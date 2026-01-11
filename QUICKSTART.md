# Quick Start Guide

## Get SnowWindow Running in 5 Minutes

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Get Your Free API Key
1. Go to [https://openweathermap.org/api](https://openweathermap.org/api)
2. Click "Sign Up" and create a free account
3. After signing in, go to "API keys" section
4. Copy your API key (it may take a few minutes to activate)

### Step 3: Configure SnowWindow
```bash
cp config.yaml.example config.yaml
```

Edit `config.yaml` and update:
- `api_key`: Paste your OpenWeatherMap API key
- `location`: Set your city and state
- `preferences`: Adjust snow thresholds and time windows to your needs

### Step 4: Run SnowWindow
```bash
python snow_window.py
```

### Example Configuration

For someone in Minneapolis who prefers morning shoveling:
```yaml
location:
  city: "Minneapolis"
  state: "MN"
  country: "US"

api_key: "your_actual_api_key_here"

preferences:
  min_snow_threshold: 2.0
  urgent_threshold: 6.0
  preferred_times:
    - start: "07:00"
      end: "09:00"
      label: "Morning"
```

### Troubleshooting

**"Error: Configuration file 'config.yaml' not found"**
- Make sure you copied `config.yaml.example` to `config.yaml`

**"Error: Please set your OpenWeatherMap API key"**
- Replace `YOUR_API_KEY_HERE` with your actual API key in `config.yaml`

**"Error fetching weather data"**
- Check your internet connection
- Verify your API key is correct and activated
- Try again in a few minutes if the API key was just created

### Advanced Usage

**Use a custom config file:**
```bash
python snow_window.py --config /path/to/my-config.yaml
```

**Schedule regular checks with cron (Linux/Mac):**
```bash
# Run every morning at 6 AM
0 6 * * * cd /path/to/SnowWindow && python snow_window.py
```

**Schedule with Task Scheduler (Windows):**
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., daily at 6:00 AM)
4. Action: Start a program
5. Program: `python`
6. Arguments: `C:\path\to\SnowWindow\snow_window.py`

### Tips

- Run the app daily during winter months
- Check it before going to bed to plan for morning shoveling
- Adjust thresholds based on your driveway size and equipment
- Lower thresholds (e.g., 1.5") if you want to stay ahead of snow
- Higher thresholds (e.g., 3.0") if you prefer less frequent shoveling

### Need Help?

Open an issue on GitHub: [https://github.com/sagoAguilar/SnowWindow/issues](https://github.com/sagoAguilar/SnowWindow/issues)
