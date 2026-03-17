// ============================================================
// Star Routes - Trading System
// Buy/sell logic, profit calculation, cargo management
// ============================================================

import {
    PlayerState, StarSystemData, LogEntry, MarketListing
} from '../types';
import { COMMODITY_MAP } from '../config/commodity-data';
import { TRADER_SELL_TAX } from '../config/constants';
import { EconomyEngine } from './EconomyEngine';
import { ReputationSystem } from './ReputationSystem';

export interface TradeResult {
    success: boolean;
    message: string;
    creditsChange: number;
    profit?: number;
}

export class TradingSystem {
    private economyEngine: EconomyEngine;
    private reputationSystem: ReputationSystem | null;

    constructor(economyEngine: EconomyEngine, reputationSystem?: ReputationSystem) {
        this.economyEngine = economyEngine;
        this.reputationSystem = reputationSystem ?? null;
    }

    /** Buy a commodity from the current system's market */
    buy(
        player: PlayerState,
        system: StarSystemData,
        commodityId: string,
        quantity: number,
        gameTime: number,
        log: LogEntry[]
    ): TradeResult {
        const listing = system.market.find(m => m.commodityId === commodityId);
        if (!listing) {
            return { success: false, message: 'Commodity not available here.', creditsChange: 0 };
        }

        const commodity = COMMODITY_MAP.get(commodityId);
        if (!commodity) {
            return { success: false, message: 'Unknown commodity.', creditsChange: 0 };
        }

        if (quantity <= 0) {
            return { success: false, message: 'Invalid quantity.', creditsChange: 0 };
        }

        if (quantity > listing.supply) {
            return { success: false, message: `Only ${listing.supply} units available.`, creditsChange: 0 };
        }

        // Apply reputation price modifier
        const repMod = this.reputationSystem
            ? this.reputationSystem.getPriceModifier(player, system.factionId)
            : { buy: 1.0, sell: 1.0 };
        const effectiveBuyPrice = Math.round(listing.price * repMod.buy);
        const totalCost = effectiveBuyPrice * quantity;
        if (totalCost > player.credits) {
            const affordable = Math.floor(player.credits / effectiveBuyPrice);
            return {
                success: false,
                message: `Not enough credits. Can afford ${affordable} units.`,
                creditsChange: 0,
            };
        }

        // Check cargo space
        const cargoWeight = commodity.weight * quantity;
        const currentCargo = this.getCargoWeight(player);
        if (currentCargo + cargoWeight > player.ship.cargoCapacity) {
            const spaceLeft = player.ship.cargoCapacity - currentCargo;
            const canFit = Math.floor(spaceLeft / commodity.weight);
            return {
                success: false,
                message: `Not enough cargo space. Can fit ${canFit} more units.`,
                creditsChange: 0,
            };
        }

        // Execute the trade
        player.credits -= totalCost;

        // Add to cargo (stack with existing if same commodity)
        const existing = player.ship.cargo.find(c => c.commodityId === commodityId);
        if (existing) {
            // Average purchase price
            const totalQty = existing.quantity + quantity;
            existing.purchasePrice = Math.round(
                (existing.purchasePrice * existing.quantity + effectiveBuyPrice * quantity) / totalQty
            );
            existing.quantity = totalQty;
        } else {
            player.ship.cargo.push({
                commodityId,
                quantity,
                purchasePrice: effectiveBuyPrice,
            });
        }

        // Update market
        this.economyEngine.playerBuy(system, commodityId, quantity);

        // Log
        log.push({
            time: gameTime,
            type: 'trade',
            message: `Bought ${quantity}x ${commodity.name} for ${totalCost} credits at ${system.name}`,
            systemId: system.id,
        });

        return {
            success: true,
            message: `Bought ${quantity}x ${commodity.name} for ${totalCost} credits`,
            creditsChange: -totalCost,
        };
    }

