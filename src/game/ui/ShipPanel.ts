// ============================================================
// Star Routes - Ship Panel
// Ship module grid, stat display, buy ships/modules
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { PlayerState } from '../types';
import { COLORS, GAME_WIDTH } from '../config/constants';
import { ShipManager } from '../systems/ShipManager';
import { SHIP_MAP } from '../config/ship-data';
import { MODULE_MAP, MODULES } from '../config/module-data';

export class ShipPanel extends GameObjects.Container {
    private shipManager: ShipManager;
    private contentContainer: GameObjects.Container;
    private messageText: GameObjects.Text;
    private onUpdate: (() => void) | null = null;

    constructor(scene: Scene, shipManager: ShipManager) {
        super(scene, 0, 0);
        this.shipManager = shipManager;
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

    updateDisplay(player: PlayerState, gameTime: number): void {
        this.contentContainer.removeAll(true);
        const scene = this.contentContainer.scene;

        const ship = player.ship;
        const def = SHIP_MAP.get(ship.defId);

        // Current ship info
        const shipTitle = scene.add.text(20, 95, `YOUR SHIP: ${ship.name} (${def?.name ?? 'Unknown'})`, {
            fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        });
        this.contentContainer.add(shipTitle);

        // Stats
        const stats = [
            `Hull: ${ship.hull}/${ship.maxHull}`,
            `Shield: ${ship.shield}/${ship.maxShield}`,
            `Speed: ${ship.speed}`,
            `Fuel: ${ship.fuel}/${ship.maxFuel}`,
            `Cargo: ${ship.cargoCapacity}`,
            `Slots: ${ship.modules.length}/${ship.moduleSlots}`,
        ];

        for (let i = 0; i < stats.length; i++) {
            const col = i < 3 ? 0 : 1;
            const row = i % 3;
            const text = scene.add.text(20 + col * 200, 120 + row * 18, stats[i], {
                fontSize: '11px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.contentContainer.add(text);
        }

        // Installed modules
        const modTitle = scene.add.text(20, 180, 'INSTALLED MODULES', {
            fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        });
        this.contentContainer.add(modTitle);

        if (ship.modules.length === 0) {
            const empty = scene.add.text(20, 200, 'No modules installed.', {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.contentContainer.add(empty);
        } else {
            for (let i = 0; i < ship.modules.length; i++) {
                const mod = ship.modules[i];
                const modDef = MODULE_MAP.get(mod.defId);
                const y = 200 + i * 20;

                const modText = scene.add.text(20, y, `${modDef?.name ?? mod.defId} (${mod.condition}%)`, {
                    fontSize: '10px', fontFamily: 'monospace',
                    color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
                });
                this.contentContainer.add(modText);

                // Remove button
                const removeBtn = this.createButton(scene, 300, y, 'REMOVE', COLORS.negative, () => {
                    const result = this.shipManager.removeModule(player, i, [], gameTime);
                    this.showMessage(result.message, result.success);
                    if (result.success && this.onUpdate) this.onUpdate();
                });
                this.contentContainer.add(removeBtn);
            }
        }

        // Available modules for purchase
        const availTitle = scene.add.text(GAME_WIDTH / 2 + 20, 95, 'AVAILABLE MODULES', {
            fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        });
        this.contentContainer.add(availTitle);

        const availModules = MODULES.slice(0, 16); // Show first 16
        for (let i = 0; i < availModules.length; i++) {
            const mod = availModules[i];
            const y = 115 + i * 20;

            const text = scene.add.text(GAME_WIDTH / 2 + 20, y, `${mod.name} [${mod.type}] T${mod.tier}`, {
                fontSize: '9px', fontFamily: 'monospace',
                color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
            });
            this.contentContainer.add(text);

            const priceText = scene.add.text(GAME_WIDTH / 2 + 280, y, `${mod.price}cr`, {
                fontSize: '9px', fontFamily: 'monospace',
                color: '#' + COLORS.warning.toString(16).padStart(6, '0'),
            });
            this.contentContainer.add(priceText);

            const buyBtn = this.createButton(scene, GAME_WIDTH / 2 + 350, y, 'BUY', COLORS.positive, () => {
                const result = this.shipManager.installModule(player, mod.id, [], gameTime);
                this.showMessage(result.message, result.success);
                if (result.success && this.onUpdate) this.onUpdate();
            });
            this.contentContainer.add(buyBtn);
        }

        // Ships for sale
        const shipSaleTitle = scene.add.text(20, 300 + ship.modules.length * 20, 'SHIPS FOR SALE', {
            fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        });
        this.contentContainer.add(shipSaleTitle);

        const ships = this.shipManager.getAvailableShips();
        const shipStartY = 320 + ship.modules.length * 20;
        for (let i = 0; i < ships.length; i++) {
            const s = ships[i];
            const y = shipStartY + i * 22;

            const shipText = scene.add.text(20, y,
                `${s.name} | Cargo:${s.baseCargoCapacity} Hull:${s.baseHull} Spd:${s.baseSpeed} Slots:${s.moduleSlots}`, {
                    fontSize: '9px', fontFamily: 'monospace',
                    color: s.id === ship.defId
                        ? '#' + COLORS.textSecondary.toString(16).padStart(6, '0')
                        : '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
                });
            this.contentContainer.add(shipText);

            if (s.price > 0 && s.id !== ship.defId) {
                const priceText = scene.add.text(450, y, `${s.price}cr`, {
                    fontSize: '9px', fontFamily: 'monospace',
                    color: '#' + COLORS.warning.toString(16).padStart(6, '0'),
                });
                this.contentContainer.add(priceText);

                const buyShipBtn = this.createButton(scene, 520, y, 'BUY', COLORS.positive, () => {
                    const result = this.shipManager.buyShip(player, s.id, s.name, [], gameTime);
                    this.showMessage(result.message, result.success);
                    if (result.success && this.onUpdate) this.onUpdate();
                });
                this.contentContainer.add(buyShipBtn);
            } else if (s.id === ship.defId) {
                const current = scene.add.text(450, y, '(current)', {
                    fontSize: '9px', fontFamily: 'monospace',
                    color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
                });
                this.contentContainer.add(current);
            }
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
        const bg = scene.add.rectangle(0, 5, width, 16, color, 0.2);
        bg.setStrokeStyle(1, color, 0.5);
        container.add(bg);

        const text = scene.add.text(0, 5, label, {
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
