// ============================================================
// Star Routes - Economy Engine
// Dynamic pricing, supply/demand, market simulation
// ============================================================

import { StarSystemData, MarketListing, EconomySnapshot, ActiveEvent } from '../types';
import {
    PRICE_VOLATILITY_TICK, SUPPLY_REGEN_RATE, DEMAND_DECAY_RATE,
    PRICE_FLOOR_MULTIPLIER, PRICE_CEILING_MULTIPLIER,
    ECONOMY_TICK_INTERVAL, SUPPLY_CHAIN_PROPAGATION,
    MARKET_HISTORY_LENGTH,
} from '../config/constants';
import { COMMODITY_MAP, SUPPLY_CHAINS, INDUSTRY_PRODUCTION } from '../config/commodity-data';

export class EconomyEngine {
    private tickCounter: number = 0;
    private snapshots: EconomySnapshot[] = [];

    get economyHistory(): EconomySnapshot[] {
        return this.snapshots;
    }

    /** Called every game tick. Updates markets periodically. */
    update(systems: StarSystemData[], activeEvents: ActiveEvent[]): void {
        this.tickCounter++;
        if (this.tickCounter % ECONOMY_TICK_INTERVAL !== 0) return;

        for (const system of systems) {
            this.updateSystemMarket(system, systems, activeEvents);
        }
    }

    private updateSystemMarket(
        system: StarSystemData,
        allSystems: StarSystemData[],
        activeEvents: ActiveEvent[]
    ): void {
        const produced = INDUSTRY_PRODUCTION[system.industry] || [];

        for (const listing of system.market) {
            const commodity = COMMODITY_MAP.get(listing.commodityId);
            if (!commodity) continue;

            // Natural supply regeneration for produced goods
            if (produced.includes(listing.commodityId)) {
                listing.supply += SUPPLY_REGEN_RATE * (1 + Math.random() * 0.5);
            } else {
                // Non-produced goods slowly regenerate from NPC trade
                listing.supply += SUPPLY_REGEN_RATE * 0.2;
            }

            // Demand naturally decays toward baseline
            const baseDemand = 50 + system.population / 20000;
            listing.demand += (baseDemand - listing.demand) * DEMAND_DECAY_RATE * 0.1;

            // Apply active event effects
            for (const event of activeEvents) {
                if (event.effects.marketEffect) {
                    const me = event.effects.marketEffect;
                    if ((me.systemId === '' || me.systemId === system.id) &&
                        me.commodityId === listing.commodityId) {
                        listing.supply += me.supplyChange * 0.1; // spread over time
                    }
                }
            }

            // Supply chain propagation: if this system produces goods that need inputs,
            // check connected systems for supply
            this.propagateSupplyChains(system, listing, allSystems);

            // Clamp supply and demand
            listing.supply = Math.max(1, Math.round(listing.supply));
            listing.demand = Math.max(1, Math.round(listing.demand));

            // Calculate new price from supply/demand ratio
            const ratio = listing.demand / listing.supply;
            const volatilityNoise = 1 + (Math.random() - 0.5) * PRICE_VOLATILITY_TICK * commodity.volatility;
            let newPrice = Math.round(commodity.basePrice * ratio * volatilityNoise);

            // Clamp price to floor/ceiling
            const floor = Math.round(commodity.basePrice * PRICE_FLOOR_MULTIPLIER);
            const ceiling = Math.round(commodity.basePrice * PRICE_CEILING_MULTIPLIER);
            newPrice = Math.max(floor, Math.min(ceiling, newPrice));

            // Smooth price changes (don't jump too wildly)
            const maxChange = Math.max(1, Math.round(listing.price * 0.1));
            const priceDelta = newPrice - listing.price;
            if (Math.abs(priceDelta) > maxChange) {
                newPrice = listing.price + Math.sign(priceDelta) * maxChange;
            }

            listing.price = newPrice;

            // Update price history
            listing.priceHistory.push(newPrice);
            if (listing.priceHistory.length > MARKET_HISTORY_LENGTH) {
                listing.priceHistory.shift();
            }

            // Calculate trend
            listing.trend = this.calculateTrend(listing.priceHistory);
        }
    }

