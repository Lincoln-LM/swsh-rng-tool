#pragma once
#include <optional>
#include "util.hpp"
#include "types.h"
#include "xoroshiro.hpp"
#include <nlohmann/json.hpp>

// stored as they are in encounter slot archives
// NOT as is returned by GetWeather
enum class Weather {
    Sunny = 0,
    Cloudy,
    Rain,
    Storm,
    Sunshine,
    Snow,
    Snowstorm,
    Sandstorm,
    Mist
};

enum class EncounterType {
    Gimmick,
    Symbol,
    Hidden,
    Fishing,
};

enum class Mark {
    Time = 0,
    Lunchtime = 0,
    SleepyTime,
    Dusk,
    Dawn,
    Cloudy,
    Rainy,
    Stormy,
    Snowy,
    Blizzard,
    Dry,
    Sandstorm,
    Misty,
    Destiny,
    Fishing,
    Curry,
    Uncommon,
    Rare,
    Rowdy,
    AbsentMinded,
    Jittery,
    Excited,
    Charismatic,
    Calmness,
    Intense,
    ZonedOut,
    Joyful,
    Angry,
    Smiley,
    Teary,
    Upbeat,
    Peeved,
    Intellectual,
    Ferocious,
    Crafty,
    Scowling,
    Kindly,
    Flustered,
    PumpedUp,
    ZeroEnergy,
    Prideful,
    Unsure,
    Humble,
    Thorny,
    Vigor,
    Slump,

    None = -1,
};

// map from the order stored in encounter archives to the one returned by GetCurrentWeather
constexpr u8 weatherMap[9] = { 0, 1, 2, 3, 6, 4, 5, 7, 8 };

typedef struct Settings {
    u32 minAdvance;
    u32 totalAdvances;
    u32 npcCount;
    u32 flyCalibration;
    u32 rainCalibration;
    u32 maximumDistance;
    u32 tidsid;
    bool hasShinyCharm;
    bool hasMarkCharm;
    Weather weather;
    EncounterType encounterType;
    Settings(const char* json) {
        nlohmann::json j = nlohmann::json::parse(json);

        minAdvance = j["minAdvance"];
        totalAdvances = j["totalAdvances"];
        npcCount = j["npcCount"];
        flyCalibration = j["flyCalibration"];
        rainCalibration = j["rainCalibration"];
        maximumDistance = j["maximumDistance"];
        tidsid = j["tidsid"];
        hasShinyCharm = j["hasShinyCharm"];
        hasMarkCharm = j["hasMarkCharm"];
        weather = static_cast<Weather>(j["weather"]);
        encounterType = static_cast<EncounterType>(j["encounterType"]);
    }
} Settings;

typedef struct OverworldSpec {
    u16 species = 0;
    u8 form = 0;
    u8 level = 1;
    u8 shininess = 0;
    s8 nature = -1;
    u8 gender = 0;
    u8 ability = 0;
    u8 heldItem = 0;
    u8 guaranteedIvs = 0;
    s8 ivs[6] = {-1, -1, -1, -1, -1, -1};
    Mark mark = Mark::None;
    u8 brilliantLevel = 0;
    u32 fixedSeed = 0;
    u32 pid = -1;
    u32 ec = -1;
    u8 scale = -1;

    float rotation = 0.0;
    float distance = 0.0;

    u8 slot = 10;
    u32 advance = -1;

    nlohmann::json toJSON() const {
        nlohmann::json j;
        j["species"] = species;
        j["form"] = form;
        j["level"] = level;
        j["shininess"] = shininess;
        j["nature"] = nature;
        j["gender"] = gender;
        j["ability"] = ability;
        j["heldItem"] = heldItem;
        j["guaranteedIvs"] = guaranteedIvs;
        for (int i = 0; i < 6; i++) {
            j["ivs"][i] = ivs[i];
        }
        j["mark"] = mark;
        j["brilliantLevel"] = brilliantLevel;
        j["fixedSeed"] = fixedSeed;
        j["pid"] = pid;
        j["ec"] = ec;
        j["scale"] = scale;

        j["rotation"] = rotation;
        j["distance"] = distance;

        j["slot"] = slot;
        j["advance"] = advance;
        return j;
    }
} OverworldSpec;

