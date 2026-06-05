import asyncio
import websockets
import json
import logging
import os
import math
import time
from fastf1.livetiming.client import SignalRClient

logging.basicConfig(level=logging.INFO)
connected_clients = set()

async def handler(websocket):
    connected_clients.add(websocket)
    logging.info("New frontend client connected!")
    try:
        await websocket.wait_closed()
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

async def fastf1_live_bridge():
    """
    Connects to the real FastF1 SignalR client and tails the output file.
    """
    filename = 'live_timing_data.txt'
    if os.path.exists(filename):
        os.remove(filename)

    logging.info("Attempting to connect to real FastF1 SignalR Live Timing...")
    try:
        client = SignalRClient(filename)
        # Uncomment in production during a live session:
        # await client.start()
        # asyncio.create_task(tail_file_and_broadcast(filename))
        
        raise Exception("No active F1 session to connect to right now.")
    except Exception as e:
        logging.warning(f"FastF1 connection failed/skipped: {e}. Falling back to simulation loop.")
        await simulate_live_stream()

async def simulate_live_stream():
    """Simulates the incoming WebSocket data structure and broadcasts it."""
    logging.info("Starting simulated local WebSocket stream...")
    
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
                    "name": "FORMULA 1 LENOVO GRAND PRIX DU CANADA 2026",
                    "status": "Green",
                    "lap": int(current_time / 60) + 1,
                    "totalLaps": 68
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
                simulated_timing = {
                    "topic": "TimingData",
                    "data": {
                        "driver": drv,
                        "position": i + 1,
                        "lap": int(current_time / 60) + 1,
                        "s1": f"28.{532 + i*10:03d}",
                        "s2": f"30.{111 + i*5:03d}",
                        "s3": f"24.{992 + i*2:03d}",
                        "gapToLeader": f"+{i * 0.3:.3f}",
                        "interval": f"+0.300"
                    }
                }
                websockets.broadcast(connected_clients, json.dumps(simulated_timing))
            
            # Telemetry Data
            for _ in range(2): 
                for drv in drivers:
                    simulated_telemetry = {
                        "topic": "Telemetry",
                        "data": {
                            "driver": drv,
                            "time": current_time,
                            "speed": 300 - (drivers.index(drv) * 2) + (math.sin(current_time) * 10),
                            "rpm": 11000 + (math.sin(current_time) * 500),
                            "gear": 8
                        }
                    }
                    websockets.broadcast(connected_clients, json.dumps(simulated_telemetry))
                await asyncio.sleep(0.5)

            # Track Position (Plotly X/Y)
            for drv in drivers:
                idx = drivers.index(drv)
                track_progress = (current_time * 0.5) - (idx * 0.2)
                
                # Figure 8 track shape
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
