import asyncio
import websockets
import json
import logging
import os
import math
import time
import pandas as pd
import fastf1
from fastf1.livetiming.client import SignalRClient

logging.basicConfig(level=logging.INFO)
connected_clients = set()

# Setup FastF1 Cache
if not os.path.exists("fastf1_cache"):
    os.makedirs("fastf1_cache")
fastf1.Cache.enable_cache("fastf1_cache")

def fetch_laptimes_sync(year, gp, session_type):
    session = fastf1.get_session(year, gp, session_type)
    session.load(telemetry=False, weather=False, messages=False)
    laps = session.laps
    results = []
    for index, row in laps.iterrows():
        if pd.notnull(row['LapTime']):
            results.append({
                "Driver": row['Driver'],
                "LapNumber": row['LapNumber'],
                "LapTime": row['LapTime'].total_seconds()
            })
    return results

async def handle_get_laptimes(websocket, req):
    year = req.get("year", 2023)
    gp = req.get("gp", "Monaco")
    sess = req.get("session", "R")
    try:
        results = await asyncio.to_thread(fetch_laptimes_sync, year, gp, sess)
        await websocket.send(json.dumps({"topic": "LaptimesData", "data": results}))
    except Exception as e:
        await websocket.send(json.dumps({"topic": "Error", "data": str(e)}))

def fetch_telemetry_sync(year, gp, session_type, driver):
    session = fastf1.get_session(year, gp, session_type)
    session.load(telemetry=True, weather=False, messages=False)
    laps = session.laps.pick_driver(driver)
    fastest = laps.pick_fastest()
    if pd.isnull(fastest['LapTime']):
        return []
    tel = fastest.get_telemetry()
    results = []
    for index, row in tel.iterrows():
        results.append({
            "Distance": row['Distance'],
            "Speed": row['Speed'],
            "Throttle": row['Throttle'],
            "Brake": bool(row['Brake']),
            "nGear": row['nGear']
        })
    return results

async def handle_get_telemetry(websocket, req):
    year = req.get("year", 2023)
    gp = req.get("gp", "Monaco")
    sess = req.get("session", "Q")
    driver = req.get("driver", "VER")
    try:
        results = await asyncio.to_thread(fetch_telemetry_sync, year, gp, sess, driver)
        await websocket.send(json.dumps({"topic": "TelemetryData", "data": results, "driver": driver}))
    except Exception as e:
        await websocket.send(json.dumps({"topic": "Error", "data": str(e)}))


async def handler(websocket):
    connected_clients.add(websocket)
    logging.info("New frontend client connected!")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                if data.get("action") == "get_laptimes":
                    asyncio.create_task(handle_get_laptimes(websocket, data))
                elif data.get("action") == "get_telemetry":
                    asyncio.create_task(handle_get_telemetry(websocket, data))
            except json.JSONDecodeError:
                pass
    finally:
        connected_clients.remove(websocket)

async def tail_file_and_broadcast(filename):
    """Asynchronously tails the file and broadcasts parsed JSON to clients."""
    with open(filename, 'r') as f:
        # Read from the beginning to catch up, then tail
        while True:
            line = f.readline()
            if not line:
                await asyncio.sleep(0.1)
                continue
            
            try:
                data = json.loads(line)
                
                # Simplified filter for demo (FastF1 saves raw SignalR messages)
                topic = data.get("M", [{}])[0].get("H")
                msg = data.get("M", [{}])[0].get("A", [{}])[0]

                if topic == "Streaming" and msg.get("TimingData"):
                    broadcast_data = {
                        "topic": "TimingData",
                        "data": msg["TimingData"]
                    }
                    websockets.broadcast(connected_clients, json.dumps(broadcast_data))
                
                elif topic == "Streaming" and msg.get("Position.z"):
                    positions = msg["Position.z"].get("Position", [])
                    for p in positions:
                        broadcast_data = {
                            "topic": "Position",
                            "data": { "driver": p.get("driver"), "x": p.get("X"), "y": p.get("Y") }
                        }
                        websockets.broadcast(connected_clients, json.dumps(broadcast_data))
            except json.JSONDecodeError:
                pass
            except Exception as e:
                logging.error(f"Error parsing line: {e}")

import threading

def _run_fastf1_client_thread(filename):
    try:
        # FastF1 client internally uses asyncio.run, which conflicts with our main loop
        # Running it in a separate thread fixes the "asyncio.run() cannot be called from a running event loop" error
        client = SignalRClient(filename, timeout=60)
        client.start()
    except Exception as e:
        logging.error(f"F1 Client thread error: {e}")

