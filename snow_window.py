#!/usr/bin/env python3
"""
SnowWindow - Snow Shoveling Timing Optimizer

This application helps you decide when to shovel snow based on:
- Weather forecasts and snow accumulation
- Your personal preferences and schedule
- Optimal timing for productivity
"""

import argparse
import sys
import yaml
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import os


class WeatherService:
    """Handles weather data fetching from OpenWeatherMap API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.openweathermap.org/data/2.5"
    
    def get_forecast(self, city: str, state: str = None, country: str = "US") -> Optional[Dict]:
        """Fetch weather forecast for a location"""
        location = f"{city}"
        if state:
            location += f",{state}"
        if country:
            location += f",{country}"
        
        url = f"{self.base_url}/forecast"
        params = {
            "q": location,
            "appid": self.api_key,
            "units": "imperial"  # Fahrenheit and inches
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching weather data: {e}")
            return None
    
    def get_forecast_by_coords(self, lat: float, lon: float) -> Optional[Dict]:
        """Fetch weather forecast by coordinates"""
        url = f"{self.base_url}/forecast"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "units": "imperial"
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching weather data: {e}")
            return None


class SnowEvent:
    """Represents a snow event with timing and accumulation"""
    
    def __init__(self, start_time: datetime, end_time: datetime, accumulation: float, temp: float):
        self.start_time = start_time
        self.end_time = end_time
        self.accumulation = accumulation  # inches
        self.temp = temp  # Fahrenheit
    
    def __repr__(self):
        return (f"SnowEvent(start={self.start_time.strftime('%Y-%m-%d %H:%M')}, "
                f"end={self.end_time.strftime('%Y-%m-%d %H:%M')}, "
                f"accumulation={self.accumulation:.2f}\", temp={self.temp:.1f}°F)")


class SnowAnalyzer:
    """Analyzes weather data to identify snow events and shoveling needs"""
    
    def __init__(self, config: Dict):
        self.config = config
    
    def parse_forecast(self, forecast_data: Dict) -> List[SnowEvent]:
        """Parse forecast data to identify snow events"""
        if not forecast_data or "list" not in forecast_data:
            return []
        
        snow_events = []
        current_event = None
        
        for item in forecast_data["list"]:
            dt = datetime.fromtimestamp(item["dt"])
            temp = item["main"]["temp"]
            
            # Check for snow in this time period (3-hour intervals)
            snow_3h = 0
            if "snow" in item and "3h" in item["snow"]:
                snow_3h = item["snow"]["3h"] / 25.4  # Convert mm to inches
            
            if snow_3h > 0:
                if current_event is None:
                    # Start new snow event
                    current_event = {
                        "start": dt,
                        "end": dt + timedelta(hours=3),
                        "accumulation": snow_3h,
                        "temps": [temp]
                    }
                else:
                    # Continue existing event
                    current_event["end"] = dt + timedelta(hours=3)
                    current_event["accumulation"] += snow_3h
                    current_event["temps"].append(temp)
            else:
                # No snow in this period
                if current_event is not None:
                    # End current event
                    avg_temp = sum(current_event["temps"]) / len(current_event["temps"])
                    snow_events.append(SnowEvent(
                        current_event["start"],
                        current_event["end"],
                        current_event["accumulation"],
                        avg_temp
                    ))
                    current_event = None
        
        # Handle event that extends to end of forecast
        if current_event is not None:
            avg_temp = sum(current_event["temps"]) / len(current_event["temps"])
            snow_events.append(SnowEvent(
                current_event["start"],
                current_event["end"],
                current_event["accumulation"],
                avg_temp
            ))
        
        return snow_events
    
    def should_shovel(self, event: SnowEvent) -> Tuple[bool, str]:
        """Determine if a snow event requires shoveling"""
        min_threshold = self.config["preferences"]["min_snow_threshold"]
        urgent_threshold = self.config["preferences"]["urgent_threshold"]
        
        if event.accumulation < min_threshold:
            return False, f"Only {event.accumulation:.1f}\" expected (below {min_threshold}\" threshold)"
        elif event.accumulation >= urgent_threshold:
            return True, f"URGENT: {event.accumulation:.1f}\" expected (above {urgent_threshold}\" urgent threshold)"
        else:
            return True, f"{event.accumulation:.1f}\" expected (above {min_threshold}\" threshold)"
    
    def find_optimal_shovel_time(self, event: SnowEvent) -> List[Dict]:
        """Find optimal times to shovel for a snow event"""
        recommendations = []
        
        comfortable_min = self.config["preferences"]["comfortable_temp_min"]
        comfortable_max = self.config["preferences"]["comfortable_temp_max"]
        
        # Recommend shoveling after snow stops
        after_stop = {
            "time": event.end_time,
            "label": "After snow stops",
            "reason": f"Snow ends at {event.end_time.strftime('%I:%M %p on %a, %b %d')}",
            "priority": "high"
        }
        
        # Check if temperature is comfortable
        if comfortable_min <= event.temp <= comfortable_max:
            after_stop["reason"] += f" (comfortable temp: {event.temp:.1f}°F)"
        elif event.temp < comfortable_min:
            after_stop["reason"] += f" (cold: {event.temp:.1f}°F - dress warmly)"
        else:
            after_stop["reason"] += f" (warm: {event.temp:.1f}°F - snow may be heavy)"
        
        recommendations.append(after_stop)
        
        # Check if there are preferred time windows after the snow
        preferred_times = self.config["preferences"].get("preferred_times", [])
        for time_window in preferred_times:
            window_start = self._parse_time_on_date(event.end_time.date(), time_window["start"])
            window_end = self._parse_time_on_date(event.end_time.date(), time_window["end"])
            
            # If snow ends before this window, suggest it
            if event.end_time <= window_start:
                recommendations.append({
                    "time": window_start,
                    "label": f"Your {time_window['label']} window",
                    "reason": f"Falls within your preferred {time_window['label']} time",
                    "priority": "medium"
                })
            # If window is the next day
            elif event.end_time.date() < window_start.date():
                recommendations.append({
                    "time": window_start,
                    "label": f"Next day {time_window['label']}",
                    "reason": f"Your preferred {time_window['label']} time",
                    "priority": "low"
                })
        
        # Sort by time
        recommendations.sort(key=lambda x: x["time"])
        return recommendations[:3]  # Return top 3 recommendations
    
    def _parse_time_on_date(self, date, time_str: str) -> datetime:
        """Parse time string (HH:MM) and combine with date"""
        hour, minute = map(int, time_str.split(":"))
        return datetime.combine(date, datetime.min.time().replace(hour=hour, minute=minute))


class SnowWindowApp:
    """Main application class"""
    
    def __init__(self, config_path: str = "config.yaml"):
        self.config = self._load_config(config_path)
        self.weather_service = WeatherService(self.config["api_key"])
        self.analyzer = SnowAnalyzer(self.config)
    
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from YAML file"""
        if not os.path.exists(config_path):
            print(f"Error: Configuration file '{config_path}' not found.")
            print("Please copy config.yaml.example to config.yaml and configure it.")
            sys.exit(1)
        
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        # Validate required fields
        if not config.get("api_key") or config["api_key"] == "YOUR_API_KEY_HERE":
            print("Error: Please set your OpenWeatherMap API key in config.yaml")
            print("Get a free API key at: https://openweathermap.org/api")
            sys.exit(1)
        
        return config
    
    def run(self):
        """Main application logic"""
        print("=" * 70)
        print("  SnowWindow - Snow Shoveling Timing Optimizer")
        print("=" * 70)
        print()
        
        # Fetch weather data
        location = self.config["location"]
        print(f"📍 Location: {location.get('city', 'N/A')}, {location.get('state', '')}")
        print(f"⏰ Current time: {datetime.now().strftime('%I:%M %p on %A, %B %d, %Y')}")
        print()
        print("Fetching weather forecast...")
        
        forecast_data = None
        if "latitude" in location and "longitude" in location:
            forecast_data = self.weather_service.get_forecast_by_coords(
                location["latitude"], location["longitude"]
            )
        else:
            forecast_data = self.weather_service.get_forecast(
                location.get("city", ""),
                location.get("state"),
                location.get("country", "US")
            )
        
        if not forecast_data:
            print("❌ Failed to fetch weather data. Please check your configuration.")
            return
        
        # Analyze forecast for snow events
        snow_events = self.analyzer.parse_forecast(forecast_data)
        
        if not snow_events:
            print("✅ Good news! No significant snow events in the forecast.")
            print(f"   (Checked next {self.config['preferences']['forecast_hours']} hours)")
            return
        
        print(f"❄️  Found {len(snow_events)} snow event(s) in the forecast:")
        print()
        
        # Analyze each event
        for i, event in enumerate(snow_events, 1):
            print(f"--- Snow Event #{i} ---")
            print(f"⏱  Start: {event.start_time.strftime('%I:%M %p on %a, %b %d')}")
            print(f"⏱  End:   {event.end_time.strftime('%I:%M %p on %a, %b %d')}")
            print(f"❄️  Accumulation: {event.accumulation:.2f} inches")
            print(f"🌡  Temperature: {event.temp:.1f}°F")
            print()
            
            # Check if shoveling is needed
            should_shovel, reason = self.analyzer.should_shovel(event)
            
            if should_shovel:
                if "URGENT" in reason:
                    print(f"🚨 {reason}")
                else:
                    print(f"⚠️  {reason}")
                print()
                
                # Get timing recommendations
                recommendations = self.analyzer.find_optimal_shovel_time(event)
                print("📅 Recommended shoveling times:")
                for j, rec in enumerate(recommendations, 1):
                    priority_icon = "🔴" if rec["priority"] == "high" else "🟡" if rec["priority"] == "medium" else "🟢"
                    print(f"   {priority_icon} {rec['label']}: {rec['time'].strftime('%I:%M %p on %a, %b %d')}")
                    print(f"      → {rec['reason']}")
            else:
                print(f"✅ No action needed: {reason}")
            
            print()
        
        print("=" * 70)
        print("💡 Tips:")
        print("   • Shovel in multiple sessions for heavy accumulation")
        print("   • Clear snow before it gets compacted by foot traffic")
        print("   • Check forecast updates regularly for changes")
        print("=" * 70)


def main():
    """Entry point for the application"""
    parser = argparse.ArgumentParser(
        description="SnowWindow - Determine when to shovel snow based on weather and preferences"
    )
    parser.add_argument(
        "-c", "--config",
        default="config.yaml",
        help="Path to configuration file (default: config.yaml)"
    )
    
    args = parser.parse_args()
    
    try:
        app = SnowWindowApp(config_path=args.config)
        app.run()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
