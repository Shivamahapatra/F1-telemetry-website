import asyncio
import websockets
import json
import logging
import requests
import math
import datetime
import urllib.request

logging.basicConfig(level=logging.INFO)
connected_clients = set()
global_track_map = []

def generate_fallback_circle():
    coords = []
    for i in range(100):
        angle = (i / 100.0) * math.pi * 2
        coords.append({"x": math.cos(angle) * 5000, "y": math.sin(angle) * 5000})
    return coords

def get_latest_session():
    try:
        logging.info("Fetching latest session from OpenF1...")
        # Just grab the last available race
        url = "https://api.openf1.org/v1/sessions?session_name=Race"
        res = requests.get(url)
        if res.status_code == 200:
            sessions = res.json()
            if sessions:
                return sessions[-1]
    except Exception as e:
        logging.error(f"Error fetching OpenF1 session: {e}")
    return None

def fetch_drivers(session_key):
    try:
        url = f"https://api.openf1.org/v1/drivers?session_key={session_key}"
        res = requests.get(url)
        if res.status_code == 200:
            # OpenF1 returns multiple driver instances per session (for each stint/session), 
            # we need to deduplicate them
            driver_map = {}
            for d in res.json():
                num = str(d.get('driver_number'))
                acr = d.get('name_acronym')
                if acr and num and acr != "None":
                    driver_map[num] = acr
            return driver_map
    except Exception as e:
        logging.error(f"Error fetching drivers: {e}")
    return {}

def fetch_track_map(session_key, driver_number):
    try:
        logging.info(f"Loading track map from OpenF1 for session {session_key}...")
        # Get one lap of location data
        url = f"https://api.openf1.org/v1/location?session_key={session_key}&driver_number={driver_number}"
        res = requests.get(url)
        if res.status_code == 200:
            data = res.json()
            # The location array has points for the whole session. We just need ~1 lap's worth of points.
            # 250-300 points is roughly one lap.
            if len(data) > 300:
                data = data[:300]
            
            coords = []
            for i, row in enumerate(data):
                if i % 2 == 0:  # downsample slightly
                    coords.append({"x": row['x'], "y": row['y']})
            logging.info(f"Loaded {len(coords)} track coordinates from OpenF1.")
            return coords
    except Exception as e:
        logging.error(f"Error loading OpenF1 track map: {e}")
    return []

async def openf1_streamer():
    global global_track_map
    session = await asyncio.to_thread(get_latest_session)
    if not session:
        logging.error("No OpenF1 session found. Using fallback.")
        session = {"session_key": 9531, "country_name": "Fallback", "year": 2024}
        
    session_key = session['session_key']
    race_name = f"{session.get('country_name', 'F1')} GP"
    year = session.get('year', 2024)
    
    drivers_map = await asyncio.to_thread(fetch_drivers, session_key)
    if not drivers_map:
        drivers_map = {"1": "VER", "4": "NOR", "16": "LEC", "55": "SAI", "81": "PIA"}
        
    driver_numbers = list(drivers_map.keys())
    
    if driver_numbers:
        global_track_map = await asyncio.to_thread(fetch_track_map, session_key, driver_numbers[0])
    
    if not global_track_map:
        global_track_map = generate_fallback_circle()

    # Initial leaderboard state
    sim_state = {}
    for i, (num, acr) in enumerate(drivers_map.items()):
        sim_state[acr] = {
            "position": i + 1,
            "lap_time": "1:15.000",
            "gap": f"+{i*2}.000" if i > 0 else "+0.000",
            "interval": "+2.000" if i > 0 else "0.000",
            "tire": "Medium",
            "pos_index": (i * 5) % len(global_track_map) if global_track_map else 0,
            "lap_count": 0
        }

    drivers = list(sim_state.keys())

    while True:
        if connected_clients:
            session_info = {
                "topic": "SessionInfo",
                "data": {
                    "name": f"{race_name} - OpenF1 Replay ({year})",
                    "status": "Green",
                    "lap": sim_state[drivers[0]]["lap_count"] + 1,
                    "totalLaps": 70
                }
            }
            websockets.broadcast(connected_clients, json.dumps(session_info))

            for drv in drivers:
                state = sim_state[drv]
                
                if global_track_map:
                    state["pos_index"] = (state["pos_index"] + 1) % len(global_track_map)
                    pos = global_track_map[state["pos_index"]]
                    websockets.broadcast(connected_clients, json.dumps({
                        "topic": "Position",
                        "data": {
                            "driver": drv,
                            "x": pos["x"],
                            "y": pos["y"]
                        }
                    }))
                
                if state["pos_index"] == 0 or not global_track_map:
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

async def handler(websocket):
    connected_clients.add(websocket)
    logging.info("New frontend client connected!")
    try:
        async for message in websocket:
            pass # Ignore client requests for now since we are in OpenF1 replay mode
    finally:
        connected_clients.remove(websocket)

async def main():
    asyncio.create_task(openf1_streamer())
    async with websockets.serve(handler, "0.0.0.0", 8765):
        logging.info("WebSocket Server running on ws://0.0.0.0:8765")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
