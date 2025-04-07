import os
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

from redis_listener import start_redis_client, start_redis_pubsub


load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins='*', transports=['websocket'])
r_client = start_redis_client()
app.config['REDIS'] = r_client


from api import api_routes
app.register_blueprint(api_routes, url_prefix="/api")


enable_redis_pubsub = os.getenv("ENABLE_REDIS_PUBSUB", "false").lower() == "true"
if enable_redis_pubsub:
    pubsub = start_redis_pubsub(r_client, socketio)
    app.config['PUBSUB'] = pubsub

    from sockets import socket_routes
    app.register_blueprint(socket_routes)


if __name__ == "__main__":
    socketio.run(app, debug=True)
