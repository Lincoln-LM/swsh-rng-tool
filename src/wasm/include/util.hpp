#pragma once
#include <string.h>
#include "types.h"

#define export __attribute__((visibility("default"))) extern "C"

export u8* allocateBytes(u32 size) {
    return new u8[size];
}

export void deleteBytes(u8* arr) {
    delete arr;
}

char* allocateStr(const char* str) {
    char* ptr = new char[strlen(str) + 1];
    strcpy((char*)ptr, str);
    return ptr;
}