    private propagateSupplyChains(
        system: StarSystemData,
        listing: MarketListing,
        allSystems: StarSystemData[]
    ): void {
        // Check if this commodity needs inputs from supply chains
        const inputs = SUPPLY_CHAINS[listing.commodityId];
        if (!inputs) return;

        const produced = INDUSTRY_PRODUCTION[system.industry] || [];
        if (!produced.includes(listing.commodityId)) return;

        // For each input, check connected systems' supply
        for (const inputId of inputs) {
            let totalInputSupply = 0;
            let connectedCount = 0;

            for (const connId of system.connections) {
                const connSystem = allSystems.find(s => s.id === connId);
                if (!connSystem) continue;

                const inputListing = connSystem.market.find(m => m.commodityId === inputId);
                if (inputListing) {
                    totalInputSupply += inputListing.supply;
                    connectedCount++;
                }
            }

            // If connected systems have high supply of inputs, boost this system's production
            if (connectedCount > 0) {
                const avgInputSupply = totalInputSupply / connectedCount;
                if (avgInputSupply > 50) {
                    listing.supply += SUPPLY_CHAIN_PROPAGATION * (avgInputSupply - 50) * 0.1;
                }
            }
        }
    }

    private calculateTrend(history: number[]): 'rising' | 'falling' | 'stable' {
        if (history.length < 3) return 'stable';
        const recent = history.slice(-3);
        const older = history.slice(-6, -3);
        if (older.length === 0) return 'stable';

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        const change = (recentAvg - olderAvg) / olderAvg;

        if (change > 0.05) return 'rising';
        if (change < -0.05) return 'falling';
        return 'stable';
    }

    /** Player buys commodity: reduce supply, raise demand */
    playerBuy(system: StarSystemData, commodityId: string, quantity: number): void {
        const listing = system.market.find(m => m.commodityId === commodityId);
        if (!listing) return;

        listing.supply = Math.max(1, listing.supply - quantity);
        listing.demand += quantity * 0.5;
    }

    /** Player sells commodity: increase supply, reduce demand */
    playerSell(system: StarSystemData, commodityId: string, quantity: number): void {
        const listing = system.market.find(m => m.commodityId === commodityId);
        if (!listing) return;

        listing.supply += quantity;
        listing.demand = Math.max(1, listing.demand - quantity * 0.3);
    }

    /** Get current price for a commodity in a system */
    getPrice(system: StarSystemData, commodityId: string): number | null {
        const listing = system.market.find(m => m.commodityId === commodityId);
        return listing ? listing.price : null;
    }

    /** Calculate expected profit for buying here and selling at target */
    calculateExpectedProfit(
        buySystem: StarSystemData,
        sellSystem: StarSystemData,
        commodityId: string,
        quantity: number
    ): number {
        const buyListing = buySystem.market.find(m => m.commodityId === commodityId);
        const sellListing = sellSystem.market.find(m => m.commodityId === commodityId);
        if (!buyListing || !sellListing) return 0;

        const buyCost = buyListing.price * quantity;
        const sellRevenue = sellListing.price * quantity;
        return sellRevenue - buyCost;
    }

    /** Take an economy snapshot for history tracking */
    takeSnapshot(time: number, systems: StarSystemData[]): void {
        for (const system of systems) {
            for (const listing of system.market) {
                this.snapshots.push({
                    time,
                    systemId: system.id,
                    commodityId: listing.commodityId,
                    price: listing.price,
                    supply: listing.supply,
                    demand: listing.demand,
                });
            }
        }

        // Keep only last 1000 snapshots to avoid memory issues
        if (this.snapshots.length > 1000) {
            this.snapshots = this.snapshots.slice(-500);
        }
    }

    loadSnapshots(snapshots: EconomySnapshot[]): void {
        this.snapshots = snapshots;
    }
}
