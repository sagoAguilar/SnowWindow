#!/usr/bin/env python3
"""
Simple tests for SnowWindow core functionality
Run with: python test_snow_window.py
"""

import sys
from datetime import datetime, timedelta
from snow_window import SnowEvent, SnowAnalyzer


def test_snow_event_creation():
    """Test SnowEvent object creation"""
    start = datetime(2026, 1, 15, 10, 0)
    end = datetime(2026, 1, 15, 18, 0)
    event = SnowEvent(start, end, 3.5, 25.0)
    
    assert event.accumulation == 3.5, "Accumulation should be 3.5 inches"
    assert event.temp == 25.0, "Temperature should be 25.0°F"
    assert event.start_time == start, "Start time mismatch"
    assert event.end_time == end, "End time mismatch"
    print("✓ Snow event creation test passed")


def test_should_shovel_below_threshold():
    """Test shoveling decision for snow below threshold"""
    config = {
        "preferences": {
            "min_snow_threshold": 2.0,
            "urgent_threshold": 6.0
        }
    }
    analyzer = SnowAnalyzer(config)
    
    event = SnowEvent(
        datetime.now(),
        datetime.now() + timedelta(hours=4),
        1.5,
        30.0
    )
    
    should_shovel, reason = analyzer.should_shovel(event)
    assert not should_shovel, "Should not shovel for 1.5 inches"
    assert "below" in reason.lower(), "Reason should mention below threshold"
    print("✓ Below threshold test passed")


def test_should_shovel_above_threshold():
    """Test shoveling decision for snow above threshold"""
    config = {
        "preferences": {
            "min_snow_threshold": 2.0,
            "urgent_threshold": 6.0
        }
    }
    analyzer = SnowAnalyzer(config)
    
    event = SnowEvent(
        datetime.now(),
        datetime.now() + timedelta(hours=4),
        3.5,
        28.0
    )
    
    should_shovel, reason = analyzer.should_shovel(event)
    assert should_shovel, "Should shovel for 3.5 inches"
    assert "3.5" in reason, "Reason should mention accumulation"
    print("✓ Above threshold test passed")


def test_should_shovel_urgent():
    """Test shoveling decision for urgent snow"""
    config = {
        "preferences": {
            "min_snow_threshold": 2.0,
            "urgent_threshold": 6.0
        }
    }
    analyzer = SnowAnalyzer(config)
    
    event = SnowEvent(
        datetime.now(),
        datetime.now() + timedelta(hours=8),
        7.5,
        22.0
    )
    
    should_shovel, reason = analyzer.should_shovel(event)
    assert should_shovel, "Should shovel for 7.5 inches"
    assert "URGENT" in reason, "Reason should indicate urgency"
    print("✓ Urgent threshold test passed")


def test_optimal_shovel_time():
    """Test optimal shoveling time recommendations"""
    config = {
        "preferences": {
            "min_snow_threshold": 2.0,
            "urgent_threshold": 6.0,
            "comfortable_temp_min": 20,
            "comfortable_temp_max": 35,
            "preferred_times": [
                {"start": "07:00", "end": "09:00", "label": "Morning"},
                {"start": "16:00", "end": "18:00", "label": "Evening"}
            ]
        }
    }
    analyzer = SnowAnalyzer(config)
    
    # Create event that ends at 2 PM
    today = datetime.now().replace(hour=14, minute=0, second=0, microsecond=0)
    event = SnowEvent(
        today - timedelta(hours=4),
        today,
        4.0,
        28.0
    )
    
    recommendations = analyzer.find_optimal_shovel_time(event)
    assert len(recommendations) > 0, "Should have at least one recommendation"
    assert recommendations[0]["time"] >= event.end_time, "First recommendation should be after snow ends"
    print("✓ Optimal shovel time test passed")


def test_temperature_warnings():
    """Test temperature-based warnings in recommendations"""
    config = {
        "preferences": {
            "min_snow_threshold": 2.0,
            "urgent_threshold": 6.0,
            "comfortable_temp_min": 20,
            "comfortable_temp_max": 35,
            "preferred_times": []
        }
    }
    analyzer = SnowAnalyzer(config)
    
    # Cold temperature event
    cold_event = SnowEvent(
        datetime.now(),
        datetime.now() + timedelta(hours=4),
        3.0,
        15.0  # Very cold
    )
    
    cold_recs = analyzer.find_optimal_shovel_time(cold_event)
    cold_reason = cold_recs[0]["reason"]
    assert "cold" in cold_reason.lower(), "Should warn about cold temperature"
    
    # Warm temperature event
    warm_event = SnowEvent(
        datetime.now(),
        datetime.now() + timedelta(hours=4),
        3.0,
        40.0  # Warm for snow
    )
    
    warm_recs = analyzer.find_optimal_shovel_time(warm_event)
    warm_reason = warm_recs[0]["reason"]
    assert "warm" in warm_reason.lower(), "Should warn about warm temperature"
    
    print("✓ Temperature warnings test passed")


def run_all_tests():
    """Run all tests"""
    print("=" * 70)
    print("  Running SnowWindow Tests")
    print("=" * 70)
    print()
    
    tests = [
        test_snow_event_creation,
        test_should_shovel_below_threshold,
        test_should_shovel_above_threshold,
        test_should_shovel_urgent,
        test_optimal_shovel_time,
        test_temperature_warnings
    ]
    
    failed = 0
    for test in tests:
        try:
            test()
        except AssertionError as e:
            print(f"✗ {test.__name__} failed: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ {test.__name__} error: {e}")
            failed += 1
    
    print()
    print("=" * 70)
    if failed == 0:
        print(f"  All {len(tests)} tests passed! ✓")
    else:
        print(f"  {failed} test(s) failed out of {len(tests)}")
    print("=" * 70)
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
