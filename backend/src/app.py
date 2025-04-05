from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS
from flask_socketio import SocketIO

from redis_listener import start_redis_client


load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins='*')

r_client, pubsub = start_redis_client(socketio)
app.config['REDIS'] = r_client

from api import api_routes
app.register_blueprint(api_routes, url_prefix="/api")


client_subscriptions = {}

@socketio.on("connect")
def handle_connect():
    print(f"Client {request.sid} connected")


@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client {request.sid} disconnected")

    channels = client_subscriptions.pop(request.sid, [])
    for channel in channels:
        pubsub.unsubscribe(channel)


@socketio.on("subscribe")
def handle_redis_subscribe(channel):
    print(f"Client {request.sid} subscribed to {channel}")

    if request.sid not in client_subscriptions:
        client_subscriptions[request.sid] = []
    client_subscriptions[request.sid].append(channel)
    pubsub.subscribe(channel)


@socketio.on("unsubscribe")
def handle_redis_unsubscribe(channel):
    print(f"Client {request.sid} unsubscribed from {channel}")
    
    if request.sid in client_subscriptions and channel in client_subscriptions[request.sid]:
        client_subscriptions[request.sid].remove(channel)
        pubsub.unsubscribe(channel)


if __name__ == "__main__":
    socketio.run(app, debug=True)
