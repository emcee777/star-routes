// ============================================================
// Star Routes - New Game Scene
// Ship selection (8 classes with preview), pilot naming
// ============================================================

import { Scene } from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, STARTING_CREDITS, STARTING_FUEL } from '../config/constants';
import { SHIPS } from '../config/ship-data';
import { ShipManager } from '../systems/ShipManager';

export class NewGameScene extends Scene {
    private selectedShipIndex: number = 0;
    private playerName: string = 'Captain';
    private shipManager: ShipManager;
    private nameInputText!: Phaser.GameObjects.Text;

    constructor() {
        super('NewGame');
        this.shipManager = new ShipManager();
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.background);
        this.cameras.main.fadeIn(400, 0, 0, 0);

        // Title
        this.add.text(GAME_WIDTH / 2, 40, 'CREATE YOUR CAPTAIN', {
            fontSize: '24px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        // Name input area
        this.add.text(GAME_WIDTH / 2 - 150, 85, 'Captain Name:', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);

        const nameBg = this.add.rectangle(GAME_WIDTH / 2 + 70, 85, 200, 28, COLORS.panelBg, 0.9);
        nameBg.setStrokeStyle(1, COLORS.panelBorder);

        this.nameInputText = this.add.text(GAME_WIDTH / 2 + 70, 85, this.playerName, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        // Handle keyboard input for name
        this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Backspace') {
                this.playerName = this.playerName.slice(0, -1);
            } else if (event.key.length === 1 && this.playerName.length < 16) {
                this.playerName += event.key;
            }
            this.nameInputText.setText(this.playerName || '_');
        });

        // Ship selection
        this.add.text(GAME_WIDTH / 2, 130, 'SELECT YOUR SHIP', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        this.drawShipSelection();

        // Start button
        const startBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, 200, 44, COLORS.positive, 0.2);
        startBg.setStrokeStyle(2, COLORS.positive, 0.6);

        const startText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'LAUNCH', {
            fontSize: '18px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#' + COLORS.positive.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        startBg.setInteractive();
        startBg.on('pointerdown', () => this.startGame());
        startBg.on('pointerover', () => {
            startBg.setFillStyle(COLORS.positive, 0.4);
            startText.setColor('#ffffff');
        });
        startBg.on('pointerout', () => {
            startBg.setFillStyle(COLORS.positive, 0.2);
            startText.setColor('#' + COLORS.positive.toString(16).padStart(6, '0'));
        });
    }

    private drawShipSelection(): void {
        const startY = 155;
        const cardHeight = 60;
        const cardWidth = GAME_WIDTH - 80;

        for (let i = 0; i < SHIPS.length; i++) {
            const ship = SHIPS[i];
            const y = startY + i * (cardHeight + 6);
            const isSelected = i === this.selectedShipIndex;

            const bg = this.add.rectangle(GAME_WIDTH / 2, y + cardHeight / 2, cardWidth, cardHeight,
                isSelected ? COLORS.textHighlight : COLORS.panelBg,
                isSelected ? 0.15 : 0.7
            );
            bg.setStrokeStyle(1,
                isSelected ? COLORS.textHighlight : COLORS.panelBorder,
                isSelected ? 0.8 : 0.4
            );

            // Ship name
            const nameColor = isSelected
                ? '#' + COLORS.textHighlight.toString(16).padStart(6, '0')
                : '#' + COLORS.textPrimary.toString(16).padStart(6, '0');
            this.add.text(60, y + 12, ship.name, {
                fontSize: '13px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: nameColor,
            });

            // Ship class
            this.add.text(60, y + 30, ship.class.replace('_', ' ').toUpperCase(), {
                fontSize: '9px',
                fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });

            // Stats
            const statsX = 280;
            this.add.text(statsX, y + 10, `Cargo: ${ship.baseCargoCapacity}`, {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.add.text(statsX + 100, y + 10, `Hull: ${ship.baseHull}`, {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.add.text(statsX + 200, y + 10, `Speed: ${ship.baseSpeed}`, {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.add.text(statsX + 300, y + 10, `Slots: ${ship.moduleSlots}`, {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.add.text(statsX, y + 28, `Shield: ${ship.baseShield}`, {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.add.text(statsX + 100, y + 28, `Fuel: ${ship.baseFuelCapacity}`, {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });

            // Description
            this.add.text(statsX + 200, y + 28, ship.description, {
                fontSize: '9px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
                wordWrap: { width: 280 },
            });

            // Price
            const priceStr = ship.price === 0 ? 'FREE' : `${ship.price}cr`;
            const priceColor = ship.price === 0
                ? '#' + COLORS.positive.toString(16).padStart(6, '0')
                : '#' + COLORS.warning.toString(16).padStart(6, '0');
            this.add.text(GAME_WIDTH - 60, y + 20, priceStr, {
                fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
                color: priceColor,
            }).setOrigin(1, 0.5);

            // Make clickable
            bg.setInteractive();
            bg.on('pointerdown', () => {
                // Only allow free ships at start
                if (ship.price <= STARTING_CREDITS) {
                    this.selectedShipIndex = i;
                    this.scene.restart();
                }
            });
        }
    }

    private startGame(): void {
        const ship = SHIPS[this.selectedShipIndex];
        const playerShip = this.shipManager.createShip(ship.id, ship.name);
        if (!playerShip) return;

        // Set starting fuel
        playerShip.fuel = Math.min(STARTING_FUEL, playerShip.maxFuel);

        const name = this.playerName.trim() || 'Captain';

        // Warp launch effect: horizontal stretch + white flash → fade to station
        this.cameras.main.flash(300, 255, 255, 255, false);
        this.time.delayedCall(200, () => {
            this.cameras.main.fadeOut(400, 255, 255, 255);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('StationScene', {
                    newGame: true,
                    playerName: name,
                    ship: playerShip,
                    startingCredits: STARTING_CREDITS,
                });
            });
        });
    }
}
