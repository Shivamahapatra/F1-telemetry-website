import { useState, useEffect, useRef } from 'react';

export function useF1Telemetry() {
  const [timingData, setTimingData] = useState<any[]>([]);
  const [trackPositions, setTrackPositions] = useState<Record<string, any>>({});
  const [sessionInfo, setSessionInfo] = useState<any>({});
  const [weatherData, setWeatherData] = useState<any>({});
  const [trackCoords, setTrackCoords] = useState<any[]>([]);
  const [raceControlMessages, setRaceControlMessages] = useState<any[]>([]);
  const [teamRadioMessages, setTeamRadioMessages] = useState<any[]>([]);
  
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(['VER', 'HAM']);
  const selectedDriversRef = useRef<string[]>(['VER', 'HAM']);
  
  useEffect(() => {
    selectedDriversRef.current = selectedDrivers;
  }, [selectedDrivers]);
  
  const telemetryBufferRef = useRef<Record<string, any[]>>({});
  const [telemetryState, setTelemetryState] = useState<Record<string, any[]>>({});

  const timingBufferRef = useRef<Record<string, any>>({});
  const positionsBufferRef = useRef<Record<string, any>>({});

  useEffect(() => {
    // Connect to the python fastf1 backend
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8765';
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.topic === 'TrackMap') {
            setTrackCoords(message.data);
        }
        else if (message.topic === 'TimingData') {
          timingBufferRef.current[message.data.driver] = message.data;
        }
        else if (message.topic === 'Position') {
          positionsBufferRef.current[message.data.driver] = message.data;
        }
        else if (message.topic === 'SessionInfo') {
          setSessionInfo(message.data);
        }
        else if (message.topic === 'WeatherData') {
          setWeatherData(message.data);
        }
        else if (message.topic === 'RaceControlData') {
          setRaceControlMessages(message.data.raceControl || []);
          setTeamRadioMessages(message.data.teamRadio || []);
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
      } catch (err) {
        console.error("WS Parse error", err);
      }
    };

    const interval = setInterval(() => {
      setTelemetryState(current => {
        const nextState: Record<string, any[]> = {};
        selectedDriversRef.current.forEach(drv => {
          nextState[drv] = [...(telemetryBufferRef.current[drv] || [])];
        });
        return nextState;
      });
    }, 500);

    // Controlled 30 FPS update loop
    let animationFrameId: number;
    let lastUpdate = 0;

    const updateLoop = (timestamp: number) => {
      if (timestamp - lastUpdate >= 33) { // 33ms is ~30fps
        let nextPositions: Record<string, any> | null = null;
        let nextTiming: Record<string, any> | null = null;

        if (Object.keys(positionsBufferRef.current).length > 0) {
          nextPositions = { ...positionsBufferRef.current };
          positionsBufferRef.current = {};
        }

        if (Object.keys(timingBufferRef.current).length > 0) {
          nextTiming = { ...timingBufferRef.current };
          timingBufferRef.current = {};
        }

        if (nextPositions) {
          setTrackPositions(prev => ({ ...prev, ...nextPositions }));
        }

        if (nextTiming) {
          setTimingData(prev => {
            const updated = [...prev];
            Object.values(nextTiming!).forEach((newData: any) => {
              const idx = updated.findIndex(d => d.driver === newData.driver);
              if (idx >= 0) updated[idx] = newData;
              else updated.push(newData);
            });
            return updated.sort((a, b) => a.position - b.position);
          });
        }

        lastUpdate = timestamp;
      }
      animationFrameId = requestAnimationFrame(updateLoop);
    };

    animationFrameId = requestAnimationFrame(updateLoop);

    return () => {
      ws.close();
      clearInterval(interval);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return { 
    timingData, 
    telemetryState, 
    trackPositions, 
    sessionInfo, 
    weatherData, 
    selectedDrivers, 
    setSelectedDrivers, 
    trackCoords,
    raceControlMessages,
    teamRadioMessages
  };
}
