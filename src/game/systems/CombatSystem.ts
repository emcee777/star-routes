// ============================================================
// Star Routes - Combat System
// Simplified turn-based combat: flee/fight/negotiate
// ============================================================

import { CombatState, CombatLoot, PlayerShip, CargoItem } from '../types';
import {
    COMBAT_MAX_ROUNDS, FLEE_BASE_CHANCE, NEGOTIATE_BASE_CHANCE,
    WEAPON_BASE_DAMAGE, SHIELD_REGEN_PER_ROUND, PIRATE_STRENGTH_SCALING
} from '../config/constants';
import { MODULE_MAP } from '../config/module-data';
import { COMMODITY_MAP } from '../config/commodity-data';

export type CombatAction = 'attack' | 'flee' | 'negotiate' | 'defend';

export interface CombatOutcome {
    result: 'victory' | 'defeat' | 'fled' | 'negotiated';
    hullDamage: number;
    shieldDamage: number;
    loot?: CombatLoot;
    message: string;
}

export class CombatSystem {
    /** Start a new combat encounter */
    createCombat(
        ship: PlayerShip,
        dangerLevel: number,
        gameDay: number
    ): CombatState {
        // Scale enemy strength with game time and danger
        const timeScale = 1 + (gameDay / 100) * PIRATE_STRENGTH_SCALING;
        const dangerScale = 0.5 + dangerLevel;

        const baseEnemyHull = 30 + Math.round(40 * dangerScale * timeScale);
        const baseEnemyShield = 10 + Math.round(20 * dangerScale * timeScale);

        const enemyTypes = [
            { name: 'Pirate Scout', type: 'scout', hullMod: 0.7, shieldMod: 0.5 },
            { name: 'Pirate Raider', type: 'raider', hullMod: 1.0, shieldMod: 1.0 },
            { name: 'Pirate Destroyer', type: 'destroyer', hullMod: 1.5, shieldMod: 1.3 },
            { name: 'Rogue Militia', type: 'militia', hullMod: 1.2, shieldMod: 0.8 },
            { name: 'Bounty Hunter', type: 'hunter', hullMod: 1.1, shieldMod: 1.5 },
        ];

        // Pick enemy type based on danger level
        const typeIdx = Math.min(
            enemyTypes.length - 1,
            Math.floor(dangerLevel * enemyTypes.length)
        );
        const enemy = enemyTypes[typeIdx];

        const enemyHull = Math.round(baseEnemyHull * enemy.hullMod);
        const enemyShield = Math.round(baseEnemyShield * enemy.shieldMod);

        return {
            playerHull: ship.hull,
            playerShield: ship.shield,
            enemyHull,
            enemyMaxHull: enemyHull,
            enemyShield,
            enemyMaxShield: enemyShield,
            enemyName: enemy.name,
            enemyType: enemy.type,
            round: 0,
            log: [`A ${enemy.name} engages you!`],
            result: 'ongoing',
        };
    }

    /** Process one round of combat */
    processRound(
        combat: CombatState,
        action: CombatAction,
        ship: PlayerShip,
        crewCombatBonus: number,
        crewPilotBonus: number,
        crewDiplomacyBonus: number
    ): CombatState {
        const state = { ...combat, log: [...combat.log] };
        state.round++;

        switch (action) {
            case 'attack':
                this.processAttack(state, ship, crewCombatBonus);
                break;
            case 'flee':
                if (this.processFlee(state, ship, crewPilotBonus)) {
                    return state;
                }
                break;
            case 'negotiate':
                if (this.processNegotiate(state, crewDiplomacyBonus)) {
                    return state;
                }
                break;
            case 'defend':
                this.processDefend(state, ship);
                break;
        }

        // Enemy attacks if still fighting
        if (state.result === 'ongoing') {
            this.processEnemyAttack(state);
        }

        // Check victory/defeat conditions
        if (state.enemyHull <= 0) {
            state.result = 'victory';
            state.log.push('Enemy destroyed! Victory!');
            state.loot = this.generateLoot(combat.enemyType);
        } else if (state.playerHull <= 0) {
            state.result = 'defeat';
            state.log.push('Your ship is destroyed...');
        } else if (state.round >= COMBAT_MAX_ROUNDS) {
            // Stalemate: enemy disengages
            state.result = 'fled';
            state.log.push('The enemy disengages after a prolonged fight.');
        }

        return state;
    }

    private processAttack(state: CombatState, ship: PlayerShip, crewBonus: number): void {
        const weaponDamage = this.getWeaponDamage(ship);
        const totalDamage = weaponDamage + crewBonus;

        // Damage hits shields first
        if (state.enemyShield > 0) {
            const shieldDmg = Math.min(state.enemyShield, totalDamage);
            state.enemyShield -= shieldDmg;
            const hullDmg = totalDamage - shieldDmg;
            if (hullDmg > 0) {
                state.enemyHull -= hullDmg;
            }
            state.log.push(`You fire! ${shieldDmg} shield damage, ${Math.max(0, hullDmg)} hull damage.`);
        } else {
            state.enemyHull -= totalDamage;
            state.log.push(`You fire! ${totalDamage} hull damage.`);
        }
    }

