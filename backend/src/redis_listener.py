import os
import gc
import signal
import threading
import redis


redis_thread = None
stop_signal = threading.Event()


def check_redis_connection(r_client):
    try:
        r_client.ping()
        return True
    except redis.ConnectionError as err:
        raise Exception(f"Failed to connect to Redis: {err}")


def redis_listener(socketio, r_client, pubsub, stop_signal):
    """Background thread that subscribes to Redis and forwards messages to Socket.IO clients"""
    pubsub.psubscribe('__keyspace@0__:node:*')

    try:
        for message in pubsub.listen():
            if stop_signal.is_set():  # Check if the stop signal is set
                print("Stopping Redis listener thread...")
                break

            if message['type'] == 'pmessage':
                event_type = message['data'].decode('utf-8')
                if event_type == 'hset':
                    channel = message['channel'].decode('utf-8')
                    full_key = channel.replace('__keyspace@0__:', '')

                    prompt_response = r_client.hget(full_key, "prompt_response").decode('utf-8')

                    notification_channel = f"{full_key}:update"

                    message = {
                        "nodeId": full_key,
                        "promptResponse": prompt_response,
                    }
                    
                    print(f"{notification_channel}\n{prompt_response}\n\n")
                    socketio.emit(
                        notification_channel,
                        message,
                    )
    finally:
        pubsub.unsubscribe()
        pubsub.close()
        print("Redis pubsub connection closed.")


def start_redis_client():
    redis_host = os.environ.get("REDIS_HOST", "localhost")
    redis_port = int(os.environ.get("REDIS_PORT", 6379))

    r_client = redis.Redis(host=redis_host, port=redis_port, db=0)
    r_client.config_set('notify-keyspace-events', 'KEh')

    check_redis_connection(r_client)

    return r_client


# Graceful shutdown handler
def handle_sigint(signal, frame):
    print("Caught SIGINT, shutting down gracefully...")
    stop_signal.set()
    if redis_thread:
        redis_thread.join(timeout=5)  # Wait for the redis thread to finish
        print("Redis thread stopped.")

    gc.collect()
    exit(0)


def start_redis_pubsub(r_client, socketio):
    print("Starting Redis PubSub...")
    check_redis_connection(r_client)
    stop_signal.clear()

    pubsub = r_client.pubsub()

    redis_thread = threading.Thread(target=redis_listener, args=(socketio, r_client, pubsub, stop_signal, ), daemon=True)
    redis_thread.start()

    # Register the signal handler for SIGINT (Ctrl+C)
    signal.signal(signal.SIGINT, handle_sigint)

    return pubsub
