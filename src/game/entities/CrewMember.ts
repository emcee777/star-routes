// ============================================================
// Star Routes - Crew Member Entity
// Crew member card display (name, skills, morale)
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { CrewMemberData } from '../types';
import { COLORS } from '../config/constants';
import { POSITIVE_TRAITS } from '../config/crew-data';

export class CrewMemberEntity extends GameObjects.Container {
    private bg: GameObjects.Rectangle;
    private nameText: GameObjects.Text;
    private skillText: GameObjects.Text;
    private moraleBar: GameObjects.Rectangle;
    private moraleBg: GameObjects.Rectangle;
    private traitText: GameObjects.Text;
    private memberData: CrewMemberData;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        data: CrewMemberData,
        width: number = 220
    ) {
        super(scene, x, y);
        this.memberData = data;

        const height = 70;

        // Background
        this.bg = scene.add.rectangle(0, 0, width, height, COLORS.panelBg, 0.9);
        this.bg.setStrokeStyle(1, COLORS.panelBorder, 0.6);
        this.add(this.bg);

        // Portrait placeholder (procedural from seed)
        const portraitColor = this.getPortraitColor(data.portrait);
        const portrait = scene.add.circle(-width / 2 + 20, -8, 12, portraitColor, 0.8);
        portrait.setStrokeStyle(1, 0xffffff, 0.3);
        this.add(portrait);

        const portraitLetter = scene.add.text(-width / 2 + 20, -8, data.name[0], {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff',
        }).setOrigin(0.5, 0.5);
        this.add(portraitLetter);

        // Name
        this.nameText = scene.add.text(-width / 2 + 40, -18, data.name, {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
            fontStyle: 'bold',
        }).setOrigin(0, 0.5);
        this.add(this.nameText);

        // Primary/secondary skill
        const primaryLevel = data.skillLevels[data.primarySkill] ?? 0;
        const secondaryLevel = data.skillLevels[data.secondarySkill] ?? 0;
        this.skillText = scene.add.text(-width / 2 + 40, -2, `${data.primarySkill} ${primaryLevel} / ${data.secondarySkill} ${secondaryLevel}`, {
            fontSize: '9px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.skillText);

        // Traits
        const traitTexts = data.traits.map(t => {
            const isPositive = (POSITIVE_TRAITS as readonly string[]).includes(t);
            return isPositive ? `+${t}` : `-${t}`;
        });
        this.traitText = scene.add.text(-width / 2 + 10, 14, traitTexts.join(' '), {
            fontSize: '8px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.traitText);

        // Morale bar
        const barWidth = width - 20;
        const barY = 27;
        this.moraleBg = scene.add.rectangle(0, barY, barWidth, 6, 0x333344);
        this.add(this.moraleBg);

        const moraleColor = data.morale > 60 ? COLORS.positive :
            data.morale > 30 ? COLORS.warning : COLORS.negative;
        const moraleWidth = (data.morale / 100) * barWidth;
        this.moraleBar = scene.add.rectangle(
            -barWidth / 2 + moraleWidth / 2, barY,
            moraleWidth, 6, moraleColor
        );
        this.add(this.moraleBar);

        // Salary
        const salaryText = scene.add.text(width / 2 - 10, -18, `${data.salary}cr/pay`, {
            fontSize: '8px',
            fontFamily: 'monospace',
            color: '#' + COLORS.warning.toString(16).padStart(6, '0'),
        }).setOrigin(1, 0.5);
        this.add(salaryText);

        scene.add.existing(this);
    }

    private getPortraitColor(seed: number): number {
        const colors = [
            0x4488ff, 0xff4466, 0x44cc66, 0xffaa22, 0xaa44ff,
            0xff8844, 0x44ddcc, 0xdd4488, 0x88aa44, 0x6644ff,
        ];
        return colors[seed % colors.length];
    }

    updateMorale(morale: number): void {
        this.memberData.morale = morale;
        const barWidth = this.moraleBg.width;
        const moraleColor = morale > 60 ? COLORS.positive :
            morale > 30 ? COLORS.warning : COLORS.negative;
        const moraleWidth = Math.max(1, (morale / 100) * barWidth);

        this.moraleBar.setFillStyle(moraleColor);
        this.moraleBar.setSize(moraleWidth, 6);
        this.moraleBar.setX(-barWidth / 2 + moraleWidth / 2);
    }

    getData(): CrewMemberData {
        return this.memberData;
    }
}