    private processFlee(state: CombatState, ship: PlayerShip, pilotBonus: number): boolean {
        const speedFactor = ship.speed / 15;
        const fleeChance = FLEE_BASE_CHANCE + speedFactor * 0.2 + pilotBonus * 0.03;

        if (Math.random() < fleeChance) {
            state.result = 'fled';
            state.log.push('You break away and escape!');
            return true;
        } else {
            state.log.push('Failed to escape! The enemy blocks your path.');
            return false;
        }
    }

    private processNegotiate(state: CombatState, diplomacyBonus: number): boolean {
        const negotiateChance = NEGOTIATE_BASE_CHANCE + diplomacyBonus * 0.05;

        if (Math.random() < negotiateChance) {
            state.result = 'negotiated';
            state.log.push('You negotiate a ceasefire. The enemy stands down.');
            return true;
        } else {
            state.log.push('Negotiations failed. They want blood, not words.');
            return false;
        }
    }

    private processDefend(state: CombatState, ship: PlayerShip): void {
        // Defending regenerates shields
        const shieldRegen = SHIELD_REGEN_PER_ROUND * 2;
        const maxShield = ship.maxShield;
        state.playerShield = Math.min(maxShield, state.playerShield + shieldRegen);
        state.log.push(`You focus on defense. Shields +${shieldRegen}.`);
    }

    private processEnemyAttack(state: CombatState): void {
        // Enemy damage scales with their remaining hull (represents crew/systems)
        const healthFactor = state.enemyHull / state.enemyMaxHull;
        const baseDmg = 8 + Math.round(12 * healthFactor);
        const damage = Math.max(3, baseDmg + Math.round((Math.random() - 0.3) * 6));

        if (state.playerShield > 0) {
            const shieldDmg = Math.min(state.playerShield, damage);
            state.playerShield -= shieldDmg;
            const hullDmg = damage - shieldDmg;
            if (hullDmg > 0) {
                state.playerHull -= hullDmg;
            }
            state.log.push(`Enemy fires! ${shieldDmg} shield damage, ${Math.max(0, hullDmg)} hull damage to you.`);
        } else {
            state.playerHull -= damage;
            state.log.push(`Enemy fires! ${damage} hull damage to you!`);
        }

        // Shield regen for enemy
        if (state.enemyShield < state.enemyMaxShield) {
            state.enemyShield = Math.min(state.enemyMaxShield, state.enemyShield + SHIELD_REGEN_PER_ROUND);
        }
    }

    private getWeaponDamage(ship: PlayerShip): number {
        let damage = WEAPON_BASE_DAMAGE;
        for (const mod of ship.modules) {
            const def = MODULE_MAP.get(mod.defId);
            if (def?.effect.combatBonus) {
                damage += def.effect.combatBonus;
            }
        }
        return damage;
    }

    private generateLoot(enemyType: string): CombatLoot {
        const loot: CombatLoot = {
            credits: 0,
            cargo: [],
        };

        switch (enemyType) {
            case 'scout':
                loot.credits = 200 + Math.round(Math.random() * 300);
                break;
            case 'raider':
                loot.credits = 500 + Math.round(Math.random() * 500);
                loot.cargo.push({ commodityId: 'fuel_cells', quantity: 2 + Math.floor(Math.random() * 3), purchasePrice: 0 });
                break;
            case 'destroyer':
                loot.credits = 1000 + Math.round(Math.random() * 1000);
                loot.cargo.push({ commodityId: 'weapons', quantity: 1 + Math.floor(Math.random() * 3), purchasePrice: 0 });
                loot.cargo.push({ commodityId: 'ship_parts', quantity: 1 + Math.floor(Math.random() * 2), purchasePrice: 0 });
                break;
            case 'militia':
                loot.credits = 400 + Math.round(Math.random() * 400);
                loot.cargo.push({ commodityId: 'electronics', quantity: 1 + Math.floor(Math.random() * 3), purchasePrice: 0 });
                break;
            case 'hunter':
                loot.credits = 800 + Math.round(Math.random() * 800);
                loot.reputation = { factionId: 'syndicate', amount: 3 };
                break;
        }

        return loot;
    }

    /** Apply combat outcome to player state */
    applyCombatResult(combat: CombatState, ship: PlayerShip): void {
        ship.hull = Math.max(0, combat.playerHull);
        ship.shield = Math.max(0, combat.playerShield);
    }

    /** Collect loot from combat */
    collectLoot(loot: CombatLoot, cargo: CargoItem[], cargoCapacity: number): {
        creditsGained: number;
        cargoGained: CargoItem[];
        cargoDropped: CargoItem[];
    } {
        const cargoGained: CargoItem[] = [];
        const cargoDropped: CargoItem[] = [];

        let currentWeight = 0;
        for (const item of cargo) {
            const commodity = COMMODITY_MAP.get(item.commodityId);
            currentWeight += (commodity?.weight ?? 1) * item.quantity;
        }

        for (const item of loot.cargo) {
            const commodity = COMMODITY_MAP.get(item.commodityId);
            const itemWeight = (commodity?.weight ?? 1) * item.quantity;
            if (currentWeight + itemWeight <= cargoCapacity) {
                // Add to existing stack or create new
                const existing = cargo.find(c => c.commodityId === item.commodityId);
                if (existing) {
                    existing.quantity += item.quantity;
                } else {
                    cargo.push({ ...item });
                }
                cargoGained.push(item);
                currentWeight += itemWeight;
            } else {
                cargoDropped.push(item);
            }
        }

        return {
            creditsGained: loot.credits,
            cargoGained,
            cargoDropped,
        };
    }
}
