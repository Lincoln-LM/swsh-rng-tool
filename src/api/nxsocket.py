"""Socket connection interface to sys-botbase"""

import socket
import threading
from typing import Iterable


class NXSocket:
    """Socket connection interface to sys-botbase"""

    def __init__(self) -> None:
        self.socket: socket.socket | None = None
        self.lock = threading.Lock()

    def connect(self, ip: str) -> None:
        """Connect to sys-botbase"""
        with self.lock:
            if self.socket is not None:
                self.socket.close()
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((ip, 6000))

    def disconnect(self) -> None:
        """Disconnect from sys-botbase if connected"""
        with self.lock:
            if self.socket is not None:
                self.socket.close()
                self.socket = None

    def _send(self, command: str) -> None:
        """Send command to sys-botbase"""
        if self.socket is None:
            raise ValueError("Not connected to sys-botbase")
        self.socket.sendall(f"{command}\r\n".encode())

    def _recv(self) -> bytearray:
        """Receive data from sys-botbase"""
        if self.socket is None:
            raise ValueError("Not connected to sys-botbase")
        data = self.socket.recv(1024)
        while data[-1] != ord("\n"):
            data += self.socket.recv(1024)
        return bytearray.fromhex(data[0:-1].decode("utf-8"))

    def read_heap(self, address: int, size: int) -> bytearray:
        """Read data offset from heap"""
        with self.lock:
            self._send(f"peek {address} {size}")
            return self._recv()

    def read_pointer(self, pointer: tuple[int, ...], size: int) -> bytearray:
        """Read data from pointer"""
        pointer_str = " ".join(map(str, pointer))
        with self.lock:
            self._send(f"pointerPeek {size} {pointer_str}")
            return self._recv()

    def read_absolute_multi(
        self, address_size_list: Iterable[tuple[int, int]]
    ) -> bytearray:
        """Read aggregated data from multiple absolute addresses"""
        data_repr = " ".join(
            (f"{address} {size}" for address, size in address_size_list)
        )
        with self.lock:
            self._send(f"peekAbsoluteMulti {data_repr}")
            return self._recv()

    # TODO: other read commands