typedef struct Filters {
    u8 ivMin[6];
    u8 ivMax[6];
    u8 abilities;
    u8 shininess;
    u16 slots;
    u32 natures;
    u32 marks[2];
    u8 genders;
    u8 scales;

    Filters(const char* json) {
        nlohmann::json j = nlohmann::json::parse(json);

        for (int i = 0; i < 6; i++) {
            ivMin[i] = j["ivMin"][i];
            ivMax[i] = j["ivMax"][i];
        }
        abilities = j["abilities"];
        shininess = j["shininess"];
        slots = j["slots"];
        natures = j["natures"];
        marks[0] = j["marks"][0];
        marks[1] = j["marks"][1];
        genders = j["genders"];
        scales = j["scales"];
    }

    // TODO: generation shortcircuiting filters?
    bool isValid(const OverworldSpec &spec) const {
        for (int i = 0; i < 6; i++) {
            if (ivMin[i] > spec.ivs[i] || spec.ivs[i] > ivMax[i]) {
                return false;
            }
        }
        if (abilities != 0 && (abilities & (1 << spec.ability)) == 0) {
            return false;
        }
        if (shininess != 0 && (shininess & (1 << spec.shininess)) == 0) {
            return false;
        }
        if (slots != 0 && (slots & (1 << static_cast<u16>(spec.slot))) == 0) {
            return false;
        }
        if (natures != 0 && (natures & (1 << static_cast<u32>(spec.nature))) == 0) {
            return false;
        }
        auto mark = static_cast<u32>(spec.mark);
        if ((marks[0] | marks[1]) != 0 && (spec.mark == Mark::None || (marks[mark >> 5] & (1 << (mark & 31))) == 0)) {
            return false;
        }
        if (genders != 0 && (genders & (1 << spec.gender)) == 0) {
            return false;
        }
        if (scales != 0 && (scales & (1 << spec.scale)) == 0) {
            return false;
        }
        return true;
    }
} Filters;

typedef struct GimmickSpec {
    u16 species;
    u8 form;
    u8 level;
    u8 shininess;
    u8 gender;
    s8 nature;
    u8 ability;
    u8 item;
    s8 ivs[6];

    GimmickSpec(const char* json) {
        nlohmann::json j = nlohmann::json::parse(json);
        species = j["species"];
        form = j["form"];
        level = j["level"];
        shininess = j["shininess"];
        gender = j["gender"];
        nature = j["nature"];
        ability = j["ability"];
        item = j["item"];
        for (int i = 0; i < 6; i++) {
            ivs[i] = j["ivs"][i];
        }
    }
} GimmickSpec;

typedef struct EncounterSlot {
    u16 species;
    u8 form;
    u8 weight;
} EncounterSlot;

typedef struct EncounterSlotTable {
    u8 minLevel;
    u8 maxLevel;
    EncounterSlot slots[10];

    EncounterSlotTable(const char* json) {
        nlohmann::json j = nlohmann::json::parse(json);
        minLevel = j["minLevel"];
        maxLevel = j["maxLevel"];
        for (int i = 0; i < 10; i++) {
            slots[i].species = j["slots"][i]["species"];
            slots[i].form = j["slots"][i]["form"];
            slots[i].weight = j["slots"][i]["weight"];
        }
    }
} EncounterSlotTable;

inline bool isShiny(u32 a, u32 b) {
    return (a & 0xFFF0 ^ a >> 0x10 ^ b >> 0x10 ^ b & 0xFFF0) < 0x10;
}

inline u32 forceShiny(u32 tidsid, u32 pid) {
    return (((tidsid >> 16) ^ (tidsid & 0xFFFF) ^ pid) << 16) | (pid & 0xFFFF);
}

Mark generateMark(Xoroshiro &rng, Weather currentWeather, bool isFishing) {
    auto rare = rng.randMax<1000>();
    auto personality = rng.randMax<100>();
    auto uncommon = rng.randMax<50>();
    auto weather = rng.randMax<50>();
    auto time = rng.randMax<50>();
    auto fish = rng.randMax<25>();

    if (rare == 0) return Mark::Rare;
    if (personality == 0) return static_cast<Mark>(static_cast<u8>(Mark::Rowdy) + rng.randMax<28>());
    if (uncommon == 0) return Mark::Uncommon;
    if (weather == 0 && currentWeather != Weather::Sunny) return static_cast<Mark>(static_cast<u8>(Mark::Dawn) + weatherMap[static_cast<u8>(currentWeather)]);
    if (time == 0) return Mark::Time; // TODO: should time be handled?
    if (fish == 0 && isFishing) return Mark::Fishing;
    return Mark::None;
}

