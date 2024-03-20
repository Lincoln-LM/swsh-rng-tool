"""API for swsh-rng-tool"""

import io
from math import atan2
from struct import iter_unpack, unpack
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


@app.route("/api/tidsid")
def get_tidsid():
    """Read player TID and SID"""
    return str(int.from_bytes(socket.read_heap(0x45068F18 + 0xA0, 4), "little"))


@app.route("/api/charms")
def get_charms():
    """Read mark/shiny charm flags"""
    key_items_bag = iter_unpack(
        "<I", socket.read_pointer((0x26364F0, 0x1D8, 0x1398, 0), 64 * 4)
    )
    mark_charm = False
    shiny_charm = False
    for (item,) in key_items_bag:
        if ((item >> 15) & 0x7FFF) >= 1:
            shiny_charm |= (item & 0x7FFF) == 632
            mark_charm |= (item & 0x7FFF) == 1589
        if mark_charm and shiny_charm:
            break
    return {
        "hasShinyCharm": mark_charm,
        "hasMarkCharm": shiny_charm,
    }


@app.route("/api/current-weather")
def get_current_weather():
    """Read current weather"""
    weather = int.from_bytes(
        socket.read_pointer((0x26365B8, 0x90, 0x408, 0x3F8, 0x60), 4), "little"
    )
    if weather >= 9:
        return "0"
    # convert GetCurrentWeather weather enum to encounter archive order
    return str([0, 1, 2, 3, 5, 6, 4, 7, 8][weather])


@app.route("/api/loaded-spawners")
def get_loaded_spawners():
    """Read loaded spawners"""
    main_base = (
        unpack("<Q", socket.read_pointer((0x2955208, 0xB0, 0, 0), 8))[0] - 0x255D470
    )
    field_objects_start, field_objects_end = unpack(
        "<QQ", socket.read_pointer((0x2955208, 0xB0), 16)
    )
    field_objects_size = field_objects_end - field_objects_start
    app.logger.info("%d %d", field_objects_start, field_objects_end)
    field_objects_pointers = unpack(
        "<" + ("Q" * (field_objects_size >> 3)),
        socket.read_pointer((0x2955208, 0xB0, 0), field_objects_size),
    )
    field_objects_vtables = unpack(
        "<" + ("Q" * (field_objects_size >> 3)),
        socket.read_absolute_multi(
            ((address, 8) for address in field_objects_pointers)
        ),
    )
    gimmick_spawners = tuple(
        address
        for address, abs_vtable in zip(field_objects_pointers, field_objects_vtables)
        if abs_vtable - main_base == 0x255A750
    )
    if len(gimmick_spawners) == 0:
        return []
    position_data = iter_unpack(
        "<fff",
        socket.read_absolute_multi(
            ((spawner + 0xB0, 12) for spawner in gimmick_spawners)
        ),
    )
    spawn_radius_data = iter_unpack(
        "<f",
        socket.read_absolute_multi(
            ((spawner + 0xB90 + 0x20 + 0x4, 4) for spawner in gimmick_spawners)
        ),
    )
    despawn_radius_data = iter_unpack(
        "<f",
        socket.read_absolute_multi(
            ((spawner + 0xB90 + 0x20 + 0x20 + 0x4, 4) for spawner in gimmick_spawners)
        ),
    )
    gimmick_spec_data = iter_unpack(
        "<xxxxxxxxihxxxxxxbxxxiiiihxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxbbbbbbxxxxxxxxxxx",
        socket.read_absolute_multi(
            ((spawner + 0x7E8, 0x3A8) for spawner in gimmick_spawners)
        ),
    )
    return [
        {
            "position": list(position),
            "spawnRadius": next(spawn_radius_data)[0],
            "despawnRadius": next(despawn_radius_data)[0],
            "gimmickSpecs": [
                {
                    "species": species,
                    "form": form,
                    "level": level,
                    "shininess": shininess,
                    "nature": nature,
                    "gender": gender,
                    "ability": ability,
                    "item": item,
                    "ivs": [iv0, iv1, iv2, iv3, iv4, iv5],
                }
                for (
                    species,
                    form,
                    level,
                    shininess,
                    gender,
                    nature,
                    ability,
                    item,
                    iv0,
                    iv1,
                    iv2,
                    iv3,
                    iv4,
                    iv5,
                ) in (next(gimmick_spec_data) for _ in range(9))
            ],
            "encounterSlotTables": [],
        }
        for position in position_data
    ]


@app.route("/api/player-position")
def get_player_position():
    """Read player position and rotation"""
    _, ry, _, rw, x, y, z = unpack(
        "<fffffff", socket.read_pointer((0x2955208, 0xB0, 0, 0xA0), 16 + 12)
    )
    return {
        "x": x,
        "y": y,
        "z": z,
        "yaw": -2 * atan2(rw, ry),
    }
