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
import http


def format_lap_time(val):
    if pd.isnull(val):
        return "-"
    
    # If it's a pd.Timedelta (or similar timedelta object)
    if isinstance(val, pd.Timedelta) or hasattr(val, 'total_seconds'):
        total_seconds = val.total_seconds()
    elif isinstance(val, str):
        val = val.strip()
        if not val or val in ["-", "NaT", "IN PIT"]:
            return val
        # Try parsing standard timedelta representation or "hh:mm:ss.xxx"
        try:
            td = pd.to_timedelta(val)
            total_seconds = td.total_seconds()
        except Exception:
            try:
                parts = val.split(':')
                if len(parts) == 3:  # hh:mm:ss.xxx
                    h, m, s = parts
                    total_seconds = int(h) * 3600 + int(m) * 60 + float(s)
                elif len(parts) == 2:  # mm:ss.xxx
                    m, s = parts
                    total_seconds = int(m) * 60 + float(s)
                else:
                    return val
            except Exception:
                return val
    elif isinstance(val, (int, float)):
        total_seconds = float(val)
    else:
        return "-"
        
    minutes = int(total_seconds // 60)
    seconds = total_seconds % 60
    return f"{minutes}:{seconds:06.3f}"

logging.basicConfig(level=logging.INFO)
logging.getLogger('websockets').setLevel(logging.DEBUG)

connected_clients = set()
global_track_map = []

# Global State for Offline vs Live Timing
global_state = {
    "is_live": False
}
global_offline_data = {
    "TrackMap": [],
    "WeatherData": {},
    "SessionInfo": {},
    "TimingData": {},
    "RaceControlData": {}
}

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
    
    # If offline, send all cached static data immediately
    if not global_state.get("is_live", False) and global_offline_data.get("TimingData"):
        try:
            if global_offline_data.get("TrackMap"):
                await websocket.send(json.dumps({"topic": "TrackMap", "data": global_offline_data["TrackMap"]}))
            if global_offline_data.get("WeatherData"):
                await websocket.send(json.dumps({"topic": "WeatherData", "data": global_offline_data["WeatherData"]}))
            if global_offline_data.get("SessionInfo"):
                await websocket.send(json.dumps({"topic": "SessionInfo", "data": global_offline_data["SessionInfo"]}))
            if global_offline_data.get("RaceControlData"):
                await websocket.send(json.dumps({"topic": "RaceControlData", "data": global_offline_data["RaceControlData"]}))
            for drv, data in global_offline_data["TimingData"].items():
                await websocket.send(json.dumps({"topic": "TimingData", "data": data}))
            logging.info("Sent static offline data to newly connected client.")
        except Exception as e:
            logging.error(f"Error sending static offline data to client: {e}")
    else:
        # Fallback to sending track map
        if global_track_map:
            try:
                await websocket.send(json.dumps({
                    "topic": "TrackMap",
                    "data": global_track_map
                }))
                logging.info("Sent TrackMap to newly connected client.")
            except Exception as e:
                logging.error(f"Error sending TrackMap to new client: {e}")
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

async def tail_file_and_broadcast(filename, replay_mode=False):
    """Asynchronously tails or replays the file and broadcasts parsed JSON to clients."""
    driver_state = {}
    
    with open(filename, 'r') as f:
        # Read from the beginning to catch up, then tail
        while True:
            line = f.readline()
            if not line:
                if replay_mode:
                    f.seek(0)
                    driver_state.clear()
                    await asyncio.sleep(2)
                    continue
                else:
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
                            val = car_data["BestLapTime"].get("Value")
                            if val:
                                state["bestLap"] = format_lap_time(val)
                        if "LastLapTime" in car_data and isinstance(car_data["LastLapTime"], dict):
                            val = car_data["LastLapTime"].get("Value")
                            if val:
                                state["lastLap"] = format_lap_time(val)
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
                
                # Add a small delay in replay mode to avoid broadcasting thousands of messages per second
                if replay_mode:
                    await asyncio.sleep(0.01)

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
    global global_offline_data
    global global_track_map
    logging.info("Starting historical replay simulation stream using Practice 2 data...")
    
    # Try loading 2026, then 2025 Monaco Practice 2
    session = None
    for year in [2026, 2025]:
        try:
            logging.info(f"Fetching real {year} Monaco GP Practice 2 data for replay...")
            session = fastf1.get_session(year, "Monaco Grand Prix", "Practice 2")
            # Load with messages=True to retrieve steward warnings, flags, and investigations
            session.load(telemetry=True, weather=True, messages=True)
            break
        except Exception as e:
            logging.error(f"Error loading {year} Practice 2: {e}")
            
    if not session:
        logging.error("Failed to load any Monaco GP Practice 2 data!")
        return
        
    laps = session.laps
    
    # Sort drivers by their fastest lap time in the session
    driver_fastest = []
    for drv in session.drivers:
        drv_laps = laps.pick_drivers(drv)
        if not drv_laps.empty:
            fastest_lap = drv_laps.pick_fastest()
            lt = fastest_lap['LapTime']
            abbr = session.get_driver(drv)['Abbreviation']
            driver_fastest.append({
                'Driver': abbr,
                'LapTime': lt if pd.notnull(lt) else pd.NaT,
                'drv_code': drv
            })
            
    driver_fastest.sort(key=lambda x: x['LapTime'] if pd.notnull(x['LapTime']) else pd.Timedelta(days=99))
    
    # Session best sectors
    session_best_s1 = laps['Sector1Time'].min().total_seconds() if not laps['Sector1Time'].empty else 19.0
    session_best_s2 = laps['Sector2Time'].min().total_seconds() if not laps['Sector2Time'].empty else 34.0
    session_best_s3 = laps['Sector3Time'].min().total_seconds() if not laps['Sector3Time'].empty else 19.0
    
    # Extract real race control messages from fastf1
    raw_rc_messages = []
    try:
        if not session.race_control_messages.empty:
            # Sort messages chronologically by timestamp
            sorted_rc = session.race_control_messages.sort_values(by='Time')
            for idx, row in sorted_rc.iterrows():
                msg_text = str(row['Message'])
                flag_type = str(row['Flag']).upper() if pd.notnull(row['Flag']) else 'NONE'
                
                msg_type = 'incident'
                if 'DOUBLE YELLOW' in msg_text or flag_type in ['DOUBLE_YELLOW', 'DOUBLE YELLOW']:
                    msg_type = 'double_yellow'
                elif 'YELLOW' in msg_text or flag_type == 'YELLOW':
                    msg_type = 'yellow'
                elif 'CLEAR' in msg_text or flag_type in ['CLEAR', 'GREEN']:
                    msg_type = 'green'
                    
                time_val = str(row['Time']).split(' ')[-1][:8] if pd.notnull(row['Time']) else "15:00:00"
                sector_val = str(row['Sector']) if pd.notnull(row['Scope']) and row['Scope'] == 'Sector' and pd.notnull(row['Sector']) else ""
                
                raw_rc_messages.append({
                    "time": time_val,
                    "type": msg_type,
                    "text": msg_text,
                    "sector": sector_val
                })
    except Exception as e:
        logging.error(f"Error parsing race control messages: {e}")
        
    if not raw_rc_messages:
        # Fallback to realistic Monaco 2026 FP2 warnings
        raw_rc_messages = [
            {"time": "15:01:06", "type": "incident", "text": "CAR 23 (ALB) TIME DELETED - TRACK LIMITS AT TURN 10"},
            {"time": "15:01:33", "type": "incident", "text": "CAR 41 (LIN) TIME DELETED - TRACK LIMITS AT TURN 10"},
            {"time": "15:09:06", "type": "double_yellow", "text": "DOUBLE YELLOW IN TRACK SECTOR 14", "sector": "14"},
            {"time": "15:09:15", "type": "yellow", "text": "YELLOW IN TRACK SECTOR 6", "sector": "6"},
            {"time": "15:09:19", "type": "green", "text": "CLEAR IN TRACK SECTOR 6", "sector": "6"},
            {"time": "15:10:13", "type": "double_yellow", "text": "DOUBLE YELLOW IN TRACK SECTOR 4", "sector": "4"},
            {"time": "15:12:31", "type": "green", "text": "CLEAR IN TRACK SECTOR 14", "sector": "14"},
            {"time": "15:14:40", "type": "yellow", "text": "YELLOW IN TRACK SECTOR 5", "sector": "5"}
        ]
        
    # Setup team radio transmissions
    radio_messages = [
        {"time": "15:02:10", "driver": "HAM", "text": "HAM: The medium tyres are holding up well. Balance feels okay.", "channel": "Team Radio HAM"},
        {"time": "15:05:45", "driver": "LEC", "text": "LEC: Heavy traffic in Sector 2, impossible to get a clean run.", "channel": "Team Radio LEC"},
        {"time": "15:10:12", "driver": "VER", "text": "VER: Still struggling with understeer at the Grand Hotel hairpin.", "channel": "Team Radio VER"},
        {"time": "15:12:30", "driver": "RUS", "text": "RUS: Copy. Car is bottoming out on the main straight.", "channel": "Team Radio RUS"},
        {"time": "15:14:15", "driver": "NOR", "text": "NOR: Softs are starting to grain on the rear left. Graining is high.", "channel": "Team Radio NOR"},
        {"time": "15:20:05", "driver": "PIA", "text": "PIA: Boxing now, let's make a minor front wing flap adjustment.", "channel": "Team Radio PIA"},
        {"time": "15:25:40", "driver": "ALO", "text": "ALO: Engine feels strong, but track is very green and dirty.", "channel": "Team Radio ALO"},
        {"time": "15:32:15", "driver": "GAS", "text": "GAS: Copy. Let's stay out for 3 more laps on this set.", "channel": "Team Radio GAS"},
        {"time": "15:36:20", "driver": "BEA", "text": "BEA: Box box, tyres are completely done. Overheating.", "channel": "Team Radio BEA"}
    ]
    
    # We want a base telemetry mapping for fallbacks in case some drivers don't have telemetry
    master_telemetry = []
    try:
        master_drv = driver_fastest[0]['drv_code']
        master_fastest = laps.pick_drivers(master_drv).pick_fastest()
        master_tel = master_fastest.get_telemetry()
        # Downsample to ~150 points
        step = max(1, len(master_tel) // 150)
        for idx, row in master_tel.iloc[::step].iterrows():
            drs_val = int(row['DRS'])
            master_telemetry.append({
                "speed": int(row['Speed']),
                "gear": int(row['nGear']),
                "throttle": int(row['Throttle']),
                "brake": bool(row['Brake']),
                "drs": bool(drs_val >= 8 or drs_val % 2 == 1),
                "x": float(row['X']),
                "y": float(row['Y'])
            })
    except Exception as e:
        logging.error(f"Error creating master telemetry template: {e}")

    # Generate simulated master telemetry loop using track map if telemetry is missing
    if len(master_telemetry) <= 1:
        logging.info("Generating simulated telemetry loop from fallback track map...")
        if not global_track_map or len(global_track_map) <= 1:
            global_track_map = generate_fallback_circle()
        
        master_telemetry = []
        for i, pt in enumerate(global_track_map):
            master_telemetry.append({
                "speed": 180 + int(math.sin(i / 10.0) * 80),
                "gear": 4 + int(math.sin(i / 10.0) * 2),
                "throttle": 80 if math.sin(i / 10.0) > 0 else 0,
                "brake": math.sin(i / 10.0) <= 0,
                "drs": i % 20 < 5,
                "x": pt["x"],
                "y": pt["y"]
            })
        
    # Build states for all active drivers in the session
    sim_state = {}
    for pos_0, item in enumerate(driver_fastest):
        drv = item['Driver']
        drv_code = item['drv_code']
        best_lap_val = item['LapTime']
        
        drv_laps = laps.pick_drivers(drv_code)
        
        # Best sectors
        best_s1 = drv_laps['Sector1Time'].min().total_seconds() if not drv_laps['Sector1Time'].empty else 20.0
        best_s2 = drv_laps['Sector2Time'].min().total_seconds() if not drv_laps['Sector2Time'].empty else 35.0
        best_s3 = drv_laps['Sector3Time'].min().total_seconds() if not drv_laps['Sector3Time'].empty else 20.0
        
        # Sector times of their fastest lap for rendering
        fastest_lap = drv_laps.pick_fastest()
        lap_s1 = fastest_lap['Sector1Time'].total_seconds() if pd.notnull(fastest_lap['Sector1Time']) else best_s1
        lap_s2 = fastest_lap['Sector2Time'].total_seconds() if pd.notnull(fastest_lap['Sector2Time']) else best_s2
        lap_s3 = fastest_lap['Sector3Time'].total_seconds() if pd.notnull(fastest_lap['Sector3Time']) else best_s3
        
        # Stints
        stints_list = []
        for stint_num, stint_laps in drv_laps.groupby('Stint'):
            comp = stint_laps['Compound'].iloc[0]
            start_lap = int(stint_laps['LapNumber'].min())
            end_lap = int(stint_laps['LapNumber'].max())
            life = int(stint_laps['TyreLife'].iloc[-1])
            stints_list.append({
                "number": int(stint_num),
                "compound": str(comp).upper(),
                "startLap": start_lap,
                "endLap": end_lap,
                "life": life
            })
            
        if not stints_list:
            stints_list = [{"number": 1, "compound": "MEDIUM", "startLap": 1, "endLap": 30, "life": 30}]
            
        # Telemetry
        telemetry_list = []
        try:
            tel = fastest_lap.get_telemetry()
            if not tel.empty:
                step = max(1, len(tel) // 150)
                for idx, row in tel.iloc[::step].iterrows():
                    drs_val = int(row['DRS'])
                    telemetry_list.append({
                        "speed": int(row['Speed']),
                        "gear": int(row['nGear']),
                        "throttle": int(row['Throttle']),
                        "brake": bool(row['Brake']),
                        "drs": bool(drs_val >= 8 or drs_val % 2 == 1),
                        "x": float(row['X']),
                        "y": float(row['Y'])
                    })
        except:
            pass
            
        if not telemetry_list:
            # Fallback to master template (with slight shift so they don't overlay exactly)
            telemetry_list = []
            for p in master_telemetry:
                telemetry_list.append({
                    "speed": p["speed"],
                    "gear": p["gear"],
                    "throttle": p["throttle"],
                    "brake": p["brake"],
                    "drs": p["drs"],
                    "x": p["x"] + (pos_0 * 5),
                    "y": p["y"] + (pos_0 * 5)
                })
                
        # Gap & Interval times
        if pos_0 == 0:
            gap = "-"
            interval = "-"
        else:
            prev_item = driver_fastest[pos_0 - 1]
            if pd.notnull(best_lap_val) and pd.notnull(driver_fastest[0]['LapTime']):
                gap = f"+{(best_lap_val - driver_fastest[0]['LapTime']).total_seconds():.3f}"
            else:
                gap = "+1.500"
                
            if pd.notnull(best_lap_val) and pd.notnull(prev_item['LapTime']):
                interval = f"+{(best_lap_val - prev_item['LapTime']).total_seconds():.3f}"
            else:
                interval = "+0.100"
                
        sim_state[drv] = {
            "driver": drv,
            "position": pos_0 + 1,
            "bestLap": format_lap_time(best_lap_val) if pd.notnull(best_lap_val) else "1:13.500",
            "lastLap": "-",
            "gap": gap,
            "interval": interval,
            "bestS1": f"{best_s1:.3f}",
            "bestS2": f"{best_s2:.3f}",
            "bestS3": f"{best_s3:.3f}",
            "lap_s1": lap_s1,
            "lap_s2": lap_s2,
            "lap_s3": lap_s3,
            "stints": stints_list,
            "telemetry": telemetry_list,
            "pos_index": (pos_0 * 8) % len(telemetry_list),
            "lap_count": 1
        }
        
    drivers = list(sim_state.keys())
    
    # Broadcast Weather Data once
    weather_df = session.weather_data
    w_data = {
        "airTemp": 22.5,
        "trackTemp": 28.8,
        "humidity": 64.6,
        "windSpeed": 0.5,
        "rainfall": False
    }
    if not weather_df.empty:
        latest_weather = weather_df.iloc[-1]
        w_data = {
            "airTemp": float(latest_weather['AirTemp']),
            "trackTemp": float(latest_weather['TrackTemp']),
            "humidity": float(latest_weather['Humidity']),
            "windSpeed": float(latest_weather['WindSpeed']),
            "rainfall": bool(latest_weather['Rainfall'])
        }
        
    # Also set global track coordinates from master template coordinates
    if len(master_telemetry) > 1:
        global_track_map = [{"x": p["x"], "y": p["y"]} for p in master_telemetry]
    elif not global_track_map or len(global_track_map) <= 1:
        global_track_map = generate_fallback_circle()
    
    # Construct complete global_offline_data dictionary
    global_offline_data["TrackMap"] = global_track_map
    global_offline_data["WeatherData"] = w_data
    global_offline_data["SessionInfo"] = {
        "name": f"Monaco Grand Prix - Practice 2 ({session.date.year}) [OFFLINE]",
        "status": "Final",
        "lap": 40,
        "totalLaps": 40
    }
    global_offline_data["RaceControlData"] = {
        "raceControl": list(reversed(raw_rc_messages)),
        "teamRadio": list(reversed(radio_messages))
    }
    
    global_offline_data["TimingData"] = {}
    for pos_0, item in enumerate(driver_fastest):
        drv = item['Driver']
        drv_code = item['drv_code']
        best_lap_val = item['LapTime']
        
        drv_laps = laps.pick_drivers(drv_code)
        
        # Best sectors
        best_s1 = drv_laps['Sector1Time'].min().total_seconds() if not drv_laps['Sector1Time'].empty else 20.0
        best_s2 = drv_laps['Sector2Time'].min().total_seconds() if not drv_laps['Sector2Time'].empty else 35.0
        best_s3 = drv_laps['Sector3Time'].min().total_seconds() if not drv_laps['Sector3Time'].empty else 20.0
        
        # Sector times of their fastest lap for rendering
        fastest_lap = drv_laps.pick_fastest()
        lap_s1 = fastest_lap['Sector1Time'].total_seconds() if pd.notnull(fastest_lap['Sector1Time']) else best_s1
        lap_s2 = fastest_lap['Sector2Time'].total_seconds() if pd.notnull(fastest_lap['Sector2Time']) else best_s2
        lap_s3 = fastest_lap['Sector3Time'].total_seconds() if pd.notnull(fastest_lap['Sector3Time']) else best_s3
        
        # Stints
        stints_list = []
        for stint_num, stint_laps in drv_laps.groupby('Stint'):
            comp = stint_laps['Compound'].iloc[0]
            start_lap = int(stint_laps['LapNumber'].min())
            end_lap = int(stint_laps['LapNumber'].max())
            life = int(stint_laps['TyreLife'].iloc[-1])
            stints_list.append({
                "number": int(stint_num),
                "compound": str(comp).upper(),
                "startLap": start_lap,
                "endLap": end_lap,
                "life": life
            })
            
        if not stints_list:
            stints_list = [{"number": 1, "compound": "MEDIUM", "startLap": 1, "endLap": 30, "life": 30}]
            
        last_comp = stints_list[-1]["compound"]
        last_life = stints_list[-1]["life"]
        
        # Get actual last lap time of their session
        last_lap_val = None
        if not drv_laps.empty:
            valid_laps = drv_laps[pd.notnull(drv_laps['LapTime'])]
            if not valid_laps.empty:
                last_lap_val = valid_laps['LapTime'].iloc[-1]
        last_lap_str = format_lap_time(last_lap_val) if last_lap_val is not None else format_lap_time(best_lap_val)
        
        # Gap & Interval times
        if pos_0 == 0:
            gap = "-"
            interval = "-"
        else:
            prev_item = driver_fastest[pos_0 - 1]
            if pd.notnull(best_lap_val) and pd.notnull(driver_fastest[0]['LapTime']):
                gap = f"+{(best_lap_val - driver_fastest[0]['LapTime']).total_seconds():.3f}"
            else:
                gap = "+1.500"
                
            if pd.notnull(best_lap_val) and pd.notnull(prev_item['LapTime']):
                interval = f"+{(best_lap_val - prev_item['LapTime']).total_seconds():.3f}"
            else:
                interval = "+0.100"
                
        # Colors relative to session bests
        s1_st = "purple" if lap_s1 <= session_best_s1 else "green"
        s2_st = "purple" if lap_s2 <= session_best_s2 else "green"
        s3_st = "purple" if lap_s3 <= session_best_s3 else "green"
        
        global_offline_data["TimingData"][drv] = {
            "driver": drv,
            "position": pos_0 + 1,
            "bestLap": format_lap_time(best_lap_val) if pd.notnull(best_lap_val) else "1:13.500",
            "lastLap": last_lap_str,
            "gapToLeader": gap,
            "interval": interval,
            "pitStatus": "IN PIT",
            "tire": last_comp,
            "tireAge": last_life,
            "stints": stints_list,
            "bestS1": f"{best_s1:.3f}",
            "bestS2": f"{best_s2:.3f}",
            "bestS3": f"{best_s3:.3f}",
            "s1": f"{lap_s1:.3f}" if pd.notnull(lap_s1) else "-",
            "s2": f"{lap_s2:.3f}" if pd.notnull(lap_s2) else "-",
            "s3": f"{lap_s3:.3f}" if pd.notnull(lap_s3) else "-",
            "s1State": s1_st,
            "s2State": s2_st,
            "s3State": s3_st,
            "speed": 0,
            "gear": "N",
            "throttle": 0,
            "brake": False,
            "drs": False
        }

    # Broadcast static data once to all currently connected clients
    if connected_clients:
        try:
            websockets.broadcast(connected_clients, json.dumps({"topic": "TrackMap", "data": global_offline_data["TrackMap"]}))
            websockets.broadcast(connected_clients, json.dumps({"topic": "WeatherData", "data": global_offline_data["WeatherData"]}))
            websockets.broadcast(connected_clients, json.dumps({"topic": "SessionInfo", "data": global_offline_data["SessionInfo"]}))
            websockets.broadcast(connected_clients, json.dumps({"topic": "RaceControlData", "data": global_offline_data["RaceControlData"]}))
            for drv, data in global_offline_data["TimingData"].items():
                websockets.broadcast(connected_clients, json.dumps({"topic": "TimingData", "data": data}))
            logging.info("Offline static session data broadcasted to active clients.")
        except Exception as e:
            logging.error(f"Error broadcasting static offline data: {e}")
            
    # Sleep indefinitely in a low-resource loop; new clients are served by the handler
    while True:
        await asyncio.sleep(3600)

async def fastf1_live_bridge():
    global global_track_map
    filename = 'live_timing_data.txt'

    logging.info("Attempting to connect to real FastF1 SignalR Live Timing...")
    race_name = get_upcoming_race()
    
    try:
        logging.info("Loading track map for Monaco Grand Prix Practice 2...")
        session = None
        for year in [2026, 2025]:
            try:
                session = fastf1.get_session(year, "Monaco Grand Prix", "Practice 2")
                session.load(telemetry=True, weather=False, messages=False)
                break
            except:
                pass
        if session:
            lap = session.laps.pick_fastest()
            tel = lap.get_telemetry()
            global_track_map = []
            for index, row in tel.iterrows():
                if index % 5 == 0:
                    global_track_map.append({"x": row['X'], "y": row['Y']})
            logging.info(f"Loaded {len(global_track_map)} track coordinates.")
    except Exception as e:
        logging.error(f"Error loading track map: {e}")
        global_track_map = generate_fallback_circle()

    try:
        t = threading.Thread(target=_run_fastf1_client_thread, args=(filename,))
        t.daemon = True
        t.start()
        
        await asyncio.sleep(10)
        
        if t.is_alive() and os.path.exists(filename) and os.path.getsize(filename) > 0:
            logging.info("Live feed active! Streaming real-time data...")
            global_state["is_live"] = True
            tail_task = asyncio.create_task(tail_file_and_broadcast(filename, replay_mode=False))
            while t.is_alive():
                await asyncio.sleep(1)
            logging.warning("Live feed went offline! Switching to replay mode.")
            tail_task.cancel()
            
        if os.path.exists(filename) and os.path.getsize(filename) > 0:
            logging.info("Replaying the live timing data recorded before going offline...")
            global_state["is_live"] = True
            asyncio.create_task(tail_file_and_broadcast(filename, replay_mode=True))
        else:
            logging.warning("FastF1 connected but receiving 0 bytes. Falling back to Practice 2 simulation.")
            global_state["is_live"] = False
            asyncio.create_task(simulate_live_stream(race_name, global_track_map))
    except Exception as e:
        logging.error(f"Failed to start live stream bridge: {e}")
        global_state["is_live"] = False
        asyncio.create_task(simulate_live_stream(race_name, global_track_map))

async def health_check(path, request_headers):
    print(f"[HEALTH_CHECK] Incoming request: path={path}", flush=True)
    print(f"[HEALTH_CHECK] Headers: {dict(request_headers)}", flush=True)
    
    upgrade = request_headers.get("Upgrade", "")
    connection = request_headers.get("Connection", "")
    key = request_headers.get("Sec-WebSocket-Key", "")
    version = request_headers.get("Sec-WebSocket-Version", "")
    
    # If a WebSocket key is present, force standard headers to bypass proxy stripping
    if key:
        print("[HEALTH_CHECK] WebSocket handshake detected, normalizing Upgrade and Connection headers...", flush=True)
        if "Connection" in request_headers:
            del request_headers["Connection"]
        if "Upgrade" in request_headers:
            del request_headers["Upgrade"]
        request_headers["Connection"] = "Upgrade"
        request_headers["Upgrade"] = "websocket"

        
        # Log validation issues to stdout for debugging
        if not any(token.strip() == "upgrade" for token in connection.lower().split(",")):
            print(f"[HEALTH_CHECK] WARNING: Original Connection header did not contain 'upgrade': '{connection}'", flush=True)
        if upgrade.lower() != "websocket":
            print(f"[HEALTH_CHECK] WARNING: Original Upgrade header was not 'websocket': '{upgrade}'", flush=True)
        if version != "13":
            print(f"[HEALTH_CHECK] WARNING: Sec-WebSocket-Version is not '13': '{version}'", flush=True)
            
        print("[HEALTH_CHECK] Handshake allowed to proceed", flush=True)
        return None
        
    print("[HEALTH_CHECK] Non-upgrade request, returning 200 OK", flush=True)
    return http.HTTPStatus.OK, [("Content-Type", "text/plain")], b"OK"




async def main():
    try:
        asyncio.create_task(fastf1_live_bridge())
        port = int(os.environ.get("PORT", 8765))
        async with websockets.serve(handler, "0.0.0.0", port, process_request=health_check):
            logging.info(f"WebSocket Server running on ws://0.0.0.0:{port}")
            await asyncio.Future()
    except Exception as e:
        logging.critical(f"Critical error in main loop: {e}", exc_info=True)
        await asyncio.sleep(5)
        raise


if __name__ == "__main__":
    asyncio.run(main())

