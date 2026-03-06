// ============================================================
// Star Routes - Combat UI
// Combat encounter: enemy display, actions, health bars
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { CombatState } from '../types';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { CombatAction } from '../systems/CombatSystem';

export class CombatUI extends GameObjects.Container {
    private playerHullBar: GameObjects.Rectangle;
    private playerShieldBar: GameObjects.Rectangle;
    private enemyHullBar: GameObjects.Rectangle;
    private enemyShieldBar: GameObjects.Rectangle;
    private enemyNameText: GameObjects.Text;
    private roundText: GameObjects.Text;
    private logText: GameObjects.Text;
    private resultText: GameObjects.Text;
    private actionButtons: GameObjects.Container[] = [];
    private onAction: ((action: CombatAction) => void) | null = null;
    private onContinue: (() => void) | null = null;

    constructor(scene: Scene) {
        super(scene, 0, 0);
        this.setDepth(500);

        // Full screen dark overlay
        const overlay = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);
        this.add(overlay);

        // Title
        const title = scene.add.text(GAME_WIDTH / 2, 60, 'COMBAT', {
            fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.negative.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);
        this.add(title);

        // Enemy section
        this.enemyNameText = scene.add.text(GAME_WIDTH / 2, 100, '', {
            fontSize: '16px', fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);
        this.add(this.enemyNameText);

        // Enemy bars
        const barWidth = 200;
        const enemyBarX = GAME_WIDTH / 2 - barWidth / 2;

        scene.add.text(enemyBarX - 50, 125, 'Hull', {
            fontSize: '10px', fontFamily: 'monospace',
            color: '#' + COLORS.hullBar.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(scene.children.list[scene.children.list.length - 1] as GameObjects.Text);

        const eHullBg = scene.add.rectangle(GAME_WIDTH / 2, 125, barWidth, 10, 0x222233);
        this.add(eHullBg);
        this.enemyHullBar = scene.add.rectangle(enemyBarX, 125, barWidth, 10, COLORS.negative);
        this.enemyHullBar.setOrigin(0, 0.5);
        this.add(this.enemyHullBar);

        const eShieldBg = scene.add.rectangle(GAME_WIDTH / 2, 140, barWidth, 8, 0x222233);
        this.add(eShieldBg);
        this.enemyShieldBar = scene.add.rectangle(enemyBarX, 140, barWidth, 8, COLORS.shieldBar);
        this.enemyShieldBar.setOrigin(0, 0.5);
        this.add(this.enemyShieldBar);

        // Player section
        scene.add.text(GAME_WIDTH / 2, 530, 'YOUR SHIP', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);
        this.add(scene.children.list[scene.children.list.length - 1] as GameObjects.Text);

        const pHullBg = scene.add.rectangle(GAME_WIDTH / 2, 550, barWidth, 10, 0x222233);
        this.add(pHullBg);
        this.playerHullBar = scene.add.rectangle(enemyBarX, 550, barWidth, 10, COLORS.hullBar);
        this.playerHullBar.setOrigin(0, 0.5);
        this.add(this.playerHullBar);

        const pShieldBg = scene.add.rectangle(GAME_WIDTH / 2, 565, barWidth, 8, 0x222233);
        this.add(pShieldBg);
        this.playerShieldBar = scene.add.rectangle(enemyBarX, 565, barWidth, 8, COLORS.shieldBar);
        this.playerShieldBar.setOrigin(0, 0.5);
        this.add(this.playerShieldBar);

        // Round counter
        this.roundText = scene.add.text(GAME_WIDTH / 2, 175, 'Round 1', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);
        this.add(this.roundText);

        // Combat log
        this.logText = scene.add.text(GAME_WIDTH / 2, 350, '', {
            fontSize: '11px', fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
            align: 'center',
            wordWrap: { width: 500 },
        }).setOrigin(0.5, 0.5);
        this.add(this.logText);

        // Result text (hidden until combat ends)
        this.resultText = scene.add.text(GAME_WIDTH / 2, 450, '', {
            fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.positive.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);
        this.add(this.resultText);

        // Action buttons
        const actions: Array<{ action: CombatAction; label: string; color: number }> = [
            { action: 'attack', label: 'ATTACK', color: COLORS.negative },
            { action: 'defend', label: 'DEFEND', color: COLORS.shieldBar },
            { action: 'flee', label: 'FLEE', color: COLORS.warning },
            { action: 'negotiate', label: 'NEGOTIATE', color: COLORS.textHighlight },
        ];

        const btnStartX = GAME_WIDTH / 2 - (actions.length * 100) / 2 + 50;
        for (let i = 0; i < actions.length; i++) {
            const a = actions[i];
            const btn = this.createActionButton(scene, btnStartX + i * 100, 620, a.label, a.color, () => {
                if (this.onAction) this.onAction(a.action);
            });
            this.actionButtons.push(btn);
            this.add(btn);
        }

        scene.add.existing(this);
    }

    setActionHandler(handler: (action: CombatAction) => void): void {
        this.onAction = handler;
    }

    setContinueHandler(handler: () => void): void {
        this.onContinue = handler;
    }

    updateDisplay(combat: CombatState, playerMaxHull: number, playerMaxShield: number): void {
        const barWidth = 200;

        this.enemyNameText.setText(combat.enemyName);
        this.roundText.setText(`Round ${combat.round}`);

        // Enemy bars
        const eHullPct = Math.max(0, combat.enemyHull / 100);
        this.enemyHullBar.setSize(barWidth * eHullPct, 10);

        const eShieldPct = Math.max(0, combat.enemyShield / 50);
        this.enemyShieldBar.setSize(barWidth * Math.min(1, eShieldPct), 8);

        // Player bars
        const pHullPct = Math.max(0, combat.playerHull / playerMaxHull);
        this.playerHullBar.setSize(barWidth * pHullPct, 10);

        const pShieldPct = Math.max(0, combat.playerShield / playerMaxShield);
        this.playerShieldBar.setSize(barWidth * pShieldPct, 8);

        // Show last 5 log entries
        const recentLog = combat.log.slice(-5).join('\n');
        this.logText.setText(recentLog);

        // Handle combat end
        if (combat.result !== 'ongoing') {
            this.showResult(combat);
        }
    }

    private showResult(combat: CombatState): void {
        // Hide action buttons
        for (const btn of this.actionButtons) {
            btn.setVisible(false);
        }

        let resultMsg: string;
        let resultColor: number;

        switch (combat.result) {
            case 'victory':
                resultMsg = 'VICTORY!';
                resultColor = COLORS.positive;
                if (combat.loot) {
                    resultMsg += `\nLoot: ${combat.loot.credits} credits`;
                    if (combat.loot.cargo.length > 0) {
                        resultMsg += ` + ${combat.loot.cargo.length} cargo items`;
                    }
                }
                break;
            case 'defeat':
                resultMsg = 'DEFEAT...';
                resultColor = COLORS.negative;
                break;
            case 'fled':
                resultMsg = 'ESCAPED';
                resultColor = COLORS.warning;
                break;
            case 'negotiated':
                resultMsg = 'NEGOTIATED PEACE';
                resultColor = COLORS.textHighlight;
                break;
            default:
                resultMsg = '';
                resultColor = COLORS.textPrimary;
        }

        this.resultText.setText(resultMsg);
        this.resultText.setColor('#' + resultColor.toString(16).padStart(6, '0'));

        // Continue button
        const scene = this.scene;
        const continueBtn = this.createActionButton(scene, GAME_WIDTH / 2, 620, 'CONTINUE', COLORS.textHighlight, () => {
            if (this.onContinue) this.onContinue();
        });
        this.add(continueBtn);
    }

    resetForNewCombat(): void {
        this.resultText.setText('');
        for (const btn of this.actionButtons) {
            btn.setVisible(true);
        }
    }

    private createActionButton(
        scene: Scene,
        x: number,
        y: number,
        label: string,
        color: number,
        onClick: () => void
    ): GameObjects.Container {
        const container = scene.add.container(x, y);
        const width = Math.max(80, label.length * 10 + 20);
        const bg = scene.add.rectangle(0, 0, width, 32, color, 0.2);
        bg.setStrokeStyle(1, color, 0.6);
        container.add(bg);

        const text = scene.add.text(0, 0, label, {
            fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + color.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);
        container.add(text);

        container.setSize(width, 32);
        container.setInteractive();
        container.on('pointerdown', onClick);
        container.on('pointerover', () => bg.setFillStyle(color, 0.4));
        container.on('pointerout', () => bg.setFillStyle(color, 0.2));

        return container;
    }
}
