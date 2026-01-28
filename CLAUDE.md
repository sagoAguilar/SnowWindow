# CLAUDE.md - AI Assistant Guide for SnowWindow

## Project Overview

**SnowWindow** is a Progressive Web App (PWA) that helps homeowners determine the optimal time to shovel snow. Rather than just displaying weather data, it answers the practical question "when should I shovel?" using weather forecasts combined with snow science principles.

**Key Features:**
- Location-based hyperlocal weather analysis via Open-Meteo API
- Smart algorithm factoring snowfall, rain, sunshine, temperature, and wind
- Optimal timing recommendations with effort estimates
- Salt/ice prevention advisor
- Push notifications
- Installable PWA with offline support
- Dev Sandbox for testing scenarios

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.2 | Type-safe code |
| Vite | 6.0.5 | Build tool & dev server |
| Vitest | 2.1.8 | Unit testing |
| vite-plugin-pwa | 0.21.1 | Service worker & PWA manifest |

**External API:** Open-Meteo (free, no API key required)

## Directory Structure

```
src/
├── components/           # React UI components
│   ├── DevSandbox.tsx   # Testing sandbox (dev mode only)
│   ├── DynamicBackground.tsx
│   ├── LocationInput.tsx
│   ├── RecommendationCard.tsx
│   ├── SnowAnimation.tsx
│   └── WeatherDisplay.tsx
├── services/            # Business logic & APIs
│   ├── geolocation.ts   # Browser geolocation wrapper
│   ├── notifications.ts # Web Push API integration
│   ├── scenarios.ts     # 14 preset test scenarios
│   ├── shoveling.ts     # Core recommendation algorithm
│   ├── snowScience.ts   # Snow physics constants & calculations
│   ├── shoveling.test.ts
│   ├── snowScience.test.ts
│   └── weather/
│       ├── adapter.ts   # Weather provider interface
│       ├── index.ts     # Adapter export/selection
│       ├── openMeteo.ts # Open-Meteo API implementation
│       └── mockWeather.ts # Mock adapter for testing
├── types/
│   └── index.ts         # All TypeScript interfaces
├── App.tsx              # Root component with state management
├── main.tsx             # React DOM entry point
└── index.css            # Design system (CSS variables)

public/                  # PWA assets (icons, favicon)
```

## Development Commands

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # TypeScript check + Vite production build
npm run preview    # Preview production build locally
npm run test       # Run tests once
npm run test:watch # Run tests in watch mode
```

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component - orchestrates state, effects, and UI |
| `src/services/shoveling.ts` | **Core algorithm** - `generateRecommendation()` function |
| `src/services/snowScience.ts` | Physics constants & calculations |
| `src/types/index.ts` | Central type definitions |
| `src/services/scenarios.ts` | 14 preset weather scenarios for testing |

## Code Conventions

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig.json)
- No unused locals or parameters (`noUnusedLocals`, `noUnusedParameters`)
- All interfaces defined in `src/types/index.ts`
- Type-first approach - define interfaces before implementation

### React
- Functional components only with hooks
- State management via `useState` and `useCallback` in App.tsx
- No external state management library

### Architecture Pattern
```
Weather API → Services → State (App.tsx) → Components → UI
```

- **Adapter Pattern** for weather providers - `WeatherAdapter` interface allows swapping Open-Meteo with Mock adapter
- **Separation of Concerns:**
  - `weather/` handles API communication
  - `snowScience.ts` contains physics formulas
  - `shoveling.ts` implements recommendation logic

### CSS
- Design tokens via CSS variables at `:root`
- Glassmorphism style (blur + semi-transparent overlays)
- Mobile-first responsive design (max-width: 600px)
- No external CSS framework

### Error Handling
- Try-catch with graceful fallbacks
- User-friendly error messages displayed in UI
- localStorage operations wrapped in try-catch

## Testing

**Framework:** Vitest

**Test Files:**
- `src/services/shoveling.test.ts` - Recommendation algorithm tests
- `src/services/snowScience.test.ts` - Physics calculation tests

**Testing Pattern:**
```typescript
import { PRESET_SCENARIOS } from './scenarios';
import { MockWeatherAdapter } from './weather/mockWeather';
import { generateRecommendation } from './shoveling';

