// ============================================================
// Star Routes - Event Panel
// Event display with narrative text and choice buttons
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { GameEventDef, EventChoice } from '../types';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

export class EventPanel extends GameObjects.Container {
    private titleText: GameObjects.Text;
    private descriptionText: GameObjects.Text;
    private choiceContainer: GameObjects.Container;
    private outcomeText: GameObjects.Text;
    private onChoice: ((choiceIndex: number) => void) | null = null;
    private onContinue: (() => void) | null = null;

    constructor(scene: Scene) {
        super(scene, 0, 0);
        this.setDepth(400);

        // Dark overlay
        const overlay = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
        this.add(overlay);

        // Event card
        const cardWidth = 600;
        const cardHeight = 450;
        const card = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, cardWidth, cardHeight, COLORS.panelBg, 0.95);
        card.setStrokeStyle(2, COLORS.panelBorder, 0.8);
        this.add(card);

        // Title
        this.titleText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 180, '', {
            fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);
        this.add(this.titleText);

        // Description
        this.descriptionText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, '', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
            wordWrap: { width: 500 },
            align: 'center',
        }).setOrigin(0.5, 0);
        this.add(this.descriptionText);

        // Choices container
        this.choiceContainer = scene.add.container(0, 0);
        this.add(this.choiceContainer);

        // Outcome text
        this.outcomeText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '', {
            fontSize: '13px', fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
            wordWrap: { width: 500 },
            align: 'center',
        }).setOrigin(0.5, 0);
        this.add(this.outcomeText);

        scene.add.existing(this);
    }

    setChoiceHandler(handler: (choiceIndex: number) => void): void {
        this.onChoice = handler;
    }

    setContinueHandler(handler: () => void): void {
        this.onContinue = handler;
    }

    showEvent(
        event: GameEventDef,
        availableChoices: Array<{
            choice: EventChoice;
            index: number;
            meetsRequirements: boolean;
            requirementText?: string;
        }>
    ): void {
        this.titleText.setText(event.name);
        this.descriptionText.setText(event.description);
        this.outcomeText.setText('');
        this.showChoices(availableChoices);
    }

    private showChoices(
        choices: Array<{
            choice: EventChoice;
            index: number;
            meetsRequirements: boolean;
            requirementText?: string;
        }>
    ): void {
        this.choiceContainer.removeAll(true);
        const scene = this.choiceContainer.scene;

        const startY = GAME_HEIGHT / 2 - 30;

        for (let i = 0; i < choices.length; i++) {
            const choice = choices[i];
            const y = startY + i * 45;

            const btnWidth = 500;
            const btnHeight = 36;

            const container = scene.add.container(GAME_WIDTH / 2, y);

            const bg = scene.add.rectangle(0, 0, btnWidth, btnHeight,
                choice.meetsRequirements ? COLORS.panelBg : 0x1a1a2a, 0.9);
            bg.setStrokeStyle(1,
                choice.meetsRequirements ? COLORS.textHighlight : COLORS.textSecondary,
                choice.meetsRequirements ? 0.5 : 0.2);
            container.add(bg);

            const textColor = choice.meetsRequirements
                ? '#' + COLORS.textPrimary.toString(16).padStart(6, '0')
                : '#' + COLORS.textSecondary.toString(16).padStart(6, '0');

            let labelStr = choice.choice.text;
            if (!choice.meetsRequirements && choice.requirementText) {
                labelStr += ` (${choice.requirementText})`;
            }

            const text = scene.add.text(0, 0, labelStr, {
                fontSize: '11px', fontFamily: 'monospace',
                color: textColor,
            }).setOrigin(0.5, 0.5);
            container.add(text);

            if (choice.meetsRequirements) {
                container.setSize(btnWidth, btnHeight);
                container.setInteractive();
                container.on('pointerdown', () => {
                    if (this.onChoice) this.onChoice(choice.index);
                });
                container.on('pointerover', () => bg.setFillStyle(COLORS.panelBg, 1));
                container.on('pointerout', () => bg.setFillStyle(COLORS.panelBg, 0.9));
            }

            this.choiceContainer.add(container);
        }
    }

    showOutcome(text: string): void {
        this.choiceContainer.removeAll(true);
        this.outcomeText.setText(text);

        // Continue button
        const scene = this.scene;
        const continueBtn = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 160);
        const bg = scene.add.rectangle(0, 0, 120, 32, COLORS.textHighlight, 0.3);
        bg.setStrokeStyle(1, COLORS.textHighlight, 0.6);
        continueBtn.add(bg);

        const btnText = scene.add.text(0, 0, 'CONTINUE', {
            fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);
        continueBtn.add(btnText);

        continueBtn.setSize(120, 32);
        continueBtn.setInteractive();
        continueBtn.on('pointerdown', () => {
            if (this.onContinue) this.onContinue();
        });
        continueBtn.on('pointerover', () => bg.setFillStyle(COLORS.textHighlight, 0.5));
        continueBtn.on('pointerout', () => bg.setFillStyle(COLORS.textHighlight, 0.3));

        this.choiceContainer.add(continueBtn);
    }
}
