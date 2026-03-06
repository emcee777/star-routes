// ============================================================
// Star Routes - Log UI
// Scrollable trade log / captain's journal
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { LogEntry, LogType } from '../types';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

const LOG_TYPE_COLORS: Record<LogType, number> = {
    trade: COLORS.positive,
    travel: COLORS.textHighlight,
    combat: COLORS.negative,
    event: COLORS.warning,
    crew: COLORS.cargoBar,
    faction: COLORS.fuelBar,
    economy: COLORS.textSecondary,
    ship: COLORS.shieldBar,
    system: COLORS.textPrimary,
};

export class LogUI extends GameObjects.Container {
    private logContainer: GameObjects.Container;
    private entries: LogEntry[] = [];
    private scrollOffset: number = 0;
    private maxVisible: number = 25;

    constructor(scene: Scene) {
        super(scene, 0, 0);
        this.setDepth(150);

        // Panel background
        const panelWidth = 280;
        const panelHeight = GAME_HEIGHT - 100;
        const bg = scene.add.rectangle(
            GAME_WIDTH - panelWidth / 2 - 10,
            GAME_HEIGHT / 2 + 20,
            panelWidth, panelHeight, COLORS.panelBg, 0.85
        );
        bg.setStrokeStyle(1, COLORS.panelBorder, 0.4);
        this.add(bg);

        // Title
        const title = scene.add.text(GAME_WIDTH - panelWidth - 5, 55, "CAPTAIN'S LOG", {
            fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        });
        this.add(title);

        this.logContainer = scene.add.container(0, 0);
        this.add(this.logContainer);

        scene.add.existing(this);
    }

    updateEntries(entries: LogEntry[]): void {
        this.entries = entries;
        this.render();
    }

    addEntry(entry: LogEntry): void {
        this.entries.push(entry);
        // Auto-scroll to bottom
        this.scrollOffset = Math.max(0, this.entries.length - this.maxVisible);
        this.render();
    }

    private render(): void {
        this.logContainer.removeAll(true);
        const scene = this.logContainer.scene;

        const panelWidth = 260;
        const startX = GAME_WIDTH - panelWidth - 15;
        const startY = 72;
        const lineHeight = 24;

        const visibleEntries = this.entries.slice(
            this.scrollOffset,
            this.scrollOffset + this.maxVisible
        );

        for (let i = 0; i < visibleEntries.length; i++) {
            const entry = visibleEntries[i];
            const y = startY + i * lineHeight;
            const color = LOG_TYPE_COLORS[entry.type] ?? COLORS.textPrimary;

            // Truncate message to fit
            const maxChars = 32;
            const msg = entry.message.length > maxChars
                ? entry.message.substring(0, maxChars - 2) + '..'
                : entry.message;

            const text = scene.add.text(startX, y, msg, {
                fontSize: '9px',
                fontFamily: 'monospace',
                color: '#' + color.toString(16).padStart(6, '0'),
                wordWrap: { width: panelWidth - 10 },
            });
            this.logContainer.add(text);
        }
    }

    scrollUp(): void {
        this.scrollOffset = Math.max(0, this.scrollOffset - 5);
        this.render();
    }

    scrollDown(): void {
        this.scrollOffset = Math.min(
            Math.max(0, this.entries.length - this.maxVisible),
            this.scrollOffset + 5
        );
        this.render();
    }
}
