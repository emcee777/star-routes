// ============================================================
// Star Routes - Save System
// LocalStorage save/load of full game state
// ============================================================

import { GameState } from '../types';
import { GAME_VERSION } from '../config/constants';

const SAVE_KEY = 'star_routes_save';
const SAVE_SLOTS_KEY = 'star_routes_slots';

export interface SaveSlot {
    name: string;
    playerName: string;
    credits: number;
    day: number;
    systemsVisited: number;
    savedAt: number;
}

export class SaveSystem {
    /** Save the game state to localStorage */
    save(state: GameState, slotName: string = 'auto'): boolean {
        try {
            state.savedAt = Date.now();
            state.version = GAME_VERSION;

            const key = `${SAVE_KEY}_${slotName}`;
            const data = JSON.stringify(state);
            localStorage.setItem(key, data);

            // Update save slot info
            this.updateSlotInfo(state, slotName);

            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }

    /** Load a game state from localStorage */
    load(slotName: string = 'auto'): GameState | null {
        try {
            const key = `${SAVE_KEY}_${slotName}`;
            const data = localStorage.getItem(key);
            if (!data) return null;

            const state = JSON.parse(data) as GameState;
            return state;
        } catch (e) {
            console.error('Failed to load game:', e);
            return null;
        }
    }

    /** Delete a save slot */
    deleteSave(slotName: string): void {
        const key = `${SAVE_KEY}_${slotName}`;
        localStorage.removeItem(key);

        // Update slots list
        const slots = this.getSaveSlots();
        const filtered = slots.filter(s => s.name !== slotName);
        localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(filtered));
    }

    /** Get all save slots */
    getSaveSlots(): SaveSlot[] {
        try {
            const data = localStorage.getItem(SAVE_SLOTS_KEY);
            if (!data) return [];
            return JSON.parse(data) as SaveSlot[];
        } catch {
            return [];
        }
    }

    /** Check if a save exists */
    hasSave(slotName: string = 'auto'): boolean {
        const key = `${SAVE_KEY}_${slotName}`;
        return localStorage.getItem(key) !== null;
    }

    /** Auto-save if enabled */
    autoSave(state: GameState): boolean {
        if (!state.settings.autoSave) return false;
        return this.save(state, 'auto');
    }

    private updateSlotInfo(state: GameState, slotName: string): void {
        const slots = this.getSaveSlots();
        const existing = slots.findIndex(s => s.name === slotName);

        const slotInfo: SaveSlot = {
            name: slotName,
            playerName: state.player.name,
            credits: state.player.credits,
            day: state.player.daysSurvived,
            systemsVisited: state.player.systemsVisited.length,
            savedAt: state.savedAt,
        };

        if (existing >= 0) {
            slots[existing] = slotInfo;
        } else {
            slots.push(slotInfo);
        }

        localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
    }
}
