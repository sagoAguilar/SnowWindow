import { useCallback, useEffect, useState } from 'react';
import { DevSandbox } from './components/DevSandbox';
import { DynamicBackground } from './components/DynamicBackground';
import { LocationInput } from './components/LocationInput';
import { RecommendationCard } from './components/RecommendationCard';
import { SnowAnimation } from './components/SnowAnimation';
import { WeatherDisplay } from './components/WeatherDisplay';
import {
  getNotificationStatus,
  requestNotificationPermission,
  scheduleNotification
} from './services/notifications';
import { PRESET_SCENARIOS } from './services/scenarios';
import { generateRecommendation } from './services/shoveling';
import { weatherAdapter } from './services/weather';
import { MockWeatherAdapter, type MockWeatherParams } from './services/weather/mockWeather';
import type { Location, ShovelingRecommendation, UserSettings, WeatherData } from './types';

const DEFAULT_SETTINGS: UserSettings = {
  areaSquareMeters: 50,
  notificationsEnabled: false
};

function App() {
  const [location, setLocation] = useState<Location | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [recommendation, setRecommendation] = useState<ShovelingRecommendation | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev mode state (read-only, set via URL param ?dev=true)
  const devMode = (() => {
    // Check URL param or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const devParam = urlParams.get('dev');
    if (devParam === 'true') {
      localStorage.setItem('devMode', 'true');
      return true;
    }
    return localStorage.getItem('devMode') === 'true';
  })();
  const [devModeActive, setDevModeActive] = useState(false);
  const [mockAdapter] = useState(() => new MockWeatherAdapter(PRESET_SCENARIOS[0].params));
  const [mockParams, setMockParams] = useState<MockWeatherParams>(PRESET_SCENARIOS[0].params);

  // Fetch weather (real or mock)
  const fetchWeather = useCallback(async (loc: Location, useMock = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const adapter = useMock ? mockAdapter : weatherAdapter;
      const data = await adapter.fetchWeather(loc);
      setWeather(data);

      // Generate recommendation
      const rec = generateRecommendation(data, settings.areaSquareMeters);
      setRecommendation(rec);

      // Schedule notification if enabled
      if (settings.notificationsEnabled && rec.shouldShovel && rec.optimalTime) {
        const notifyTime = new Date(rec.optimalTime.getTime() - 30 * 60 * 1000); // 30 min before
        if (notifyTime > new Date()) {
          scheduleNotification(
            '🚿 Time to shovel soon!',
            notifyTime,
            { body: rec.message }
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
    } finally {
      setIsLoading(false);
    }
  }, [settings.areaSquareMeters, settings.notificationsEnabled, mockAdapter]);

  // Handle location set
  const handleLocationSet = (loc: Location) => {
    setLocation(loc);
    fetchWeather(loc, devModeActive);
  };

  // Handle dev mode toggle
  const handleDevModeToggle = () => {
    const newActive = !devModeActive;
    setDevModeActive(newActive);
    if (newActive && location) {
      // Refresh with mock data
      fetchWeather(location, true);
    } else if (location) {
      // Refresh with real data
      fetchWeather(location, false);
    }
  };

  // Handle mock params change
  const handleMockParamsChange = (params: MockWeatherParams) => {
    setMockParams(params);
    mockAdapter.setParams(params);
    if (devModeActive && location) {
      fetchWeather(location, true);
    }
  };

  // Refresh weather every 15 minutes (only in real mode)
  useEffect(() => {
    if (!location || devModeActive) return;

    const interval = setInterval(() => {
      fetchWeather(location, false);
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [location, fetchWeather, devModeActive]);

  // Toggle notifications
  const handleToggleNotifications = async () => {
    if (settings.notificationsEnabled) {
      setSettings(s => ({ ...s, notificationsEnabled: false }));
    } else {
      const status = getNotificationStatus();
      if (status === 'granted') {
        setSettings(s => ({ ...s, notificationsEnabled: true }));
      } else if (status === 'default') {
        const granted = await requestNotificationPermission();
        setSettings(s => ({ ...s, notificationsEnabled: granted }));
      }
    }
  };

  // Update area
  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setSettings(s => ({ ...s, areaSquareMeters: value }));
      // Recalculate if we have weather
      if (weather) {
        const rec = generateRecommendation(weather, value);
        setRecommendation(rec);
      }
    }
  };

  const notificationStatus = getNotificationStatus();

  return (
    <div className="app">
      {weather && (
        <DynamicBackground
          weatherCode={weather.current.weatherCode}
          isDay={weather.current.isDay}
        />
      )}
      <SnowAnimation />

      <header className="header">
        <h1>
          <span className="logo">❄️</span>
          SnowWindow
        </h1>
        <p className="tagline">Know when to shovel</p>
      </header>

      <main className="main">
        {/* Dev Sandbox - only show if dev mode enabled */}
        {devMode && (
          <DevSandbox
            onParamsChange={handleMockParamsChange}
            currentParams={mockParams}
            isActive={devModeActive}
            onToggle={handleDevModeToggle}
          />
        )}

        <LocationInput
          onLocationSet={handleLocationSet}
          currentLocation={location}
          isLoading={isLoading}
        />

        {error && (
          <div className="error-banner">
            <span>⚠️</span> {error}
            <button onClick={() => location && fetchWeather(location, devModeActive)}>Retry</button>
          </div>
        )}

        {isLoading && (
          <div className="loading">
            <div className="spinner large"></div>
            <p>Fetching weather data...</p>
          </div>
        )}

        {weather && recommendation && !isLoading && (
          <>
            <RecommendationCard recommendation={recommendation} />
            <WeatherDisplay weather={weather} />
          </>
        )}

        {location && (
          <div className="settings card">
            <h3>⚙️ Settings</h3>

            <div className="setting-row">
              <label htmlFor="area">Driveway/Walkway Area</label>
              <div className="input-group">
                <input
                  type="number"
                  id="area"
                  value={settings.areaSquareMeters}
                  onChange={handleAreaChange}
                  min="1"
                  max="500"
                />
                <span>m²</span>
              </div>
            </div>

            <div className="setting-row">
              <label>Notifications</label>
              {notificationStatus === 'unsupported' ? (
                <span className="text-muted">Not supported in this browser</span>
              ) : notificationStatus === 'denied' ? (
                <span className="text-muted">Blocked by browser</span>
              ) : (
                <button
                  className={`btn ${settings.notificationsEnabled ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={handleToggleNotifications}
                >
                  {settings.notificationsEnabled ? '🔔 Enabled' : '🔕 Enable'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>
          Weather data from <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>
        </p>
        <p className="text-muted">
          Last updated: {weather ? weather.fetchedAt.toLocaleTimeString() : 'Never'}
        </p>
      </footer>
    </div>
  );
}

export default App;
