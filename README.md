# SnowWindow ❄️

A **Progressive Web App** that helps homeowners determine the **optimal time to shovel snow** by analyzing weather forecasts and applying snow science to provide actionable recommendations.

## The Problem

Homeowners want to know: _"Should I shovel now or wait 2 hours?"_

Existing solutions don't help:

- **Weather apps** show forecasts but don't give shoveling advice
- **Snow removal apps** are B2B (contractors) or marketplaces to hire someone
- **No consumer app** specifically tells you the optimal time to shovel

## The Solution

SnowWindow monitors your local weather and tells you exactly when to shovel:

> **"Shovel at 4:00 PM for easiest clearing"**  
> _Snow stops at 3 PM. Temperature drops below freezing at 6 PM (compaction risk)._

## Features

- 📍 **Location-based** - Uses your location for hyperlocal forecasts
- 🧠 **Smart Algorithm** - Factors in snowfall, rain (melts snow), sunshine, temperature
- ⏰ **Optimal Timing** - Tells you when to shovel, not just what the weather is
- 🧂 **Salt Advisor** - Recommends when to apply salt preventively
- 💪 **Effort Estimate** - Calculates approximate time needed based on area & depth
- 🔔 **Push Notifications** - Alerts you when it's time to act
- 📱 **Installable PWA** - Add to home screen, works offline

## How It Works

1. **Get Location** → Share your location or enter an address
2. **Fetch Forecast** → Pulls hourly snowfall, rain, temperature, sunshine data
3. **Apply Snow Science** → Calculates melting, compaction risk, accumulation
4. **Generate Recommendation** → Clear advice with reasoning
5. **Notify User** → Push notification when it's time to shovel

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Weather API**: Open-Meteo (free, no API key)
- **PWA**: vite-plugin-pwa for installability & offline support
- **Notifications**: Web Push API
