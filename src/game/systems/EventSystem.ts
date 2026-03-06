// ============================================================
// Star Routes - Event System
// Random event generation during travel, event resolution
// ============================================================

import {
    GameEventDef, EventChoice, EventOutcome, PlayerState,
    StarSystemData, LogEntry, ActiveEvent
} from '../types';
import { EVENTS, EVENT_MAP } from '../config/event-data';
import { DANGER_ENCOUNTER_BASE } from '../config/constants';
import { CrewManager } from './CrewManager';

export class EventSystem {
    private crewManager: CrewManager;

    constructor(crewManager: CrewManager) {
        this.crewManager = crewManager;
    }

    /** Check if a random event should occur during travel */
    checkForEvent(
        dangerLevel: number,
        player: PlayerState,
        currentSystem: StarSystemData | null,
        inTransit: boolean
    ): GameEventDef | null {
        // Base chance modified by danger level
        const chance = DANGER_ENCOUNTER_BASE * (0.5 + dangerLevel);

        // Stealth bonuses reduce encounter chance
        let stealthReduction = 0;
        for (const member of player.crew) {
            stealthReduction += (member.skillLevels.stealth ?? 0) * 0.02;
        }

        const finalChance = Math.max(0.02, chance - stealthReduction);

        if (Math.random() > finalChance) return null;

        // Select event from eligible events
        const eligible = EVENTS.filter(event => {
            if (event.conditions) {
                if (event.conditions.inTransit !== undefined && event.conditions.inTransit !== inTransit) {
                    return false;
                }
                if (event.conditions.minDanger !== undefined && dangerLevel < event.conditions.minDanger) {
                    return false;
                }
                if (event.conditions.hasCargo !== undefined) {
                    if (event.conditions.hasCargo && player.ship.cargo.length === 0) return false;
                }
                if (event.conditions.factionTerritory && currentSystem) {
                    if (currentSystem.factionId !== event.conditions.factionTerritory) return false;
                }
            }
            return true;
        });

        if (eligible.length === 0) return null;

        // Weighted random selection
        const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
        let roll = Math.random() * totalWeight;

        for (const event of eligible) {
            roll -= event.weight;
            if (roll <= 0) return event;
        }

        return eligible[eligible.length - 1];
    }

    /** Get available choices for an event, filtered by player capabilities */
    getAvailableChoices(event: GameEventDef, player: PlayerState): Array<{
        choice: EventChoice;
        index: number;
        meetsRequirements: boolean;
        requirementText?: string;
    }> {
        return event.choices.map((choice, index) => {
            let meetsRequirements = true;
            let requirementText: string | undefined;

            if (choice.requirements) {
                const req = choice.requirements;

                if (req.hasCrew) {
                    if (!this.crewManager.hasSkill(player.crew, req.hasCrew)) {
                        meetsRequirements = false;
                        requirementText = `Requires crew with ${req.hasCrew} skill`;
                    }
                }

                if (req.minCredits !== undefined && player.credits < req.minCredits) {
                    meetsRequirements = false;
                    requirementText = `Requires ${req.minCredits} credits`;
                }

                if (req.hasCargo) {
                    const hasCargo = player.ship.cargo.some(c => c.commodityId === req.hasCargo);
                    if (!hasCargo) {
                        meetsRequirements = false;
                        requirementText = `Requires ${req.hasCargo} in cargo`;
                    }
                }

                if (req.minReputation) {
                    const rep = player.factionRep.find(r => r.factionId === req.minReputation!.factionId);
                    if (!rep || rep.reputation < req.minReputation.min) {
                        meetsRequirements = false;
                        requirementText = `Requires higher reputation`;
                    }
                }
            }

            return { choice, index, meetsRequirements, requirementText };
        });
    }

    /** Resolve a choice: roll for outcome */
    resolveChoice(choice: EventChoice): EventOutcome {
        let roll = Math.random();

        for (const outcome of choice.outcomes) {
            roll -= outcome.probability;
            if (roll <= 0) return outcome;
        }

        return choice.outcomes[choice.outcomes.length - 1];
    }

