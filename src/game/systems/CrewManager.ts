// ============================================================
// Star Routes - Crew Manager
// Hire, fire, morale tracking, skill effects
// ============================================================

import { CrewMemberData, CrewSkill, CrewTrait, PlayerState, LogEntry } from '../types';
import {
    MAX_CREW_SIZE, MORALE_DECAY_PER_DAY, MORALE_LEAVE_THRESHOLD,
    SALARY_PAYMENT_INTERVAL
} from '../config/constants';
import {
    CREW_FIRST_NAMES, CREW_LAST_NAMES,
    CREW_SALARIES, POSITIVE_TRAITS, NEGATIVE_TRAITS
} from '../config/crew-data';

export class CrewManager {
    /** Generate a random crew member for hire */
    generateCrewMember(gameTime: number, seed?: number): CrewMemberData {
        const rng = seed !== undefined
            ? this.seededRandom(seed)
            : Math.random;

        const firstName = CREW_FIRST_NAMES[Math.floor(rng() * CREW_FIRST_NAMES.length)];
        const lastName = CREW_LAST_NAMES[Math.floor(rng() * CREW_LAST_NAMES.length)];

        const skills: CrewSkill[] = [
            'navigation', 'combat', 'trading', 'engineering', 'diplomacy',
            'stealth', 'medicine', 'leadership', 'piloting', 'gunnery',
            'hacking', 'mining', 'logistics', 'scouting', 'intimidation'
        ];

        const primarySkill = skills[Math.floor(rng() * skills.length)];
        let secondarySkill = skills[Math.floor(rng() * skills.length)];
        while (secondarySkill === primarySkill) {
            secondarySkill = skills[Math.floor(rng() * skills.length)];
        }

        const skillLevels: Partial<Record<CrewSkill, number>> = {};
        skillLevels[primarySkill] = 3 + Math.floor(rng() * 5); // 3-7
        skillLevels[secondarySkill] = 1 + Math.floor(rng() * 4); // 1-4

        // Sometimes add a third minor skill
        if (rng() > 0.5) {
            let tertiarySkill = skills[Math.floor(rng() * skills.length)];
            while (tertiarySkill === primarySkill || tertiarySkill === secondarySkill) {
                tertiarySkill = skills[Math.floor(rng() * skills.length)];
            }
            skillLevels[tertiarySkill] = 1 + Math.floor(rng() * 2); // 1-2
        }

        // Assign traits
        const traits: CrewTrait[] = [];
        const numTraits = 1 + Math.floor(rng() * 2);
        const allTraits: CrewTrait[] = [...POSITIVE_TRAITS, ...NEGATIVE_TRAITS] as CrewTrait[];

        for (let i = 0; i < numTraits; i++) {
            const trait = allTraits[Math.floor(rng() * allTraits.length)];
            if (!traits.includes(trait)) {
                traits.push(trait);
            }
        }

        // Calculate salary
        const totalSkillLevel = Object.values(skillLevels).reduce((a, b) => a + (b ?? 0), 0);
        const positiveTraitCount = traits.filter(t =>
            (POSITIVE_TRAITS as readonly string[]).includes(t)
        ).length;
        const salary = CREW_SALARIES.base +
            totalSkillLevel * CREW_SALARIES.perSkillLevel +
            positiveTraitCount * CREW_SALARIES.perTrait;

        return {
            id: `crew_${Date.now()}_${Math.floor(rng() * 10000)}`,
            name: `${firstName} ${lastName}`,
            portrait: Math.floor(rng() * 1000),
            primarySkill,
            secondarySkill,
            skillLevels,
            traits,
            morale: 60 + Math.floor(rng() * 30), // 60-90
            salary,
            experience: Math.floor(rng() * 100),
            hiredAt: gameTime,
        };
    }

    /** Generate available crew for hire at a station */
    generateAvailableCrew(gameTime: number, systemSeed: number, count: number = 3): CrewMemberData[] {
        const crew: CrewMemberData[] = [];
        for (let i = 0; i < count; i++) {
            crew.push(this.generateCrewMember(gameTime, systemSeed * 1000 + i + gameTime));
        }
        return crew;
    }

    /** Hire a crew member */
    hire(player: PlayerState, crewMember: CrewMemberData, log: LogEntry[], gameTime: number): {
        success: boolean;
        message: string;
    } {
        if (player.crew.length >= MAX_CREW_SIZE) {
            return { success: false, message: `Crew is full (max ${MAX_CREW_SIZE}).` };
        }

        // Hiring bonus/fee
        const hiringFee = crewMember.salary * 5;
        if (player.credits < hiringFee) {
            return { success: false, message: `Not enough credits. Hiring fee: ${hiringFee}.` };
        }

        player.credits -= hiringFee;
        crewMember.hiredAt = gameTime;
        crewMember.morale = 75; // fresh start morale
        player.crew.push(crewMember);
        player.crewHired++;

        log.push({
            time: gameTime,
            type: 'crew',
            message: `Hired ${crewMember.name} (${crewMember.primarySkill}) for ${hiringFee} credits`,
        });

        return { success: true, message: `Hired ${crewMember.name}!` };
    }

