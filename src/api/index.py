"""API for swsh-rng-tool"""

import io
from flask import Flask, send_file, request
from nxsocket import NXSocket

socket = NXSocket()
app = Flask(__name__)


def send_bytes(data: bytes):
    """Send bytes as octet-stream"""
    return send_file(io.BytesIO(data), mimetype="application/octet-stream")


@app.route("/")
def index():
    """Serve index.html"""
    return app.send_static_file("index.html")


@app.route("/api/connect", methods=["POST"])
def connect():
    """Connect to switch"""
    socket.connect(request.json["ip"])
    return "Connected"


@app.route("/api/disconnect")
def disconnect():
    """Disconnect from switch"""
    socket.disconnect()
    return "Disconnected"


@app.route("/api/rng-state")
def get_rng_state():
    """Read current main RNG state"""
    return send_bytes(socket.read_heap(0x4C2AAC18, 16))
