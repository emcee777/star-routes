// ============================================================
// Star Routes - Commodity Entity
// Commodity display (icon representation, price, quantity)
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { MarketListing, CommodityCategory } from '../types';
import { COLORS } from '../config/constants';
import { COMMODITY_MAP } from '../config/commodity-data';

const CATEGORY_COLORS: Record<CommodityCategory, number> = {
    raw: 0x8B7355,
    industrial: 0x6688AA,
    consumer: 0x44AA66,
    tech: 0x44DDFF,
    medical: 0xFF6688,
    luxury: 0xFFDD44,
    military: 0xFF4444,
    contraband: 0xAA44FF,
};

const CATEGORY_SYMBOLS: Record<CommodityCategory, string> = {
    raw: 'R',
    industrial: 'I',
    consumer: 'C',
    tech: 'T',
    medical: 'M',
    luxury: 'L',
    military: 'W',
    contraband: 'X',
};

export class CommodityEntity extends GameObjects.Container {
    private bg: GameObjects.Rectangle;
    private icon: GameObjects.Text;
    private nameText: GameObjects.Text;
    private priceText: GameObjects.Text;
    private trendIcon: GameObjects.Text;
    private listing: MarketListing;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        listing: MarketListing,
        width: number = 200
    ) {
        super(scene, x, y);
        this.listing = listing;

        const commodity = COMMODITY_MAP.get(listing.commodityId);
        const category = commodity?.category ?? 'raw';
        const color = CATEGORY_COLORS[category];

        // Background
        this.bg = scene.add.rectangle(0, 0, width, 28, COLORS.panelBg, 0.8);
        this.bg.setStrokeStyle(1, color, 0.4);
        this.add(this.bg);

        // Category icon
        this.icon = scene.add.text(-width / 2 + 8, 0, CATEGORY_SYMBOLS[category], {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#' + color.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.icon);

        // Name
        this.nameText = scene.add.text(-width / 2 + 28, 0, commodity?.name ?? listing.commodityId, {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.nameText);

        // Price
        const priceColor = this.getPriceColor(listing);
        this.priceText = scene.add.text(width / 2 - 40, 0, `${listing.price}cr`, {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: priceColor,
        }).setOrigin(1, 0.5);
        this.add(this.priceText);

        // Trend indicator
        const trendSymbol = listing.trend === 'rising' ? '^' : listing.trend === 'falling' ? 'v' : '-';
        const trendColor = listing.trend === 'rising'
            ? '#' + COLORS.positive.toString(16).padStart(6, '0')
            : listing.trend === 'falling'
                ? '#' + COLORS.negative.toString(16).padStart(6, '0')
                : '#' + COLORS.neutral.toString(16).padStart(6, '0');

        this.trendIcon = scene.add.text(width / 2 - 8, 0, trendSymbol, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: trendColor,
        }).setOrigin(0.5, 0.5);
        this.add(this.trendIcon);

        scene.add.existing(this);
    }

    private getPriceColor(listing: MarketListing): string {
        const commodity = COMMODITY_MAP.get(listing.commodityId);
        if (!commodity) return '#' + COLORS.textPrimary.toString(16).padStart(6, '0');

        const ratio = listing.price / commodity.basePrice;
        if (ratio < 0.7) return '#' + COLORS.positive.toString(16).padStart(6, '0'); // cheap
        if (ratio > 1.5) return '#' + COLORS.negative.toString(16).padStart(6, '0'); // expensive
        return '#' + COLORS.textPrimary.toString(16).padStart(6, '0');
    }

    updateListing(newListing: MarketListing): void {
        this.listing = newListing;
        const priceColor = this.getPriceColor(newListing);
        this.priceText.setText(`${newListing.price}cr`);
        this.priceText.setColor(priceColor);

        const trendSymbol = newListing.trend === 'rising' ? '^' : newListing.trend === 'falling' ? 'v' : '-';
        this.trendIcon.setText(trendSymbol);
    }

    getListing(): MarketListing {
        return this.listing;
    }
}