    /** Fire a crew member */
    fire(player: PlayerState, crewId: string, log: LogEntry[], gameTime: number): {
        success: boolean;
        message: string;
    } {
        const idx = player.crew.findIndex(c => c.id === crewId);
        if (idx < 0) {
            return { success: false, message: 'Crew member not found.' };
        }

        const member = player.crew[idx];
        player.crew.splice(idx, 1);

        // Firing affects remaining crew morale
        for (const c of player.crew) {
            if (c.traits.includes('loyal')) {
                c.morale -= 5;
            }
            c.morale -= 3;
        }

        log.push({
            time: gameTime,
            type: 'crew',
            message: `Dismissed ${member.name} from the crew.`,
        });

        return { success: true, message: `${member.name} has been dismissed.` };
    }

    /** Daily morale update */
    dailyUpdate(player: PlayerState, log: LogEntry[], gameTime: number): void {
        const toRemove: string[] = [];

        for (const member of player.crew) {
            // Natural morale decay
            let decay = MORALE_DECAY_PER_DAY;

            // Traits affect morale
            if (member.traits.includes('loyal')) decay *= 0.5;
            if (member.traits.includes('greedy') && player.credits < 1000) decay *= 2;
            if (member.traits.includes('brave')) decay *= 0.8;
            if (member.traits.includes('cowardly') && player.ship.hull < player.ship.maxHull * 0.5) decay *= 2;

            // Leadership bonus
            const hasLeader = player.crew.some(c =>
                c.id !== member.id && (c.skillLevels.leadership ?? 0) > 0
            );
            if (hasLeader) decay *= 0.7;

            member.morale = Math.max(0, Math.min(100, member.morale - decay));

            // Crew may leave if morale is too low
            if (member.morale < MORALE_LEAVE_THRESHOLD && Math.random() < 0.15) {
                toRemove.push(member.id);
                log.push({
                    time: gameTime,
                    type: 'crew',
                    message: `${member.name} has deserted the crew due to low morale!`,
                });
            }
        }

        // Remove deserters
        player.crew = player.crew.filter(c => !toRemove.includes(c.id));
    }

    /** Pay crew salaries */
    paySalaries(player: PlayerState, gameTime: number, log: LogEntry[]): {
        totalCost: number;
        paid: boolean;
    } {
        if (gameTime % SALARY_PAYMENT_INTERVAL !== 0) {
            return { totalCost: 0, paid: false };
        }

        const totalCost = player.crew.reduce((sum, c) => sum + c.salary, 0);

        if (player.credits >= totalCost) {
            player.credits -= totalCost;
            // Paying salaries gives a small morale boost
            for (const member of player.crew) {
                member.morale = Math.min(100, member.morale + 2);
            }
            if (totalCost > 0) {
                log.push({
                    time: gameTime,
                    type: 'crew',
                    message: `Paid crew salaries: ${totalCost} credits.`,
                });
            }
            return { totalCost, paid: true };
        } else {
            // Can't pay: morale hit
            for (const member of player.crew) {
                member.morale = Math.max(0, member.morale - 10);
            }
            log.push({
                time: gameTime,
                type: 'crew',
                message: `Cannot afford crew salaries (${totalCost} credits)! Morale drops.`,
            });
            return { totalCost, paid: false };
        }
    }

    /** Get total crew bonus for a specific skill */
    getSkillBonus(crew: CrewMemberData[], skill: CrewSkill): number {
        let total = 0;
        for (const member of crew) {
            const level = member.skillLevels[skill] ?? 0;
            if (level > 0) {
                // Morale affects effectiveness
                const moraleMultiplier = 0.5 + (member.morale / 100) * 0.5;
                total += level * moraleMultiplier;
            }
        }
        return total;
    }

    /** Check if crew has a member with a specific skill */
    hasSkill(crew: CrewMemberData[], skill: CrewSkill): boolean {
        return crew.some(c => (c.skillLevels[skill] ?? 0) > 0);
    }

    /** Get total salary per payment period */
    getTotalSalary(crew: CrewMemberData[]): number {
        return crew.reduce((sum, c) => sum + c.salary, 0);
    }

    /** Adjust morale for an event */
    adjustMorale(crew: CrewMemberData[], amount: number): void {
        for (const member of crew) {
            member.morale = Math.max(0, Math.min(100, member.morale + amount));
        }
    }

    /** Get average morale */
    getAverageMorale(crew: CrewMemberData[]): number {
        if (crew.length === 0) return 100;
        return crew.reduce((sum, c) => sum + c.morale, 0) / crew.length;
    }

    private seededRandom(seed: number): () => number {
        let s = seed;
        return () => {
            s = (s * 1664525 + 1013904223) & 0x7fffffff;
            return s / 0x7fffffff;
        };
    }
}
