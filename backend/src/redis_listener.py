import json
import threading
import redis


r_client = redis.Redis(host='localhost', port=6379, db=0)
pubsub = r_client.pubsub()
r_client.config_set('notify-keyspace-events', 'KEh')


def check_redis_connection():
    try:
        r_client.ping()
        return True
    except redis.ConnectionError as err:
        raise Exception(f"Failed to connect to Redis: {err}")


def redis_listener(socketio):
    """Background thread that subscribes to Redis and forwards messages to Socket.IO clients"""
    pubsub.psubscribe('__keyspace@0__:node:*')

    for message in pubsub.listen():
        if message['type'] == 'pmessage':
            event_type = message['data'].decode('utf-8')
            if event_type == 'hset':
                channel = message['channel'].decode('utf-8')
                full_key = channel.replace('__keyspace@0__:', '')

                prompt_response = r_client.hget(full_key, "prompt_response").decode('utf-8')

                notification_channel = f"{full_key}:update"
                
                print(f"Publishing to channel {notification_channel}")
                socketio.emit(
                    notification_channel,
                    json.dumps({ "promptResponse": prompt_response })
                )


def start_redis_client(socketio):
    check_redis_connection()

    redis_thread = threading.Thread(target=redis_listener, args=(socketio, ), daemon=True)
    redis_thread.start()

    return r_client, pubsub
