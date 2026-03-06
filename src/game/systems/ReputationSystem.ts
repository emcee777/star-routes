// ============================================================
// Star Routes - Reputation System
// Faction reputation tracking, access, smuggling detection
// ============================================================

import { FactionReputation, FactionRank, PlayerState, LogEntry, StarSystemData } from '../types';
import {
    REP_TRADE_GAIN, REP_SMUGGLE_GAIN, REP_SMUGGLE_LOSS,
    REP_COMBAT_GAIN, REP_HOSTILE_THRESHOLD, REP_FRIENDLY_THRESHOLD,
    REP_ALLIED_THRESHOLD, REP_EXALTED_THRESHOLD, REP_CROSS_FACTION_PENALTY
} from '../config/constants';
import { FACTIONS, FACTION_MAP } from '../config/faction-data';
import { COMMODITY_MAP } from '../config/commodity-data';

export class ReputationSystem {
    /** Initialize faction reputations for a new game */
    initializeReputations(): FactionReputation[] {
        return FACTIONS.map(f => ({
            factionId: f.id,
            reputation: 0,
            rank: 'neutral' as FactionRank,
        }));
    }

    /** Adjust reputation with a faction */
    adjustReputation(
        player: PlayerState,
        factionId: string,
        amount: number,
        log: LogEntry[],
        gameTime: number,
        reason?: string
    ): void {
        const rep = player.factionRep.find(r => r.factionId === factionId);
        if (!rep) return;

        const oldRank = rep.rank;
        rep.reputation = Math.max(-100, Math.min(100, rep.reputation + amount));
        rep.rank = this.calculateRank(rep.reputation);

        // Cross-faction effects: gaining rep with one faction may reduce rep with rivals
        const faction = FACTION_MAP.get(factionId);
        if (faction && amount > 0) {
            for (const [rivalId, relationship] of Object.entries(faction.relationships)) {
                if (relationship < -20) {
                    // Rival faction loses rep when you gain with their enemy
                    const rivalRep = player.factionRep.find(r => r.factionId === rivalId);
                    if (rivalRep) {
                        const penalty = Math.round(amount * REP_CROSS_FACTION_PENALTY * Math.abs(relationship) / 100);
                        rivalRep.reputation = Math.max(-100, rivalRep.reputation + penalty);
                        rivalRep.rank = this.calculateRank(rivalRep.reputation);
                    }
                }
            }
        }

        // Log rank changes
        if (rep.rank !== oldRank) {
            const factionName = faction?.name ?? factionId;
            log.push({
                time: gameTime,
                type: 'faction',
                message: `Reputation with ${factionName}: ${oldRank} -> ${rep.rank}${reason ? ` (${reason})` : ''}`,
            });
        }
    }

    /** Apply reputation effects from trading */
    onTrade(
        player: PlayerState,
        system: StarSystemData,
        commodityId: string,
        isBuying: boolean,
        log: LogEntry[],
        gameTime: number
    ): void {
        if (!system.factionId) return;

        const commodity = COMMODITY_MAP.get(commodityId);
        if (!commodity) return;

        // Trading in faction territory earns a small rep gain
        let amount = isBuying ? REP_TRADE_GAIN * 0.5 : REP_TRADE_GAIN;

        // Contraband is risky
        if (commodity.isContraband) {
            // Smuggling detection check
            const detected = this.checkSmuggling(player, system);
            if (detected) {
                amount = REP_SMUGGLE_LOSS;
                log.push({
                    time: gameTime,
                    type: 'faction',
                    message: `Caught with contraband in ${system.name}! Reputation damaged.`,
                });
            } else {
                // Successful smuggling: bonus with syndicate
                this.adjustReputation(player, 'syndicate', REP_SMUGGLE_GAIN, log, gameTime, 'smuggling');
            }
        }

        this.adjustReputation(player, system.factionId, amount, log, gameTime, 'trade');
    }