    /** Sell a commodity at the current system's market */
    sell(
        player: PlayerState,
        system: StarSystemData,
        commodityId: string,
        quantity: number,
        gameTime: number,
        log: LogEntry[]
    ): TradeResult {
        const listing = system.market.find(m => m.commodityId === commodityId);
        if (!listing) {
            return { success: false, message: 'This commodity is not traded here.', creditsChange: 0 };
        }

        const commodity = COMMODITY_MAP.get(commodityId);
        if (!commodity) {
            return { success: false, message: 'Unknown commodity.', creditsChange: 0 };
        }

        const cargo = player.ship.cargo.find(c => c.commodityId === commodityId);
        if (!cargo || cargo.quantity < quantity) {
            return {
                success: false,
                message: `You only have ${cargo?.quantity ?? 0} units.`,
                creditsChange: 0,
            };
        }

        // Apply reputation price modifier
        const repMod = this.reputationSystem
            ? this.reputationSystem.getPriceModifier(player, system.factionId)
            : { buy: 1.0, sell: 1.0 };
        const effectiveSellPrice = Math.round(listing.price * repMod.sell);

        // Calculate revenue with tax
        const grossRevenue = effectiveSellPrice * quantity;
        const tax = Math.round(grossRevenue * TRADER_SELL_TAX);
        const netRevenue = grossRevenue - tax;
        const profit = netRevenue - (cargo.purchasePrice * quantity);

        // Execute the trade
        player.credits += netRevenue;
        cargo.quantity -= quantity;

        // Remove empty cargo entries
        if (cargo.quantity <= 0) {
            const idx = player.ship.cargo.indexOf(cargo);
            if (idx >= 0) player.ship.cargo.splice(idx, 1);
        }

        // Update market
        this.economyEngine.playerSell(system, commodityId, quantity);

        // Update player stats
        player.totalTrades++;
        player.cargoSold += quantity;
        if (profit > 0) {
            player.totalProfit += profit;
        }

        // Log
        const profitStr = profit >= 0 ? `+${profit}` : `${profit}`;
        log.push({
            time: gameTime,
            type: 'trade',
            message: `Sold ${quantity}x ${commodity.name} for ${netRevenue} credits (${profitStr} profit) at ${system.name}`,
            systemId: system.id,
        });

        return {
            success: true,
            message: `Sold ${quantity}x ${commodity.name} for ${netRevenue} credits (${profitStr} profit)`,
            creditsChange: netRevenue,
            profit,
        };
    }

    /** Get total cargo weight currently carried */
    getCargoWeight(player: PlayerState): number {
        let weight = 0;
        for (const cargo of player.ship.cargo) {
            const commodity = COMMODITY_MAP.get(cargo.commodityId);
            if (commodity) {
                weight += commodity.weight * cargo.quantity;
            }
        }
        return weight;
    }

    /** Get remaining cargo capacity */
    getRemainingCapacity(player: PlayerState): number {
        return player.ship.cargoCapacity - this.getCargoWeight(player);
    }

    /** Get cargo value at current system prices */
    getCargoValue(player: PlayerState, system: StarSystemData): number {
        let value = 0;
        for (const cargo of player.ship.cargo) {
            const listing = system.market.find(m => m.commodityId === cargo.commodityId);
            if (listing) {
                value += listing.price * cargo.quantity;
            }
        }
        return value;
    }

    /** Find best trade opportunities between two systems */
    findTradeOpportunities(
        fromSystem: StarSystemData,
        toSystem: StarSystemData,
        maxWeight: number
    ): Array<{ commodityId: string; buyPrice: number; sellPrice: number; profit: number; quantity: number }> {
        const opportunities: Array<{
            commodityId: string;
            buyPrice: number;
            sellPrice: number;
            profit: number;
            quantity: number;
        }> = [];

        for (const fromListing of fromSystem.market) {
            const toListing = toSystem.market.find(m => m.commodityId === fromListing.commodityId);
            if (!toListing) continue;

            const commodity = COMMODITY_MAP.get(fromListing.commodityId);
            if (!commodity) continue;

            const profitPerUnit = toListing.price - fromListing.price;
            if (profitPerUnit <= 0) continue;

            const maxByWeight = Math.floor(maxWeight / commodity.weight);
            const maxBySupply = fromListing.supply;
            const quantity = Math.min(maxByWeight, maxBySupply);

            if (quantity > 0) {
                opportunities.push({
                    commodityId: fromListing.commodityId,
                    buyPrice: fromListing.price,
                    sellPrice: toListing.price,
                    profit: profitPerUnit * quantity,
                    quantity,
                });
            }
        }

        // Sort by total profit descending
        opportunities.sort((a, b) => b.profit - a.profit);
        return opportunities;
    }

    /** Get market listing with additional info for UI */
    getMarketInfo(system: StarSystemData): Array<{
        listing: MarketListing;
        name: string;
        category: string;
        isContraband: boolean;
        weight: number;
    }> {
        return system.market.map(listing => {
            const commodity = COMMODITY_MAP.get(listing.commodityId);
            return {
                listing,
                name: commodity?.name ?? listing.commodityId,
                category: commodity?.category ?? 'unknown',
                isContraband: commodity?.isContraband ?? false,
                weight: commodity?.weight ?? 1,
            };
        }).sort((a, b) => a.category.localeCompare(b.category));
    }
}
