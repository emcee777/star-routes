# Star Routes

> Space trading and exploration sim with procedural galaxy generation. Built entirely with procedural graphics — no sprites, no art assets. Your code IS the art.

## Play

[Play Star Routes](https://emcee777.github.io/star-routes/)

## About

Star Routes drops you into a procedurally generated galaxy where you trade commodities, manage a crew, navigate faction politics, and survive turn-based combat. Buy low, sell high, discover branching events, and build your reputation across 4 factions.

**Built with zero art assets** — starfields, nebulae, ships, and UI are all procedural.

## Features

- **Procedural galaxy** — seeded RNG with minimum distance constraints and faction territories
- **20+ commodities** with supply/demand pricing and price history
- **Turn-based combat** — attack, defend, flee, or negotiate
- **Crew management** — hiring, morale, skill bonuses, salary
- **4-faction reputation** with smuggling detection
- **32 branching events** with multiple outcomes
- **3 navigation modes** — shortest, safest, efficient (Dijkstra pathfinding)
- **Multi-slot save system** via localStorage
- **Procedural graphics** — multi-layer starfield, bloom effects, animated UI

## How to Play

1. **Choose your ship** and hire a crew
2. **Trade** — buy commodities at stations, sell where prices are higher
3. **Navigate** — choose routes between star systems (watch for pirates)
4. **Fight or talk** — turn-based combat with attack/defend/flee/negotiate
5. **Build reputation** — faction standings affect prices and access
6. **Explore** — trigger events that shape your journey
7. **Profit** — reach your wealth goal to win

## Tech Stack

| Component | Version |
|-----------|---------|
| [Phaser](https://phaser.io/) | 3.90.0 |
| TypeScript | 5.7.2 (strict) |
| [Vite](https://vitejs.dev/) | 6.3.1 |
| Renderer | WebGL + PostFX |

## Development

```bash
npm install
npm run dev    # Dev server (port 8080)
npm run build  # Production build
```

## Architecture

8 core systems with clean separation:

- **EconomyEngine** — Supply/demand with price propagation and volatility
- **TradingSystem** — Buy/sell with profit tracking and cargo constraints
- **NavigationSystem** — Dijkstra pathfinding with 3 route optimization modes
- **CombatSystem** — Turn-based with 4 action types
- **CrewManager** — Hiring, morale, skill bonuses, salary management
- **ReputationSystem** — 4-faction standings with smuggling detection
- **EventSystem** — 32 branching narrative events
- **SaveSystem** — Multi-slot localStorage persistence

## Contributing

Contributions welcome! Add new events, commodities, or star types — all defined in config files. Visual changes are code. No art tools needed.

## License

MIT — see [LICENSE](LICENSE)
