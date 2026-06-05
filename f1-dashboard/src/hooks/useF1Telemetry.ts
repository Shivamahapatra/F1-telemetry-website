import { useState, useEffect, useRef } from 'react';

export function useF1Telemetry() {
  const [timingData, setTimingData] = useState<any[]>([]);
  const [trackPositions, setTrackPositions] = useState<Record<string, any>>({});
  const [sessionInfo, setSessionInfo] = useState<any>({});
  const [weatherData, setWeatherData] = useState<any>({});
  const [trackCoords, setTrackCoords] = useState<any[]>([]);
  const [raceControlMsgs, setRaceControlMsgs] = useState<any[]>([]);
  const [teamRadioMsgs, setTeamRadioMsgs] = useState<any[]>([]);
  
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(['VER', 'HAM']);
  const selectedDriversRef = useRef<string[]>(['VER', 'HAM']);
  
  useEffect(() => {
    selectedDriversRef.current = selectedDrivers;
  }, [selectedDrivers]);
  
  const telemetryBufferRef = useRef<Record<string, any[]>>({});
  const [telemetryState, setTelemetryState] = useState<Record<string, any[]>>({});

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket('ws://localhost:8765');
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.topic === 'TrackMap') {
              setTrackCoords(message.data);
          }
          else if (message.topic === 'TimingData') {
            setTimingData((prev) => {
              const updated = [...prev];
              const idx = updated.findIndex(d => d.driver === message.data.driver);
              if (idx >= 0) updated[idx] = message.data;
              else updated.push(message.data);
              return updated.sort((a,b) => a.position - b.position);
            });
          }
          else if (message.topic === 'Position') {
            setTrackPositions(prev => ({
              ...prev,
              [message.data.driver]: message.data
            }));
          }
          else if (message.topic === 'SessionInfo') {
            setSessionInfo(message.data);
          }
          else if (message.topic === 'WeatherData') {
            setWeatherData(message.data);
          }
          else if (message.topic === 'Telemetry') {
            const driver = message.data.driver;
            if (!telemetryBufferRef.current[driver]) {
              telemetryBufferRef.current[driver] = [];
            }
            telemetryBufferRef.current[driver].push(message.data);
            
            if (telemetryBufferRef.current[driver].length > 500) {
              telemetryBufferRef.current[driver].shift();
            }
          }
          else if (message.topic === 'RaceControl') {
            setRaceControlMsgs(prev => [message.data, ...prev].slice(0, 50));
          }
          else if (message.topic === 'TeamRadio') {
            setTeamRadioMsgs(prev => [message.data, ...prev].slice(0, 50));
          }
        } catch (err) {
          console.error("WS Parse error", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 3s...");
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws?.close();
      };
    };

    connect();

    const interval = setInterval(() => {
      setTelemetryState(current => {
        const nextState: Record<string, any[]> = {};
        selectedDriversRef.current.forEach(drv => {
          nextState[drv] = [...(telemetryBufferRef.current[drv] || [])];
        });
        return nextState;
      });
    }, 500);

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      clearTimeout(reconnectTimeout);
      clearInterval(interval);
    };
  }, []);

  return { timingData, telemetryState, trackPositions, sessionInfo, weatherData, selectedDrivers, setSelectedDrivers, trackCoords, raceControlMsgs, teamRadioMsgs };
}
