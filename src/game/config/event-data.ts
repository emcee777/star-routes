// ============================================================
// Star Routes - Random Event Definitions (32 events)
// ============================================================

import { GameEventDef } from '../types';

export const EVENTS: GameEventDef[] = [
    // --- Combat Events ---
    {
        id: 'pirate_ambush',
        name: 'Pirate Ambush',
        description: 'A pirate vessel drops out of warp ahead of you, weapons hot!',
        type: 'combat',
        weight: 10,
        conditions: { inTransit: true, minDanger: 0.3 },
        choices: [
            {
                text: 'Fight them off',
                outcomes: [
                    { probability: 0.5, text: 'You engage the pirates in combat!', effects: { combatStart: true } },
                    { probability: 0.5, text: 'You engage the pirates in combat!', effects: { combatStart: true } },
                ],
            },
            {
                text: 'Try to flee',
                requirements: { minCombat: 0 },
                outcomes: [
                    { probability: 0.6, text: 'Your engines burn hot as you escape!', effects: { fuel: -10 } },
                    { probability: 0.4, text: 'They catch up! No choice but to fight!', effects: { combatStart: true } },
                ],
            },
            {
                text: 'Negotiate passage',
                requirements: { hasCrew: 'diplomacy' },
                outcomes: [
                    { probability: 0.5, text: 'Your diplomat talks them down. They accept a toll.', effects: { credits: -500 } },
                    { probability: 0.3, text: 'They laugh at your offer and attack!', effects: { combatStart: true } },
                    { probability: 0.2, text: 'Impressed by your boldness, they let you pass freely.', effects: {} },
                ],
            },
        ],
    },
    {
        id: 'pirate_patrol',
        name: 'Pirate Patrol',
        description: 'A patrol of pirate scouts is scanning the area. They haven\'t spotted you yet.',
        type: 'combat',
        weight: 8,
        conditions: { inTransit: true, minDanger: 0.2 },
        choices: [
            {
                text: 'Sneak past them',
                outcomes: [
                    { probability: 0.7, text: 'You drift silently past the patrol.', effects: {} },
                    { probability: 0.3, text: 'Detected! They move to intercept!', effects: { combatStart: true } },
                ],
            },
            {
                text: 'Attack first',
                outcomes: [
                    { probability: 1.0, text: 'You get the drop on them!', effects: { combatStart: true } },
                ],
            },
            {
                text: 'Change course (costs fuel)',
                outcomes: [
                    { probability: 1.0, text: 'You take a longer route to avoid them.', effects: { fuel: -15 } },
                ],
            },
        ],
    },
    {
        id: 'bounty_hunter',
        name: 'Bounty Hunter',
        description: 'A bounty hunter hails you. They\'re looking for someone who matches your description.',
        type: 'combat',
        weight: 5,
        conditions: { inTransit: true },
        choices: [
            {
                text: 'Talk your way out',
                requirements: { hasCrew: 'diplomacy' },
                outcomes: [
                    { probability: 0.7, text: 'Your smooth talking convinces them you\'re not the target.', effects: { morale: 5 } },
                    { probability: 0.3, text: 'They don\'t buy it. Weapons hot!', effects: { combatStart: true } },
                ],
            },
            {
                text: 'Bribe them',
                requirements: { minCredits: 1000 },
                outcomes: [
                    { probability: 0.8, text: 'Credits change hands. They move on.', effects: { credits: -1000 } },
                    { probability: 0.2, text: 'They take your money AND attack!', effects: { credits: -1000, combatStart: true } },
                ],
            },
            {
                text: 'Prepare for battle',
                outcomes: [
                    { probability: 1.0, text: 'You power up weapons and face them.', effects: { combatStart: true } },
                ],
            },
        ],
    },
    // --- Trade Events ---
    {
        id: 'merchant_convoy',
        name: 'Merchant Convoy',
        description: 'A friendly merchant convoy is passing through. They offer to trade.',
        type: 'trade',
        weight: 8,
        conditions: { inTransit: true },
        choices: [
            {
                text: 'Trade with them (buy food cheap)',
                outcomes: [
                    { probability: 1.0, text: 'You stock up on cheap supplies!', effects: { addCargo: { commodityId: 'food', quantity: 10 } } },
                ],
            },
            {
                text: 'Ask for market info',
                outcomes: [
                    { probability: 1.0, text: 'They share valuable trade intelligence.', effects: { morale: 5 } },
                ],
            },
            {
                text: 'Continue on your way',
                outcomes: [
                    { probability: 1.0, text: 'You wave and continue your journey.', effects: {} },
                ],
            },
        ],
    },
    {
        id: 'supply_surplus',
        name: 'Supply Surplus',
        description: 'A nearby station is dumping surplus goods at rock-bottom prices!',
        type: 'trade',
        weight: 6,
        conditions: {},
        choices: [
            {
                text: 'Rush to buy cheap electronics',
                outcomes: [
                    { probability: 0.7, text: 'You grab cheap electronics before they\'re gone!', effects: { addCargo: { commodityId: 'electronics', quantity: 8 } } },
                    { probability: 0.3, text: 'Too late! Other traders got there first.', effects: {} },
                ],
            },
            {
                text: 'Ignore it',
                outcomes: [
                    { probability: 1.0, text: 'You pass on the opportunity.', effects: {} },
                ],
            },
        ],
    },
    {
        id: 'price_crash',
        name: 'Market Crash',
        description: 'News comes in: a major supply route has been secured, crashing prices on manufactured goods.',
        type: 'trade',
        weight: 5,
        conditions: {},
        choices: [
            {
                text: 'Acknowledge the news',
                outcomes: [
                    { probability: 1.0, text: 'Manufactured goods prices drop across the sector.', effects: { marketEffect: { systemId: '', commodityId: 'ship_parts', supplyChange: 50 } } },
                ],
            },
        ],
    },
    {
        id: 'trade_blockade',
        name: 'Trade Blockade',
        description: 'A faction has blockaded a major trade route, causing shortages.',
        type: 'trade',
        weight: 4,
        conditions: {},
        choices: [
            {
                text: 'Run the blockade (risky)',
                outcomes: [
                    { probability: 0.4, text: 'You slip through! Shortage goods are worth a fortune!', effects: { addCargo: { commodityId: 'fuel_cells', quantity: 15 }, morale: 10 } },
                    { probability: 0.6, text: 'Caught! You barely escape with your hull intact.', effects: { hull: -20 } },
                ],
            },
            {
                text: 'Find alternate routes',
                outcomes: [
                    { probability: 1.0, text: 'You reroute your trade plans.', effects: { fuel: -5 } },
                ],
            },
        ],
    },
    // --- Discovery Events ---
    {
        id: 'derelict_ship',
        name: 'Derelict Ship',
        description: 'You detect a drifting derelict on your scanners. It appears abandoned.',
        type: 'discovery',
        weight: 7,
        conditions: { inTransit: true },
        choices: [
            {
                text: 'Board and salvage',
                requirements: { hasCrew: 'engineering' },
                outcomes: [
                    { probability: 0.5, text: 'Your engineer finds valuable salvage!', effects: { credits: 2000, addCargo: { commodityId: 'ship_parts', quantity: 5 } } },
                    { probability: 0.3, text: 'Mostly stripped already, but you find some credits.', effects: { credits: 500 } },
                    { probability: 0.2, text: 'It\'s a trap! Pirates were waiting inside!', effects: { combatStart: true } },
                ],
            },
            {
                text: 'Scan from a distance',
                outcomes: [
                    { probability: 0.6, text: 'Scans reveal some useful data about the area.', effects: { discoveredSystem: true } },
                    { probability: 0.4, text: 'Nothing useful on the scanners.', effects: {} },
                ],
            },
            {
                text: 'Avoid it',
                outcomes: [
                    { probability: 1.0, text: 'You give the wreck a wide berth. Better safe than sorry.', effects: {} },
                ],
            },
        ],
    },
    {
        id: 'asteroid_field',
        name: 'Asteroid Field',
        description: 'Your route passes through a dense asteroid field rich with minerals.',
        type: 'discovery',
        weight: 6,
        conditions: { inTransit: true },
        choices: [
            {
                text: 'Mine the asteroids',
                requirements: { hasCrew: 'mining' },
                outcomes: [
                    { probability: 0.6, text: 'Excellent haul! Your miner knows their stuff.', effects: { addCargo: { commodityId: 'rare_minerals', quantity: 5 } } },
                    { probability: 0.4, text: 'Slim pickings, but you find some ore.', effects: { addCargo: { commodityId: 'iron_ore', quantity: 8 } } },
                ],
            },
            {
                text: 'Navigate carefully through',
                outcomes: [
                    { probability: 0.8, text: 'You thread through the field safely.', effects: {} },
                    { probability: 0.2, text: 'An asteroid clips your hull!', effects: { hull: -15 } },
                ],
            },
            {
                text: 'Go around (costs fuel)',
                outcomes: [
                    { probability: 1.0, text: 'You take the safe route around.', effects: { fuel: -10 } },
                ],
            },
        ],
    },
    {
        id: 'ancient_ruins',
        name: 'Ancient Ruins Signal',
        description: 'Your scanners pick up an anomalous signal from a nearby moon. Ancient ruins!',
        type: 'discovery',
        weight: 3,
        conditions: {},
        choices: [
            {
                text: 'Investigate the ruins',
                outcomes: [
                    { probability: 0.4, text: 'You find priceless artifacts!', effects: { addCargo: { commodityId: 'artifacts', quantity: 3 } } },
                    { probability: 0.3, text: 'The ruins are mostly collapsed. You find a few trinkets.', effects: { credits: 1000 } },
                    { probability: 0.3, text: 'Automated defenses activate!', effects: { hull: -25 } },
                ],
            },
            {
                text: 'Log the coordinates and move on',
                outcomes: [
                    { probability: 1.0, text: 'You mark the location for future exploration.', effects: { discoveredSystem: true } },
                ],
            },
        ],
    },
    {
        id: 'nebula_passage',
        name: 'Nebula Passage',
        description: 'A beautiful nebula lies across your path. Sensors are unreliable inside.',
        type: 'discovery',
        weight: 5,
        conditions: { inTransit: true },
        choices: [
            {
                text: 'Fly through the nebula',
                outcomes: [
                    { probability: 0.5, text: 'The nebula hides a shortcut! You save fuel.', effects: { fuel: 20 } },
                    { probability: 0.3, text: 'Disorienting but you make it through.', effects: {} },
                    { probability: 0.2, text: 'Electromagnetic discharge damages your systems!', effects: { hull: -10, morale: -5 } },
                ],
            },
            {
                text: 'Go around',
                outcomes: [
                    { probability: 1.0, text: 'You skirt the nebula\'s edge.', effects: { fuel: -8 } },
                ],
            },
        ],
    },
    // --- Distress Events ---
    {
        id: 'distress_signal',
        name: 'Distress Signal',
        description: 'A ship is broadcasting a distress signal. They report engine failure.',
        type: 'distress',
        weight: 7,
        conditions: { inTransit: true },
        choices: [
            {
                text: 'Render assistance',
                requirements: { hasCrew: 'engineering' },
                outcomes: [
                    { probability: 0.6, text: 'Your engineer fixes their engines. They reward you!', effects: { credits: 1500, morale: 10, reputation: { factionId: 'federation', amount: 5 } } },
                    { probability: 0.2, text: 'You help, but they have nothing to offer.', effects: { morale: 5, reputation: { factionId: 'federation', amount: 3 } } },
                    { probability: 0.2, text: 'It was a trap! Pirates!', effects: { combatStart: true } },
                ],
            },
            {
                text: 'Offer supplies',
                outcomes: [
                    { probability: 0.8, text: 'They\'re grateful for the fuel and food.', effects: { fuel: -15, morale: 5, reputation: { factionId: 'federation', amount: 3 } } },
                    { probability: 0.2, text: 'It was a pirate lure!', effects: { combatStart: true } },
                ],
            },
            {
                text: 'Ignore and continue',
                outcomes: [
                    { probability: 1.0, text: 'You fly past. Your crew looks uneasy.', effects: { morale: -5 } },
                ],
            },
        ],
    },
    {
        id: 'refugee_ship',
        name: 'Refugee Ship',
        description: 'A crowded refugee ship hails you. They\'ve fled a war zone and need food.',
        type: 'distress',
        weight: 4,
        conditions: {},
        choices: [
            {
                text: 'Give them food supplies',
                requirements: { hasCargo: 'food' },
                outcomes: [
                    { probability: 0.8, text: 'They\'re incredibly grateful. Word of your generosity spreads.', effects: { removeCargo: { commodityId: 'food', quantity: 5 }, reputation: { factionId: 'federation', amount: 8 }, morale: 10 } },
                    { probability: 0.2, text: 'A skilled engineer among the refugees offers to join your crew!', effects: { removeCargo: { commodityId: 'food', quantity: 5 }, addCrew: true, morale: 15 } },
                ],
            },
            {
                text: 'Give them credits',
                requirements: { minCredits: 500 },
                outcomes: [
                    { probability: 1.0, text: 'They thank you and continue their journey.', effects: { credits: -500, morale: 5, reputation: { factionId: 'federation', amount: 3 } } },
                ],
            },
            {
                text: 'Move along',
                outcomes: [
                    { probability: 1.0, text: 'You leave the refugees behind.', effects: { morale: -10 } },
                ],
            },
        ],
    },
    {
        id: 'medical_emergency',
        name: 'Medical Emergency',
        description: 'A nearby station has a plague outbreak! They\'re begging for medicine.',
        type: 'distress',
        weight: 5,
        conditions: {},
        choices: [
            {
                text: 'Deliver medicine',
                requirements: { hasCargo: 'medicine' },
                outcomes: [
                    { probability: 1.0, text: 'You deliver the medicine. The station is saved!', effects: { removeCargo: { commodityId: 'medicine', quantity: 5 }, credits: 3000, reputation: { factionId: 'federation', amount: 10 }, morale: 15 } },
                ],
            },
            {
                text: 'Exploit the shortage',
                outcomes: [
                    { probability: 1.0, text: 'You sell overpriced supplies. Profitable, but morally grey.', effects: { credits: 2000, reputation: { factionId: 'federation', amount: -5 }, morale: -5 } },
                ],
            },
            {
                text: 'Quarantine yourself and leave',
                outcomes: [
                    { probability: 1.0, text: 'You seal your ship and depart.', effects: {} },
                ],
            },
        ],
    },
    // --- Faction Events ---
    {
        id: 'faction_inspection',
        name: 'Faction Inspection',
        description: 'A faction patrol vessel demands to inspect your cargo for contraband.',
        type: 'faction',
        weight: 7,
        conditions: {},
        choices: [
            {
                text: 'Allow inspection',
                outcomes: [
                    { probability: 0.7, text: 'They find nothing suspicious. You\'re cleared to go.', effects: { reputation: { factionId: 'hegemony', amount: 2 } } },
                    { probability: 0.3, text: 'Clean cargo. They appreciate your cooperation.', effects: { reputation: { factionId: 'hegemony', amount: 5 } } },
                ],
            },
            {
                text: 'Bribe the inspector',
                requirements: { minCredits: 800 },
                outcomes: [
                    { probability: 0.6, text: 'The inspector pockets your credits and waves you through.', effects: { credits: -800, reputation: { factionId: 'syndicate', amount: 3 } } },
                    { probability: 0.4, text: 'The inspector is insulted! Reputation damaged.', effects: { credits: -800, reputation: { factionId: 'hegemony', amount: -10 } } },
                ],
            },
            {
                text: 'Try to flee',
                outcomes: [
                    { probability: 0.4, text: 'You outrun them!', effects: { fuel: -10, reputation: { factionId: 'hegemony', amount: -8 } } },
                    { probability: 0.6, text: 'They catch you and confiscate cargo!', effects: { credits: -1000, reputation: { factionId: 'hegemony', amount: -15 } } },
                ],
            },
        ],
    },
    {
        id: 'faction_mission',
        name: 'Faction Mission',
        description: 'A faction representative approaches with a delivery job.',
        type: 'faction',
        weight: 6,
        conditions: {},
        choices: [
            {
                text: 'Accept the mission',
                outcomes: [
                    { probability: 1.0, text: 'You accept delivery of their cargo and a promised reward.', effects: { addCargo: { commodityId: 'electronics', quantity: 5 }, credits: 1000, reputation: { factionId: 'federation', amount: 5 } } },
                ],
            },
            {
                text: 'Decline politely',
                outcomes: [
                    { probability: 1.0, text: 'They understand. Maybe next time.', effects: {} },
                ],
            },
        ],
    },
    {
        id: 'faction_war',
        name: 'Border Skirmish',
        description: 'Two factions are fighting over this sector! Debris and weapons fire everywhere.',
        type: 'faction',
        weight: 4,
        conditions: { inTransit: true, minDanger: 0.4 },
        choices: [
            {
                text: 'Navigate through carefully',
                requirements: { hasCrew: 'piloting' },
                outcomes: [
                    { probability: 0.7, text: 'Your pilot weaves through the crossfire!', effects: {} },
                    { probability: 0.3, text: 'Caught in the crossfire! Hull damage!', effects: { hull: -30 } },
                ],
            },
            {
                text: 'Wait it out',
                outcomes: [
                    { probability: 1.0, text: 'You drift at a safe distance until the fighting stops.', effects: { fuel: -5 } },
                ],
            },
            {
                text: 'Salvage the battlefield',
                outcomes: [
                    { probability: 0.5, text: 'You grab valuable wreckage!', effects: { addCargo: { commodityId: 'weapons', quantity: 5 }, hull: -10 } },
                    { probability: 0.5, text: 'A stray torpedo nearly destroys you!', effects: { hull: -40 } },
                ],
            },
        ],
    },
    // --- Crew Events ---
    {
        id: 'crew_conflict',
        name: 'Crew Conflict',
        description: 'Two crew members are having a heated argument that\'s affecting morale.',
        type: 'crew',
        weight: 6,
        conditions: {},
        choices: [
            {
                text: 'Mediate the dispute',
                requirements: { hasCrew: 'leadership' },
                outcomes: [
                    { probability: 0.7, text: 'Your leader resolves the conflict. Morale improves.', effects: { morale: 10 } },
                    { probability: 0.3, text: 'Things escalate before calming down.', effects: { morale: -5 } },
                ],
            },
            {
                text: 'Let them sort it out',
                outcomes: [
                    { probability: 0.5, text: 'They work it out eventually.', effects: { morale: -3 } },
                    { probability: 0.5, text: 'The tension festers. Morale drops.', effects: { morale: -10 } },
                ],
            },
            {
                text: 'Throw a party to lighten the mood',
                requirements: { minCredits: 200 },
                outcomes: [
                    { probability: 0.8, text: 'Good food and drink smooth things over!', effects: { credits: -200, morale: 15 } },
                    { probability: 0.2, text: 'The party makes things worse somehow.', effects: { credits: -200, morale: -5 } },
                ],
            },
        ],
    },
    {
        id: 'crew_talent',
        name: 'Crew Discovery',
        description: 'One of your crew reveals a hidden talent you didn\'t know about.',
        type: 'crew',
        weight: 4,
        conditions: {},
        choices: [
            {
                text: 'Encourage them',
                outcomes: [
                    { probability: 1.0, text: 'Their morale soars! They work even harder.', effects: { morale: 15 } },
                ],
            },
        ],
    },
    {
        id: 'stowaway',
        name: 'Stowaway Found',
        description: 'Your crew discovers a stowaway hiding in the cargo bay!',
        type: 'crew',
        weight: 3,
        conditions: {},
        choices: [
            {
                text: 'Offer them a job',
                outcomes: [
                    { probability: 0.7, text: 'They\'re grateful and join your crew!', effects: { addCrew: true, morale: 5 } },
                    { probability: 0.3, text: 'They refuse. They just wanted a ride.', effects: {} },
                ],
            },
            {
                text: 'Turn them in at the next station',
                outcomes: [
                    { probability: 1.0, text: 'You hand them over. Small bounty collected.', effects: { credits: 300, reputation: { factionId: 'hegemony', amount: 3 } } },
                ],
            },
            {
                text: 'Drop them at the next station, no questions',
                outcomes: [
                    { probability: 1.0, text: 'You let them go quietly.', effects: { morale: 5 } },
                ],
            },
        ],
    },
    // --- Environmental Events ---
    {
        id: 'solar_flare',
        name: 'Solar Flare',
        description: 'A massive solar flare erupts from the nearby star! Electromagnetic interference!',
        type: 'environmental',
        weight: 5,
        conditions: { inTransit: true },
        choices: [
            {
                text: 'Raise shields and push through',
                outcomes: [
                    { probability: 0.6, text: 'Shields absorb most of the radiation. Minor damage.', effects: { hull: -5 } },
                    { probability: 0.4, text: 'Shields buckle under the strain!', effects: { hull: -20, morale: -5 } },
                ],
            },
            {
                text: 'Take shelter behind a planet',
                outcomes: [
                    { probability: 0.9, text: 'You hide in the planet\'s shadow until it passes.', effects: { fuel: -5 } },
                    { probability: 0.1, text: 'You discover an interesting anomaly while waiting!', effects: { discoveredSystem: true } },
                ],
            },
        ],
    },
    {
        id: 'meteor_shower',
        name: 'Meteor Shower',
        description: 'A dense meteor shower threatens your ship!',
        type: 'environmental',
        weight: 5,
        conditions: { inTransit: true },
        choices: [
            {
                text: 'Dodge through it',
                requirements: { hasCrew: 'piloting' },
                outcomes: [
                    { probability: 0.8, text: 'Expert piloting gets you through unscathed!', effects: {} },
                    { probability: 0.2, text: 'A few hits but nothing critical.', effects: { hull: -10 } },
                ],
            },
            {
                text: 'Full speed ahead',
                outcomes: [
                    { probability: 0.5, text: 'You blast through with minor scratches.', effects: { hull: -10 } },
                    { probability: 0.5, text: 'Heavy impacts! Your hull takes a beating.', effects: { hull: -25 } },
                ],
            },
        ],
    },
    {
        id: 'ion_storm',
        name: 'Ion Storm',
        description: 'An ion storm disrupts your electronics and navigation.',
        type: 'environmental',
        weight: 4,
        conditions: { inTransit: true },
        choices: [
            {
                text: 'Shut down non-essential systems',
                requirements: { hasCrew: 'engineering' },
                outcomes: [
                    { probability: 0.9, text: 'Your engineer reroutes power. Systems protected.', effects: {} },
                    { probability: 0.1, text: 'Some systems still take damage.', effects: { hull: -5 } },
                ],
            },
            {
                text: 'Push through quickly',
                outcomes: [
                    { probability: 0.6, text: 'You make it through with fried circuits.', effects: { hull: -15 } },
                    { probability: 0.4, text: 'Major system failure! Significant damage.', effects: { hull: -30, fuel: -10 } },
                ],
            },
        ],
    },
    // --- Smuggling Events ---
    {
        id: 'smuggler_offer',
        name: 'Smuggler\'s Offer',
        description: 'A shadowy figure approaches you at the station bar with a lucrative offer.',
        type: 'smuggling',
        weight: 5,
        conditions: {},
        choices: [
            {
                text: 'Accept the smuggling job',
                outcomes: [
                    { probability: 1.0, text: 'You take on contraband cargo. Risky but profitable.', effects: { addCargo: { commodityId: 'narcotics', quantity: 5 }, reputation: { factionId: 'syndicate', amount: 5 } } },
                ],
            },
            {
                text: 'Decline and report them',
                outcomes: [
                    { probability: 0.7, text: 'The authorities are grateful for the tip.', effects: { credits: 500, reputation: { factionId: 'hegemony', amount: 5 }, reputation: { factionId: 'syndicate', amount: -5 } } },
                    { probability: 0.3, text: 'The smuggler escapes before authorities arrive.', effects: {} },
                ],
            },
            {
                text: 'Decline quietly',
                outcomes: [
                    { probability: 1.0, text: 'You shake your head and walk away.', effects: {} },
                ],
            },
        ],
    },
    {
        id: 'contraband_found',
        name: 'Hidden Contraband',
        description: 'During maintenance, your crew finds contraband hidden in a compartment!',
        type: 'smuggling',
        weight: 3,
        conditions: {},
        choices: [
            {
                text: 'Keep it to sell',
                outcomes: [
                    { probability: 1.0, text: 'You stash the contraband in your cargo.', effects: { addCargo: { commodityId: 'stolen_data', quantity: 3 }, reputation: { factionId: 'syndicate', amount: 2 } } },
                ],
            },
            {
                text: 'Jettison it',
                outcomes: [
                    { probability: 1.0, text: 'You dump the contraband into space.', effects: { morale: 5 } },
                ],
            },
            {
                text: 'Turn it in to authorities',
                outcomes: [
                    { probability: 1.0, text: 'The authorities pay a finder\'s fee.', effects: { credits: 800, reputation: { factionId: 'hegemony', amount: 5 }, reputation: { factionId: 'syndicate', amount: -3 } } },
                ],
            },
        ],
    },
    // --- More varied events ---
    {
        id: 'gambling_den',
        name: 'Station Gambling',
        description: 'A high-stakes card game is happening in the station cantina.',
        type: 'trade',
        weight: 4,
        conditions: {},
        choices: [
            {
                text: 'Join the game (bet 500 credits)',
                requirements: { minCredits: 500 },
                outcomes: [
                    { probability: 0.4, text: 'You clean them out!', effects: { credits: 1500, morale: 10 } },
                    { probability: 0.3, text: 'You break even. Good entertainment though.', effects: { morale: 5 } },
                    { probability: 0.3, text: 'You lose your stake. Bad luck.', effects: { credits: -500, morale: -5 } },
                ],
            },
            {
                text: 'Watch from the bar',
                outcomes: [
                    { probability: 0.7, text: 'You pick up some useful gossip.', effects: { morale: 3 } },
                    { probability: 0.3, text: 'A drunk trader lets slip a profitable trade route!', effects: { discoveredSystem: true, morale: 5 } },
                ],
            },
        ],
    },
    {
        id: 'mechanical_failure',
        name: 'Engine Malfunction',
        description: 'Warning! Your main engine is overheating. It needs immediate attention.',
        type: 'environmental',
        weight: 5,
        conditions: { inTransit: true },
        choices: [
            {
                text: 'Emergency repairs',
                requirements: { hasCrew: 'engineering' },
                outcomes: [
                    { probability: 0.8, text: 'Your engineer patches it up. Crisis averted!', effects: {} },
                    { probability: 0.2, text: 'Fixed, but you had to burn extra fuel cooling it.', effects: { fuel: -10 } },
                ],
            },
            {
                text: 'Limp to nearest station',
                outcomes: [
                    { probability: 0.6, text: 'You make it, barely. Repair costs 500.', effects: { credits: -500 } },
                    { probability: 0.4, text: 'The engine blows! Significant damage.', effects: { hull: -25, fuel: -20 } },
                ],
            },
        ],
    },
    {
        id: 'mysterious_signal',
        name: 'Mysterious Signal',
        description: 'An encrypted signal repeats from deep space. It seems to be coordinates.',
        type: 'discovery',
        weight: 3,
        conditions: { inTransit: true },
        choices: [
            {
                text: 'Decode and investigate',
                requirements: { hasCrew: 'hacking' },
                outcomes: [
                    { probability: 0.5, text: 'Hidden cache! Someone stashed valuable goods here.', effects: { addCargo: { commodityId: 'gemstones', quantity: 3 }, credits: 2000 } },
                    { probability: 0.3, text: 'The coordinates lead to a new system!', effects: { discoveredSystem: true } },
                    { probability: 0.2, text: 'It was a virus! Your systems take minor damage.', effects: { hull: -5 } },
                ],
            },
            {
                text: 'Ignore it',
                outcomes: [
                    { probability: 1.0, text: 'You suppress the signal and move on.', effects: {} },
                ],
            },
        ],
    },
    {
        id: 'fuel_leak',
        name: 'Fuel Leak',
        description: 'A micro-fracture in your fuel line is leaking fuel into space!',
        type: 'environmental',
        weight: 5,
        conditions: { inTransit: true },
        choices: [
            {
                text: 'Seal the leak',
                requirements: { hasCrew: 'engineering' },
                outcomes: [
                    { probability: 0.9, text: 'Leak sealed! Only lost a little fuel.', effects: { fuel: -5 } },
                    { probability: 0.1, text: 'The patch holds but used extra fuel.', effects: { fuel: -15 } },
                ],
            },
            {
                text: 'Emergency shutdown and drift',
                outcomes: [
                    { probability: 0.7, text: 'You stop the leak by shutting down. Restart costs fuel.', effects: { fuel: -20 } },
                    { probability: 0.3, text: 'While drifting, you spot something interesting!', effects: { fuel: -15, discoveredSystem: true } },
                ],
            },
        ],
    },
];

export const EVENT_MAP = new Map(EVENTS.map(e => [e.id, e]));
