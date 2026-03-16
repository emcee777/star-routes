// ============================================================
// Star Routes - Trading Panel
// Buy/sell commodities with glowing profit indicators,
// price sparklines, trend arrows with color coding
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { PlayerState, StarSystemData, MarketListing } from '../types';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { COMMODITY_MAP } from '../config/commodity-data';
import { TradingSystem } from '../systems/TradingSystem';
import { AudioManager } from '../audio/AudioManager';

export class TradingPanel extends GameObjects.Container {
    private tradingSystem: TradingSystem;
    private listContainer: GameObjects.Container;
    private cargoContainer: GameObjects.Container;
    private messageText: GameObjects.Text;
    private onTrade: (() => void) | null = null;
    private messageTimer: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Scene, tradingSystem: TradingSystem) {
        super(scene, 0, 0);
        this.tradingSystem = tradingSystem;
        this.setDepth(200);

        // Market listings (left panel)
        const leftTitle = scene.add.text(20, 95, 'MARKET', {
            fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        });
        this.add(leftTitle);

        // Column headers
        const headerY = 115;
        const headers = [
            { text: 'Commodity', x: 20 },
            { text: 'Price', x: 200 },
            { text: 'Supply', x: 270 },
            { text: 'Trend', x: 330 },
            { text: 'History', x: 360 },
            { text: '', x: 420 },
        ];
        for (const h of headers) {
            const t = scene.add.text(h.x, headerY, h.text, {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.add(t);
        }

        this.listContainer = scene.add.container(0, 0);
        this.add(this.listContainer);

        // Player cargo (right panel)
        const rightTitle = scene.add.text(GAME_WIDTH / 2 + 20, 95, 'YOUR CARGO', {
            fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        });
        this.add(rightTitle);

        const cargoHeaders = [
            { text: 'Item', x: GAME_WIDTH / 2 + 20 },
            { text: 'Qty', x: GAME_WIDTH / 2 + 200 },
            { text: 'Paid', x: GAME_WIDTH / 2 + 240 },
            { text: 'Now', x: GAME_WIDTH / 2 + 290 },
            { text: 'P/L', x: GAME_WIDTH / 2 + 340 },
            { text: '', x: GAME_WIDTH / 2 + 400 },
        ];
        for (const h of cargoHeaders) {
            const t = scene.add.text(h.x, headerY, h.text, {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.add(t);
        }

        this.cargoContainer = scene.add.container(0, 0);
        this.add(this.cargoContainer);

        // Message text
        this.messageText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 55, '', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
            align: 'center',
        }).setOrigin(0.5, 0.5);
        this.add(this.messageText);

        scene.add.existing(this);
    }

    setTradeHandler(handler: () => void): void {
        this.onTrade = handler;
    }

    updateTradingDisplay(player: PlayerState, system: StarSystemData, gameTime: number): void {
        this.updateMarketList(player, system, gameTime);
        this.updateCargoList(player, system, gameTime);
    }

    private drawSparkline(scene: Scene, x: number, y: number, priceHistory: number[]): GameObjects.Graphics {
        const graphics = scene.add.graphics();
        const width = 40;
        const height = 12;

        if (priceHistory.length < 2) return graphics;

        const min = Math.min(...priceHistory);
        const max = Math.max(...priceHistory);
        const range = max - min || 1;

        // Determine if trending up or down
        const first = priceHistory[0];
        const last = priceHistory[priceHistory.length - 1];
        const color = last > first ? COLORS.positive : last < first ? COLORS.negative : COLORS.textSecondary;

        graphics.lineStyle(1, color, 0.6);
        graphics.beginPath();

        for (let i = 0; i < priceHistory.length; i++) {
            const px = x + (i / (priceHistory.length - 1)) * width;
            const py = y + height - ((priceHistory[i] - min) / range) * height;

            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }

        graphics.strokePath();

        return graphics;
    }

    private updateMarketList(player: PlayerState, system: StarSystemData, gameTime: number): void {
        this.listContainer.removeAll(true);

        const startY = 130;
        const rowHeight = 22;
        const maxRows = Math.min(system.market.length, 20);

        for (let i = 0; i < maxRows; i++) {
            const listing = system.market[i];
            const commodity = COMMODITY_MAP.get(listing.commodityId);
            if (!commodity) continue;

            const y = startY + i * rowHeight;

            // Row background (subtle alternating)
            if (i % 2 === 0) {
                const rowBg = this.listContainer.scene.add.rectangle(
                    240, y + 5, 450, rowHeight - 2, COLORS.panelBg, 0.3
                );
                this.listContainer.add(rowBg);
            }

            // Name with contraband coloring
            const nameColor = commodity.isContraband
                ? '#' + COLORS.negative.toString(16).padStart(6, '0')
                : '#' + COLORS.textPrimary.toString(16).padStart(6, '0');
            const name = this.listContainer.scene.add.text(20, y, commodity.name, {
                fontSize: '10px', fontFamily: 'monospace', color: nameColor,
            });
            this.listContainer.add(name);

            // Price with deal highlighting
            const priceColor = this.getPriceColor(listing);
            const price = this.listContainer.scene.add.text(200, y, `${listing.price}cr`, {
                fontSize: '10px', fontFamily: 'monospace', color: priceColor,
            });
            this.listContainer.add(price);

            // Supply with low-supply warning
            const supplyColor = listing.supply < 20
                ? '#' + COLORS.warning.toString(16).padStart(6, '0')
                : '#' + COLORS.textSecondary.toString(16).padStart(6, '0');
            const supply = this.listContainer.scene.add.text(270, y, `${listing.supply}`, {
                fontSize: '10px', fontFamily: 'monospace', color: supplyColor,
            });
            this.listContainer.add(supply);

            // Trend arrows with glow coloring
            const trendStr = listing.trend === 'rising' ? '\u2191' : listing.trend === 'falling' ? '\u2193' : '\u2022';
            const trendColor = listing.trend === 'rising'
                ? '#' + COLORS.positive.toString(16).padStart(6, '0')
                : listing.trend === 'falling'
                    ? '#' + COLORS.negative.toString(16).padStart(6, '0')
                    : '#' + COLORS.neutral.toString(16).padStart(6, '0');
            const trend = this.listContainer.scene.add.text(340, y, trendStr, {
                fontSize: '11px', fontFamily: 'monospace', color: trendColor,
            });
            this.listContainer.add(trend);

            // Price history sparkline
            if (listing.priceHistory && listing.priceHistory.length > 1) {
                const sparkline = this.drawSparkline(this.listContainer.scene, 358, y, listing.priceHistory);
                this.listContainer.add(sparkline);
            }

            // Buy button
            const buyBtn = this.createButton(this.listContainer.scene, 420, y, 'BUY', COLORS.positive, () => {
                const qty = Math.min(5, listing.supply);
                const result = this.tradingSystem.buy(player, system, listing.commodityId, qty, gameTime, []);
                this.showMessage(result.message, result.success);
                if (result.success) {
                    AudioManager.play('tradeComplete');
                    if (this.onTrade) this.onTrade();
                }
            });
            this.listContainer.add(buyBtn);

            // Buy 1 button
            const buy1Btn = this.createButton(this.listContainer.scene, 460, y, '1', COLORS.positive, () => {
                const result = this.tradingSystem.buy(player, system, listing.commodityId, 1, gameTime, []);
                this.showMessage(result.message, result.success);
                if (result.success) {
                    AudioManager.play('tradeComplete');
                    if (this.onTrade) this.onTrade();
                }
            });
            this.listContainer.add(buy1Btn);
        }
    }

    private updateCargoList(player: PlayerState, system: StarSystemData, gameTime: number): void {
        this.cargoContainer.removeAll(true);

        const startY = 130;
        const rowHeight = 22;

        if (player.ship.cargo.length === 0) {
            const empty = this.cargoContainer.scene.add.text(
                GAME_WIDTH / 2 + 100, startY + 20, 'Cargo hold is empty.',
                { fontSize: '11px', fontFamily: 'monospace', color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0') }
            ).setOrigin(0.5, 0);
            this.cargoContainer.add(empty);
            return;
        }

        for (let i = 0; i < player.ship.cargo.length; i++) {
            const cargo = player.ship.cargo[i];
            const commodity = COMMODITY_MAP.get(cargo.commodityId);
            if (!commodity) continue;

            const y = startY + i * rowHeight;
            const listing = system.market.find(m => m.commodityId === cargo.commodityId);
            const currentPrice = listing?.price ?? 0;
            const profitPerUnit = currentPrice - cargo.purchasePrice;
            const totalProfit = profitPerUnit * cargo.quantity;

            // Row background for profitable items
            if (profitPerUnit > 0) {
                const rowBg = this.cargoContainer.scene.add.rectangle(
                    GAME_WIDTH / 2 + 240, y + 5, 450, rowHeight - 2,
                    COLORS.positive, 0.05
                );
                this.cargoContainer.add(rowBg);
            } else if (profitPerUnit < 0) {
                const rowBg = this.cargoContainer.scene.add.rectangle(
                    GAME_WIDTH / 2 + 240, y + 5, 450, rowHeight - 2,
                    COLORS.negative, 0.04
                );
                this.cargoContainer.add(rowBg);
            }

            // Name
            const name = this.cargoContainer.scene.add.text(GAME_WIDTH / 2 + 20, y, commodity.name, {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
            });
            this.cargoContainer.add(name);

            // Quantity
            const qty = this.cargoContainer.scene.add.text(GAME_WIDTH / 2 + 200, y, `${cargo.quantity}`, {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.cargoContainer.add(qty);

            // Paid price
            const paid = this.cargoContainer.scene.add.text(GAME_WIDTH / 2 + 240, y, `${cargo.purchasePrice}`, {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.cargoContainer.add(paid);

            // Current price
            const nowColor = currentPrice > cargo.purchasePrice
                ? '#' + COLORS.positive.toString(16).padStart(6, '0')
                : currentPrice < cargo.purchasePrice
                    ? '#' + COLORS.negative.toString(16).padStart(6, '0')
                    : '#' + COLORS.textPrimary.toString(16).padStart(6, '0');
            const now = this.cargoContainer.scene.add.text(GAME_WIDTH / 2 + 290, y, `${currentPrice}`, {
                fontSize: '10px', fontFamily: 'monospace', color: nowColor,
            });
            this.cargoContainer.add(now);

            // Profit/Loss with total
            const plColor = profitPerUnit >= 0
                ? '#' + COLORS.positive.toString(16).padStart(6, '0')
                : '#' + COLORS.negative.toString(16).padStart(6, '0');
            const plSign = profitPerUnit >= 0 ? '+' : '';
            const pl = this.cargoContainer.scene.add.text(GAME_WIDTH / 2 + 340, y,
                `${plSign}${totalProfit}`, {
                    fontSize: '10px', fontFamily: 'monospace',
                    color: plColor,
                    fontStyle: Math.abs(totalProfit) > 100 ? 'bold' : 'normal',
                });
            this.cargoContainer.add(pl);

            // Sell button
            if (listing) {
                const sellBtn = this.createButton(this.cargoContainer.scene, GAME_WIDTH / 2 + 400, y, 'SELL', COLORS.warning, () => {
                    const sellQty = Math.min(5, cargo.quantity);
                    const result = this.tradingSystem.sell(player, system, cargo.commodityId, sellQty, gameTime, []);
                    this.showMessage(result.message, result.success);
                    if (result.success) {
                        AudioManager.play('tradeComplete');
                        if (this.onTrade) this.onTrade();
                    }
                });
                this.cargoContainer.add(sellBtn);

                const sell1Btn = this.createButton(this.cargoContainer.scene, GAME_WIDTH / 2 + 445, y, '1', COLORS.warning, () => {
                    const result = this.tradingSystem.sell(player, system, cargo.commodityId, 1, gameTime, []);
                    this.showMessage(result.message, result.success);
                    if (result.success) {
                        AudioManager.play('tradeComplete');
                        if (this.onTrade) this.onTrade();
                    }
                });
                this.cargoContainer.add(sell1Btn);
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
        const width = label.length > 2 ? 35 : 20;

        // Button glow (behind)
        const glow = scene.add.rectangle(0, 5, width + 4, 20, color, 0.05);
        container.add(glow);

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
        container.on('pointerover', () => {
            bg.setFillStyle(color, 0.4);
            glow.setAlpha(0.12);
        });
        container.on('pointerout', () => {
            bg.setFillStyle(color, 0.2);
            glow.setAlpha(0.05);
        });

        return container;
    }

    private getPriceColor(listing: MarketListing): string {
        const commodity = COMMODITY_MAP.get(listing.commodityId);
        if (!commodity) return '#' + COLORS.textPrimary.toString(16).padStart(6, '0');

        const ratio = listing.price / commodity.basePrice;
        if (ratio < 0.7) return '#' + COLORS.positive.toString(16).padStart(6, '0');
        if (ratio > 1.5) return '#' + COLORS.negative.toString(16).padStart(6, '0');
        return '#' + COLORS.textPrimary.toString(16).padStart(6, '0');
    }

    showMessage(text: string, positive: boolean = true): void {
        const color = positive
            ? '#' + COLORS.positive.toString(16).padStart(6, '0')
            : '#' + COLORS.negative.toString(16).padStart(6, '0');
        this.messageText.setText(text);
        this.messageText.setColor(color);

        // Golden flash on successful trade
        if (positive) {
            this.scene.cameras.main.flash(200, 255, 215, 0, false);
        }

        // Cancel previous timer
        if (this.messageTimer) {
            this.messageTimer.destroy();
        }

        // Fade out message after 3 seconds
        this.messageTimer = this.scene.time.delayedCall(3000, () => {
            this.messageText.setText('');
        });
    }
}
