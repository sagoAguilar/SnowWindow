#!/usr/bin/env python3
"""
Demo mode for SnowWindow - Shows application functionality without API key
"""

import sys
from datetime import datetime, timedelta
from snow_window import SnowEvent, SnowAnalyzer

def create_demo_config():
    """Create a demo configuration"""
    return {
        "preferences": {
            "min_snow_threshold": 2.0,
            "urgent_threshold": 6.0,
            "preferred_times": [
                {"start": "07:00", "end": "09:00", "label": "Morning"},
                {"start": "16:00", "end": "18:00", "label": "Evening"}
            ],
            "forecast_hours": 48,
            "comfortable_temp_min": 20,
            "comfortable_temp_max": 35
        }
    }

def demo_light_snow():
    """Demo with light snow that doesn't require shoveling"""
    print("=" * 70)
    print("  DEMO: Light Snow Event (No Shoveling Needed)")
    print("=" * 70)
    print()
    
    config = create_demo_config()
    analyzer = SnowAnalyzer(config)
    
    # Create a light snow event
    start = datetime.now() + timedelta(hours=2)
    end = datetime.now() + timedelta(hours=6)
    event = SnowEvent(start, end, 1.5, 30.0)
    
    print(f"❄️  Snow Event:")
    print(f"⏱  Start: {event.start_time.strftime('%I:%M %p on %a, %b %d')}")
    print(f"⏱  End:   {event.end_time.strftime('%I:%M %p on %a, %b %d')}")
    print(f"❄️  Accumulation: {event.accumulation:.2f} inches")
    print(f"🌡  Temperature: {event.temp:.1f}°F")
    print()
    
    should_shovel, reason = analyzer.should_shovel(event)
    if should_shovel:
        print(f"⚠️  {reason}")
    else:
        print(f"✅ No action needed: {reason}")
    print()

def demo_moderate_snow():
    """Demo with moderate snow requiring shoveling"""
    print("=" * 70)
    print("  DEMO: Moderate Snow Event (Shoveling Required)")
    print("=" * 70)
    print()
    
    config = create_demo_config()
    analyzer = SnowAnalyzer(config)
    
    # Create a moderate snow event
    start = datetime.now() + timedelta(hours=4)
    end = datetime.now() + timedelta(hours=12)
    event = SnowEvent(start, end, 4.5, 28.0)
    
    print(f"❄️  Snow Event:")
    print(f"⏱  Start: {event.start_time.strftime('%I:%M %p on %a, %b %d')}")
    print(f"⏱  End:   {event.end_time.strftime('%I:%M %p on %a, %b %d')}")
    print(f"❄️  Accumulation: {event.accumulation:.2f} inches")
    print(f"🌡  Temperature: {event.temp:.1f}°F")
    print()
    
    should_shovel, reason = analyzer.should_shovel(event)
    if should_shovel:
        print(f"⚠️  {reason}")
        print()
        
        recommendations = analyzer.find_optimal_shovel_time(event)
        print("📅 Recommended shoveling times:")
        for i, rec in enumerate(recommendations, 1):
            priority_icon = "🔴" if rec["priority"] == "high" else "🟡" if rec["priority"] == "medium" else "🟢"
            print(f"   {priority_icon} {rec['label']}: {rec['time'].strftime('%I:%M %p on %a, %b %d')}")
            print(f"      → {rec['reason']}")
    print()

def demo_heavy_snow():
    """Demo with heavy snow requiring urgent action"""
    print("=" * 70)
    print("  DEMO: Heavy Snow Event (URGENT)")
    print("=" * 70)
    print()
    
    config = create_demo_config()
    analyzer = SnowAnalyzer(config)
    
    # Create a heavy snow event
    start = datetime.now() + timedelta(hours=1)
    end = datetime.now() + timedelta(hours=18)
    event = SnowEvent(start, end, 8.5, 18.0)
    
    print(f"❄️  Snow Event:")
    print(f"⏱  Start: {event.start_time.strftime('%I:%M %p on %a, %b %d')}")
    print(f"⏱  End:   {event.end_time.strftime('%I:%M %p on %a, %b %d')}")
    print(f"❄️  Accumulation: {event.accumulation:.2f} inches")
    print(f"🌡  Temperature: {event.temp:.1f}°F")
    print()
    
    should_shovel, reason = analyzer.should_shovel(event)
    if should_shovel:
        print(f"🚨 {reason}")
        print()
        
        recommendations = analyzer.find_optimal_shovel_time(event)
        print("📅 Recommended shoveling times:")
        for i, rec in enumerate(recommendations, 1):
            priority_icon = "🔴" if rec["priority"] == "high" else "🟡" if rec["priority"] == "medium" else "🟢"
            print(f"   {priority_icon} {rec['label']}: {rec['time'].strftime('%I:%M %p on %a, %b %d')}")
            print(f"      → {rec['reason']}")
        print()
        print("💡 TIP: Consider shoveling in multiple sessions for this amount!")
    print()

def main():
    """Run all demos"""
    print()
    print("╔══════════════════════════════════════════════════════════════════════╗")
    print("║              SnowWindow - DEMO MODE                                  ║")
    print("║  Demonstrating snow analysis without requiring an API key           ║")
    print("╚══════════════════════════════════════════════════════════════════════╝")
    print()
    
    demo_light_snow()
    input("Press Enter to continue to next demo...")
    print()
    
    demo_moderate_snow()
    input("Press Enter to continue to next demo...")
    print()
    
    demo_heavy_snow()
    
    print("=" * 70)
    print("💡 To use SnowWindow with real weather data:")
    print("   1. Get a free API key from https://openweathermap.org/api")
    print("   2. Configure config.yaml with your location and API key")
    print("   3. Run: python snow_window.py")
    print("=" * 70)

if __name__ == "__main__":
    main()