void handleLeadAbility(Xoroshiro &rng) {
    rng.randMax<100>();
    // TODO: actual handling
}

void generateBasicSpec(const Settings &settings, const EncounterSlot &slot, u8 maxLevel, u8 minLevel, OverworldSpec &spec, Xoroshiro &rng) {
    spec.species = slot.species;
    spec.form = slot.form;
    // special handling for minior forms would happen here
    spec.level = minLevel + rng.randMax(maxLevel - minLevel + 1);
    // pressure forcing max level would happen here
    // level cap shiny lock applied here
    // this is always overwritten for encounter types that use generateMainSpec (Symbol/Hidden/Fishing)
    for (u8 i = 0; i < (settings.hasMarkCharm ? 3 : 1) && spec.mark == Mark::None; i++) {
        spec.mark = generateMark(rng, settings.weather, settings.encounterType == EncounterType::Fishing);
    }
}

void generateFixed(const Settings &settings, OverworldSpec &spec) {
    Xoroshiro rng(spec.fixedSeed);
    spec.ec = rng.next();
    spec.pid = rng.next();
    if (spec.shininess == 2) {
        if (isShiny(settings.tidsid, spec.pid)) {
            spec.pid ^= 0x10000000;
        }
    } else {
        if (!isShiny(settings.tidsid, spec.pid)) {
            spec.pid = forceShiny(settings.tidsid, spec.pid);
        }
    }
    u16 pxor = spec.pid ^ spec.pid >> 0x10 ^ settings.tidsid >> 0x10 ^ settings.tidsid;
    spec.shininess = pxor == 0 ? 2 : (pxor < 16 ? 1 : 0);
    for (int i = 0; i < spec.guaranteedIvs;) {
        auto idx = rng.randMax<6>();
        if (spec.ivs[idx] == -1) {
            spec.ivs[idx] = 31;
            i++;
        }
    }
    for (int i = 0; i < 6; i++) {
        if (spec.ivs[i] == -1) {
            spec.ivs[i] = rng.randMax<32>();
        }
    }
    auto scale = rng.randMax<0x81>();
    scale += rng.randMax<0x80>();
    spec.scale = scale == 0 ? 1 : scale == 255 ? 2 : 0;
    // weight = rng.randMax<0x81>() + rng.randMax<0x80>();
}

void generateMainSpec(const Settings &settings, OverworldSpec &spec, Xoroshiro &rng) {
    u8 shinyRolls = settings.hasShinyCharm ? 3 : 1;
    if (settings.encounterType == EncounterType::Symbol || settings.encounterType == EncounterType::Fishing) {
        auto brilliantRand = rng.randMax<1000>();
        // fishing chain happens here
        // TODO: brilliant levels
    }
    if (spec.brilliantLevel > 0) {
        // TODO:
        // spec.level = maxLevel;
    }
    if (spec.shininess == 0) {
        spec.shininess = 2;
        // level cap shiny lock applied here
        for (u8 i = 0; i < shinyRolls; i++) {
            if (isShiny(settings.tidsid, rng.next())) {
                spec.shininess = 1;
                break;
            }
        }
    }
    if (spec.gender == 0) {
        // TODO: some flag here might still set gender
        spec.gender = rng.randMax<2>() ? 1 : 2;
    }
    if (spec.nature == -1) {
        spec.nature = rng.randMax<25>();
    }
    if (spec.ability == 0) {
        spec.ability = rng.randMax<2>() ? 1 : 2;
    }
    if (spec.heldItem == 0) {
        // TODO: held item handling
    }
    if (spec.brilliantLevel > 0) {
        spec.guaranteedIvs = rng.randMax<2>() | 2;
        // TODO: egg move handling
    }
    spec.fixedSeed = rng.next();
    generateFixed(settings, spec);
    for (u8 i = 0; i < (settings.hasMarkCharm ? 3 : 1) && spec.mark == Mark::None; i++) {
        spec.mark = generateMark(rng, settings.weather, settings.encounterType == EncounterType::Fishing);
    }
}

