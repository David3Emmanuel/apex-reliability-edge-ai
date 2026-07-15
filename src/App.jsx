import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Cpu, 
  CheckCircle, 
  Wrench, 
  Zap, 
  TrendingUp, 
  Info, 
  Clock, 
  Power,
  RotateCw,
  Sliders,
  Thermometer,
  ShieldAlert,
  Shield
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

export default function App() {
  // Navigation / Selected mill
  const [selectedMillId, setSelectedMillId] = useState(2); // Defaults to Cement Mill 1 (traditional drive)
  
  // State variables for Edge simulation
  const [simState, setSimState] = useState('NORMAL'); // NORMAL, FAULT, MITIGATED, ESTOP
  const [time, setTime] = useState(0);
  
  // Telemetry history for scrolling oscilloscopes
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  
  // Live current metrics
  const [liveSensors, setLiveSensors] = useState({
    vibration: 1.8,
    acoustic: 35,
    temp: 62,
    ehi: 96
  });

  // Mill configurations and assets specs
  const mills = [
    {
      id: 1,
      name: "Loesche Raw Mill 1 (LM 69.6)",
      location: "Ibese Plant - Line 1",
      power: "5.6 MW",
      driveType: "Renk COPE Drive (8x Motors)",
      tableSpeed: "24.5 RPM",
      rollers: 6,
      supportsCope: true
    },
    {
      id: 2,
      name: "Loesche Cement Mill 1 (LM 63.3+3)",
      location: "Ibese Plant - Line 1",
      power: "6.4 MW",
      driveType: "Flender KMPS 530 Gearbox",
      tableSpeed: "28.2 RPM",
      rollers: 6,
      supportsCope: false
    },
    {
      id: 3,
      name: "Loesche Coal Mill 1 (LM 28.3 D)",
      location: "Ibese Plant - Line 2",
      power: "1.2 MW",
      driveType: "Flender KMP 250 Gearbox",
      tableSpeed: "35.1 RPM",
      rollers: 3,
      supportsCope: false
    }
  ];

  const activeMill = mills.find(m => m.id === selectedMillId) || mills[1];

  // Initialize scrolling baseline history
  useEffect(() => {
    const history = [];
    for (let i = 0; i < 20; i++) {
      history.push({
        time: i,
        vibration: 1.8,
        acoustic: 35,
        temp: 62,
        ehi: 96
      });
    }
    setTelemetryHistory(history);
  }, []);

  // Live timer for data generation loop (updates every 500ms for smooth live wave feeling)
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => prev + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Update telemetry history and live sensor values on every timer tick
  useEffect(() => {
    let vib, ae, temp, ehi;
    
    // Add realistic fluctuations
    const noise = (amplitude) => (Math.random() - 0.5) * amplitude;
    
    switch (simState) {
      case 'NORMAL':
        ehi = 96;
        vib = 1.8 + noise(0.2);
        ae = 35 + noise(4);
        temp = 62 + Math.sin(time / 10) * 0.4;
        break;
        
      case 'FAULT':
        ehi = 64;
        // CRITICAL TELEMETRY EVIDENCE:
        // High-frequency acoustic emission has spiked due to micro-cracking,
        // but low-frequency vibration is still healthy (under ISO limits).
        vib = 2.1 + noise(0.2); 
        ae = 98 + noise(8); 
        temp = 64 + Math.sin(time / 10) * 0.4;
        break;
        
      case 'MITIGATED':
        // Active redundancy handles load distribution
        if (activeMill.supportsCope) {
          ehi = 82;
          vib = 2.9 + noise(0.3);
          ae = 55 + noise(6);
          temp = 71 + Math.sin(time / 10) * 0.4;
        } else {
          // Standard drive cannot mitigate, falls back to normal or fault
          ehi = 64;
          vib = 2.1 + noise(0.2);
          ae = 98 + noise(8);
          temp = 64 + Math.sin(time / 10) * 0.4;
        }
        break;
        
      case 'ESTOP':
        ehi = 12;
        vib = 0.05 + noise(0.02);
        ae = 8 + noise(2);
        temp = Math.max(38, Math.round(liveSensors.temp - 1.2)); // Cooling down
        break;
        
      default:
        ehi = 96;
        vib = 1.8;
        ae = 35;
        temp = 62;
    }

    // Safeguard negative limits and format decimals
    vib = Math.max(0.02, Number(vib.toFixed(2)));
    ae = Math.max(0, Math.round(ae));
    temp = Math.max(30, Math.round(temp));

    setLiveSensors({ vibration: vib, acoustic: ae, temp, ehi });

    // Append to rolling history
    setTelemetryHistory(prev => {
      if (prev.length === 0) return [];
      const nextTime = prev[prev.length - 1].time + 1;
      return [
        ...prev.slice(1),
        { time: nextTime, vibration: vib, acoustic: ae, temp, ehi }
      ];
    });
  }, [time, simState, selectedMillId]);

  // Reset simulation states upon selecting a different mill
  const handleMillSelect = (id) => {
    setSelectedMillId(id);
    setSimState('NORMAL');
  };

  // Diagnostic status color mapping
  const getEHIColor = (score) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    if (score >= 70) return 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
  };

  const getDrivetrainStatus = () => {
    if (simState === 'ESTOP') return { label: "HALTED", bg: "bg-rose-500/20 border-rose-500 text-rose-400" };
    if (simState === 'FAULT') return { label: "ALERT - DEGRADED", bg: "bg-amber-500/20 border-amber-500 text-amber-400" };
    if (simState === 'MITIGATED' && activeMill.supportsCope) return { label: "RUNNING - MITIGATED", bg: "bg-cyan-500/20 border-cyan-500 text-cyan-400" };
    return { label: "ONLINE", bg: "bg-emerald-500/20 border-emerald-500 text-emerald-400" };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      
      {/* Premium Header */}
      <header className="border-b border-slate-900 bg-slate-900/30 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded tracking-widest uppercase">Dangote Cement</span>
            <span className="text-slate-500 text-[10px] font-mono">IBESE LINE 1 · MILL MONITORING</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mt-1">
            Edge AI Predictive Maintenance Console
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Local FPGA-accelerated stress wave co-processing for raw meal and clinker cement grinding mills.
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-3">
            <Cpu className="text-indigo-400 w-4 h-4" />
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Edge Processor</div>
              <div className="text-xs font-bold text-slate-200">FPGA Real-Time Pipeline</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-3">
            <Clock className="text-cyan-400 w-4 h-4" />
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Inference Latency</div>
              <div className="text-xs font-bold text-emerald-400">28 &mu;s (Deterministic)</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-3">
            <Zap className="text-amber-400 w-4 h-4 animate-pulse" />
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Financial Risk Avoided</div>
              <div className="text-xs font-bold text-emerald-400">$1,280,000 YTD</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column: Asset Selection & Simulation Console */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Asset Selection */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
              Select Grinding Mill
            </div>
            
            <div className="flex flex-col gap-2">
              {mills.map((mill) => {
                const isSelected = mill.id === selectedMillId;
                const isCurrentAlert = mill.id === 2 && simState === 'FAULT';
                return (
                  <button
                    key={mill.id}
                    onClick={() => handleMillSelect(mill.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 ${
                      isSelected 
                        ? 'bg-slate-900/80 border-indigo-500/60 shadow-lg shadow-indigo-500/5' 
                        : 'bg-slate-900/20 border-slate-800/40 hover:bg-slate-900/50 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-200 text-sm leading-snug">{mill.name}</div>
                        <div className="text-[11px] text-slate-500 mt-1">{mill.location}</div>
                      </div>
                      {isCurrentAlert && (
                        <span className="bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase animate-pulse">
                          Alert
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-800/60 text-[11px]">
                      <span className="text-slate-400 font-mono">{mill.driveType.split(' ')[0]} Drive</span>
                      <span className="text-slate-500">{mill.power}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulation Console - Clean, Intuitive for Judges */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 mt-auto">
            <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Simulation Injections</span>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Inject different operational scenarios to verify the Edge AI diagnostic behavior and early warning capabilities.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setSimState('NORMAL')}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all ${
                  simState === 'NORMAL'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400 font-bold shadow-md shadow-emerald-500/5'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${simState === 'NORMAL' ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500/60'}`}></span>
                  <span>1. Normal Baseline</span>
                </div>
                <span className="text-[10px] text-slate-500">Healthy</span>
              </button>

              <button
                onClick={() => setSimState('FAULT')}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all ${
                  simState === 'FAULT'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-400 font-bold shadow-md shadow-amber-500/5'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${simState === 'FAULT' ? 'bg-amber-400 animate-ping' : 'bg-amber-500/60'}`}></span>
                  <span>2. Bearing Crack (Alert)</span>
                </div>
                <span className="text-[10px] text-slate-500">Early Warning</span>
              </button>

              <button
                onClick={() => setSimState('MITIGATED')}
                disabled={!activeMill.supportsCope}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all ${
                  !activeMill.supportsCope 
                    ? 'opacity-40 cursor-not-allowed border-slate-900 text-slate-600'
                    : simState === 'MITIGATED'
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-400 font-bold shadow-md shadow-cyan-500/5'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${simState === 'MITIGATED' && activeMill.supportsCope ? 'bg-cyan-400 animate-ping' : 'bg-cyan-500/60'}`}></span>
                  <span>3. Decouple Motor (COPE)</span>
                </div>
                <span className="text-[10px] text-slate-500">Redundancy</span>
              </button>

              <button
                onClick={() => setSimState('ESTOP')}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all ${
                  simState === 'ESTOP'
                    ? 'bg-rose-950/60 border-rose-500/50 text-rose-400 font-bold shadow-md shadow-rose-500/5'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${simState === 'ESTOP' ? 'bg-rose-400 animate-ping' : 'bg-rose-500/60'}`}></span>
                  <span>4. Emergency E-Stop</span>
                </div>
                <span className="text-[10px] text-slate-500">GPIO Shutdown</span>
              </button>
            </div>
            
            {!activeMill.supportsCope && (
              <p className="text-[10px] text-slate-500 mt-3 text-center italic">
                * Active motor-decoupling requires a Renk COPE drive (available on Raw Mill 1).
              </p>
            )}
          </div>

        </div>

        {/* Center Panels: Drivetrain Map & Telemetry Oscilloscopes */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Drivetrain Mechanical Map - Show visual flow */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Mill Mechanical Train Status Map
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${getDrivetrainStatus().bg}`}>
                {getDrivetrainStatus().label}
              </span>
            </div>

            {/* Graphic Layout blocks */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              
              {/* Grinding Table */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-500 ${
                simState === 'ESTOP' 
                  ? 'border-rose-900/40 bg-slate-950/30 text-slate-500' 
                  : 'border-slate-850 bg-slate-900/30'
              }`}>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Stage 1: Processing</div>
                  <div className="text-xs font-bold text-slate-300 mt-1">Grinding Table</div>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Speed:</span>
                  <span className="text-slate-300">{simState === 'ESTOP' ? '0 RPM' : activeMill.tableSpeed}</span>
                </div>
              </div>

              {/* Main Gearbox Housing */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-500 ${
                simState === 'ESTOP' 
                  ? 'border-rose-900/40 bg-slate-950/30 text-slate-500' 
                  : 'border-slate-850 bg-slate-900/30'
              }`}>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Stage 2: Transmission</div>
                  <div className="text-xs font-bold text-slate-300 mt-1">Gearbox Shell</div>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Lubrication:</span>
                  <span className="text-emerald-400 font-bold">OK</span>
                </div>
              </div>

              {/* Input Shaft Bearing Zone - Primary alert location! */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-500 ${
                simState === 'ESTOP'
                  ? 'border-rose-500 bg-rose-950/10 text-slate-400'
                  : simState === 'FAULT'
                    ? 'border-amber-500 bg-amber-500/5 text-slate-200 animate-pulse'
                    : 'border-slate-850 bg-slate-900/30'
              }`}>
                <div>
                  <div className="flex justify-between items-start">
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Stage 3: Sensor Zone</div>
                    <Thermometer className={`w-3.5 h-3.5 ${simState === 'FAULT' ? 'text-amber-500 animate-bounce' : 'text-slate-500'}`} />
                  </div>
                  <div className="text-xs font-bold text-slate-300 mt-1">Input Shaft Bearing</div>
                </div>
                
                {simState === 'FAULT' ? (
                  <div className="mt-2 text-[10px] text-amber-500 font-medium leading-tight">
                    Micro-spall detected via high-frequency AE. Vibration normal.
                  </div>
                ) : simState === 'ESTOP' ? (
                  <div className="mt-2 text-[10px] text-rose-500 font-medium leading-tight">
                    Shutdown: Emergency stop triggered.
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Bearing Temp:</span>
                    <span className="text-slate-300">{liveSensors.temp}&deg;C</span>
                  </div>
                )}
              </div>

              {/* Redundant Motors Stage */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-500 ${
                simState === 'ESTOP'
                  ? 'border-rose-900/40 bg-slate-950/30 text-slate-500'
                  : simState === 'MITIGATED' && activeMill.supportsCope
                    ? 'border-cyan-500 bg-cyan-950/10 text-slate-200'
                    : 'border-slate-850 bg-slate-900/30'
              }`}>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Stage 4: Propulsion</div>
                  <div className="text-xs font-bold text-slate-300 mt-1">Drivetrain Motors</div>
                </div>
                
                {simState === 'MITIGATED' && activeMill.supportsCope ? (
                  <div className="mt-2 text-[10px] text-cyan-400 font-medium leading-tight">
                    Active Redundancy: Motor 3 Decoupled. Operating at 85%.
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Drive Type:</span>
                    <span className="text-indigo-400 truncate max-w-[80px]" title={activeMill.driveType}>
                      {activeMill.driveType.split(' ')[0]}
                    </span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Scrolling FPGA Telemetry Oscilloscopes - Live wave feedback */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col flex-1">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Edge FPGA Telemetry Oscilloscopes
                </span>
              </div>
              <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-900 font-mono">
                Real-Time Stream
              </span>
            </div>

            {/* Telemetry charts stack */}
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Scope 1: Vibration Velocity (Low frequency) */}
              <div className="flex-1 bg-slate-950/40 border border-slate-850 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-2">
                  <span className="font-bold text-cyan-400">VIBRATION VELOCITY (LOW-FREQUENCY ISO LIMIT)</span>
                  <span>{liveSensors.vibration} mm/s (Limit: 4.5 mm/s)</span>
                </div>
                
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={telemetryHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVib" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={[0, 6]} />
                      <Area 
                        type="monotone" 
                        dataKey="vibration" 
                        stroke="#06b6d4" 
                        fillOpacity={1} 
                        fill="url(#colorVib)" 
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scope 2: Acoustic Emission Stress waves (High frequency) */}
              <div className="flex-1 bg-slate-950/40 border border-slate-850 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-2">
                  <span className="font-bold text-indigo-400">ACOUSTIC EMISSION (HIGH-FREQUENCY EDGE AI)</span>
                  <span>{liveSensors.acoustic} dB (Limit: 85 dB)</span>
                </div>
                
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={telemetryHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAE" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={[0, 120]} />
                      <Area 
                        type="monotone" 
                        dataKey="acoustic" 
                        stroke="#6366f1" 
                        fillOpacity={1} 
                        fill="url(#colorAE)" 
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Circular Gauge, Action Plan & FPGA Status */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Health Index Ring Gauge & AI Classification */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">
              Equipment Health Index
            </span>
            
            {/* Custom SVG Ring Progress Gauge */}
            <div className="relative w-32 h-32 flex items-center justify-center">
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
                  stroke={`url(#gauge-gradient-${selectedMillId}-${simState})`}
                  strokeWidth="8" fill="transparent" 
                  strokeDasharray={263.8}
                  strokeDashoffset={263.8 - (263.8 * Math.min(100, liveSensors.ehi)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id={`gauge-gradient-${selectedMillId}-${simState}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={liveSensors.ehi >= 85 ? "#10b981" : (liveSensors.ehi >= 70 ? "#06b6d4" : (liveSensors.ehi >= 50 ? "#f59e0b" : "#f43f5e"))} />
                    <stop offset="100%" stopColor={liveSensors.ehi >= 85 ? "#34d399" : (liveSensors.ehi >= 70 ? "#3b82f6" : (liveSensors.ehi >= 50 ? "#fb923c" : "#ef4444"))} />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold font-mono tracking-tighter ${getEHIColor(liveSensors.ehi).split(' ')[0]}`}>
                  {liveSensors.ehi}%
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Points</span>
              </div>
            </div>

            {/* AI Diagnostics status pill */}
            <div className="mt-4 w-full">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">AI Classification Status</div>
              <div className={`mt-1.5 text-xs font-bold border px-2.5 py-1.5 rounded-lg leading-tight ${getEHIColor(liveSensors.ehi)}`}>
                {simState === 'NORMAL' && "Healthy Operation Baseline (99.8%)"}
                {simState === 'FAULT' && "Bearing Outer-Race Micro-Spall (94.2%)"}
                {simState === 'MITIGATED' && (activeMill.supportsCope ? "Active Redundancy: Motor Decoupled" : "Bearing Outer-Race Micro-Spall (94.2%)")}
                {simState === 'ESTOP' && "Automatic Protective Shutoff Active"}
              </div>
            </div>
          </div>

          {/* Edge AI Action Recommendation & Judge's Key Takeaway */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 flex-grow">
            
            {/* Operator Recommendation */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5 mb-2">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>Edge AI Action Plan</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {simState === 'NORMAL' && "Normal baseline signals confirmed. Continuous monitoring active. No operator actions required."}
                {simState === 'FAULT' && "ALERT: High-frequency stress waves indicate localized cracking in input bearing races. Vibration levels are stable. Action: Schedule maintenance check within the next 8 days."}
                {simState === 'MITIGATED' && (activeMill.supportsCope 
                  ? "NOTICE: Dynamic motor decoupling triggered automatically. Mill load balanced across remaining 7 motors. Schedule inspection during next routine weekly shutdown."
                  : "ALERT: High-frequency stress waves indicate localized cracking. Drive type does not support decoupling. Action: Schedule immediate check.")}
                {simState === 'ESTOP' && "CRITICAL HALT: Vibration exceeded safety threshold. FPGA triggered automatic E-Stop halt to prevent mechanical shearing. Inspect gearbox before restarting."}
              </p>
            </div>

            {/* Judge's Highlight Takeaway - The core value explanation */}
            <div className="mt-auto bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 flex flex-col gap-2">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Judge's Core Takeaway</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {simState === 'NORMAL' && "Parallel wavelet filtering removes table crushing noises locally. Rather than streaming heavy raw data to the cloud, the edge node only transmits simple EHI updates, eliminating bandwidth bottlenecks."}
                {simState === 'FAULT' && "Observe that Vibration and Temperature are still green. Standard SCADA systems are blind to early cracks. High-frequency Acoustic Emission catches defects 8 days earlier, preventing catastrophic failures."}
                {simState === 'MITIGATED' && "Under localized torque stress, the edge controller decouples the damaged motor module. This provides active redundancy, avoiding unplanned downtime and keeping the plant running safely."}
                {simState === 'ESTOP' && "Industrial safety requires immediate action. Operating systems introduce milliseconds of lag. The FPGA co-processor responds in 28 microseconds, halting the system before catastrophic shearing occurs."}
              </p>
            </div>
            
          </div>

          {/* FPGA Technical Metrics Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3 text-slate-300 font-bold text-xs uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Edge Hardware Specifications</span>
            </div>
            
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between pb-1.5 border-b border-slate-850">
                <span className="text-slate-500">Board Module:</span>
                <span className="text-slate-300">{activeMill.supportsCope ? "Xilinx Zynq-7020" : "Terasic DE10-Lite"}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-850">
                <span className="text-slate-500">ADC Sampling Rate:</span>
                <span className="text-slate-300">500,000 samples/sec</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-850">
                <span className="text-slate-500">CNN Model Format:</span>
                <span className="text-indigo-400">Int8 Quantized CNN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Logic Resources:</span>
                <span className="text-emerald-400">14.5% Util (Optimized)</span>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Premium Footer */}
      <footer className="border-t border-slate-900 bg-slate-900/10 px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
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
