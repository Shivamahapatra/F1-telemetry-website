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
import threading
import datetime
import urllib.request

logging.basicConfig(level=logging.INFO)
connected_clients = set()
global_track_map = []

# Setup FastF1 Cache
if not os.path.exists("fastf1_cache"):
    os.makedirs("fastf1_cache")
fastf1.Cache.enable_cache("fastf1_cache")

def get_upcoming_race():
    """Fetches the upcoming race data from FastF1."""
    try:
        year = datetime.datetime.utcnow().year
        schedule = fastf1.get_event_schedule(year)
        now = pd.Timestamp(datetime.datetime.utcnow())
        upcoming = schedule[schedule['EventDate'] >= now]
        if not upcoming.empty:
            race_name = upcoming.iloc[0]['EventName']
            logging.info(f"Upcoming race found: {race_name}")
            return race_name
    except Exception as e:
        logging.error(f"Error fetching upcoming race data from FastF1: {e}")
    return "Canadian Grand Prix"

def generate_fallback_circle():
    """Generates a simple circle if the real track map fails to load, preventing 0-length bugs."""
    coords = []
    for i in range(100):
        angle = (i / 100.0) * math.pi * 2
        coords.append({"x": math.cos(angle) * 5000, "y": math.sin(angle) * 5000})
    return coords

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
    year = req.get("year", 2024)
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
    year = req.get("year", 2024)
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

CAR_TO_DRIVER = {
    "1": "VER", "11": "PER",
    "44": "HAM", "63": "RUS",
    "16": "LEC", "55": "SAI",
    "4": "NOR", "81": "PIA",
    "14": "ALO", "18": "STR",
    "10": "GAS", "31": "OCO",
    "23": "ALB", "2": "SAR",
    "22": "TSU", "3": "RIC",
    "77": "BOT", "24": "ZHO",
    "20": "MAG", "27": "HUL"
}

async def tail_file_and_broadcast(filename):
    """Asynchronously tails the file and broadcasts parsed JSON to clients."""
    driver_state = {}
    
    with open(filename, 'r') as f:
        # Read from the beginning to catch up, then tail
        while True:
            line = f.readline()
            if not line:
                await asyncio.sleep(0.1)
                continue
            
            try:
                data = json.loads(line)
                
                topic = data.get("M", [{}])[0].get("H")
                msg = data.get("M", [{}])[0].get("A", [{}])[0]

                if topic == "Streaming" and msg.get("TimingData"):
                    timing_data = msg["TimingData"]
                    lines = timing_data.get("Lines", {})
                    for car_num, car_data in lines.items():
                        drv = CAR_TO_DRIVER.get(car_num, f"CAR{car_num}")
                        if drv not in driver_state:
                            driver_state[drv] = {
                                "driver": drv, "position": 99, "lap": 0,
                                "bestLap": "", "lastLap": "",
                                "s1": "", "s2": "", "s3": "",
                                "gapToLeader": "", "interval": "",
                                "pitStatus": "", "tire": "SOFT"
                            }
                            
                        state = driver_state[drv]
                        
                        if "Position" in car_data:
                            try:
                                state["position"] = int(car_data["Position"])
                            except: pass
                        if "BestLapTime" in car_data and isinstance(car_data["BestLapTime"], dict):
                            state["bestLap"] = car_data["BestLapTime"].get("Value", state["bestLap"])
                        if "LastLapTime" in car_data and isinstance(car_data["LastLapTime"], dict):
                            state["lastLap"] = car_data["LastLapTime"].get("Value", state["lastLap"])
                        if "GapToLeader" in car_data:
                            state["gapToLeader"] = car_data["GapToLeader"]
                        if "IntervalToPositionAhead" in car_data and isinstance(car_data["IntervalToPositionAhead"], dict):
                            state["interval"] = car_data["IntervalToPositionAhead"].get("Value", state["interval"])
                        if "InPit" in car_data:
                            state["pitStatus"] = "IN PIT" if car_data["InPit"] else ""
                            
                        if "Sectors" in car_data:
                            sectors = car_data["Sectors"]
                            if "0" in sectors and isinstance(sectors["0"], dict): state["s1"] = sectors["0"].get("Value", state["s1"])
                            if "1" in sectors and isinstance(sectors["1"], dict): state["s2"] = sectors["1"].get("Value", state["s2"])
                            if "2" in sectors and isinstance(sectors["2"], dict): state["s3"] = sectors["2"].get("Value", state["s3"])

                        broadcast_data = {
                            "topic": "TimingData",
                            "data": state
                        }
                        websockets.broadcast(connected_clients, json.dumps(broadcast_data))
                
                elif topic == "Streaming" and msg.get("Position.z"):
                    positions = msg["Position.z"].get("Position", [])
                    for p in positions:
                        drv = CAR_TO_DRIVER.get(p.get("Entries", {}).get("0", ""), p.get("driver", "UNK"))
                        broadcast_data = {
                            "topic": "Position",
                            "data": { "driver": drv, "x": p.get("X"), "y": p.get("Y") }
                        }
                        websockets.broadcast(connected_clients, json.dumps(broadcast_data))
                        
                elif topic == "Streaming" and msg.get("SessionInfo"):
                    session = msg["SessionInfo"]
                    broadcast_data = {
                        "topic": "SessionInfo",
                        "data": {
                            "name": session.get("Path", "Formula 1 Session"),
                            "status": "Green",
                            "lap": 0,
                            "totalLaps": 0
                        }
                    }
                    websockets.broadcast(connected_clients, json.dumps(broadcast_data))
            except json.JSONDecodeError:
                pass
            except Exception as e:
                logging.error(f"Error parsing line: {e}")
