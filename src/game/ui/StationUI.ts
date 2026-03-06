// ============================================================
// Star Routes - Station UI
// Docked at station: tabs with glow borders, system info,
// smooth active tab highlighting
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

export type StationTab = 'trade' | 'crew' | 'ship' | 'repairs' | 'map';

export class StationUI extends GameObjects.Container {
    private tabButtons: Map<StationTab, GameObjects.Container> = new Map();
    private activeTab: StationTab = 'trade';
    private onTabChange: ((tab: StationTab) => void) | null = null;
    private systemNameText: GameObjects.Text;
    private systemInfoText: GameObjects.Text;

    constructor(scene: Scene) {
        super(scene, 0, 0);
        this.setDepth(100);

        // Tab bar at the bottom
        const tabY = GAME_HEIGHT - 36;
        const tabs: StationTab[] = ['trade', 'crew', 'ship', 'repairs', 'map'];
        const tabLabels: Record<StationTab, string> = {
            trade: 'TRADE',
            crew: 'CREW',
            ship: 'SHIPYARD',
            repairs: 'REPAIRS',
            map: 'GALAXY MAP',
        };

        const tabWidth = GAME_WIDTH / tabs.length;

        // Tab bar background
        const tabBarBg = scene.add.rectangle(GAME_WIDTH / 2, tabY, GAME_WIDTH, 34, COLORS.panelBg, 0.95);
        tabBarBg.setStrokeStyle(1, COLORS.panelBorder, 0.3);
        this.add(tabBarBg);

        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            const container = scene.add.container(tabWidth * i + tabWidth / 2, tabY);

            // Tab glow (behind, visible when active)
            const glow = scene.add.rectangle(0, 0, tabWidth - 8, 28, COLORS.textHighlight, 0);
            container.add(glow);

            const bg = scene.add.rectangle(0, 0, tabWidth - 4, 30, COLORS.panelBg, 0);
            bg.setStrokeStyle(1, COLORS.panelBorder, 0.4);
            container.add(bg);

            const text = scene.add.text(0, 0, tabLabels[tab], {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            }).setOrigin(0.5, 0.5);
            container.add(text);

            container.setSize(tabWidth - 4, 30);
            container.setInteractive();

            container.on('pointerdown', () => {
                this.setActiveTab(tab);
            });

            container.on('pointerover', () => {
                if (tab !== this.activeTab) {
                    bg.setStrokeStyle(1, COLORS.textHighlight, 0.3);
                    glow.setAlpha(0.03);
                }
            });

            container.on('pointerout', () => {
                if (tab !== this.activeTab) {
                    bg.setStrokeStyle(1, COLORS.panelBorder, 0.4);
                    glow.setAlpha(0);
                }
            });

            this.tabButtons.set(tab, container);
            this.add(container);
        }

        // System name at top
        this.systemNameText = scene.add.text(GAME_WIDTH / 2, 55, '', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
            fontStyle: 'bold',
        }).setOrigin(0.5, 0);
        this.add(this.systemNameText);

        this.systemInfoText = scene.add.text(GAME_WIDTH / 2, 78, '', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0);
        this.add(this.systemInfoText);

        this.setActiveTab('trade');
        scene.add.existing(this);
    }

    setActiveTab(tab: StationTab): void {
        this.activeTab = tab;

        // Update button visuals
        for (const [t, container] of this.tabButtons) {
            const glow = container.getAt(0) as GameObjects.Rectangle;
            const bg = container.getAt(1) as GameObjects.Rectangle;
            const text = container.getAt(2) as GameObjects.Text;

            if (t === tab) {
                bg.setStrokeStyle(2, COLORS.textHighlight, 0.8);
                glow.setAlpha(0.06);
                text.setColor('#' + COLORS.textHighlight.toString(16).padStart(6, '0'));
                text.setFontStyle('bold');
            } else {
                bg.setStrokeStyle(1, COLORS.panelBorder, 0.4);
                glow.setAlpha(0);
                text.setColor('#' + COLORS.textSecondary.toString(16).padStart(6, '0'));
                text.setFontStyle('normal');
            }
        }

        if (this.onTabChange) {
            this.onTabChange(tab);
        }
    }

    getActiveTab(): StationTab {
        return this.activeTab;
    }

    setTabChangeHandler(handler: (tab: StationTab) => void): void {
        this.onTabChange = handler;
    }

    setSystemInfo(name: string, description: string, faction: string | null): void {
        this.systemNameText.setText(name);
        const factionStr = faction ? ` | ${faction}` : '';
        this.systemInfoText.setText(description + factionStr);
    }
}