async def fastf1_live_bridge():
    """
    Connects to the real FastF1 SignalR client and tails the output file.
    """
    filename = 'live_timing_data.txt'
    if os.path.exists(filename):
        os.remove(filename)

    logging.info("Attempting to connect to real FastF1 SignalR Live Timing...")
    try:
        # Start the real connection to F1 servers in a background thread
        t = threading.Thread(target=_run_fastf1_client_thread, args=(filename,), daemon=True)
        t.start()
        
        # Wait a moment for the connection to establish and create the file
        await asyncio.sleep(5)
        
        if not t.is_alive():
            raise Exception("FastF1 client thread crashed on startup (F1 Live Timing is likely offline).")
            
        if os.path.exists(filename) and os.path.getsize(filename) == 0:
            raise Exception("FastF1 connected but receiving no data (F1 Live Timing is currently between sessions).")
        
        asyncio.create_task(tail_file_and_broadcast(filename))
        
        # Keep the connection alive
        while True:
            if not t.is_alive():
                raise Exception("FastF1 client thread died unexpectedly.")
            await asyncio.sleep(1)
            
    except Exception as e:
        logging.warning(f"FastF1 connection failed/skipped: {e}. Falling back to simulation loop.")
        await simulate_live_stream()

upcoming_race = None
track_layout = []

