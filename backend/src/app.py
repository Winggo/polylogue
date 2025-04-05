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
app.config['PUBSUB'] = pubsub


from api import api_routes
app.register_blueprint(api_routes, url_prefix="/api")

from sockets import socket_routes
app.register_blueprint(socket_routes)


if __name__ == "__main__":
    socketio.run(app, debug=True)