def _run_fastf1_client_thread(filename):
    try:
        client = SignalRClient(filename, timeout=10)
        client.start()
    except Exception as e:
        logging.error(f"F1 Client thread error: {e}")

async def simulate_live_stream(race_name, track_map_coords):
    logging.info("Starting historical replay simulation stream...")
    
    # Load 2025 Monaco GP Data for Replay/Map since 2026 Race hasn't happened yet!
    try:
        logging.info("Fetching real 2025 Monaco GP data for replay...")
        year = datetime.datetime.utcnow().year - 1
        session = fastf1.get_session(year, "Monaco Grand Prix", "R")
        session.load(telemetry=False, weather=False, messages=False)
        results = session.results
        
        sim_state = {}
        for count, (idx, row) in enumerate(results.iterrows()):
            drv = row['Abbreviation']
            best_lap = row.get('BestLapTime', pd.NaT)
            race_time = row.get('Time', pd.NaT)
            
            sim_state[drv] = {
                "position": row['Position'],
                "lap_time": str(best_lap).split(' ')[-1][:9] if pd.notnull(best_lap) else "1:15.000",
                "gap": f"+{race_time.total_seconds():.3f}" if pd.notnull(race_time) and count > 0 else ("" if count == 0 else "+1L"),
                "interval": "0.000",
                "tire": "Medium",
                "pos_index": (count * 5) % len(track_map_coords) if track_map_coords else 0,
                "lap_count": 0
            }
        drivers = list(sim_state.keys())
    except Exception as e:
        logging.error(f"Error loading real 2025 data: {e}")
        drivers = ["VER", "PER", "HAM", "RUS", "LEC", "SAI", "NOR", "PIA", "ALO", "STR", "GAS", "OCO", "ALB", "SAR", "BOT", "ZHO", "MAG", "HUL", "TSU", "RIC"]
        sim_state = {drv: {"position": i+1, "lap_time": "1:15.000", "gap": "+0.000", "interval": "+0.000", "tire": "Soft", "pos_index": i*5, "lap_count": 0} for i, drv in enumerate(drivers)}

    while True:
        if connected_clients:
            session_info = {
                "topic": "SessionInfo",
                "data": {
                    "name": f"{race_name or 'Monaco Grand Prix'} - Live Replay (2025 Data)",
                    "status": "Green",
                    "lap": sim_state[drivers[0]]["lap_count"] + 1,
                    "totalLaps": 70
                }
            }
            websockets.broadcast(connected_clients, json.dumps(session_info))

            for drv in drivers:
                state = sim_state[drv]
                
                if track_map_coords:
                    state["pos_index"] = (state["pos_index"] + 1) % len(track_map_coords)
                    pos = track_map_coords[state["pos_index"]]
                    websockets.broadcast(connected_clients, json.dumps({
                        "topic": "Position",
                        "data": {
                            "driver": drv,
                            "x": pos["x"],
                            "y": pos["y"]
                        }
                    }))
                
                if state["pos_index"] == 0 or not track_map_coords:
                    state["lap_count"] += 1
                    
                timing_data = {
                    "topic": "TimingData",
                    "data": {
                        "driver": drv,
                        "position": state["position"],
                        "bestLap": state["lap_time"],
                        "lastLap": state["lap_time"],
                        "s1": "20.100",
                        "s2": "23.400",
                        "s3": "31.500",
                        "gapToLeader": state["gap"],
                        "interval": state["interval"],
                        "pitStatus": "",
                        "tire": state["tire"]
                    }
                }
                websockets.broadcast(connected_clients, json.dumps(timing_data))

        await asyncio.sleep(0.5)

async def fastf1_live_bridge():
    global global_track_map
    filename = 'live_timing_data.txt'
    if os.path.exists(filename):
        os.remove(filename)

    logging.info("Attempting to connect to real FastF1 SignalR Live Timing...")
    race_name = get_upcoming_race()
    
    if race_name:
        try:
            logging.info("Loading track map for Monaco Grand Prix (using 2025 data)...")
            year = datetime.datetime.utcnow().year - 1
            session = fastf1.get_session(year, "Monaco Grand Prix", "R")
            session.load(telemetry=True, weather=False, messages=False)
            lap = session.laps.pick_fastest()
            tel = lap.get_telemetry()
            for index, row in tel.iterrows():
                if index % 5 == 0:
                    global_track_map.append({"x": row['X'], "y": row['Y']})
            logging.info(f"Loaded {len(global_track_map)} track coordinates.")
        except Exception as e:
            logging.error(f"Error loading track map: {e}")
            global_track_map = generate_fallback_circle()
            logging.info("Using fallback circle map.")

    try:
        t = threading.Thread(target=_run_fastf1_client_thread, args=(filename,))
        t.daemon = True
        t.start()
        
        await asyncio.sleep(10)
        
        if not t.is_alive() or (os.path.exists(filename) and os.path.getsize(filename) == 0):
            logging.warning("FastF1 connected but receiving 0 bytes. Falling back to 2025 replay.")
            asyncio.create_task(simulate_live_stream(race_name, global_track_map))
    except Exception as e:
        logging.error(f"Failed to start live stream bridge: {e}")
        asyncio.create_task(simulate_live_stream(race_name, global_track_map))

async def main():
    asyncio.create_task(fastf1_live_bridge())
    async with websockets.serve(handler, "0.0.0.0", 8765):
        logging.info("WebSocket Server running on ws://0.0.0.0:8765")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