s8 generateDexRecSlot(const EncounterSlotTable &slotTable, Xoroshiro &rng) {
    if (rng.randMax<100>() < 50) {
        return -1;
    }
    // TODO: actual handling
    return -1;
}

s8 generateRegularSlot(const EncounterSlotTable &slotTable, Xoroshiro &rng) {
    u8 slotRand = rng.randMax<100>();
    for (s8 slot = 0; slot < 10; slot++) {
        auto weight = slotTable.slots[slot].weight;
        if (slotRand < weight) {
            return slot;
        }
        slotRand -= weight;
    }
    return -1;
}

void generateFullSpec(const Settings &settings, const EncounterSlotTable &slotTable, Xoroshiro &rng, OverworldSpec &spec) {
    s8 slot = -1;
    // TODO: does fishing use this
    if (settings.encounterType == EncounterType::Symbol /*|| settings.encounterType == EncounterType::Fishing*/) {
        // TODO: 50% KO Boost handling
    }
    // TODO: lead based encounter slot boosts
    if (slot < 0) {
        slot = generateDexRecSlot(slotTable, rng);
    }
    if (slot < 0) {
        slot = generateRegularSlot(slotTable, rng);
    }
    spec.slot = slot;
    generateBasicSpec(settings, slotTable.slots[slot], slotTable.maxLevel, slotTable.minLevel, spec, rng);
    // berry tree (kinomi) encounters do not call generateMainSpec
    generateMainSpec(settings, spec, rng);
    // level forced to 60 here (WK_SCENE_MAIN_MASTER)
}

std::optional<OverworldSpec> generateSlotEncount(const Settings &settings, const EncounterSlotTable &slotTable, const float spawnRadius, Xoroshiro &rng) {
    OverworldSpec spec;
    if (settings.encounterType == EncounterType::Symbol) {
        // placement happens before generation for symbols
        // rejects with similar conditions to hiddens but is unimplemented
        spec.rotation = rng.randMax<361>();
        spec.distance = rng.randFloat(spawnRadius);
    }
    handleLeadAbility(rng);
    if (settings.encounterType == EncounterType::Hidden) {
        // TODO: specify encounter rate
        // an encounter check like this happens on every step with increasing probability of success
        // for simplicity's sake: only return results that succeed on the first step
        if (rng.randMax<100>() >= 22) {
            return std::nullopt;
        }
    }
    generateFullSpec(settings, slotTable, rng, spec);
    if (settings.encounterType == EncounterType::Hidden) {
        bool placed = false;
        for (u8 i = 0; i < 10 && !placed; i++) {
            spec.rotation = rng.randMax<361>();
            spec.distance = rng.randFloat(spawnRadius);
            // the most bare-bones placement rejection
            // assumes sufficient distance from player/items and that it is within a grass patch
            placed = spec.distance < spawnRadius - 40.0f;
        }
        if (!placed) {
            return std::nullopt;
        }
        // TODO: should this be a filter instead
        // specifying an adequate maximum distance from the spawner is a simple (though very limiting)
        // way to avoid running into the unimplemented rejection conditions
        if (spec.distance > settings.maximumDistance) {
            return std::nullopt;
        }
        // traditional rotation
        rng.randMax<361>();
        // a few ticks pass potentially letting noise advance the rng
        // lua rolls a 30% chance to not spawn
        if (rng.randMax<100>() < 30) {
            return std::nullopt;
        }
    }
    return spec;
}