def fetch_upcoming_race():
    global upcoming_race, track_layout
    try:
        import urllib.request
        from datetime import datetime
        res = urllib.request.urlopen('https://api.jolpi.ca/ergast/f1/current.json')
        data = json.loads(res.read())
        races = data['MRData']['RaceTable']['Races']
        now_str = datetime.utcnow().isoformat() + "Z"
        
        for race in races:
            race_time_str = race['date'] + "T" + race.get('time', '00:00:00Z')
            if race_time_str > now_str:
                upcoming_race = race
                break
        if not upcoming_race:
            upcoming_race = races[-1]
            
        logging.info(f"Upcoming race found: {upcoming_race['raceName']}")
        
        # Load track layout using fastf1 (use 2023 for reliable offline cache)
        gp = upcoming_race['Circuit']['circuitName']
        if 'Albert Park' in gp: gp = 'Australia' # FastF1 name mapping
        elif 'Miami' in gp: gp = 'Miami'
        elif 'Circuit de Monaco' in gp: gp = 'Monaco'
        elif 'Circuit Gilles-Villeneuve' in gp: gp = 'Canada'
        elif 'Red Bull Ring' in gp: gp = 'Austria'
        elif 'Silverstone' in gp: gp = 'Great Britain'
        elif 'Hungaroring' in gp: gp = 'Hungary'
        elif 'Spa' in gp: gp = 'Belgium'
        elif 'Zandvoort' in gp: gp = 'Netherlands'
        elif 'Monza' in gp: gp = 'Italy'
        elif 'Baku' in gp: gp = 'Azerbaijan'
        elif 'Marina Bay' in gp: gp = 'Singapore'
        elif 'Suzuka' in gp: gp = 'Japan'
        elif 'Lusail' in gp: gp = 'Qatar'
        elif 'Austin' in gp: gp = 'United States'
        elif 'Hermanos Rodriguez' in gp: gp = 'Mexico'
        elif 'Interlagos' in gp: gp = 'Brazil'
        elif 'Las Vegas' in gp: gp = 'Las Vegas'
        elif 'Yas Marina' in gp: gp = 'Abu Dhabi'
        elif 'Jeddah' in gp: gp = 'Saudi Arabia'
        elif 'Bahrain' in gp: gp = 'Bahrain'
        
        try:
            logging.info(f"Loading track map for {gp}...")
            session = fastf1.get_session(2023, gp, 'Q')
            session.load(telemetry=True, weather=False, messages=False)
            lap = session.laps.pick_fastest()
            tel = lap.get_telemetry()
            # Downsample
            tel = tel.iloc[::max(1, len(tel)//150)]
            for index, row in tel.iterrows():
                track_layout.append({"x": float(row['X']), "y": float(row['Y'])})
            logging.info(f"Loaded {len(track_layout)} track coordinates.")
        except Exception as e:
            logging.error(f"Failed to load track map: {e}")
            track_layout = []
            
    except Exception as e:
        logging.error(f"Failed to fetch upcoming race: {e}")
        upcoming_race = {"season": "2026", "raceName": "Simulated Grand Prix", "date": "2026-12-31"}

async def simulate_live_stream():
    """Simulates the incoming WebSocket data structure and broadcasts it."""
    logging.info("Starting simulated local WebSocket stream...")
    
    if not upcoming_race:
        # Run synchronous fetch in a thread so it doesn't block startup
        await asyncio.to_thread(fetch_upcoming_race)
    
    # 20 drivers to test the dynamic leaderboard mapping
    drivers = [
        "VER", "PER", "HAM", "RUS", "LEC", "SAI", 
        "NOR", "PIA", "ALO", "STR", "GAS", "OCO", 
        "ALB", "SAR", "BOT", "ZHO", "MAG", "HUL", 
        "TSU", "RIC"
    ]
    
    start_time = time.time()
    
    while True:
        current_time = time.time() - start_time
        
        if connected_clients:
            # Session & Weather Data
            session_data = {
                "topic": "SessionInfo",
                "data": {
                    "name": upcoming_race['raceName'].upper() if upcoming_race else "FORMULA 1 GRAND PRIX",
                    "status": "Green",
                    "lap": int(current_time / 60) + 1,
                    "totalLaps": int(upcoming_race.get('Circuit', {}).get('totalLaps', 68)) if upcoming_race else 68
                }
            }
            websockets.broadcast(connected_clients, json.dumps(session_data))

            weather_data = {
                "topic": "WeatherData",
                "data": {
                    "airTemp": 22.5 + math.sin(current_time * 0.1),
                    "trackTemp": 34.2 + math.sin(current_time * 0.05) * 2,
                    "humidity": 45,
                    "windSpeed": 12,
                    "rainfall": False
                }
            }
            websockets.broadcast(connected_clients, json.dumps(weather_data))
            
            # Timing Data
            for i, drv in enumerate(drivers):
                is_pit = (i % 5 == 0 and int(current_time) % 120 < 15)
                tire_compound = "SOFT" if i % 3 == 0 else "MEDIUM" if i % 2 == 0 else "HARD"
                
                simulated_timing = {
                    "topic": "TimingData",
                    "data": {
                        "driver": drv,
                        "position": i + 1,
                        "lap": int(current_time / 60) + 1,
                        "s1": f"28.{532 + i*10 + int(math.sin(current_time)*10):03d}" if not is_pit else "",
                        "s2": f"30.{111 + i*5 + int(math.cos(current_time)*5):03d}" if not is_pit else "",
                        "s3": f"24.{992 + i*2 + int(math.sin(current_time*2)*2):03d}" if not is_pit else "",
                        "gapToLeader": f"+{i * 0.8 + (math.sin(current_time*0.1)*i*0.1):.3f}" if i > 0 else "",
                        "interval": f"+{0.8 + (math.sin(current_time*0.1)*0.1):.3f}" if i > 0 else "",
                        "pitStatus": "IN PIT" if is_pit else "",
                        "tire": tire_compound
                    }
                }
                websockets.broadcast(connected_clients, json.dumps(simulated_timing))
            
            # Telemetry Data
            for _ in range(2): 
                for i, drv in enumerate(drivers):
                    simulated_telemetry = {
                        "topic": "Telemetry",
                        "data": {
                            "driver": drv,
                            "time": current_time,
                            "speed": 300 - (i * 2) + (math.sin(current_time) * 10),
                            "rpm": 11000 + (math.sin(current_time) * 500),
                            "gear": 8
                        }
                    }
                    websockets.broadcast(connected_clients, json.dumps(simulated_telemetry))
                await asyncio.sleep(0.5)

            # Track Position (Plotly X/Y)
            for i, drv in enumerate(drivers):
                if track_layout:
                    # Move around the actual track coords
                    speed = 2.0  # indices per second
                    track_idx = int((current_time * speed) - (i * 5)) % len(track_layout)
                    x = track_layout[track_idx]['x']
                    y = track_layout[track_idx]['y']
                else:
                    # Fallback Figure 8 track shape
                    track_progress = (current_time * 0.5) - (i * 0.2)
                    x = 500 * math.sin(track_progress)
                    y = 200 * math.sin(track_progress * 2)
                
                simulated_position = {
                    "topic": "Position",
                    "data": { "driver": drv, "x": x, "y": y }
                }
                websockets.broadcast(connected_clients, json.dumps(simulated_position))
        else:
            await asyncio.sleep(2)

async def main():
    port = int(os.environ.get("PORT", 8765))
    server = await websockets.serve(handler, "0.0.0.0", port)
    logging.info(f"WebSocket Server running on ws://0.0.0.0:{port}")
    
    await fastf1_live_bridge()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Live streamer stopped.")