const scenario = PRESET_SCENARIOS.find(s => s.id === 'heavy-snow-ongoing');
const adapter = new MockWeatherAdapter(scenario!.params);
const weather = await adapter.fetchWeather(coords);
const rec = generateRecommendation(weather, 50);
expect(rec.shouldShovel).toBe(true);
```

**Run tests before committing changes to recommendation logic.**

## Dev Mode

Enable dev mode by adding `?dev=true` to the URL. This:
- Shows the DevSandbox component
- Allows testing 14 preset weather scenarios
- Provides manual weather parameter controls
- Persists in localStorage

## Key Constants (from snowScience.ts)

```typescript
// Snow thresholds (mm)
SNOW_THRESHOLDS: { negligible: 10, light: 25, moderate: 75, heavy: 150, veryHeavy: 200 }

// Melting
RAIN_SNOW_MELT_RATIO: 10      // 1mm rain melts ~10mm snow
SOLAR_MELT_RATES: { low: 0.5, moderate: 2, high: 5 }  // mm/hr

// Timing
OPTIMAL_SHOVEL_WINDOW_HOURS: 2  // Post-snowfall before compaction

// Salt effectiveness temperatures (Celsius)
SALT_EFFECTIVENESS: { effective: -5, reduced: -10, ineffective: -15 }
```

## Algorithm Logic (shoveling.ts)

The `generateRecommendation()` function:
1. Calculates past accumulation (last 12 hours or since last shoveled)
2. Forecasts future accumulation (next 24 hours)
3. Applies melting factors (rain, solar radiation)
4. Detects special conditions (slush, blocked driveway, snowplow pile)
5. Determines urgency level and optimal timing
6. Generates human-readable reasoning
7. Calculates salt/ice prevention advice

**Special Condition Flags:**
- `isSlushWarning` - Rain after snow detected
- `isBlockedDriveaway` - Overnight accumulation blocking car access
- `hasSnowplowPile` - User-reported plow pile (overrides light snow thresholds)

## Important Implementation Notes

1. **Shoveling validity is 12 hours** - After marking "done", recommendations reset after 12 hours
2. **Don't recommend shoveling during active snowfall** - Wait for a break in precipitation
3. **Rain melts snow** - 1mm rain = ~10mm snow melted (applied to accumulation calculations)
4. **Salt is ineffective below -15C** - Algorithm adjusts advice based on temperature

## Deployment

See `deployment_guide.md` for Google Cloud Run deployment instructions.

**Docker build:**
```bash
docker build -t snowwindow .
docker run -p 8080:8080 snowwindow
```

## Git Workflow

- Feature branches: `claude/[feature-name]-[ID]`
- Commit messages: `type: description` (feat:, fix:, refactor:, test:, docs:)
- PRs merged to main via GitHub

## Common Tasks

### Adding a New Weather Scenario
1. Edit `src/services/scenarios.ts`
2. Add new entry to `PRESET_SCENARIOS` array with unique `id`
3. Test in DevSandbox with `?dev=true`

### Modifying Recommendation Logic
1. Edit `src/services/shoveling.ts`
2. Update or add tests in `src/services/shoveling.test.ts`
3. Run `npm run test` to verify
4. Test edge cases via DevSandbox

### Adjusting Snow Science Constants
1. Edit `src/services/snowScience.ts`
2. Update tests in `src/services/snowScience.test.ts`
3. Consider impact on `generateRecommendation()` behavior

### Adding a New Component
1. Create in `src/components/`
2. Use functional component with TypeScript
3. Import types from `src/types/index.ts`
4. Follow existing CSS patterns (use design tokens)
