// ============================================================
// Star Routes - Crew Panel
// Crew roster, hire available crew, fire crew, morale display
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { PlayerState, CrewMemberData } from '../types';
import { COLORS, GAME_WIDTH, MAX_CREW_SIZE } from '../config/constants';
import { CrewManager } from '../systems/CrewManager';
import { POSITIVE_TRAITS } from '../config/crew-data';
import { AudioManager } from '../audio/AudioManager';

export class CrewPanel extends GameObjects.Container {
    private crewManager: CrewManager;
    private contentContainer: GameObjects.Container;
    private messageText: GameObjects.Text;
    private availableCrew: CrewMemberData[] = [];
    private onUpdate: (() => void) | null = null;

    constructor(scene: Scene, crewManager: CrewManager) {
        super(scene, 0, 0);
        this.crewManager = crewManager;
        this.setDepth(200);

        this.contentContainer = scene.add.container(0, 0);
        this.add(this.contentContainer);

        this.messageText = scene.add.text(GAME_WIDTH / 2, 680, '', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
            align: 'center',
        }).setOrigin(0.5, 0.5);
        this.add(this.messageText);

        scene.add.existing(this);
    }

    setUpdateHandler(handler: () => void): void {
        this.onUpdate = handler;
    }

    setAvailableCrew(crew: CrewMemberData[]): void {
        this.availableCrew = crew;
    }

    updateDisplay(player: PlayerState, gameTime: number): void {
        this.contentContainer.removeAll(true);
        const scene = this.contentContainer.scene;

        // Current crew
        const crewTitle = scene.add.text(20, 95, `YOUR CREW (${player.crew.length}/${MAX_CREW_SIZE})`, {
            fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        });
        this.contentContainer.add(crewTitle);

        const avgMorale = this.crewManager.getAverageMorale(player.crew);
        const moraleColor = avgMorale > 60 ? COLORS.positive : avgMorale > 30 ? COLORS.warning : COLORS.negative;
        const moraleText = scene.add.text(GAME_WIDTH / 2 - 20, 95, `Avg Morale: ${Math.round(avgMorale)}%`, {
            fontSize: '11px', fontFamily: 'monospace',
            color: '#' + moraleColor.toString(16).padStart(6, '0'),
        }).setOrigin(1, 0);
        this.contentContainer.add(moraleText);

        if (player.crew.length === 0) {
            const empty = scene.add.text(20, 120, 'No crew hired yet.', {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.contentContainer.add(empty);
        } else {
            for (let i = 0; i < player.crew.length; i++) {
                const member = player.crew[i];
                const y = 115 + i * 55;
                this.drawCrewMember(scene, member, y, player, gameTime, true);
            }
        }

        // Available for hire
        const hireTitle = scene.add.text(GAME_WIDTH / 2 + 20, 95, 'AVAILABLE FOR HIRE', {
            fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        });
        this.contentContainer.add(hireTitle);

        if (this.availableCrew.length === 0) {
            const none = scene.add.text(GAME_WIDTH / 2 + 20, 120, 'No crew available at this station.', {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.contentContainer.add(none);
        } else {
            for (let i = 0; i < this.availableCrew.length; i++) {
                const member = this.availableCrew[i];
                const y = 115 + i * 55;
                this.drawCrewMember(scene, member, y, player, gameTime, false);
            }
        }
    }

    private drawCrewMember(
        scene: Scene,
        member: CrewMemberData,
        y: number,
        player: PlayerState,
        gameTime: number,
        isHired: boolean
    ): void {
        const baseX = isHired ? 20 : GAME_WIDTH / 2 + 20;

        // Background
        const bg = scene.add.rectangle(baseX + 220, y + 20, 440, 48, COLORS.panelBg, 0.6);
        bg.setStrokeStyle(1, COLORS.panelBorder, 0.3);
        this.contentContainer.add(bg);

        // Portrait
        const colors = [0x4488ff, 0xff4466, 0x44cc66, 0xffaa22, 0xaa44ff];
        const portrait = scene.add.circle(baseX + 20, y + 20, 14, colors[member.portrait % colors.length], 0.7);
        portrait.setStrokeStyle(1, 0xffffff, 0.3);
        this.contentContainer.add(portrait);

        const initial = scene.add.text(baseX + 20, y + 20, member.name[0], {
            fontSize: '13px', fontFamily: 'monospace', color: '#ffffff',
        }).setOrigin(0.5, 0.5);
        this.contentContainer.add(initial);

        // Name
        const name = scene.add.text(baseX + 42, y + 6, member.name, {
            fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
        });
        this.contentContainer.add(name);

        // Skills
        const primaryLvl = member.skillLevels[member.primarySkill] ?? 0;
        const secondaryLvl = member.skillLevels[member.secondarySkill] ?? 0;
        const skills = scene.add.text(baseX + 42, y + 20,
            `${member.primarySkill}:${primaryLvl} ${member.secondarySkill}:${secondaryLvl}`, {
                fontSize: '9px', fontFamily: 'monospace',
                color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
            });
        this.contentContainer.add(skills);

        // Traits
        const traitStrs = member.traits.map(t => {
            const isPos = (POSITIVE_TRAITS as readonly string[]).includes(t);
            return isPos ? `+${t}` : `-${t}`;
        });
        const traits = scene.add.text(baseX + 42, y + 34, traitStrs.join(' '), {
            fontSize: '8px', fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        });
        this.contentContainer.add(traits);

        // Salary
        const salary = scene.add.text(baseX + 320, y + 6, `${member.salary}cr/pay`, {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#' + COLORS.warning.toString(16).padStart(6, '0'),
        });
        this.contentContainer.add(salary);

        if (isHired) {
            // Morale bar
            const barWidth = 80;
            const barBg = scene.add.rectangle(baseX + 320, y + 25, barWidth, 5, 0x222233);
            this.contentContainer.add(barBg);

            const moralePct = member.morale / 100;
            const mColor = member.morale > 60 ? COLORS.positive : member.morale > 30 ? COLORS.warning : COLORS.negative;
            const bar = scene.add.rectangle(
                baseX + 320 - barWidth / 2 + (barWidth * moralePct) / 2, y + 25,
                barWidth * moralePct, 5, mColor
            );
            this.contentContainer.add(bar);

            // Fire button
            const fireBtn = this.createButton(scene, baseX + 410, y + 15, 'FIRE', COLORS.negative, () => {
                const result = this.crewManager.fire(player, member.id, [], gameTime);
                this.showMessage(result.message, result.success);
                if (result.success && this.onUpdate) this.onUpdate();
            });
            this.contentContainer.add(fireBtn);
        } else {
            // Hire fee
            const hireFee = member.salary * 5;
            const feeText = scene.add.text(baseX + 320, y + 22, `Hire: ${hireFee}cr`, {
                fontSize: '9px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.contentContainer.add(feeText);

            // Hire button
            const hireBtn = this.createButton(scene, baseX + 410, y + 15, 'HIRE', COLORS.positive, () => {
                const result = this.crewManager.hire(player, member, [], gameTime);
                this.showMessage(result.message, result.success);
                if (result.success) {
                    AudioManager.play('crewHire');
                    // Remove from available
                    this.availableCrew = this.availableCrew.filter(c => c.id !== member.id);
                    if (this.onUpdate) this.onUpdate();
                }
            });
            this.contentContainer.add(hireBtn);
        }
    }

    private createButton(
        scene: Scene,
        x: number,
        y: number,
        label: string,
        color: number,
        onClick: () => void
    ): GameObjects.Container {
        const container = scene.add.container(x, y);
        const width = label.length * 8 + 10;
        const bg = scene.add.rectangle(0, 0, width, 16, color, 0.2);
        bg.setStrokeStyle(1, color, 0.5);
        container.add(bg);

        const text = scene.add.text(0, 0, label, {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#' + color.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);
        container.add(text);

        container.setSize(width, 16);
        container.setInteractive();
        container.on('pointerdown', onClick);
        container.on('pointerover', () => bg.setFillStyle(color, 0.4));
        container.on('pointerout', () => bg.setFillStyle(color, 0.2));

        return container;
    }

    showMessage(text: string, positive: boolean = true): void {
        const color = positive
            ? '#' + COLORS.positive.toString(16).padStart(6, '0')
            : '#' + COLORS.negative.toString(16).padStart(6, '0');
        this.messageText.setText(text);
        this.messageText.setColor(color);
        this.scene.time.delayedCall(3000, () => this.messageText.setText(''));
    }
}
