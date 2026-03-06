// ============================================================
// Star Routes - Procedural Galaxy Generator
// ============================================================

import {
    StarSystemData, StarType, IndustryType, MarketListing, SeededRandom
} from '../types';
import {
    GALAXY_MIN_SYSTEMS, GALAXY_MAX_SYSTEMS, GALAXY_WIDTH, GALAXY_HEIGHT,
    MIN_SYSTEM_DISTANCE, MAX_CONNECTION_DISTANCE, MIN_CONNECTIONS, MAX_CONNECTIONS,
    MARKET_HISTORY_LENGTH,
} from '../config/constants';
import { STAR_NAMES } from '../config/system-name-data';
import { DESCRIPTIONS_BY_INDUSTRY } from '../config/system-name-data';
import { COMMODITIES, INDUSTRY_PRODUCTION, INDUSTRY_CONSUMPTION } from '../config/commodity-data';
import { FACTIONS } from '../config/faction-data';

export function createSeededRandom(seed: number): SeededRandom {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

export function generateGalaxy(seed: number): StarSystemData[] {
    const rng = createSeededRandom(seed);
    const numSystems = GALAXY_MIN_SYSTEMS + Math.floor(rng() * (GALAXY_MAX_SYSTEMS - GALAXY_MIN_SYSTEMS));

    // Generate system positions with minimum distance constraint
    const positions: { x: number; y: number }[] = [];
    const padding = 50;
    let attempts = 0;

    while (positions.length < numSystems && attempts < 5000) {
        const x = padding + rng() * (GALAXY_WIDTH - padding * 2);
        const y = padding + rng() * (GALAXY_HEIGHT - padding * 2);
        let valid = true;

        for (const pos of positions) {
            const dx = x - pos.x;
            const dy = y - pos.y;
            if (Math.sqrt(dx * dx + dy * dy) < MIN_SYSTEM_DISTANCE) {
                valid = false;
                break;
            }
        }

        if (valid) {
            positions.push({ x, y });
        }
        attempts++;
    }

    // Shuffle and pick names
    const names = [...STAR_NAMES];
    for (let i = names.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [names[i], names[j]] = [names[j], names[i]];
    }

    // Assign star types, industries, faction territories
    const starTypes: StarType[] = ['yellow', 'red', 'blue', 'white', 'orange', 'binary', 'neutron', 'nebula'];
    const industries: IndustryType[] = [
        'mining', 'agriculture', 'manufacturing', 'tech', 'military',
        'trading_hub', 'refinery', 'medical', 'luxury', 'frontier'
    ];

    // Divide galaxy into quadrants for faction territories
    const centerX = GALAXY_WIDTH / 2;
    const centerY = GALAXY_HEIGHT / 2;

    const systems: StarSystemData[] = positions.map((pos, i) => {
        const id = `sys_${i}`;
        const name = names[i % names.length];
        const starType = starTypes[Math.floor(rng() * starTypes.length)];
        const industry = industries[Math.floor(rng() * industries.length)];
        const size = 1 + Math.floor(rng() * 5);
        const population = 10000 + Math.floor(rng() * 990000);

        // Assign faction based on quadrant with some randomness
        let factionId: string | null = null;
        const qx = pos.x < centerX ? 0 : 1;
        const qy = pos.y < centerY ? 0 : 1;
        const quadrant = qy * 2 + qx;

        if (rng() > 0.15) { // 85% chance of faction territory
            const factionIdx = quadrant % FACTIONS.length;
            factionId = FACTIONS[factionIdx].id;
        }

        // Danger based on distance from center + faction influence
        const distFromCenter = Math.sqrt(
            (pos.x - centerX) ** 2 + (pos.y - centerY) ** 2
        ) / Math.sqrt(centerX ** 2 + centerY ** 2);
        let dangerLevel = 0.1 + distFromCenter * 0.5 + rng() * 0.3;
        if (factionId === 'syndicate') dangerLevel += 0.15;
        if (factionId === 'hegemony') dangerLevel -= 0.1;
        dangerLevel = Math.max(0, Math.min(1, dangerLevel));

        // Star color based on type
        const colorMap: Record<StarType, number> = {
            yellow: 0xffdd44,
            red: 0xff4444,
            blue: 0x4488ff,
            white: 0xeeeeff,
            orange: 0xff8833,
            binary: 0xffaa88,
            neutron: 0x88eeff,
            nebula: 0xcc44ff,
        };

        // Generate market
        const market = generateMarket(industry, factionId, population, dangerLevel, rng);

        // Description
        const descs = DESCRIPTIONS_BY_INDUSTRY[industry] || ['A system in the galaxy.'];
        const description = descs[Math.floor(rng() * descs.length)];

        return {
            id,
            name,
            x: pos.x,
            y: pos.y,
            size,
            color: colorMap[starType],
            type: starType,
            factionId,
            dangerLevel,
            population,
            industry,
            connections: [],
            market,
            hasStation: rng() > 0.05, // 95% have stations
            discovered: false,
            description,
        };
    });

    // Generate connections using Delaunay-like approach
    generateConnections(systems, rng);

    // Assign faction territories
    for (const faction of FACTIONS) {
        faction.territory = systems
            .filter(s => s.factionId === faction.id)
            .map(s => s.id);
    }

    // Make the first 5 systems always discovered and ensure starting area is safe
    for (let i = 0; i < Math.min(5, systems.length); i++) {
        systems[i].discovered = true;
        systems[i].dangerLevel = Math.min(systems[i].dangerLevel, 0.2);
    }

    // Ensure starting system has a station and is reasonably safe
    if (systems.length > 0) {
        systems[0].hasStation = true;
        systems[0].dangerLevel = 0.05;
        systems[0].industry = 'trading_hub';
        systems[0].market = generateMarket('trading_hub', systems[0].factionId, systems[0].population, 0.05, rng);
    }

    return systems;
}

function generateConnections(systems: StarSystemData[], rng: SeededRandom): void {
    // Calculate distances between all pairs
    const distances: { from: number; to: number; dist: number }[] = [];

    for (let i = 0; i < systems.length; i++) {
        for (let j = i + 1; j < systems.length; j++) {
            const dx = systems[i].x - systems[j].x;
            const dy = systems[i].y - systems[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= MAX_CONNECTION_DISTANCE) {
                distances.push({ from: i, to: j, dist });
            }
        }
    }

    // Sort by distance
    distances.sort((a, b) => a.dist - b.dist);

    // Add connections, ensuring minimum connectivity
    const connectionCounts = new Array(systems.length).fill(0);

    // First pass: ensure every system has at least MIN_CONNECTIONS
    for (const { from, to } of distances) {
        if (connectionCounts[from] < MIN_CONNECTIONS || connectionCounts[to] < MIN_CONNECTIONS) {
            addConnection(systems, from, to, connectionCounts);
        }
    }

    // Second pass: add some extra connections for variety
    for (const { from, to } of distances) {
        if (connectionCounts[from] < MAX_CONNECTIONS && connectionCounts[to] < MAX_CONNECTIONS) {
            if (rng() < 0.3) { // 30% chance for additional connections
                addConnection(systems, from, to, connectionCounts);
            }
        }
    }

    // Ensure graph is connected
    ensureConnected(systems, distances, connectionCounts);
}

function addConnection(
    systems: StarSystemData[],
    from: number,
    to: number,
    counts: number[]
): void {
    const fromId = systems[from].id;
    const toId = systems[to].id;

    if (!systems[from].connections.includes(toId)) {
        systems[from].connections.push(toId);
        systems[to].connections.push(fromId);
        counts[from]++;
        counts[to]++;
    }
}

function ensureConnected(
    systems: StarSystemData[],
    _distances: { from: number; to: number; dist: number }[],
    counts: number[]
): void {
    // BFS to find connected components
    const visited = new Set<number>();
    const queue = [0];
    visited.add(0);

    while (queue.length > 0) {
        const current = queue.shift()!;
        for (const connId of systems[current].connections) {
            const idx = systems.findIndex(s => s.id === connId);
            if (idx >= 0 && !visited.has(idx)) {
                visited.add(idx);
                queue.push(idx);
            }
        }
    }

    // Connect unvisited nodes to the closest visited node
    if (visited.size < systems.length) {
        for (let i = 0; i < systems.length; i++) {
            if (!visited.has(i)) {
                // Find closest visited system
                let closestDist = Infinity;
                let closestIdx = 0;
                for (const v of visited) {
                    const dx = systems[i].x - systems[v].x;
                    const dy = systems[i].y - systems[v].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < closestDist) {
                        closestDist = d;
                        closestIdx = v;
                    }
                }
                addConnection(systems, i, closestIdx, counts);
                visited.add(i);
            }
        }
    }
}

