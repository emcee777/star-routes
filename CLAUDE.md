# Star Routes

Space trading simulation built with Phaser 3 + Vite + TypeScript.

## Architecture

```
src/game/
  types/index.ts              - All type definitions
  config/                     - Game data (commodities, ships, modules, etc.)
  systems/                    - Core game logic (economy, trading, combat, etc.)
  entities/                   - Visual entities (star systems, ships, crew)
  ui/                         - UI panels (HUD, trading, ship, crew, combat)
  scenes/                     - Phaser scenes (menu, station, travel, combat)
```

## Key Systems

- **EconomyEngine** - Dynamic supply/demand pricing, supply chain propagation
- **TradingSystem** - Buy/sell with profit tracking, cargo management
- **NavigationSystem** - Dijkstra pathfinding with 3 route modes (shortest/safest/efficient)
- **CombatSystem** - Turn-based combat with 4 actions (attack/defend/flee/negotiate)
- **CrewManager** - Hiring, morale, skill bonuses, salary payments
- **ReputationSystem** - 4 faction standings, smuggling detection, price modifiers
- **EventSystem** - 32 random events with branching choices and outcomes
- **SaveSystem** - LocalStorage save/load with multiple slots

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npx tsc --noEmit     # Type check
```

## Game Flow

MainMenu -> NewGame (ship selection) -> StationScene (hub) <-> TravelScene (with events/combat) -> VictoryScene/GameOver
