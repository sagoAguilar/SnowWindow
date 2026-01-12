import { useMemo } from 'react';

interface DynamicBackgroundProps {
  weatherCode: number;
  isDay: boolean;
}

export function DynamicBackground({ weatherCode, isDay }: DynamicBackgroundProps) {
  const gradient = useMemo(() => {
    // WMO Weather interpretation codes (WW)
    // 0: Clear sky
    // 1, 2, 3: Mainly clear, partly cloudy, and overcast
    // 45, 48: Fog
    // 51, 53, 55, 56, 57: Drizzle
    // 61, 63, 65, 66, 67: Rain
    // 71, 73, 75, 77: Snow
    // 80, 81, 82: Rain showers
    // 85, 86: Snow showers
    // 95, 96, 99: Thunderstorm

    // Default to clear day
    let bg = 'linear-gradient(to bottom, #4facfe 0%, #00f2fe 100%)';

    // Night time defaults
    if (!isDay) {
      bg = 'linear-gradient(to bottom, #09203f 0%, #537895 100%)';
    }

    // Weather specific overrides
    if (weatherCode === 0) {
      if (isDay) {
        // Clear Day: Bright Blue
        bg = 'linear-gradient(to bottom, #2980b9, #6dd5fa, #ffffff)';
      } else {
        // Clear Night: Deep Blue
        bg = 'linear-gradient(to bottom, #0f2027, #203a43, #2c5364)';
      }
    } else if ([1, 2, 3].includes(weatherCode)) {
      if (isDay) {
        // Cloudy Day: Greyish Blue
        bg = 'linear-gradient(to bottom, #bdc3c7, #2c3e50)';
      } else {
        // Cloudy Night: Dark Grey
        bg = 'linear-gradient(to bottom, #232526, #414345)';
      }
    } else if ([45, 48].includes(weatherCode)) {
      // Fog: Misty Grey
      bg = 'linear-gradient(to bottom, #3e5151, #decba4)';
    } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
      // Rain: Dark Blue/Grey
      bg = 'linear-gradient(to bottom, #3a6073, #16222a)';
    } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
      // Snow: Icy Blue White
      if (isDay) {
        bg = 'linear-gradient(to bottom, #83a4d4, #b6fbff)';
      } else {
        bg = 'linear-gradient(to bottom, #1c2833, #83a4d4)';
      }
    } else if ([95, 96, 99].includes(weatherCode)) {
      // Thunderstorm: Dark Purple/Black
      bg = 'linear-gradient(to bottom, #141e30, #243b55)';
    }

    return bg;
  }, [weatherCode, isDay]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        background: gradient,
        transition: 'background 1s ease-in-out',
      }}
    />
  );
}