function generateMarket(
    industry: IndustryType,
    factionId: string | null,
    population: number,
    _dangerLevel: number,
    rng: SeededRandom
): MarketListing[] {
    const produced = INDUSTRY_PRODUCTION[industry] || [];
    const consumed = INDUSTRY_CONSUMPTION[industry] || [];

    const market: MarketListing[] = [];

    for (const commodity of COMMODITIES) {
        // Skip faction-exclusive commodities if not in the right faction
        if (commodity.factionExclusive && commodity.factionExclusive !== factionId) {
            // Small chance to find it anyway
            if (rng() > 0.1) continue;
        }

        const isProduced = produced.includes(commodity.id);
        const isConsumed = consumed.includes(commodity.id);

        // Base supply/demand from industry
        let supply = 50 + Math.floor(rng() * 50);
        let demand = 50 + Math.floor(rng() * 50);

        if (isProduced) {
            supply += 50 + Math.floor(rng() * 100);
            demand -= 20;
        }
        if (isConsumed) {
            demand += 50 + Math.floor(rng() * 100);
            supply -= 20;
        }

        // Population affects demand
        const popFactor = population / 500000;
        demand = Math.floor(demand * (0.5 + popFactor));

        supply = Math.max(5, supply);
        demand = Math.max(5, demand);

        // Price from supply/demand ratio
        const ratio = demand / supply;
        let price = Math.round(commodity.basePrice * ratio * (0.8 + rng() * 0.4));
        price = Math.max(
            Math.round(commodity.basePrice * 0.2),
            Math.min(Math.round(commodity.basePrice * 5), price)
        );

        const history: number[] = [];
        for (let i = 0; i < MARKET_HISTORY_LENGTH; i++) {
            history.push(price + Math.round((rng() - 0.5) * commodity.basePrice * 0.1));
        }

        market.push({
            commodityId: commodity.id,
            supply,
            demand,
            price,
            priceHistory: history,
            trend: 'stable',
        });
    }

    return market;
}
