"""Useful enums for SWSH game data"""

from enum import IntEnum

class FieldObjectVTable(IntEnum):
    """VTable offset for FieldObject children"""
    ENCOUNT_SPAWNER = 0x255EE90
    GIMMICK_SPAWNER = 0x255A750
