import { useState, useEffect, useRef } from 'react';

export function useF1Telemetry() {
  const [timingData, setTimingData] = useState<any[]>([]);
  const [trackPositions, setTrackPositions] = useState<Record<string, any>>({});
  
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(['VER', 'HAM']);
  // Ref to avoid reconnecting WS when selection changes
  const selectedDriversRef = useRef<string[]>(['VER', 'HAM']);
  
  useEffect(() => {
    selectedDriversRef.current = selectedDrivers;
  }, [selectedDrivers]);
  
  const telemetryBufferRef = useRef<Record<string, any[]>>({});
  const [telemetryState, setTelemetryState] = useState<Record<string, any[]>>({});

  useEffect(() => {
    // Connect securely to the Render cloud backend
    const ws = new WebSocket('wss://f1-telemetry-website.onrender.com');
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.topic === 'TimingData') {
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

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []); // Only run once on mount

  return { timingData, telemetryState, trackPositions, selectedDrivers, setSelectedDrivers };
}
