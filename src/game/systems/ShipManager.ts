// ============================================================
// Star Routes - Ship Manager
// Ship customization, module slot management, upgrades
// ============================================================

import { PlayerShip, PlayerState, LogEntry } from '../types';
import { SHIP_MAP, SHIPS } from '../config/ship-data';
import { MODULE_MAP, MODULES } from '../config/module-data';
import {
    REPAIR_COST_PER_HULL, REFUEL_COST_PER_UNIT, MAX_MODULES_PER_TYPE
} from '../config/constants';

export class ShipManager {
    /** Create a new player ship from a ship definition */
    createShip(shipDefId: string, name: string): PlayerShip | null {
        const def = SHIP_MAP.get(shipDefId);
        if (!def) return null;

        return {
            defId: shipDefId,
            name,
            hull: def.baseHull,
            maxHull: def.baseHull,
            shield: def.baseShield,
            maxShield: def.baseShield,
            fuel: def.baseFuelCapacity,
            maxFuel: def.baseFuelCapacity,
            cargoCapacity: def.baseCargoCapacity,
            speed: def.baseSpeed,
            cargo: [],
            modules: [],
            moduleSlots: def.moduleSlots,
        };
    }

    /** Install a module into the ship */
    installModule(
        player: PlayerState,
        moduleDefId: string,
        log: LogEntry[],
        gameTime: number
    ): { success: boolean; message: string } {
        const moduleDef = MODULE_MAP.get(moduleDefId);
        if (!moduleDef) {
            return { success: false, message: 'Module not found.' };
        }

        const ship = player.ship;

        // Check slots
        if (ship.modules.length >= ship.moduleSlots) {
            return { success: false, message: 'No free module slots. Remove a module first.' };
        }

        // Check max modules per type
        const sameTypeCount = ship.modules.filter(m => {
            const def = MODULE_MAP.get(m.defId);
            return def?.type === moduleDef.type;
        }).length;

        if (sameTypeCount >= MAX_MODULES_PER_TYPE) {
            return {
                success: false,
                message: `Maximum ${MAX_MODULES_PER_TYPE} ${moduleDef.type} modules allowed.`,
            };
        }

        // Check cost
        if (player.credits < moduleDef.price) {
            return { success: false, message: `Not enough credits. Cost: ${moduleDef.price}.` };
        }

        // Install
        player.credits -= moduleDef.price;
        ship.modules.push({ defId: moduleDefId, condition: 100 });

        // Apply module effects
        this.recalculateStats(ship);

        log.push({
            time: gameTime,
            type: 'ship',
            message: `Installed ${moduleDef.name} (${moduleDef.price} credits).`,
        });

        return { success: true, message: `Installed ${moduleDef.name}!` };
    }

    /** Remove a module from the ship */
    removeModule(
        player: PlayerState,
        moduleIndex: number,
        log: LogEntry[],
        gameTime: number
    ): { success: boolean; message: string } {
        const ship = player.ship;

        if (moduleIndex < 0 || moduleIndex >= ship.modules.length) {
            return { success: false, message: 'Invalid module slot.' };
        }

        const removed = ship.modules.splice(moduleIndex, 1)[0];
        const moduleDef = MODULE_MAP.get(removed.defId);

        // Refund half the price
        if (moduleDef) {
            const refund = Math.round(moduleDef.price * 0.5 * (removed.condition / 100));
            player.credits += refund;

            log.push({
                time: gameTime,
                type: 'ship',
                message: `Removed ${moduleDef.name}. Refund: ${refund} credits.`,
            });
        }

        // Recalculate stats
        this.recalculateStats(ship);

        return { success: true, message: `Module removed.` };
    }

    /** Recalculate ship stats based on base + modules */
    recalculateStats(ship: PlayerShip): void {
        const def = SHIP_MAP.get(ship.defId);
        if (!def) return;

        // Start with base stats
        let cargoBonus = 0;
        let shieldBonus = 0;
        let hullBonus = 0;
        let speedBonus = 0;
        let fuelBonus = 0;

        for (const mod of ship.modules) {
            const modDef = MODULE_MAP.get(mod.defId);
            if (!modDef) continue;

            const effectiveness = mod.condition / 100;
            if (modDef.effect.cargoBonus) cargoBonus += Math.round(modDef.effect.cargoBonus * effectiveness);
            if (modDef.effect.shieldBonus) shieldBonus += Math.round(modDef.effect.shieldBonus * effectiveness);
            if (modDef.effect.hullBonus) hullBonus += Math.round(modDef.effect.hullBonus * effectiveness);
            if (modDef.effect.speedBonus) speedBonus += Math.round(modDef.effect.speedBonus * effectiveness);
            if (modDef.effect.fuelBonus) fuelBonus += Math.round(modDef.effect.fuelBonus * effectiveness);
        }

        ship.cargoCapacity = def.baseCargoCapacity + cargoBonus;
        ship.maxShield = def.baseShield + shieldBonus;
        ship.maxHull = def.baseHull + hullBonus;
        ship.speed = def.baseSpeed + speedBonus;
        ship.maxFuel = def.baseFuelCapacity + fuelBonus;

        // Clamp current values to new maximums
        ship.hull = Math.min(ship.hull, ship.maxHull);
        ship.shield = Math.min(ship.shield, ship.maxShield);
        ship.fuel = Math.min(ship.fuel, ship.maxFuel);
    }