    /** Apply outcome effects to game state */
    applyOutcome(
        outcome: EventOutcome,
        player: PlayerState,
        log: LogEntry[],
        gameTime: number,
        activeEvents: ActiveEvent[],
        currentSystemId: string
    ): {
        startCombat: boolean;
        addedCrew: boolean;
        discoveredSystem: boolean;
    } {
        const effects = outcome.effects;
        let startCombat = false;
        let addedCrew = false;
        let discoveredSystem = false;

        // Credits
        if (effects.credits) {
            player.credits = Math.max(0, player.credits + effects.credits);
            if (effects.credits > 0) {
                log.push({ time: gameTime, type: 'event', message: `Gained ${effects.credits} credits.` });
            } else {
                log.push({ time: gameTime, type: 'event', message: `Lost ${-effects.credits} credits.` });
            }
        }

        // Hull damage
        if (effects.hull) {
            player.ship.hull = Math.max(0, Math.min(player.ship.maxHull, player.ship.hull + effects.hull));
            if (effects.hull < 0) {
                log.push({ time: gameTime, type: 'event', message: `Hull damage: ${-effects.hull} points.` });
            }
        }

        // Fuel
        if (effects.fuel) {
            player.ship.fuel = Math.max(0, Math.min(player.ship.maxFuel, player.ship.fuel + effects.fuel));
            if (effects.fuel < 0) {
                log.push({ time: gameTime, type: 'event', message: `Lost ${-effects.fuel} fuel.` });
            } else {
                log.push({ time: gameTime, type: 'event', message: `Gained ${effects.fuel} fuel.` });
            }
        }

        // Morale
        if (effects.morale) {
            this.crewManager.adjustMorale(player.crew, effects.morale);
        }

        // Reputation
        if (effects.reputation) {
            const rep = player.factionRep.find(r => r.factionId === effects.reputation!.factionId);
            if (rep) {
                rep.reputation = Math.max(-100, Math.min(100, rep.reputation + effects.reputation.amount));
            }
        }

        // Add cargo
        if (effects.addCargo) {
            const existing = player.ship.cargo.find(c => c.commodityId === effects.addCargo!.commodityId);
            if (existing) {
                existing.quantity += effects.addCargo.quantity;
            } else {
                player.ship.cargo.push({
                    commodityId: effects.addCargo.commodityId,
                    quantity: effects.addCargo.quantity,
                    purchasePrice: 0, // found, not bought
                });
            }
            log.push({
                time: gameTime,
                type: 'event',
                message: `Gained ${effects.addCargo.quantity}x ${effects.addCargo.commodityId}.`,
            });
        }

        // Remove cargo
        if (effects.removeCargo) {
            const cargo = player.ship.cargo.find(c => c.commodityId === effects.removeCargo!.commodityId);
            if (cargo) {
                cargo.quantity -= effects.removeCargo.quantity;
                if (cargo.quantity <= 0) {
                    const idx = player.ship.cargo.indexOf(cargo);
                    if (idx >= 0) player.ship.cargo.splice(idx, 1);
                }
            }
        }

        // Add crew
        if (effects.addCrew) {
            const newMember = this.crewManager.generateCrewMember(gameTime);
            player.crew.push(newMember);
            addedCrew = true;
            log.push({
                time: gameTime,
                type: 'crew',
                message: `${newMember.name} joined your crew!`,
            });
        }

        // Lose crew
        if (effects.loseCrew && player.crew.length > 0) {
            const idx = Math.floor(Math.random() * player.crew.length);
            const lost = player.crew.splice(idx, 1)[0];
            log.push({
                time: gameTime,
                type: 'crew',
                message: `${lost.name} was lost!`,
            });
        }

        // Discovered system
        if (effects.discoveredSystem) {
            discoveredSystem = true;
        }

        // Combat start
        if (effects.combatStart) {
            startCombat = true;
        }

        // Market effect
        if (effects.marketEffect) {
            activeEvents.push({
                eventId: 'market_effect',
                systemId: effects.marketEffect.systemId || currentSystemId,
                turnsRemaining: 10, // lasts 10 ticks
                effects: { marketEffect: effects.marketEffect },
            });
        }

        return { startCombat, addedCrew, discoveredSystem };
    }

    /** Update active events (tick down their duration) */
    updateActiveEvents(activeEvents: ActiveEvent[]): void {
        for (let i = activeEvents.length - 1; i >= 0; i--) {
            activeEvents[i].turnsRemaining--;
            if (activeEvents[i].turnsRemaining <= 0) {
                activeEvents.splice(i, 1);
            }
        }
    }

    /** Get event by id */
    getEvent(eventId: string): GameEventDef | undefined {
        return EVENT_MAP.get(eventId);
    }
}
