// ============================================================
// Star Routes - Time System
// Tracks in-game time, day/night cycles, market evolution
// ============================================================

import { GameState } from '../types';
import { DAY_LENGTH_TICKS } from '../config/constants';

export class TimeSystem {
    private gameTime: number = 0;
    private dayLength: number = DAY_LENGTH_TICKS;
    private paused: boolean = false;
    private tickCallbacks: Array<(time: number, day: number) => void> = [];
    private dailyCallbacks: Array<(day: number) => void> = [];

    get currentTime(): number {
        return this.gameTime;
    }

    get currentDay(): number {
        return Math.floor(this.gameTime / this.dayLength);
    }

    get timeOfDay(): number {
        return (this.gameTime % this.dayLength) / this.dayLength;
    }

    get isPaused(): boolean {
        return this.paused;
    }

    pause(): void {
        this.paused = true;
    }

    resume(): void {
        this.paused = false;
    }

    onTick(callback: (time: number, day: number) => void): void {
        this.tickCallbacks.push(callback);
    }

    onDaily(callback: (day: number) => void): void {
        this.dailyCallbacks.push(callback);
    }

    tick(): void {
        if (this.paused) return;

        const prevDay = this.currentDay;
        this.gameTime++;
        const newDay = this.currentDay;

        // Notify tick listeners
        for (const cb of this.tickCallbacks) {
            cb(this.gameTime, newDay);
        }

        // Notify daily listeners on day boundary
        if (newDay > prevDay) {
            for (const cb of this.dailyCallbacks) {
                cb(newDay);
            }
        }
    }

    formatTime(ticks?: number): string {
        const t = ticks ?? this.gameTime;
        const day = Math.floor(t / this.dayLength) + 1;
        const hour = Math.floor((t % this.dayLength) / this.dayLength * 24);
        return `Day ${day}, ${hour.toString().padStart(2, '0')}:00`;
    }

    formatDay(ticks?: number): string {
        const t = ticks ?? this.gameTime;
        return `Day ${Math.floor(t / this.dayLength) + 1}`;
    }

    loadState(state: GameState): void {
        this.gameTime = state.gameTime;
        this.dayLength = state.gameDayLength;
    }

    saveToState(state: GameState): void {
        state.gameTime = this.gameTime;
        state.gameDayLength = this.dayLength;
    }
}
