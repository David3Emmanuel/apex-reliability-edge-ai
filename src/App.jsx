import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Cpu, 
  CheckCircle, 
  Wrench, 
  Database, 
  Zap, 
  TrendingUp, 
  Gauge, 
  ShieldAlert, 
  Power,
  RotateCw,
  Sliders,
  ChevronRight,
  TrendingDown,
  Info,
  Clock,
  UserCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

export default function App() {
  // Active mill selection
  const [selectedMillId, setSelectedMillId] = useState(2); // Default to Cement Mill 1 (has the alert)
  const [isAnomalySimulated, setIsAnomalySimulated] = useState(false);
  const [isCopeDecoupled, setIsCopeDecoupled] = useState(false);
  const [isEStopTriggered, setIsEStopTriggered] = useState(false);
  const [time, setTime] = useState(0);

  // Mill configurations and status
  const initialMills = [
    {
      id: 1,
      name: "Loesche Raw Mill 1 (LM 69.6)",
      location: "Ibese Plant - Line 1",
      type: "Raw Material Grinding",
      power: "5.6 MW",
      tableSpeed: "24.5 RPM",
      rollers: 6,
      driveType: "Renk COPE Drive (8x Motors)",
      baseEHI: 94,
      vibration: 2.1, // mm/s
      acoustic: 45, // dB
      temp: 68, // C
      status: "Operational"
    },
    {
      id: 2,
      name: "Loesche Cement Mill 1 (LM 63.3+3)",
      location: "Ibese Plant - Line 1",
      type: "Clinker Grinding",
      power: "6.4 MW",
      tableSpeed: "28.2 RPM",
      rollers: 6, // 3 master, 3 support
      driveType: "Flender KMPS 530 Gearbox",
      baseEHI: 64, // showing degradation
      vibration: 6.8, // elevated mm/s
      acoustic: 98, // high AE stress
      temp: 84, // elevated temperature
      status: "Alert"
    },
    {
      id: 3,
      name: "Loesche Coal Mill 1 (LM 28.3 D)",
      location: "Ibese Plant - Line 2",
      type: "Fuel Preparation",
      power: "1.2 MW",
      tableSpeed: "35.1 RPM",
      rollers: 3,
      driveType: "Flender KMP 250 Gearbox",
      baseEHI: 97,
      vibration: 1.4,
      acoustic: 32,
      temp: 58,
      status: "Operational"
    },
    {
      id: 4,
      name: "Loesche Raw Mill 2 (LM 69.6)",
      location: "Ibese Plant - Line 2",
      type: "Raw Material Grinding",
      power: "5.6 MW",
      tableSpeed: "24.3 RPM",
      rollers: 6,
      driveType: "Renk COPE Drive (8x Motors)",
      baseEHI: 89,
      vibration: 2.8,
      acoustic: 52,
      temp: 72,
      status: "Operational"
    }
  ];

  const [mills, setMills] = useState(initialMills);

  // Time simulation loop for live telemetry charts
  const [chartData, setChartData] = useState([]);
  
  useEffect(() => {
    // Generate initial history data
    const history = [];
    for (let i = 29; i >= 0; i--) {
      const day = 30 - i;
      history.push({
        day: `Day ${day}`,
        RM1_EHI: 95 - Math.sin(day/5)*1.5,
        CM1_EHI: day > 15 ? 90 - (day-15)*1.8 : 92 - Math.cos(day/3)*1,
        Coal1_EHI: 97 - Math.sin(day/10)*0.5,
        RM2_EHI: 90 - (day/10)*0.8,
        vibration: day > 15 ? 2.5 + (day-15)*0.28 : 2.2 + Math.sin(day)*0.1,
        acoustic: day > 15 ? 40 + (day-15)*3.8 : 38 + Math.cos(day)*2
      });
    }
    setChartData(history);
  }, []);

  // Live sensor data generation
  const [liveSensors, setLiveSensors] = useState({
    vibration: 0,
    acoustic: 0,
    temp: 0,
    ehi: 100
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Update live sensor metrics based on selected mill and simulations
    const activeMill = mills.find(m => m.id === selectedMillId);
    if (!activeMill) return;

    let ehi = activeMill.baseEHI;
    let vib = activeMill.vibration;
    let ae = activeMill.acoustic;
    let tmp = activeMill.temp;

    // Apply simulation overrides
    if (isEStopTriggered) {
      ehi = 0;
      vib = 0.05 + Math.random() * 0.05;
      ae = 5 + Math.random() * 2;
      tmp = 35 + Math.random() * 1;
    } else if (isAnomalySimulated) {
      // Simulate extreme degradation
      const cycle = Math.sin(time / 2);
      ehi = Math.max(25, Math.round(activeMill.baseEHI - 25 - cycle * 5));
      vib = Number((activeMill.vibration * 1.8 + cycle * 0.5).toFixed(2));
      ae = Math.round(activeMill.acoustic * 1.5 + cycle * 10);
      tmp = Math.round(activeMill.temp * 1.15 + cycle * 3);
    } else if (isCopeDecoupled && activeMill.driveType.includes("COPE")) {
      // Decoupling helps mitigate bearing fault in COPE drives
      ehi = 82; // stabilizes
      vib = 2.9;
      ae = 58;
      tmp = 71;
    } else {
      // Normal operating oscillations
      const drift = Math.sin(time / 5) * 0.5;
      ehi = Math.round(activeMill.baseEHI + drift);
      vib = Number((activeMill.vibration + Math.sin(time) * 0.1).toFixed(2));
      ae = Math.round(activeMill.acoustic + Math.cos(time / 2) * 2);
      tmp = Math.round(activeMill.temp + Math.sin(time / 10) * 0.5);
    }

    setLiveSensors({
      vibration: vib,
      acoustic: ae,
      temp: tmp,
      ehi: ehi
    });

    // Update mills array to reflect live state
    setMills(prev => prev.map(m => {
      if (m.id === selectedMillId) {
        return {
          ...m,
          currentEHI: ehi,
          status: isEStopTriggered ? "Emergency Stop" : (ehi < 50 ? "Shutdown Required" : (ehi < 75 ? "Alert" : "Operational"))
        };
      }
      // For non-selected mills, assign a dummy EHI around their base
      return {
        ...m,
        currentEHI: m.currentEHI || m.baseEHI
      };
    }));

  }, [time, selectedMillId, isAnomalySimulated, isCopeDecoupled, isEStopTriggered]);

  const activeMill = mills.find(m => m.id === selectedMillId);

  // Health index indicator colors
  const getEHIColor = (score) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 70) return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
  };

  const getEHIGradient = (score) => {
    if (score >= 85) return 'from-emerald-500 to-teal-400';
    if (score >= 70) return 'from-cyan-500 to-blue-500';
    if (score >= 50) return 'from-amber-500 to-orange-400';
    return 'from-rose-600 to-red-500';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white font-bold text-xs px-2.5 py-1 rounded tracking-widest uppercase">Dangote Cement</span>
            <span className="text-slate-500 text-xs font-mono">DCP-MEW-V1.0</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mt-1">
            Edge AI Predictive Maintenance & Reliability Early-Warning
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time high-frequency acoustic and vibration processing on local FPGA nodes · Challenge Track 2
          </p>
        </div>

        {/* Global Statistics */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-lg flex items-center gap-3">
            <Cpu className="text-indigo-400 w-5 h-5" />
            <div>
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">FPGA Edge Nodes</div>
              <div className="text-xs font-bold text-slate-200">4 Active (Xilinx/Intel)</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-lg flex items-center gap-3">
            <Database className="text-cyan-400 w-5 h-5" />
            <div>
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Protocol Interface</div>
              <div className="text-xs font-bold text-slate-200">OPC UA · MQTT (OK)</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-lg flex items-center gap-3">
            <Zap className="text-emerald-400 w-5 h-5 animate-pulse" />
            <div>
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Estimated Downtime Avoided</div>
              <div className="text-xs font-bold text-emerald-400">$1,280,000 YTD</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: Mill List Selection */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-1">
            Grinding Mills (Ibese & Obajana)
          </div>
          <div className="flex flex-col gap-3">
            {mills.map((mill) => {
              const score = mill.currentEHI || mill.baseEHI;
              const isSelected = mill.id === selectedMillId;
              const healthColor = getEHIColor(score);
              return (
                <button
                  key={mill.id}
                  onClick={() => {
                    setSelectedMillId(mill.id);
                    setIsAnomalySimulated(false);
                    setIsCopeDecoupled(false);
                    setIsEStopTriggered(false);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                    isSelected 
                      ? 'bg-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-500/5' 
                      : 'bg-slate-900/30 border-slate-800/60 hover:bg-slate-900/60 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-slate-200 text-sm leading-tight">{mill.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{mill.location}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${healthColor}`}>
                      {mill.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/40">
                    <span className="text-xs text-slate-500 font-mono">{mill.type}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">EHI:</span>
                      <span className={`text-sm font-bold ${getEHIColor(score).split(' ')[0]}`}>{score}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Simulation Controls */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 mt-auto">
            <div className="flex items-center gap-2 mb-3 text-slate-300 font-semibold text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Edge Simulation Console</span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Manually inject abnormal plant states to validate the FPGA edge response and real-time dashboard propagation.
            </p>
            
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setIsAnomalySimulated(!isAnomalySimulated);
                  setIsCopeDecoupled(false);
                  setIsEStopTriggered(false);
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                  isAnomalySimulated 
                    ? 'bg-amber-600 text-white font-bold' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>Inject Anomaly (Spalling/Bearing Wear)</span>
                <AlertTriangle className={`w-3.5 h-3.5 ${isAnomalySimulated ? 'animate-bounce' : 'text-slate-400'}`} />
              </button>

              {activeMill && activeMill.driveType.includes("COPE") && (
                <button
                  onClick={() => {
                    setIsCopeDecoupled(!isCopeDecoupled);
                    setIsAnomalySimulated(false);
                    setIsEStopTriggered(false);
                  }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                    isCopeDecoupled 
                      ? 'bg-teal-600 text-white font-bold' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  disabled={isEStopTriggered}
                >
                  <span>Active Redundancy (Decouple 1x Motor)</span>
                  <RotateCw className={`w-3.5 h-3.5 ${isCopeDecoupled ? 'animate-spin' : 'text-slate-400'}`} />
                </button>
              )}

              <button
                onClick={() => {
                  setIsEStopTriggered(!isEStopTriggered);
                  setIsAnomalySimulated(false);
                  setIsCopeDecoupled(false);
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                  isEStopTriggered 
                    ? 'bg-rose-700 text-white font-bold' 
                    : 'bg-rose-950/40 text-rose-300 border border-rose-900/60 hover:bg-rose-900/30'
                }`}
              >
                <span>Emergency E-Stop (GPIO High Trigger)</span>
                <Power className="w-3.5 h-3.5" />
              </button>

              {(isAnomalySimulated || isCopeDecoupled || isEStopTriggered) && (
                <button
                  onClick={() => {
                    setIsAnomalySimulated(false);
                    setIsCopeDecoupled(false);
                    setIsEStopTriggered(false);
                  }}
                  className="w-full mt-2 py-1.5 text-center text-xs font-medium text-slate-400 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 rounded-lg transition-all"
                >
                  Reset to Healthy Baseline
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right Area: Detailed Telemetry and Escalation */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          
          {/* Active Mill Details and Health Index Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Health Circular Gauge */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">Equipment Health Index</div>
              
              {/* Custom SVG Circular Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Track circle */}
                  <circle 
                    cx="50" cy="50" r="42" 
                    className="stroke-slate-800" 
                    strokeWidth="8" fill="transparent" 
                  />
                  {/* Indicator Circle */}
                  <circle 
                    cx="50" cy="50" r="42" 
                    stroke={`url(#gauge-gradient-${selectedMillId})`}
                    strokeWidth="8" fill="transparent" 
                    strokeDasharray={263.8}
                    strokeDashoffset={263.8 - (263.8 * Math.min(100, liveSensors.ehi)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                  <defs>
                    <linearGradient id={`gauge-gradient-${selectedMillId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={liveSensors.ehi >= 85 ? "#10b981" : (liveSensors.ehi >= 70 ? "#06b6d4" : (liveSensors.ehi >= 50 ? "#f59e0b" : "#f43f5e"))} />
                      <stop offset="100%" stopColor={liveSensors.ehi >= 85 ? "#34d399" : (liveSensors.ehi >= 70 ? "#3b82f6" : (liveSensors.ehi >= 50 ? "#fb923c" : "#ef4444"))} />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold font-mono tracking-tighter ${getEHIColor(liveSensors.ehi).split(' ')[0]}`}>
                    {liveSensors.ehi}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase mt-0.5">Points</span>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-400 font-mono text-center">
                State: <span className={`font-bold ${getEHIColor(liveSensors.ehi).split(' ')[0]}`}>{activeMill?.status}</span>
              </div>
            </div>

            {/* Core Raw Telemetry Values */}
            <div className="md:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-white leading-tight">{activeMill?.name}</h2>
                    <p className="text-xs text-slate-400 font-mono mt-1">{activeMill?.location} · {activeMill?.driveType}</p>
                  </div>
                  <Info className="w-5 h-5 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors" />
                </div>

                {/* Technical Specifications */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                  <div className="bg-slate-950/50 border border-slate-800/40 p-2.5 rounded-lg">
                    <div className="text-[10px] text-slate-500 font-medium">Grinding Capacity</div>
                    <div className="text-sm font-bold text-slate-300 mt-0.5">{activeMill?.power}</div>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800/40 p-2.5 rounded-lg">
                    <div className="text-[10px] text-slate-500 font-medium">Table Velocity</div>
                    <div className="text-sm font-bold text-slate-300 mt-0.5">{activeMill?.tableSpeed}</div>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800/40 p-2.5 rounded-lg">
                    <div className="text-[10px] text-slate-500 font-medium">Grinding Rollers</div>
                    <div className="text-sm font-bold text-slate-300 mt-0.5">{activeMill?.rollers} Rollers</div>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800/40 p-2.5 rounded-lg">
                    <div className="text-[10px] text-slate-500 font-medium">Drivetrain Solution</div>
                    <div className="text-xs font-bold text-indigo-400 mt-0.5 truncate">{activeMill?.driveType.split(' ')[0]}</div>
                  </div>
                </div>
              </div>

              {/* Three Raw Sensors Grid */}
              <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-800/60">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Vibration Velocity</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-slate-100">{liveSensors.vibration}</span>
                    <span className="text-xs text-slate-400 font-mono">mm/s</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${liveSensors.vibration >= 6.0 ? 'bg-rose-500' : (liveSensors.vibration >= 3.0 ? 'bg-amber-500' : 'bg-emerald-500')}`}
                      style={{ width: `${Math.min(100, (liveSensors.vibration / 12) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Acoustic Stress</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-slate-100">{liveSensors.acoustic}</span>
                    <span className="text-xs text-slate-400 font-mono">dB</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${liveSensors.acoustic >= 90 ? 'bg-rose-500' : (liveSensors.acoustic >= 60 ? 'bg-amber-500' : 'bg-emerald-500')}`}
                      style={{ width: `${Math.min(100, (liveSensors.acoustic / 150) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Bearing Temp.</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-slate-100">{liveSensors.temp}</span>
                    <span className="text-xs text-slate-400 font-mono">°C</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${liveSensors.temp >= 85 ? 'bg-rose-500' : (liveSensors.temp >= 70 ? 'bg-amber-500' : 'bg-emerald-500')}`}
                      style={{ width: `${Math.min(100, (liveSensors.temp / 120) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Graphical Telemetry Plots */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Long-Term Diagnostic Trends</h3>
              </div>
              <span className="text-xs text-slate-500 bg-slate-950 px-2.5 py-1 rounded border border-slate-900 font-mono">
                Past 30 Days (Continuous Log)
              </span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEHI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#aa3bff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#aa3bff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAcoustic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#aa3bff" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <YAxis yAxisId="right" stroke="#ef4444" fontSize={10} orientation="right" domain={[0, 150]} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#cbd5e1' }}
                    labelStyle={{ fontWeight: 'bold', color: '#cbd5e1' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey={selectedMillId === 2 ? "CM1_EHI" : (selectedMillId === 1 ? "RM1_EHI" : (selectedMillId === 3 ? "Coal1_EHI" : "RM2_EHI"))} 
                    name="Equipment Health Index (0-100)" 
                    stroke="#aa3bff" 
                    fillOpacity={1} 
                    fill="url(#colorEHI)" 
                    strokeWidth={2}
                  />
                  <Area 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="acoustic" 
                    name="Acoustic Emission Level (dB)" 
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorAcoustic)" 
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex gap-4 mt-4 text-[10px] text-slate-500 font-mono justify-center">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Primary health progression</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> High-frequency micro-acoustic event rate</span>
            </div>
          </div>

          {/* Edge Processing status and Escalation Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* FPGA Hardware Co-Processor Panel */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Cpu className="text-indigo-400 w-5 h-5" />
                <h3 className="font-bold text-white text-base">Edge FPGA Diagnostic Node Status</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                  <span className="text-xs text-slate-400">Target FPGA System</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {activeMill?.driveType.includes("COPE") ? "Xilinx Zynq-7020 Dual-Core ARM" : "Intel MAX 10 (Lab Prototype)"}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                  <span className="text-xs text-slate-400">ADC Sampling Protocol</span>
                  <span className="text-xs font-mono text-slate-200">500 kHz (Acoustic) / 25 kHz (Vib)</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                  <span className="text-xs text-slate-400">Inference Jitter & Latency</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">28 Microseconds (Deterministic)</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                  <span className="text-xs text-slate-400">ML Model Compiler (hls4ml)</span>
                  <span className="text-xs font-mono text-indigo-400 font-semibold">1-D CNN (Int8 Quantized, 85% reduction)</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs text-slate-400 mt-0.5">AI Fault Classification</span>
                  <div className="text-right">
                    <span className={`text-xs font-bold ${liveSensors.ehi >= 85 ? 'text-emerald-400' : (liveSensors.ehi >= 70 ? 'text-cyan-400' : 'text-rose-400')}`}>
                      {isEStopTriggered ? "System Inhibited" : (liveSensors.ehi >= 85 ? "Normal / Noise Baseline (99.8%)" : "Outer-Race Bearing Micro-Spalling (94.2%)")}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">Location: Input Shaft Bearing Housing</div>
                  </div>
                </div>
              </div>

              {/* hls4ml compression badge */}
              <div className="mt-6 bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 flex items-start gap-3">
                <Gauge className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-300">FPGA vs. GPU Latency Advantage</div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    FPGAs bypass the von Neumann bottleneck. Traditional edge GPUs (e.g. Jetson Nano) exhibit stochastic latency of 15ms due to operating system scheduling. The FPGA operates at the hardware layer, responding 500x faster (28μs).
                  </p>
                </div>
              </div>
            </div>

            {/* Example Maintenance Escalation Workflow */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <Wrench className="text-indigo-400 w-5 h-5" />
                  <h3 className="font-bold text-white text-base">Integrated Escalation Workflow</h3>
                </div>
                <span className="text-[10px] bg-indigo-950/50 text-indigo-300 border border-indigo-900/60 px-2 py-0.5 rounded font-semibold uppercase font-mono">
                  ISO 10218 Standard
                </span>
              </div>

              {/* Phased Workflow Milestones */}
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                
                {/* Step 1 */}
                <div className="flex items-start gap-3.5 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs font-mono font-bold z-10 shrink-0 ${
                    liveSensors.ehi < 75 
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}>
                    {liveSensors.ehi < 75 ? <CheckCircle className="w-3.5 h-3.5" /> : "1"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">FPGA Edge Threshold Exceeded</div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {liveSensors.ehi < 75 
                        ? `Threshold breached (EHI: ${liveSensors.ehi}). Alarm register pulled High.` 
                        : "Normal monitoring state. Threshold limit set at EHI < 75."}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3.5 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs font-mono font-bold z-10 shrink-0 ${
                    liveSensors.ehi < 75 
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}>
                    {liveSensors.ehi < 75 ? <CheckCircle className="w-3.5 h-3.5" /> : "2"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Automated SAP PM Work Order</div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {liveSensors.ehi < 75 
                        ? "Work order WO-920401 triggered automatically. Criticality: High." 
                        : "Integrates with SAP PM via MQTT publisher upon alarm trigger."}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3.5 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs font-mono font-bold z-10 shrink-0 ${
                    liveSensors.ehi < 75 && !isEStopTriggered
                      ? 'bg-indigo-950 border-indigo-500 text-indigo-400 animate-pulse' 
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}>
                    {liveSensors.ehi < 75 && !isEStopTriggered ? <Clock className="w-3.5 h-3.5" /> : "3"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Field Acoustic Scanning Validation</div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {liveSensors.ehi < 75 && !isEStopTriggered
                        ? "Vibration Specialist assigned: David E. (Est. dispatch: 15 mins)." 
                        : "Field specialist dispatched to perform localized ultrasound scanning verify."}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3.5 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs font-mono font-bold z-10 shrink-0 ${
                    isEStopTriggered 
                      ? 'bg-rose-950 border-rose-500 text-rose-400' 
                      : (isCopeDecoupled ? 'bg-teal-950 border-teal-500 text-teal-400' : 'bg-slate-950 border-slate-800 text-slate-500')
                  }`}>
                    {isEStopTriggered ? <ShieldAlert className="w-3.5 h-3.5" /> : "4"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Decoupled Operational Redundancy / Shutdown</div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {isEStopTriggered 
                        ? "GPIO E-Stop pulled HIGH. Clinker production line halted to prevent shell cracking." 
                        : (isCopeDecoupled 
                            ? "RENK COPE module decoupled. Roller Mill operating at 85% capacity safely." 
                            : "Mitigation action (E-Stop or COPE motor decoupling) based on criticality level.")}
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-900/20 px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
        <div>
          ULES ARB Research Competition · Team "Arb Research Competition"
        </div>
        <div className="flex gap-4">
          <a href="#report" className="hover:text-indigo-400 transition-colors">Technical Appendix</a>
          <a href="#business" className="hover:text-indigo-400 transition-colors">Business Case</a>
          <a href="#roadmap" className="hover:text-indigo-400 transition-colors">Roadmap</a>
        </div>
        <div>
          Sponsor: Dangote Cement Plc Sustainability Team
        </div>
      </footer>

    </div>
  );
}
