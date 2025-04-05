from flask import Blueprint, request, current_app

socket_routes = Blueprint("socket_routes", __name__)

from app import socketio

client_subscriptions = {}

@socketio.on("connect")
def handle_connect():
    print(f"Client {request.sid} connected")


@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client {request.sid} disconnected")
    pubsub = current_app.config['PUBSUB']

    channels = client_subscriptions.pop(request.sid, [])
    for channel in channels:
        pubsub.unsubscribe(channel)


@socketio.on("subscribe")
def handle_redis_subscribe(channel):
    print(f"Client {request.sid} subscribed to {channel}")
    pubsub = current_app.config['PUBSUB']

    if request.sid not in client_subscriptions:
        client_subscriptions[request.sid] = []
    client_subscriptions[request.sid].append(channel)
    pubsub.subscribe(channel)


@socketio.on("unsubscribe")
def handle_redis_unsubscribe(channel):
    print(f"Client {request.sid} unsubscribed from {channel}")
    pubsub = current_app.config['PUBSUB']
    
    if request.sid in client_subscriptions and channel in client_subscriptions[request.sid]:
        client_subscriptions[request.sid].remove(channel)
        pubsub.unsubscribe(channel)
