#pragma once
#include "types.h"
#include "util.hpp"

inline u64 rotl(u64 x, int k) {
    return (x << k) | (x >> (64 - k));
}

typedef struct Xoroshiro
{
    Xoroshiro(u64 seed) : Xoroshiro(seed, 0x82A2B175229D6A5B) {}
    Xoroshiro(u64 seed0, u64 seed1) {
        state[0] = seed0;
        state[1] = seed1;
    }

    u64 next() {
        u64 s0 = state[0];
        u64 s1 = state[1];
        u64 result = s0 + s1;

        s1 ^= s0;
        state[0] = rotl(s0, 24) ^ s1 ^ (s1 << 16);
        state[1] = rotl(s1, 37);

        return result;
    }
    template<u32 max>
    u32 randMax() {
        auto bitMask = [](u32 x) constexpr {
            x--;
            x |= x >> 1;
            x |= x >> 2;
            x |= x >> 4;
            x |= x >> 8;
            x |= x >> 16;
            return x;
        };

        constexpr u32 mask = bitMask(max);
        if constexpr ((max - 1) == mask)
        {
            return next() & mask;
        }
        else
        {
            u32 result;
            do
            {
                result = next() & mask;
            } while (result >= max);
            return result;
        }
    }
    void advance(u32 advances) {
        for (u32 i = 0; i < advances; i++) {
            next();
        }
    }
    u64 state[2];
} Xoroshiro;

export Xoroshiro* xoroshiro(u64* state) {
    return new Xoroshiro(state[0], state[1]);
}

export int xoroshiroUpdate(Xoroshiro* rng, u64* state) {
    int advances = 0;
    while ((rng->state[0] != state[0] || rng->state[1] != state[1]) && advances < 1000000) {
        rng->next();
        advances++;
    }
    return advances;
}