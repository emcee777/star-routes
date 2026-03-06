// ============================================================
// Star Routes - Faction Definitions (4 factions)
// ============================================================

import { FactionDef } from '../types';
import { COLORS } from './constants';

export const FACTIONS: FactionDef[] = [
    {
        id: 'hegemony',
        name: 'Terran Hegemony',
        color: COLORS.factionColors.hegemony,
        description: 'The military superpower. Controls through force and order. Best weapons and military tech, but strict laws and high taxes.',
        attitude: 'military',
        exclusiveCommodities: ['military_tech'],
        bonusCommodities: ['weapons', 'shield_cores', 'ship_parts'],
        territory: [],  // filled by galaxy generator
        relationships: {
            federation: -20,
            syndicate: -60,
            frontier: 10,
        },
    },
    {
        id: 'federation',
        name: 'Stellar Federation',
        color: COLORS.factionColors.federation,
        description: 'The trade and technology alliance. Promotes free commerce and scientific advancement. Best tech, fair prices, but bureaucratic.',
        attitude: 'trade',
        exclusiveCommodities: ['quantum_chips'],
        bonusCommodities: ['ai_cores', 'nanotech', 'electronics'],
        territory: [],
        relationships: {
            hegemony: -20,
            syndicate: -40,
            frontier: 30,
        },
    },
    {
        id: 'syndicate',
        name: 'Shadow Syndicate',
        color: COLORS.factionColors.syndicate,
        description: 'The underground network. Deals in contraband, luxury goods, and secrets. Highest profits but dangerous allies.',
        attitude: 'pirate',
        exclusiveCommodities: ['synth_silk'],
        bonusCommodities: ['narcotics', 'stolen_data', 'black_market_tech', 'gemstones'],
        territory: [],
        relationships: {
            hegemony: -60,
            federation: -40,
            frontier: -10,
        },
    },
    {
        id: 'frontier',
        name: 'Frontier Coalition',
        color: COLORS.factionColors.frontier,
        description: 'Independent frontier worlds. Fiercely independent, resource-rich but underdeveloped. Need everything, produce raw materials.',
        attitude: 'isolationist',
        exclusiveCommodities: [],
        bonusCommodities: ['iron_ore', 'rare_minerals', 'water', 'helium3'],
        territory: [],
        relationships: {
            hegemony: 10,
            federation: 30,
            syndicate: -10,
        },
    },
];

export const FACTION_MAP = new Map(FACTIONS.map(f => [f.id, f]));
