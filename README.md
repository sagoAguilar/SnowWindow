# SnowWindow ❄️

**Timing optimization for individuals when to shovel**

SnowWindow is an intelligent application that helps you decide when to shovel snow based on weather forecasts and your personal preferences. It analyzes upcoming snow events and recommends optimal times to shovel, considering:

- 📊 Snow accumulation amounts
- 🌡️ Temperature conditions
- ⏰ Your preferred time windows
- 📅 Forecast timing

## Features

- **Real-time Weather Forecasts**: Fetches current weather data from OpenWeatherMap
- **Snow Event Detection**: Automatically identifies upcoming snow events
- **Smart Recommendations**: Suggests optimal shoveling times based on your schedule
- **Customizable Thresholds**: Set your own snow accumulation thresholds
- **Temperature Awareness**: Considers comfortable temperature ranges for shoveling
- **Priority Levels**: Highlights urgent vs. routine shoveling needs

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sagoAguilar/SnowWindow.git
   cd SnowWindow
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure the application**:
   ```bash
   cp config.yaml.example config.yaml
   ```

4. **Get an API key**:
   - Sign up for a free API key at [OpenWeatherMap](https://openweathermap.org/api)
   - Edit `config.yaml` and add your API key

5. **Customize your preferences** in `config.yaml`:
   - Set your location (city/state or latitude/longitude)
   - Configure snow thresholds
   - Define your preferred shoveling time windows

## Quick Start

**Try the demo first** (no API key required):
```bash
python demo.py
```

This will show you how SnowWindow analyzes different snow scenarios.

## Usage

Run the application:

```bash
python snow_window.py
```

Or with a custom config file:

```bash
python snow_window.py --config /path/to/config.yaml
```

### Running Tests

Validate the installation:
```bash
python test_snow_window.py
```

### Example Output

```
======================================================================
  SnowWindow - Snow Shoveling Timing Optimizer
======================================================================

📍 Location: Minneapolis, MN
⏰ Current time: 07:30 AM on Saturday, January 11, 2026

Fetching weather forecast...
❄️  Found 1 snow event(s) in the forecast:

--- Snow Event #1 ---
⏱  Start: 02:00 PM on Sat, Jan 11
⏱  End:   11:00 PM on Sat, Jan 11
❄️  Accumulation: 4.50 inches
🌡  Temperature: 28.5°F

⚠️  4.5" expected (above 2.0" threshold)

📅 Recommended shoveling times:
   🔴 After snow stops: 11:00 PM on Sat, Jan 11
      → Snow ends at 11:00 PM on Sat, Jan 11 (comfortable temp: 28.5°F)
   🟡 Next day Morning: 07:00 AM on Sun, Jan 12
      → Your preferred Morning time

======================================================================
💡 Tips:
   • Shovel in multiple sessions for heavy accumulation
   • Clear snow before it gets compacted by foot traffic
   • Check forecast updates regularly for changes
======================================================================
```

## Configuration

The `config.yaml` file allows you to customize:

### Location
```yaml
location:
  city: "Minneapolis"
  state: "MN"
  country: "US"
```

Or use coordinates:
```yaml
location:
  latitude: 44.9778
  longitude: -93.2650
```

### Thresholds
```yaml
preferences:
  min_snow_threshold: 2.0      # Minimum inches to shovel
  urgent_threshold: 6.0        # Urgent shoveling needed
  comfortable_temp_min: 20     # Comfortable temp range
  comfortable_temp_max: 35
```

### Time Windows
```yaml
preferences:
  preferred_times:
    - start: "07:00"
      end: "09:00"
      label: "Morning"
    - start: "16:00"
      end: "18:00"
      label: "Evening"
```

## How It Works

1. **Weather Data Retrieval**: The app fetches 5-day forecast data from OpenWeatherMap API
2. **Snow Event Detection**: Parses forecast data to identify continuous snow periods
3. **Accumulation Analysis**: Calculates total snow accumulation for each event
4. **Decision Logic**: Compares accumulation against your configured thresholds
5. **Timing Optimization**: Recommends shoveling times based on:
   - When snow stops falling
   - Your preferred time windows
   - Temperature conditions
6. **Priority Assessment**: Flags urgent situations requiring immediate attention

## Requirements

- Python 3.7+
- Internet connection for API access
- OpenWeatherMap API key (free tier is sufficient)

## Dependencies

- `requests` - HTTP library for API calls
- `pyyaml` - YAML configuration parsing

## Project Structure

```
SnowWindow/
├── snow_window.py          # Main application
├── demo.py                 # Demo mode (no API key needed)
├── test_snow_window.py     # Test suite
├── config.yaml.example     # Example configuration
├── requirements.txt        # Python dependencies
├── README.md              # This file
├── QUICKSTART.md          # Quick start guide
└── .gitignore             # Git ignore rules
```

## Tips for Best Results

1. **Update regularly**: Run the app daily or before expected weather events
2. **Adjust thresholds**: Customize based on your physical capability and equipment
3. **Consider multiple sessions**: For heavy snow (6"+), plan multiple shorter sessions
4. **Check temperature**: Shoveling is easier between 20-35°F
5. **Time it right**: Shovel before snow gets compacted or freezes

## License

MIT License - Feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
