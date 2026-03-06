// ============================================================
// Star Routes - Core Type Definitions
// ============================================================

// --- Commodities ---
export interface CommodityDef {
    id: string;
    name: string;
    category: CommodityCategory;
    basePrice: number;
    volatility: number;       // 0-1: how much price fluctuates
    weight: number;            // cargo units per item
    isContraband: boolean;
    factionExclusive?: string; // faction id that exclusively produces this
    description: string;
}

export type CommodityCategory =
    | 'raw'
    | 'industrial'
    | 'consumer'
    | 'tech'
    | 'medical'
    | 'luxury'
    | 'military'
    | 'contraband';

export interface MarketListing {
    commodityId: string;
    supply: number;
    demand: number;
    price: number;
    priceHistory: number[];   // last 10 prices
    trend: 'rising' | 'falling' | 'stable';
}

// --- Star Systems ---
export interface StarSystemData {
    id: string;
    name: string;
    x: number;
    y: number;
    size: number;             // 1-5: visual size
    color: number;            // hex color
    type: StarType;
    factionId: string | null;
    dangerLevel: number;      // 0-1
    population: number;       // affects demand
    industry: IndustryType;
    connections: string[];    // connected system ids
    market: MarketListing[];
    hasStation: boolean;
    discovered: boolean;
    description: string;
}

export type StarType = 'yellow' | 'red' | 'blue' | 'white' | 'orange' | 'binary' | 'neutron' | 'nebula';

export type IndustryType =
    | 'mining'
    | 'agriculture'
    | 'manufacturing'
    | 'tech'
    | 'military'
    | 'trading_hub'
    | 'refinery'
    | 'medical'
    | 'luxury'
    | 'frontier';

// --- Routes ---
export interface RouteData {
    from: string;
    to: string;
    distance: number;
    dangerLevel: number;
    fuelCost: number;
    travelTime: number;      // in game ticks
}

// --- Ships ---
export interface ShipDef {
    id: string;
    name: string;
    class: ShipClass;
    baseCargoCapacity: number;
    baseHull: number;
    baseShield: number;
    baseSpeed: number;
    baseFuelCapacity: number;
    moduleSlots: number;
    price: number;
    description: string;
}

export type ShipClass =
    | 'courier'
    | 'scout'
    | 'light_freighter'
    | 'freighter'
    | 'heavy_freighter'
    | 'armed_trader'
    | 'corvette'
    | 'galleon';

export interface PlayerShip {
    defId: string;
    name: string;
    hull: number;
    maxHull: number;
    shield: number;
    maxShield: number;
    fuel: number;
    maxFuel: number;
    cargoCapacity: number;
    speed: number;
    cargo: CargoItem[];
    modules: InstalledModule[];
    moduleSlots: number;
}

export interface CargoItem {
    commodityId: string;
    quantity: number;
    purchasePrice: number;    // what we paid per unit
}

// --- Modules ---
export interface ModuleDef {
    id: string;
    name: string;
    type: ModuleType;
    tier: number;             // 1-3
    price: number;
    effect: ModuleEffect;
    description: string;
}

export type ModuleType =
    | 'weapon'
    | 'shield'
    | 'engine'
    | 'cargo'
    | 'scanner'
    | 'armor'
    | 'fuel_tank'
    | 'repair'
    | 'stealth'
    | 'navigation';

export interface ModuleEffect {
    cargoBonus?: number;
    shieldBonus?: number;
    hullBonus?: number;
    speedBonus?: number;
    fuelBonus?: number;
    combatBonus?: number;
    scanRange?: number;
    stealthBonus?: number;
    repairRate?: number;
    dangerReduction?: number;
}

export interface InstalledModule {
    defId: string;
    condition: number;        // 0-100
}

// --- Crew ---
export interface CrewDef {
    skills: CrewSkill[];
    traits: CrewTrait[];
}

export type CrewSkill =
    | 'navigation'
    | 'combat'
    | 'trading'
    | 'engineering'
    | 'diplomacy'
    | 'stealth'
    | 'medicine'
    | 'leadership'
    | 'piloting'
    | 'gunnery'
    | 'hacking'
    | 'mining'
    | 'logistics'
    | 'scouting'
    | 'intimidation';

export type CrewTrait =
    | 'brave'
    | 'cowardly'
    | 'greedy'
    | 'loyal'
    | 'reckless'
    | 'cautious'
    | 'lucky'
    | 'unlucky'
    | 'charismatic'
    | 'antisocial'
    | 'experienced'
    | 'rookie'
    | 'mechanic'
    | 'sharpshooter'
    | 'negotiator'
    | 'survivalist';

