import type { WeatherData } from '../types';

interface WeatherDisplayProps {
  weather: WeatherData;
}

export function WeatherDisplay({ weather }: WeatherDisplayProps) {
  const { current, hourly } = weather;

  // Get next 12 hours for mini forecast
  const next12Hours = hourly.slice(0, 12);

  const totalSnowNext12h = next12Hours.reduce((sum, h) => sum + h.snowfall, 0);

  return (
    <div className="weather-display">
      <div className="weather-header">
        <span className="weather-icon">{current.isDay ? '☀️' : '🌙'}</span>
        <h2>Current Weather</h2>
      </div>

      <div className="weather-current">
        <div className="temp-display">
          <span className="temp-value">{Math.round(current.temperature)}</span>
          <span className="temp-unit">°C</span>
        </div>

        <div className="weather-details">
          <div className="weather-detail">
            <span className="detail-icon">❄️</span>
            <span className="detail-label">Snow</span>
            <span className="detail-value">{current.snowfall.toFixed(1)} mm/h</span>
          </div>
          <div className="weather-detail">
            <span className="detail-icon">🌧️</span>
            <span className="detail-label">Rain</span>
            <span className="detail-value">{current.rain.toFixed(1)} mm/h</span>
          </div>
          <div className="weather-detail">
            <span className="detail-icon">☁️</span>
            <span className="detail-label">Clouds</span>
            <span className="detail-value">{current.cloudCover}%</span>
          </div>
        </div>
      </div>

      {totalSnowNext12h > 0 && (
        <div className="snow-forecast">
          <h3>❄️ Snow Forecast (12h)</h3>
          <div className="snow-total">
            <span className="snow-value">{totalSnowNext12h.toFixed(1)}</span>
            <span className="snow-unit">mm expected</span>
          </div>

          <div className="hourly-forecast">
            {next12Hours.map((hour, i) => (
              <div
                key={i}
                className={`hourly-bar ${hour.snowfall > 0 ? 'has-snow' : ''}`}
                title={`${hour.time.toLocaleTimeString('en-US', { hour: 'numeric' })}: ${hour.snowfall.toFixed(1)}mm`}
              >
                <div
                  className="bar-fill"
                  style={{ height: `${Math.min(100, hour.snowfall * 10)}%` }}
                />
                <span className="bar-label">
                  {hour.time.toLocaleTimeString('en-US', { hour: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
