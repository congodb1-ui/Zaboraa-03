import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Activity,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  Server,
  Cloud,
  Network,
  Cpu,
  Lock,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

interface MigrationTrafficSimulatorProps {
  hyperscaler: 'azure' | 'aws' | 'gcp';
  className?: string;
}

type SimulationScenario = 'rav-replication' | 'mon-hairpin' | 'live-vmotion' | 'dfw-microseg';

export const MigrationTrafficSimulator: React.FC<MigrationTrafficSimulatorProps> = ({
  hyperscaler,
  className = ''
}) => {
  const [scenario, setScenario] = useState<SimulationScenario>('rav-replication');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [monEnabled, setMonEnabled] = useState<boolean>(true);
  const [packetCount, setPacketCount] = useState<number>(1420);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Animation cycle
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 100);
      setPacketCount((prev) => prev + Math.floor(Math.random() * 5 + 1));
    }, Math.max(20, 50 / speed));

    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  // Hyperscaler branding details
  const cloudInfo = {
    azure: {
      name: 'Azure VMware Solution (AVS)',
      circuit: 'ExpressRoute FastPath (100 Gbps)',
      circuitMtu: '9000 Jumbo Frames',
      edgeRouter: 'MSEE & Route Server',
      storageTarget: 'Azure NetApp Files & vSAN',
      accentColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/40',
      badgeBg: 'bg-cyan-950/60 border-cyan-800 text-cyan-300'
    },
    aws: {
      name: 'VMware Cloud on AWS (VMC)',
      circuit: 'AWS Direct Connect (DX) + TGW',
      circuitMtu: '8900 Jumbo Frames',
      edgeRouter: 'Transit Gateway & Connected VPC ENI',
      storageTarget: 'Amazon FSx ONTAP & NVMe vSAN',
      accentColor: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      badgeBg: 'bg-amber-950/60 border-amber-800 text-amber-300'
    },
    gcp: {
      name: 'Google Cloud VMware Engine (GCVE)',
      circuit: 'Partner / Dedicated Cloud Interconnect',
      circuitMtu: '1500 Standard MTU',
      edgeRouter: 'Cloud Router & PSA VPC Peering',
      storageTarget: 'Google Cloud NetApp Volumes & vSAN',
      accentColor: 'text-blue-400',
      borderColor: 'border-blue-500/40',
      badgeBg: 'bg-blue-950/60 border-blue-800 text-blue-300'
    }
  }[hyperscaler];

  // Calculate packet position along path (0% to 100%)
  const packetProgress = activeStep;

  return (
    <div className={`p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-5 ${className}`}>
      {/* Top Header & Scenario Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>Real-Time Network Datapath & Traffic Simulator</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Hybrid Traffic Flow: On-Premises ➔ {cloudInfo.name}</span>
          </h3>
        </div>

        {/* Controls: Play/Pause, Speed, Reset */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isPlaying ? 'Pause' : 'Play Flow'}</span>
          </button>

          <button
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 0.5 : 1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-slate-700 transition-colors"
            title="Toggle simulation speed"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{speed}x</span>
          </button>

          <button
            onClick={() => {
              setActiveStep(0);
              setPacketCount(100);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title="Reset counter"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scenario Pill Buttons */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-slate-400 uppercase text-[11px] mr-1">Traffic Pattern:</span>

        <button
          onClick={() => setScenario('rav-replication')}
          className={`px-3 py-1.5 rounded-lg transition-all border font-semibold flex items-center gap-1.5 ${
            scenario === 'rav-replication'
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-500/20'
              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>HCX RAV Disk Replication</span>
        </button>

        <button
          onClick={() => setScenario('mon-hairpin')}
          className={`px-3 py-1.5 rounded-lg transition-all border font-semibold flex items-center gap-1.5 ${
            scenario === 'mon-hairpin'
              ? 'bg-indigo-950/80 border-indigo-400 text-indigo-300 shadow-md ring-1 ring-indigo-500/20'
              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-3.5 h-3.5 text-indigo-400" />
          <span>L2 Extension & MON Routing</span>
        </button>

        <button
          onClick={() => setScenario('live-vmotion')}
          className={`px-3 py-1.5 rounded-lg transition-all border font-semibold flex items-center gap-1.5 ${
            scenario === 'live-vmotion'
              ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-500/20'
              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>Zero-Downtime Live vMotion</span>
        </button>

        <button
          onClick={() => setScenario('dfw-microseg')}
          className={`px-3 py-1.5 rounded-lg transition-all border font-semibold flex items-center gap-1.5 ${
            scenario === 'dfw-microseg'
              ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-md ring-1 ring-emerald-500/20'
              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>NSX Zero-Trust DFW Filter</span>
        </button>
      </div>

      {/* Special Toggle for MON Scenario */}
      {scenario === 'mon-hairpin' && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-white flex items-center gap-2">
              <span>Traffic Tromboning / Hairpin Mode:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${monEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                {monEnabled ? 'MON ACTIVE (LOCAL BREAKOUT)' : 'MON DISABLED (HAIRPINNED)'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              {monEnabled
                ? 'Cloud VMs break out locally through NSX Tier-1 to Internet & Cloud PaaS (Latency: ~1.8 ms)'
                : 'Cloud VMs trombone all internet and local traffic back across the WAN to on-premises default gateway (Latency: ~48.5 ms)'}
            </p>
          </div>

          <button
            onClick={() => setMonEnabled(!monEnabled)}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all border shrink-0 ${
              monEnabled
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-rose-900/80 text-rose-200 border-rose-700'
            }`}
          >
            {monEnabled ? 'Switch to Hairpin (Off)' : 'Enable MON (On)'}
          </button>
        </div>
      )}

      {/* Main Animated Visualization Canvas */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-5 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* 3 Major Structural Columns: On-Premises | Hybrid Underlay | Hyperscaler Cloud */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Column 1: On-Premises Data Center (4 cols) */}
          <div className="lg:col-span-4 p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-xs text-white">On-Premises Data Center</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800">
                Source Fabric
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">vSphere 7.0 / 8.0 Cluster</div>
                  <div className="text-[10px] font-mono text-slate-400">VMware vDS & CBT Enabled</div>
                </div>
                <Cpu className="w-4 h-4 text-purple-400" />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-cyan-300">HCX Connector & IX / NE</div>
                  <div className="text-[10px] font-mono text-slate-400">IPsec Engine (UDP 4500)</div>
                </div>
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>

              {!monEnabled && scenario === 'mon-hairpin' && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-[11px] text-rose-300 flex items-center gap-2 animate-pulse">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>On-Prem Default GW: Processing hairpin return traffic</span>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Hybrid Link & In-Transit Network Path (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
            <div className="text-center space-y-0.5">
              <div className="text-[11px] font-mono uppercase font-bold text-cyan-400">
                {cloudInfo.circuit}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                MTU: {cloudInfo.circuitMtu} · BGP AS 64512
              </div>
            </div>

            {/* Dynamic Animated Packet Pipe Graphic */}
            <div className="w-full relative h-10 rounded-full bg-slate-950 border border-slate-700/80 overflow-hidden flex items-center px-2 shadow-inner">
              {/* Pipe center line */}
              <div className="absolute inset-x-0 h-0.5 bg-slate-800" />

              {/* Animated Packet Pulses Traversing Pipe */}
              <div
                className="absolute h-5 rounded-full flex items-center justify-center px-2 text-[9px] font-mono font-bold shadow-lg transition-all duration-75"
                style={{
                  left: `${packetProgress}%`,
                  transform: 'translateX(-50%)',
                  backgroundColor:
                    scenario === 'dfw-microseg'
                      ? '#10b981'
                      : scenario === 'mon-hairpin' && !monEnabled
                      ? '#f43f5e'
                      : '#06b6d4',
                  color: '#020617',
                  boxShadow:
                    scenario === 'mon-hairpin' && !monEnabled
                      ? '0 0 16px rgba(244, 63, 94, 0.8)'
                      : '0 0 16px rgba(6, 182, 212, 0.8)'
                }}
              >
                <span>
                  {scenario === 'rav-replication'
                    ? 'RAV-BLK'
                    : scenario === 'live-vmotion'
                    ? 'vMotion-RAM'
                    : scenario === 'mon-hairpin' && !monEnabled
                    ? 'HAIRPIN-RET'
                    : 'IPsec-L2'}
                </span>
              </div>
            </div>

            {/* In-Transit Protocol Tag */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>AES-256-GCM Encapsulation · Zero Drops</span>
            </div>
          </div>

          {/* Column 3: Target Hyperscaler Cloud SDDC (4 cols) */}
          <div className={`lg:col-span-4 p-4 rounded-xl bg-slate-900/90 border ${cloudInfo.borderColor} space-y-3 shadow-lg`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Cloud className={`w-4 h-4 ${cloudInfo.accentColor}`} />
                <span className="font-bold text-xs text-white">{cloudInfo.name}</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${cloudInfo.badgeBg}`}>
                Destination
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">NSX Tier-0 / Tier-1 Gateway</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {monEnabled && scenario === 'mon-hairpin' ? 'MON /32 Local Routing' : cloudInfo.edgeRouter}
                  </div>
                </div>
                <Network className={`w-4 h-4 ${cloudInfo.accentColor}`} />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Target Datastore Tier</div>
                  <div className="text-[10px] font-mono text-slate-400">{cloudInfo.storageTarget}</div>
                </div>
                <Server className="w-4 h-4 text-emerald-400" />
              </div>

              {scenario === 'dfw-microseg' && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>DFW Kernel Filter: Zero-Trust rule validated at vNIC</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Telemetry HUD Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono uppercase text-slate-400">Total Packets Processed</div>
          <div className="text-base font-mono font-bold text-cyan-400 mt-0.5">
            {packetCount.toLocaleString()} pkts
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono uppercase text-slate-400">Underlay Wire Throughput</div>
          <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
            {scenario === 'rav-replication' ? '9.82 Gbps' : scenario === 'live-vmotion' ? '18.4 Gbps' : '1.24 Gbps'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono uppercase text-slate-400">Observed RTT Latency</div>
          <div className="text-base font-mono font-bold mt-0.5">
            {scenario === 'mon-hairpin' && !monEnabled ? (
              <span className="text-rose-400">48.5 ms (Trombone)</span>
            ) : (
              <span className="text-cyan-400">1.8 ms (Optimized)</span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono uppercase text-slate-400">Encryption Standard</div>
          <div className="text-base font-mono font-bold text-indigo-400 mt-0.5">
            AES-GCM-256
          </div>
        </div>
      </div>
    </div>
  );
};