    /** Apply reputation effects from combat */
    onCombatVictory(
        player: PlayerState,
        system: StarSystemData,
        log: LogEntry[],
        gameTime: number
    ): void {
        // Defeating pirates helps rep with the controlling faction
        if (system.factionId && system.factionId !== 'syndicate') {
            this.adjustReputation(
                player, system.factionId, REP_COMBAT_GAIN,
                log, gameTime, 'defeating pirates'
            );
        }

        // Fighting in syndicate territory: gain syndicate rep (shows you're tough)
        if (system.factionId === 'syndicate') {
            this.adjustReputation(
                player, 'syndicate', REP_COMBAT_GAIN * 0.5,
                log, gameTime, 'combat prowess'
            );
        }
    }

    /** Check if smuggling is detected */
    private checkSmuggling(player: PlayerState, system: StarSystemData): boolean {
        if (!system.factionId) return false;

        const rep = player.factionRep.find(r => r.factionId === system.factionId);
        const repBonus = rep ? Math.max(0, rep.reputation) / 200 : 0;

        // Stealth modules and crew reduce detection
        let stealthBonus = 0;
        for (const member of player.crew) {
            stealthBonus += (member.skillLevels.stealth ?? 0) * 0.03;
        }

        // Base detection chance: 30%, reduced by stealth and reputation
        const detectionChance = Math.max(0.05, 0.3 - stealthBonus - repBonus);

        // Hegemony is stricter about inspections
        const factionModifier = system.factionId === 'hegemony' ? 1.5 :
            system.factionId === 'syndicate' ? 0.3 : 1.0;

        return Math.random() < (detectionChance * factionModifier);
    }

    /** Calculate rank from reputation number */
    private calculateRank(reputation: number): FactionRank {
        if (reputation <= REP_HOSTILE_THRESHOLD) return 'hostile';
        if (reputation < 0) return 'unfriendly';
        if (reputation < REP_FRIENDLY_THRESHOLD) return 'neutral';
        if (reputation < REP_ALLIED_THRESHOLD) return 'friendly';
        if (reputation < REP_EXALTED_THRESHOLD) return 'allied';
        return 'exalted';
    }

    /** Get reputation with a faction */
    getReputation(player: PlayerState, factionId: string): FactionReputation | undefined {
        return player.factionRep.find(r => r.factionId === factionId);
    }

    /** Get price modifier based on faction reputation */
    getPriceModifier(player: PlayerState, factionId: string | null): { buy: number; sell: number } {
        if (!factionId) return { buy: 1.0, sell: 1.0 };

        const rep = player.factionRep.find(r => r.factionId === factionId);
        if (!rep) return { buy: 1.0, sell: 1.0 };

        // Better reputation = better prices
        switch (rep.rank) {
            case 'hostile': return { buy: 1.3, sell: 0.7 };
            case 'unfriendly': return { buy: 1.15, sell: 0.85 };
            case 'neutral': return { buy: 1.0, sell: 1.0 };
            case 'friendly': return { buy: 0.95, sell: 1.05 };
            case 'allied': return { buy: 0.9, sell: 1.1 };
            case 'exalted': return { buy: 0.85, sell: 1.15 };
        }
    }

    /** Check if player can access faction-exclusive commodities */
    canAccessExclusive(player: PlayerState, factionId: string): boolean {
        const rep = player.factionRep.find(r => r.factionId === factionId);
        if (!rep) return false;
        return rep.rank === 'friendly' || rep.rank === 'allied' || rep.rank === 'exalted';
    }

    /** Check if player is hostile with a faction (affects access to their stations) */
    isHostile(player: PlayerState, factionId: string): boolean {
        const rep = player.factionRep.find(r => r.factionId === factionId);
        return rep?.rank === 'hostile';
    }

    /** Get all faction standings */
    getAllStandings(player: PlayerState): Array<{
        factionId: string;
        factionName: string;
        reputation: number;
        rank: FactionRank;
        color: number;
    }> {
        return player.factionRep.map(rep => {
            const faction = FACTION_MAP.get(rep.factionId);
            return {
                factionId: rep.factionId,
                factionName: faction?.name ?? rep.factionId,
                reputation: rep.reputation,
                rank: rep.rank,
                color: faction?.color ?? 0x888888,
            };
        });
    }
}