export interface CrewMemberData {
    id: string;
    name: string;
    portrait: number;         // procedural portrait seed
    primarySkill: CrewSkill;
    secondarySkill: CrewSkill;
    skillLevels: Partial<Record<CrewSkill, number>>; // 1-10
    traits: CrewTrait[];
    morale: number;           // 0-100
    salary: number;           // per game day
    experience: number;
    hiredAt: number;          // game time
}

// --- Factions ---
export interface FactionDef {
    id: string;
    name: string;
    color: number;
    description: string;
    attitude: FactionAttitude;
    exclusiveCommodities: string[];
    bonusCommodities: string[];
    territory: string[];      // system ids
    relationships: Record<string, number>; // faction id -> -100 to 100
}

export type FactionAttitude = 'trade' | 'military' | 'isolationist' | 'pirate';

export interface FactionReputation {
    factionId: string;
    reputation: number;       // -100 to 100
    rank: FactionRank;
}

export type FactionRank =
    | 'hostile'
    | 'unfriendly'
    | 'neutral'
    | 'friendly'
    | 'allied'
    | 'exalted';

// --- Events ---
export interface GameEventDef {
    id: string;
    name: string;
    description: string;
    type: EventType;
    choices: EventChoice[];
    conditions?: EventCondition;
    weight: number;           // probability weight
}

export type EventType =
    | 'combat'
    | 'trade'
    | 'discovery'
    | 'distress'
    | 'faction'
    | 'crew'
    | 'environmental'
    | 'smuggling';

export interface EventChoice {
    text: string;
    requirements?: EventRequirement;
    outcomes: EventOutcome[];
}

export interface EventRequirement {
    minCombat?: number;
    minTrading?: number;
    minReputation?: { factionId: string; min: number };
    hasCrew?: CrewSkill;
    hasCargo?: string;
    minCredits?: number;
}

export interface EventOutcome {
    probability: number;      // 0-1
    text: string;
    effects: EventEffect;
}

export interface EventEffect {
    credits?: number;
    hull?: number;
    fuel?: number;
    morale?: number;
    reputation?: { factionId: string; amount: number };
    addCargo?: { commodityId: string; quantity: number };
    removeCargo?: { commodityId: string; quantity: number };
    addCrew?: boolean;
    loseCrew?: boolean;
    discoveredSystem?: boolean;
    combatStart?: boolean;
    marketEffect?: { systemId: string; commodityId: string; supplyChange: number };
}

export interface EventCondition {
    location?: string;
    minDanger?: number;
    hasCargo?: boolean;
    factionTerritory?: string;
    inTransit?: boolean;
}

// --- Game State ---
export interface GameState {
    player: PlayerState;
    galaxy: StarSystemData[];
    gameTime: number;         // ticks
    gameDayLength: number;
    eventLog: LogEntry[];
    settings: GameSettings;
    economyHistory: EconomySnapshot[];
    activeEvents: ActiveEvent[];
    savedAt: number;
    version: string;
}

export interface PlayerState {
    name: string;
    credits: number;
    ship: PlayerShip;
    crew: CrewMemberData[];
    factionRep: FactionReputation[];
    currentSystemId: string;
    totalProfit: number;
    totalTrades: number;
    systemsVisited: string[];
    daysSurvived: number;
    cargoSold: number;
    piratesDefeated: number;
    crewHired: number;
    isInTransit: boolean;
    transitProgress: number;  // 0-1
    transitRoute: RouteData | null;
}

export interface LogEntry {
    time: number;
    type: LogType;
    message: string;
    systemId?: string;
}

export type LogType =
    | 'trade'
    | 'travel'
    | 'combat'
    | 'event'
    | 'crew'
    | 'faction'
    | 'economy'
    | 'ship'
    | 'system';

export interface GameSettings {
    musicVolume: number;
    sfxVolume: number;
    autoSave: boolean;
    difficulty: 'easy' | 'normal' | 'hard';
}

export interface EconomySnapshot {
    time: number;
    systemId: string;
    commodityId: string;
    price: number;
    supply: number;
    demand: number;
}

export interface ActiveEvent {
    eventId: string;
    systemId: string;
    turnsRemaining: number;
    effects: EventEffect;
}

// --- Combat ---
export interface CombatState {
    playerHull: number;
    playerShield: number;
    enemyHull: number;
    enemyShield: number;
    enemyName: string;
    enemyType: string;
    round: number;
    log: string[];
    result: 'ongoing' | 'victory' | 'defeat' | 'fled' | 'negotiated';
    loot?: CombatLoot;
}

export interface CombatLoot {
    credits: number;
    cargo: CargoItem[];
    reputation?: { factionId: string; amount: number };
}

// --- Utility ---
export interface Vec2 {
    x: number;
    y: number;
}

export type SeededRandom = () => number;