    /** Repair ship hull */
    repair(
        player: PlayerState,
        amount: number,
        log: LogEntry[],
        gameTime: number
    ): { success: boolean; cost: number; repaired: number } {
        const ship = player.ship;
        const needed = ship.maxHull - ship.hull;
        const toRepair = Math.min(amount, needed);

        if (toRepair <= 0) {
            return { success: false, cost: 0, repaired: 0 };
        }

        const cost = toRepair * REPAIR_COST_PER_HULL;
        if (player.credits < cost) {
            // Repair what we can afford
            const affordable = Math.floor(player.credits / REPAIR_COST_PER_HULL);
            if (affordable <= 0) {
                return { success: false, cost: 0, repaired: 0 };
            }
            const partialCost = affordable * REPAIR_COST_PER_HULL;
            player.credits -= partialCost;
            ship.hull += affordable;

            log.push({
                time: gameTime,
                type: 'ship',
                message: `Repaired ${affordable} hull points for ${partialCost} credits.`,
            });

            return { success: true, cost: partialCost, repaired: affordable };
        }

        player.credits -= cost;
        ship.hull += toRepair;

        log.push({
            time: gameTime,
            type: 'ship',
            message: `Repaired ${toRepair} hull points for ${cost} credits.`,
        });

        return { success: true, cost, repaired: toRepair };
    }

    /** Refuel ship */
    refuel(
        player: PlayerState,
        amount: number,
        log: LogEntry[],
        gameTime: number
    ): { success: boolean; cost: number; refueled: number } {
        const ship = player.ship;
        const needed = ship.maxFuel - ship.fuel;
        const toRefuel = Math.min(amount, needed);

        if (toRefuel <= 0) {
            return { success: false, cost: 0, refueled: 0 };
        }

        const cost = toRefuel * REFUEL_COST_PER_UNIT;
        if (player.credits < cost) {
            const affordable = Math.floor(player.credits / REFUEL_COST_PER_UNIT);
            if (affordable <= 0) {
                return { success: false, cost: 0, refueled: 0 };
            }
            const partialCost = affordable * REFUEL_COST_PER_UNIT;
            player.credits -= partialCost;
            ship.fuel += affordable;

            log.push({
                time: gameTime,
                type: 'ship',
                message: `Refueled ${affordable} units for ${partialCost} credits.`,
            });

            return { success: true, cost: partialCost, refueled: affordable };
        }

        player.credits -= cost;
        ship.fuel += toRefuel;

        log.push({
            time: gameTime,
            type: 'ship',
            message: `Refueled ${toRefuel} units for ${cost} credits.`,
        });

        return { success: true, cost, refueled: toRefuel };
    }

    /** Buy a new ship */
    buyShip(
        player: PlayerState,
        shipDefId: string,
        newName: string,
        log: LogEntry[],
        gameTime: number
    ): { success: boolean; message: string } {
        const newDef = SHIP_MAP.get(shipDefId);
        if (!newDef) {
            return { success: false, message: 'Ship not found.' };
        }

        if (newDef.price > player.credits) {
            return { success: false, message: `Not enough credits. Cost: ${newDef.price}.` };
        }

        // Sell old ship for 60% value
        const oldDef = SHIP_MAP.get(player.ship.defId);
        const sellValue = oldDef ? Math.round(oldDef.price * 0.6) : 0;

        // Transfer cargo if it fits
        const newShip = this.createShip(shipDefId, newName);
        if (!newShip) {
            return { success: false, message: 'Failed to create ship.' };
        }

        // Check cargo fits
        let cargoWeight = 0;
        for (const item of player.ship.cargo) {
            cargoWeight += item.quantity; // simplified
        }
        if (cargoWeight > newShip.cargoCapacity) {
            return {
                success: false,
                message: `New ship cannot hold your current cargo. Sell some first.`,
            };
        }

        // Execute purchase
        player.credits -= newDef.price;
        player.credits += sellValue;
        newShip.cargo = [...player.ship.cargo];
        player.ship = newShip;

        log.push({
            time: gameTime,
            type: 'ship',
            message: `Purchased ${newDef.name} for ${newDef.price} credits (sold old ship for ${sellValue}).`,
        });

        return { success: true, message: `Welcome aboard the ${newName}!` };
    }

    /** Get available ships for purchase */
    getAvailableShips(): typeof SHIPS {
        return SHIPS;
    }

    /** Get available modules for purchase */
    getAvailableModules(): typeof MODULES {
        return MODULES;
    }

    /** Apply repair from repair modules during travel */
    applyModuleRepair(ship: PlayerShip): void {
        let repairRate = 0;
        for (const mod of ship.modules) {
            const def = MODULE_MAP.get(mod.defId);
            if (def?.effect.repairRate) {
                repairRate += def.effect.repairRate;
            }
        }

        if (repairRate > 0 && ship.hull < ship.maxHull) {
            ship.hull = Math.min(ship.maxHull, ship.hull + repairRate);
        }
    }

    /** Get full repair cost */
    getRepairCost(ship: PlayerShip): number {
        return (ship.maxHull - ship.hull) * REPAIR_COST_PER_HULL;
    }

    /** Get full refuel cost */
    getRefuelCost(ship: PlayerShip): number {
        return (ship.maxFuel - ship.fuel) * REFUEL_COST_PER_UNIT;
    }
}
