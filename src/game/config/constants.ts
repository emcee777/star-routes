// ============================================================
// Star Routes - Game Constants
// ============================================================

export const GAME_VERSION = '1.0.0';

// --- Display ---
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GALAXY_MAP_PADDING = 80;

// --- Economy ---
export const PRICE_VOLATILITY_TICK = 0.02;     // max % price change per tick
export const SUPPLY_REGEN_RATE = 0.5;           // supply units regenerated per tick
export const DEMAND_DECAY_RATE = 0.3;           // demand reduction per tick
export const PRICE_FLOOR_MULTIPLIER = 0.2;      // min price = base * this
export const PRICE_CEILING_MULTIPLIER = 5.0;    // max price = base * this
export const ECONOMY_TICK_INTERVAL = 3;         // game ticks between economy updates
export const SUPPLY_CHAIN_PROPAGATION = 0.15;   // how much supply changes propagate
export const MARKET_HISTORY_LENGTH = 10;        // price history entries to keep
export const TRADER_BUY_TAX = 0.0;              // no buy tax
export const TRADER_SELL_TAX = 0.05;            // 5% sell tax

// --- Galaxy ---
export const GALAXY_MIN_SYSTEMS = 50;
export const GALAXY_MAX_SYSTEMS = 60;
export const GALAXY_WIDTH = 1000;
export const GALAXY_HEIGHT = 700;
export const MIN_SYSTEM_DISTANCE = 60;
export const MAX_CONNECTION_DISTANCE = 200;
export const MIN_CONNECTIONS = 2;
export const MAX_CONNECTIONS = 5;

// --- Travel ---
export const BASE_TRAVEL_SPEED = 10;            // pixels per game tick
export const FUEL_COST_PER_DISTANCE = 0.1;
export const DANGER_ENCOUNTER_BASE = 0.15;      // base chance of encounter per travel tick
export const TRAVEL_TICKS_PER_UNIT = 0.5;       // ticks per distance unit

// --- Combat ---
export const COMBAT_MAX_ROUNDS = 10;
export const FLEE_BASE_CHANCE = 0.4;
export const NEGOTIATE_BASE_CHANCE = 0.3;
export const WEAPON_BASE_DAMAGE = 10;
export const SHIELD_REGEN_PER_ROUND = 2;
export const PIRATE_STRENGTH_SCALING = 0.8;     // pirates scale with game time

// --- Crew ---
export const MAX_CREW_SIZE = 6;
export const CREW_SKILL_MAX = 10;
export const MORALE_DECAY_PER_DAY = 0.5;
export const MORALE_COMBAT_LOSS = 10;
export const MORALE_COMBAT_WIN = 5;
export const MORALE_TRADE_PROFIT = 2;
export const MORALE_LEAVE_THRESHOLD = 15;       // morale below this = crew may leave
export const SALARY_PAYMENT_INTERVAL = 30;      // game ticks between salary payments

// --- Ship ---
export const REPAIR_COST_PER_HULL = 5;
export const REFUEL_COST_PER_UNIT = 2;
export const MAX_MODULES_PER_TYPE = 3;

// --- Reputation ---
export const REP_TRADE_GAIN = 2;
export const REP_SMUGGLE_GAIN = 5;
export const REP_SMUGGLE_LOSS = -10;
export const REP_COMBAT_GAIN = 3;
export const REP_HOSTILE_THRESHOLD = -30;
export const REP_FRIENDLY_THRESHOLD = 20;
export const REP_ALLIED_THRESHOLD = 50;
export const REP_EXALTED_THRESHOLD = 80;
export const REP_CROSS_FACTION_PENALTY = -1;    // trading with rivals

// --- Victory ---
export const VICTORY_CREDITS = 100000;
export const VICTORY_SYSTEMS = 30;
export const VICTORY_TRADES = 100;

// --- Timing ---
export const GAME_TICK_MS = 1000;               // ms per game tick
export const AUTO_SAVE_INTERVAL = 300;          // game ticks between auto saves
export const DAY_LENGTH_TICKS = 10;             // game ticks per in-game day

// --- Starting Resources ---
export const STARTING_CREDITS = 5000;
export const STARTING_FUEL = 100;

// --- UI Colors ---
export const COLORS = {
    background: 0x0a0a1a,
    stars: 0xffffff,
    panelBg: 0x111122,
    panelBorder: 0x334466,
    textPrimary: 0xeeeeff,
    textSecondary: 0x8899bb,
    textHighlight: 0x44ddff,
    positive: 0x44ff66,
    negative: 0xff4444,
    warning: 0xffaa22,
    neutral: 0x888899,
    routeSafe: 0x44ff66,
    routeDanger: 0xff4444,
    routeNormal: 0x6688aa,
    hullBar: 0x44aa44,
    shieldBar: 0x4488ff,
    fuelBar: 0xffaa22,
    cargoBar: 0xaa66cc,
    factionColors: {
        hegemony: 0xff4444,
        federation: 0x4488ff,
        syndicate: 0xaa44ff,
        frontier: 0x44cc44,
        neutral: 0x888888,
    }
} as const;
