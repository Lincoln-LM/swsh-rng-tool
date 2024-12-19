#pragma once
#include "types.h"
#include "util.hpp"

inline u64 rotl(u64 x, int k) {
    return (x << k) | (x >> (64 - k));
}

typedef struct Xoroshiro
{
    Xoroshiro(const u64 seed) : Xoroshiro(seed, 0x82A2B175229D6A5B) {}
    Xoroshiro(const u64 seed0, const u64 seed1) {
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
    u32 randMax(const u32 max) {
        auto bitMask = [](u32 x) {
            x--;
            x |= x >> 1;
            x |= x >> 2;
            x |= x >> 4;
            x |= x >> 8;
            x |= x >> 16;
            return x;
        };

        u32 mask = bitMask(max);
        if ((max - 1) == mask)
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
    float randFloat() {
        return (float)(next()) * 0x1p-64f;
    }
    float randFloat(float maximum) {
        return (float)(next()) * 0x1p-64f * maximum + 0.0f;
    }
    void advance(const u32 advances) {
        for (u32 i = 0; i < advances; i++) {
            next();
        }
    }
    u64 state[2];
} Xoroshiro;

export Xoroshiro* xoroshiro(const u64* state) {
    return new Xoroshiro(state[0], state[1]);
}

export int xoroshiroUpdate(Xoroshiro* rng, const u64* state) {
    int advances = 0;
    while ((rng->state[0] != state[0] || rng->state[1] != state[1]) && advances < 1000000) {
        rng->next();
        advances++;
    }
    return advances;
}