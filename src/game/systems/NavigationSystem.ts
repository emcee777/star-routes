// ============================================================
// Star Routes - Navigation System
// Route planning, travel time calculation, danger assessment
// ============================================================

import { StarSystemData, RouteData, PlayerState, PlayerShip } from '../types';
import {
    FUEL_COST_PER_DISTANCE, TRAVEL_TICKS_PER_UNIT, BASE_TRAVEL_SPEED
} from '../config/constants';
import { MODULE_MAP } from '../config/module-data';

export interface PlannedRoute {
    path: string[];           // system IDs in order
    legs: RouteData[];        // route data per leg
    totalDistance: number;
    totalFuelCost: number;
    totalTravelTime: number;
    totalDanger: number;      // averaged danger across all legs
    maxDanger: number;        // highest danger on any leg
}

export class NavigationSystem {
    /** Calculate distance between two systems */
    getDistance(a: StarSystemData, b: StarSystemData): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /** Get route data for a direct connection between two systems */
    getRouteData(
        from: StarSystemData,
        to: StarSystemData,
        ship: PlayerShip
    ): RouteData {
        const distance = this.getDistance(from, to);
        const speed = this.getEffectiveSpeed(ship);
        const dangerReduction = this.getDangerReduction(ship);

        const fuelCost = Math.round(distance * FUEL_COST_PER_DISTANCE);
        const travelTime = Math.max(1, Math.round(distance * TRAVEL_TICKS_PER_UNIT / (speed / BASE_TRAVEL_SPEED)));
        const dangerLevel = Math.max(0, Math.min(1,
            (from.dangerLevel + to.dangerLevel) / 2 - dangerReduction
        ));

        return {
            from: from.id,
            to: to.id,
            distance,
            dangerLevel,
            fuelCost,
            travelTime,
        };
    }

    /** Get effective ship speed including module bonuses */
    private getEffectiveSpeed(ship: PlayerShip): number {
        let speed = ship.speed;
        for (const mod of ship.modules) {
            const def = MODULE_MAP.get(mod.defId);
            if (def?.effect.speedBonus) {
                speed += def.effect.speedBonus;
            }
        }
        return Math.max(1, speed);
    }

    /** Get total danger reduction from modules */
    private getDangerReduction(ship: PlayerShip): number {
        let reduction = 0;
        for (const mod of ship.modules) {
            const def = MODULE_MAP.get(mod.defId);
            if (def?.effect.dangerReduction) {
                reduction += def.effect.dangerReduction;
            }
        }
        return reduction;
    }

    /** Find all connected systems from a given system */
    getConnectedSystems(systemId: string, allSystems: StarSystemData[]): StarSystemData[] {
        const system = allSystems.find(s => s.id === systemId);
        if (!system) return [];

        return system.connections
            .map(id => allSystems.find(s => s.id === id))
            .filter((s): s is StarSystemData => s !== undefined);
    }

    /** Find shortest path using Dijkstra */
    findShortestPath(
        fromId: string,
        toId: string,
        allSystems: StarSystemData[],
        ship: PlayerShip
    ): PlannedRoute | null {
        return this.findPath(fromId, toId, allSystems, ship, 'distance');
    }

    /** Find safest path (minimizing danger) */
    findSafestPath(
        fromId: string,
        toId: string,
        allSystems: StarSystemData[],
        ship: PlayerShip
    ): PlannedRoute | null {
        return this.findPath(fromId, toId, allSystems, ship, 'danger');
    }

    /** Find most fuel-efficient path */
    findEfficientPath(
        fromId: string,
        toId: string,
        allSystems: StarSystemData[],
        ship: PlayerShip
    ): PlannedRoute | null {
        return this.findPath(fromId, toId, allSystems, ship, 'fuel');
    }