OverworldSpec generateGimmickEncount(const Settings &settings, const GimmickSpec &gimmickSpec, Xoroshiro &rng) {
    OverworldSpec spec;
    spec.species = gimmickSpec.species;
    spec.form = gimmickSpec.form;
    spec.level = gimmickSpec.level;
    // level cap shiny lock applied here
    spec.shininess = gimmickSpec.shininess;
    spec.nature = gimmickSpec.nature;
    if (spec.nature == 25) spec.nature = -1;
    if (gimmickSpec.gender < 3) spec.gender = gimmickSpec.gender;
    if (gimmickSpec.gender < 4) spec.ability = gimmickSpec.ability;
    spec.heldItem = gimmickSpec.item;
    auto iv0 = gimmickSpec.ivs[0];
    if (iv0 >= -4 && iv0 <= -2) {
        spec.guaranteedIvs = ~iv0;
    } else {
        spec.ivs[0] = gimmickSpec.ivs[0];
        spec.ivs[1] = gimmickSpec.ivs[1];
        spec.ivs[2] = gimmickSpec.ivs[2];
        spec.ivs[3] = gimmickSpec.ivs[3];
        spec.ivs[4] = gimmickSpec.ivs[4];
        spec.ivs[5] = gimmickSpec.ivs[5];
    }
    handleLeadAbility(rng);
    generateMainSpec(settings, spec, rng);
    // level forced to 60 here (WK_SCENE_MAIN_MASTER)
    return spec;
}

bool preGenerationAdvances(const Settings &settings, Xoroshiro &rng) {
    if (settings.flyCalibration != 0) {
        // TODO: properly handle map memories
        if (rng.randMax<100>() < 5) {
            return false;
        }
        for (int i = 0; i < settings.flyCalibration; i++) {
            rng.randMax<100>();
        }
    }
    for (int i = 0; i < settings.npcCount; i++) {
        rng.randMax<91>();
    }
    for (int i = 0; i < settings.rainCalibration; i++) {
        rng.randMax<20001>();
    }

    return true;
}

// TODO: DRY?

std::vector<OverworldSpec> generateGimmickResults(const Settings &settings, const Filters &filters, const GimmickSpec &gimmickSpec, const Xoroshiro &mainRng) {
    Xoroshiro rng(mainRng.state[0], mainRng.state[1]);
    std::vector<OverworldSpec> results;
    rng.advance(settings.minAdvance);
    for (int i = 0; i < settings.totalAdvances; i++) {
        Xoroshiro go(rng.state[0], rng.state[1]);
        if (preGenerationAdvances(settings, go)) {
            auto result = generateGimmickEncount(settings, gimmickSpec, go);
            result.advance = settings.minAdvance + i;
            if (filters.isValid(result)) {
                results.push_back(result);
            }
        }
        rng.next();
    }
    return results;
}

std::vector<OverworldSpec> generateSlotResults(const Settings &settings, const Filters &filters, const EncounterSlotTable &slotTable, const float spawnRadius, const Xoroshiro &mainRng) {
    Xoroshiro rng(mainRng.state[0], mainRng.state[1]);
    std::vector<OverworldSpec> results;
    rng.advance(settings.minAdvance);
    for (int i = 0; i < settings.totalAdvances; i++) {
        Xoroshiro go(rng.state[0], rng.state[1]);
        if (preGenerationAdvances(settings, go)) {
            auto result = generateSlotEncount(settings, slotTable, spawnRadius, go);
            if (result) {
                auto encount = *result;
                encount.advance = settings.minAdvance + i;
                if (filters.isValid(encount)) {
                    results.push_back(encount);
                }
            }
        }
        rng.next();
    }
    return results;
}

char* serializeOverworldSpecs(const std::vector<OverworldSpec> &specs) {
    nlohmann::json j = nlohmann::json::array();
    for (const auto &spec : specs) {
        j.push_back(spec.toJSON());
    }
    return allocateStr(j.dump().c_str());
}

export char* generateSlots(const char* js_settings, const char* js_filters, const char* js_slotTable, const float spawnRadius, const u64* initialRngState) {
    Settings settings(js_settings);
    Filters filters(js_filters);
    EncounterSlotTable slotTable(js_slotTable);
    Xoroshiro rng(initialRngState[0], initialRngState[1]);
    std::vector<OverworldSpec> results = generateSlotResults(settings, filters, slotTable, spawnRadius, rng);
    return serializeOverworldSpecs(results);
}

export char* generateGimmicks(const char* js_settings, const char* js_filters, const char* js_gimmickSpec, const u64* initialRngState) {
    Settings settings(js_settings);
    Filters filters(js_filters);
    GimmickSpec gimmickSpec(js_gimmickSpec);
    Xoroshiro rng(initialRngState[0], initialRngState[1]);
    std::vector<OverworldSpec> results = generateGimmickResults(settings, filters, gimmickSpec, rng);
    return serializeOverworldSpecs(results);
}