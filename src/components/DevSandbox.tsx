import { useState } from 'react';
import { PRESET_SCENARIOS } from '../services/scenarios';
import type { MockWeatherParams } from '../services/weather/mockWeather';

interface DevSandboxProps {
  onParamsChange: (params: MockWeatherParams) => void;
  currentParams: MockWeatherParams;
  isActive: boolean;
  onToggle: () => void;
}

export function DevSandbox({ onParamsChange, currentParams, isActive, onToggle }: DevSandboxProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleScenarioSelect = (scenarioId: string) => {
    const scenario = PRESET_SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      onParamsChange(scenario.params);
    }
  };

  const handleParamChange = (key: keyof MockWeatherParams, value: number | string | boolean) => {
    onParamsChange({
      ...currentParams,
      [key]: value,
    });
  };

  return (
    <div className="dev-sandbox">
      <div className="dev-sandbox-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="dev-icon">🧪</span>
        <h3>Dev Sandbox</h3>
        <div className="dev-sandbox-controls">
          <button
            className={`btn-toggle ${isActive ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isActive ? '✅ Active' : '⚪ Inactive'}
          </button>
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="dev-sandbox-content">
          {/* Preset Scenarios */}
          <section className="dev-section">
            <h4>📋 Preset Scenarios</h4>
            <div className="scenario-grid">
              {PRESET_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  className="scenario-btn"
                  onClick={() => handleScenarioSelect(scenario.id)}
                  title={scenario.description}
                >
                  {scenario.name}
                </button>
              ))}
            </div>
          </section>

          {/* Manual Controls */}
          <section className="dev-section">
            <h4>🎛️ Manual Controls</h4>

            <div className="control-group">
              <label>
                Temperature: <strong>{currentParams.temperature}°C</strong>
              </label>
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={currentParams.temperature}
                onChange={(e) => handleParamChange('temperature', parseInt(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label>
                Snowfall Rate: <strong>{currentParams.snowfallRate} mm/hr</strong>
              </label>
              <input
                type="range"
                min="0"
                max="25"
                step="0.5"
                value={currentParams.snowfallRate}
                onChange={(e) => handleParamChange('snowfallRate', parseFloat(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label>
                Rain Rate: <strong>{currentParams.rainRate} mm/hr</strong>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={currentParams.rainRate}
                onChange={(e) => handleParamChange('rainRate', parseFloat(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label>
                Cloud Cover: <strong>{currentParams.cloudCover}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={currentParams.cloudCover}
                onChange={(e) => handleParamChange('cloudCover', parseInt(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label>
                Wind Speed: <strong>{currentParams.windSpeed} km/h</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={currentParams.windSpeed}
                onChange={(e) => handleParamChange('windSpeed', parseInt(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label>
                Duration: <strong>{currentParams.durationHours} hours</strong>
              </label>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={currentParams.durationHours}
                onChange={(e) => handleParamChange('durationHours', parseInt(e.target.value))}
              />
            </div>

            <div className="control-row">
              <label>Temperature Trend:</label>
              <select
                value={currentParams.tempTrend}
                onChange={(e) => handleParamChange('tempTrend', e.target.value)}
              >
                <option value="stable">Stable</option>
                <option value="rising">Rising</option>
                <option value="falling">Falling</option>
              </select>
            </div>

            <div className="control-row">
              <label>Weather Code:</label>
              <select
                value={currentParams.weatherCode}
                onChange={(e) => handleParamChange('weatherCode', parseInt(e.target.value))}
              >
                <option value="0">0 - Clear</option>
                <option value="1">1 - Mainly Clear</option>
                <option value="2">2 - Partly Cloudy</option>
                <option value="3">3 - Overcast</option>
                <option value="45">45 - Fog</option>
                <option value="48">48 - Depositing Fog</option>
                <option value="51">51 - Light Drizzle</option>
                <option value="61">61 - Light Rain</option>
                <option value="63">63 - Moderate Rain</option>
                <option value="65">65 - Heavy Rain</option>
                <option value="71">71 - Light Snow</option>
                <option value="73">73 - Moderate Snow</option>
                <option value="75">75 - Heavy Snow</option>
                <option value="95">95 - Thunderstorm</option>
              </select>
            </div>

            <div className="control-row">
              <label>Time of Day:</label>
              <button
                className={`btn-toggle ${currentParams.isDay ? 'day' : 'night'}`}
                onClick={() => handleParamChange('isDay', !currentParams.isDay)}
              >
                {currentParams.isDay ? '☀️ Day' : '🌙 Night'}
              </button>
            </div>
          </section>

          <div className="dev-warning">
            ⚠️ Dev mode active - using synthetic weather data
          </div>
        </div>
      )}
    </div>
  );
}