    private findPath(
        fromId: string,
        toId: string,
        allSystems: StarSystemData[],
        ship: PlayerShip,
        optimize: 'distance' | 'danger' | 'fuel'
    ): PlannedRoute | null {
        const systemMap = new Map(allSystems.map(s => [s.id, s]));
        const from = systemMap.get(fromId);
        const to = systemMap.get(toId);
        if (!from || !to) return null;

        // Dijkstra's algorithm
        const dist = new Map<string, number>();
        const prev = new Map<string, string>();
        const visited = new Set<string>();

        dist.set(fromId, 0);

        while (true) {
            // Find unvisited node with minimum distance
            let minDist = Infinity;
            let current: string | null = null;
            for (const [id, d] of dist) {
                if (!visited.has(id) && d < minDist) {
                    minDist = d;
                    current = id;
                }
            }

            if (current === null || current === toId) break;
            visited.add(current);

            const currentSystem = systemMap.get(current);
            if (!currentSystem) continue;

            for (const connId of currentSystem.connections) {
                if (visited.has(connId)) continue;

                const connSystem = systemMap.get(connId);
                if (!connSystem) continue;

                const route = this.getRouteData(currentSystem, connSystem, ship);
                let edgeWeight: number;

                switch (optimize) {
                    case 'distance':
                        edgeWeight = route.distance;
                        break;
                    case 'danger':
                        edgeWeight = route.dangerLevel * 100 + route.distance * 0.1;
                        break;
                    case 'fuel':
                        edgeWeight = route.fuelCost;
                        break;
                }

                const newDist = minDist + edgeWeight;
                const currentDist = dist.get(connId) ?? Infinity;

                if (newDist < currentDist) {
                    dist.set(connId, newDist);
                    prev.set(connId, current);
                }
            }
        }

        // Reconstruct path
        if (!prev.has(toId) && fromId !== toId) return null;

        const path: string[] = [];
        let current: string | undefined = toId;
        while (current !== undefined) {
            path.unshift(current);
            current = prev.get(current);
        }

        if (path[0] !== fromId) return null;

        // Build route legs
        const legs: RouteData[] = [];
        for (let i = 0; i < path.length - 1; i++) {
            const fromSys = systemMap.get(path[i])!;
            const toSys = systemMap.get(path[i + 1])!;
            legs.push(this.getRouteData(fromSys, toSys, ship));
        }

        const totalDistance = legs.reduce((sum, l) => sum + l.distance, 0);
        const totalFuelCost = legs.reduce((sum, l) => sum + l.fuelCost, 0);
        const totalTravelTime = legs.reduce((sum, l) => sum + l.travelTime, 0);
        const totalDanger = legs.length > 0
            ? legs.reduce((sum, l) => sum + l.dangerLevel, 0) / legs.length
            : 0;
        const maxDanger = legs.length > 0
            ? Math.max(...legs.map(l => l.dangerLevel))
            : 0;

        return {
            path,
            legs,
            totalDistance,
            totalFuelCost,
            totalTravelTime,
            totalDanger,
            maxDanger,
        };
    }

    /** Check if player can afford the fuel for a route */
    canAffordRoute(player: PlayerState, route: PlannedRoute): boolean {
        return player.ship.fuel >= route.totalFuelCost;
    }

    /** Get all reachable systems from current position with current fuel */
    getReachableSystems(
        currentId: string,
        allSystems: StarSystemData[],
        ship: PlayerShip,
        maxFuel: number
    ): Map<string, PlannedRoute> {
        const reachable = new Map<string, PlannedRoute>();

        for (const system of allSystems) {
            if (system.id === currentId) continue;
            const route = this.findShortestPath(currentId, system.id, allSystems, ship);
            if (route && route.totalFuelCost <= maxFuel) {
                reachable.set(system.id, route);
            }
        }

        return reachable;
    }

    /** Get systems within N hops */
    getSystemsWithinHops(
        currentId: string,
        allSystems: StarSystemData[],
        maxHops: number
    ): Set<string> {
        const result = new Set<string>();
        const queue: Array<{ id: string; hops: number }> = [{ id: currentId, hops: 0 }];
        result.add(currentId);

        while (queue.length > 0) {
            const { id, hops } = queue.shift()!;
            if (hops >= maxHops) continue;

            const system = allSystems.find(s => s.id === id);
            if (!system) continue;

            for (const connId of system.connections) {
                if (!result.has(connId)) {
                    result.add(connId);
                    queue.push({ id: connId, hops: hops + 1 });
                }
            }
        }

        return result;
    }
}
