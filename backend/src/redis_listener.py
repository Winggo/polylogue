import gc
import signal
import json
import threading
import redis


r_client = redis.Redis(host='localhost', port=6379, db=0)
pubsub = r_client.pubsub()
r_client.config_set('notify-keyspace-events', 'KEh')

stop_signal = threading.Event()
redis_thread = None


def check_redis_connection():
    try:
        r_client.ping()
        return True
    except redis.ConnectionError as err:
        raise Exception(f"Failed to connect to Redis: {err}")


def redis_listener(socketio):
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
                    
                    print(f"{notification_channel}\n{prompt_response[:5]}\n\n")
                    socketio.emit(
                        notification_channel,
                        message,
                    )
    finally:
        pubsub.unsubscribe()
        pubsub.close()
        print("Redis pubsub connection closed.")


def start_redis_client(socketio):
    check_redis_connection()

    redis_thread = threading.Thread(target=redis_listener, args=(socketio, ), daemon=True)
    redis_thread.start()

    return r_client, pubsub


# Graceful shutdown handler
def handle_sigint(signal, frame):
    print("Caught SIGINT, shutting down gracefully...")
    stop_signal.set()
    if redis_thread:
        redis_thread.join()  # Wait for the redis thread to finish
        print("Redis thread stopped.")

    gc.collect()
    exit(0)

# Register the signal handler for SIGINT (Ctrl+C)
signal.signal(signal.SIGINT, handle_sigint)
