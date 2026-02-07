import { useCallback, useEffect, useState } from 'react';
import { ClothingSuggestion } from './components/ClothingSuggestion';
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
import { generateClothingSuggestion } from './services/clothing';
import { generateRecommendation } from './services/shoveling';
import { weatherAdapter } from './services/weather';
import { MockWeatherAdapter, type MockWeatherParams } from './services/weather/mockWeather';
import type { ClothingSuggestion as ClothingSuggestionType, Location, ShovelingRecommendation, UserSettings, WeatherData } from './types';

const DEFAULT_SETTINGS: UserSettings = {
  areaSquareMeters: 50,
  notificationsEnabled: false,
  lastShoveledAt: undefined,
  snowplowPileHeight: undefined,
  carDepartureTime: undefined
};

// Local storage keys
const STORAGE_KEYS = {
  LOCATION: 'snowwindow_location',
  SETTINGS: 'snowwindow_settings'
};

// Load location from localStorage
function loadLocation(): Location | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LOCATION);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      name: parsed.name
    };
  } catch {
    return null;
  }
}

// Save location to localStorage
function saveLocation(location: Location | null): void {
  try {
    if (location) {
      localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(location));
    } else {
      localStorage.removeItem(STORAGE_KEYS.LOCATION);
    }
  } catch {
    // Ignore storage errors
  }
}

// Load settings from localStorage
function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored);
    return {
      areaSquareMeters: parsed.areaSquareMeters ?? DEFAULT_SETTINGS.areaSquareMeters,
      notificationsEnabled: parsed.notificationsEnabled ?? DEFAULT_SETTINGS.notificationsEnabled,
      lastShoveledAt: parsed.lastShoveledAt ? new Date(parsed.lastShoveledAt) : undefined,
      snowplowPileHeight: parsed.snowplowPileHeight,
      carDepartureTime: parsed.carDepartureTime
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Save settings to localStorage
function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

function App() {
  const [location, setLocation] = useState<Location | null>(() => loadLocation());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [recommendation, setRecommendation] = useState<ShovelingRecommendation | null>(null);
  const [clothingSuggestion, setClothingSuggestion] = useState<ClothingSuggestionType | null>(null);
  const [shovelingClothing, setShovelingClothing] = useState<ClothingSuggestionType | null>(null);
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
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
      // Carry the location name through to weather data
      if (loc.name) {
        data.location.name = loc.name;
      }
      setWeather(data);

      // Generate clothing suggestions (general + shoveling)
      setClothingSuggestion(generateClothingSuggestion(data));
      setShovelingClothing(generateClothingSuggestion(data, true));

      // Generate recommendation
      const rec = generateRecommendation(
        data,
        settings.areaSquareMeters,
        settings.lastShoveledAt,
        settings.snowplowPileHeight,
        settings.carDepartureTime
      );
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
  }, [settings.areaSquareMeters, settings.notificationsEnabled, settings.lastShoveledAt, settings.snowplowPileHeight, settings.carDepartureTime, mockAdapter]);

  // Handle location set
  const handleLocationSet = (loc: Location) => {
    setLocation(loc);
    saveLocation(loc);
    fetchWeather(loc, devModeActive);
  };

  // Load weather on startup if location exists
  useEffect(() => {
    if (location && !weather && !isLoading) {
      fetchWeather(location, devModeActive);
    }
  }, []); // Only run once on mount

  // Save settings when they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

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
        const rec = generateRecommendation(
          weather,
          value,
          settings.lastShoveledAt,
          settings.snowplowPileHeight,
          settings.carDepartureTime
        );
        setRecommendation(rec);
      }
    }
  };

  // Mark that shoveling is done
  const handleMarkShoveled = () => {
    setSettings(s => ({ ...s, lastShoveledAt: new Date() }));
  };

  // Check if should show reminder (shoveled more than 6 hours ago)
  const shouldShowShovelingReminder = () => {
    if (!settings.lastShoveledAt || !recommendation) return false;
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    return settings.lastShoveledAt < sixHoursAgo &&
           recommendation.shouldShovel &&
           recommendation.totalAccumulation >= 25; // At least "light" snow
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
            {shouldShowShovelingReminder() && (
              <div className="reminder-banner card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '2rem' }}>⏰</span>
                  <div style={{ flex: 1 }}>
                    <strong>Shoveling Reminder</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                      It's been more than 6 hours since you last shoveled and there's snow accumulation.
                      Consider checking if shoveling is needed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <RecommendationCard recommendation={recommendation} />

            {recommendation.shouldShovel && shovelingClothing && (
              <ClothingSuggestion suggestion={shovelingClothing} forShoveling />
            )}

            {clothingSuggestion && (
              <ClothingSuggestion suggestion={clothingSuggestion} />
            )}

            <div className="shovel-tracking card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    {settings.lastShoveledAt ? (
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Last shoveled: {settings.lastShoveledAt.toLocaleString()}
                      </p>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>
                        No shoveling recorded yet
                      </p>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleMarkShoveled}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    ✓ Mark Shoveled
                  </button>
                </div>
            </div>

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
              <label htmlFor="departure">Morning Car Departure</label>
              <div className="input-group">
                <input
                  type="time"
                  id="departure"
                  value={settings.carDepartureTime || ''}
                  onChange={(e) => {
                    const newSettings = { ...settings, carDepartureTime: e.target.value || undefined };
                    setSettings(newSettings);
                    if (weather) {
                      const rec = generateRecommendation(
                        weather,
                        settings.areaSquareMeters,
                        settings.lastShoveledAt,
                        settings.snowplowPileHeight,
                        e.target.value || undefined
                      );
                      setRecommendation(rec);
                    }
                  }}
                />
              </div>
            </div>

            <div className="setting-row">
              <label>Snowplow Pile</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {settings.snowplowPileHeight ? (
                  <>
                    <span style={{ fontSize: '0.9rem' }}>
                      {settings.snowplowPileHeight}mm pile reported
                    </span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        const newSettings = { ...settings, snowplowPileHeight: undefined };
                        setSettings(newSettings);
                        if (weather) {
                          const rec = generateRecommendation(
                            weather,
                            settings.areaSquareMeters,
                            settings.lastShoveledAt,
                            undefined,
                            settings.carDepartureTime
                          );
                          setRecommendation(rec);
                        }
                      }}
                    >
                      Clear
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const pileHeight = prompt('Enter snowplow pile height in mm:', '50');
                      if (pileHeight) {
                        const height = parseInt(pileHeight, 10);
                        if (!isNaN(height) && height > 0) {
                          const newSettings = { ...settings, snowplowPileHeight: height };
                          setSettings(newSettings);
                          if (weather) {
                            const rec = generateRecommendation(
                              weather,
                              settings.areaSquareMeters,
                              settings.lastShoveledAt,
                              height,
                              settings.carDepartureTime
                            );
                            setRecommendation(rec);
                          }
                        }
                      }
                    }}
                  >
                    🚜 Report Pile
                  </button>
                )}
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
