import pandas as pd
import numpy as np
import json

def generate_lap_telemetry(driver_name, lap_time_seconds, num_points=500):
    time = np.linspace(0, lap_time_seconds, num_points)
    
    # Simulate realistic-looking data with some sine waves and noise
    # Speed: 80 to 330 km/h
    speed = 200 + 100 * np.sin(time / lap_time_seconds * 4 * np.pi) + np.random.normal(0, 5, num_points)
    speed = np.clip(speed, 80, 350)
    
    # RPM: 6000 to 12000
    rpm = 9000 + 3000 * np.sin(time / lap_time_seconds * 8 * np.pi) + np.random.normal(0, 200, num_points)
    rpm = np.clip(rpm, 5000, 12500)
    
    # Gear: 1 to 8 based on speed
    gear = np.floor(speed / 45) + 1
    gear = np.clip(gear, 1, 8)
    
    # Throttle: 0 to 100%
    throttle = np.where(np.gradient(speed) > 0, 100, 0)
    # Smooth throttle a bit
    throttle = pd.Series(throttle).rolling(window=10, min_periods=1).mean().to_numpy()
    throttle = throttle + np.random.normal(0, 5, num_points)
    throttle = np.clip(throttle, 0, 100)
    
    # Brake: inverse of throttle roughly
    brake = np.where(throttle < 20, 100 - throttle*5, 0)
    brake = np.clip(brake, 0, 100)
    
    df = pd.DataFrame({
        'Driver': driver_name,
        'Time': np.round(time, 3),
        'Speed': np.round(speed, 1),
        'RPM': np.round(rpm, 0),
        'Gear': gear.astype(int),
        'Throttle': np.round(throttle, 1),
        'Brake': np.round(brake, 1)
    })
    
    return df

# Generate for two drivers
df_ver = generate_lap_telemetry('VER', 85.0)
df_ham = generate_lap_telemetry('HAM', 85.5)

combined_df = pd.concat([df_ver, df_ham])

# Save to CSV for backend processing if needed
combined_df.to_csv('telemetry_sample.csv', index=False)

# Also save to JSON for easy frontend consumption directly during mock testing
data = {
    'VER': df_ver.to_dict(orient='records'),
    'HAM': df_ham.to_dict(orient='records')
}
with open('telemetry_sample.json', 'w') as f:
    json.dump(data, f)

print("Telemetry data generated: telemetry_sample.csv and telemetry_sample.json")
