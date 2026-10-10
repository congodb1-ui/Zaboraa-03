import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  Wifi,
  HardDrive,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Activity,
  Play
} from 'lucide-react';

export const DRPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [protectedVMs, setProtectedVMs] = useState<number>(120);
  const [protectedStorageTB, setProtectedStorageTB] = useState<number>(45);
  const [dailyChangeRatePercent, setDailyChangeRatePercent] = useState<number>(5);
  const [targetRpoMinutes, setTargetRpoMinutes] = useState<number>(60); // 60 min (1 hr)
  const [wanBandwidthMbps, setWanBandwidthMbps] = useState<number>(1000); // 1 Gbps
  const [compressionRatio, setCompressionRatio] = useState<number>(35); // 35% reduction

  const calculations = useMemo(() => {
    const totalStorageGB = protectedStorageTB * 1024;
    // Daily changed data in GB
    const dailyChangeGB = totalStorageGB * (dailyChangeRatePercent / 100);
    // Compressed daily change
    const compressedDailyGB = dailyChangeGB * (1 - compressionRatio / 100);

    // Delta per RPO interval
    const intervalsPerDay = (24 * 60) / targetRpoMinutes;
    const deltaPerIntervalGB = compressedDailyGB / intervalsPerDay;
    const deltaPerIntervalMb = deltaPerIntervalGB * 8 * 1024; // Megabits

    // Required bandwidth: transfer must finish in 70% of RPO window for safety margin
    const transferWindowSeconds = targetRpoMinutes * 60 * 0.7;
    const requiredBandwidthMbps = Math.round(deltaPerIntervalMb / transferWindowSeconds);

    // Bandwidth utilization check
    const bandwidthUtilizationPercent = Math.min(200, Math.round((requiredBandwidthMbps / wanBandwidthMbps) * 100));
    const isBandwidthAdequate = requiredBandwidthMbps <= wanBandwidthMbps;

    // Initial baseline seeding time (full storage compressed)
    const compressedTotalStorageMb = totalStorageGB * (1 - compressionRatio / 100) * 8 * 1024;
    const initialSeedSeconds = compressedTotalStorageMb / (wanBandwidthMbps * 0.85); // 85% effective line
    const initialSeedHours = Math.round((initialSeedSeconds / 3600) * 10) / 10;
    const initialSeedDays = Math.round((initialSeedHours / 24) * 10) / 10;

    // SRM Protection Groups (Max ~50-80 VMs per PG for deterministic recovery)
    const recommendedProtectionGroups = Math.max(1, Math.ceil(protectedVMs / 40));

    // Estimated RTO breakdown (minutes)
    const rtoInfrastructureMin = 8;
    const rtoTier0Min = 5; // AD, DNS
    const rtoTier1Min = 15; // Databases
    const rtoTier2Min = 12; // App Middleware
    const rtoTier3Min = 6; // Web / Ingress
    const totalEstimatedRtoMin = rtoInfrastructureMin + rtoTier0Min + rtoTier1Min + rtoTier2Min + rtoTier3Min;

    return {
      dailyChangeGB: Math.round(dailyChangeGB),
      compressedDailyGB: Math.round(compressedDailyGB),
      deltaPerIntervalGB: Math.round(deltaPerIntervalGB * 10) / 10,
      requiredBandwidthMbps,
      bandwidthUtilizationPercent,
      isBandwidthAdequate,
      initialSeedHours,
      initialSeedDays,
      recommendedProtectionGroups,
      totalEstimatedRtoMin,
      rtoBreakdown: [
        { phase: 'SDDC & Recovery Bubble Network Init', time: rtoInfrastructureMin, color: 'bg-cyan-500' },
        { phase: 'Tier 0: Active Directory & Core DNS', time: rtoTier0Min, color: 'bg-emerald-500' },
        { phase: 'Tier 1: Enterprise Databases & SAP Backend', time: rtoTier1Min, color: 'bg-rose-500' },
        { phase: 'Tier 2: Business Logic & Application Layer', time: rtoTier2Min, color: 'bg-indigo-500' },
        { phase: 'Tier 3: Public Ingress & Web Services', time: rtoTier3Min, color: 'bg-teal-500' }
      ]
    };
  }, [
    protectedVMs,
    protectedStorageTB,
    dailyChangeRatePercent,
    targetRpoMinutes,
    wanBandwidthMbps,
    compressionRatio
  ]);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link to="/tools" className="hover:text-cyan-400 transition-colors">Engineering Workbench</Link>
          <span>/</span>
          <span className="text-cyan-300">DR RPO/RTO & Replication Calculator</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Disaster Recovery RPO/RTO & WAN Bandwidth Calculator
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Model vSphere Replication delta changes, compute required WAN bandwidth for stringent RPO thresholds, size Site Recovery Manager (SRM) protection groups, and project multi-tier failover recovery times.
            </p>
          </div>
          <button
            onClick={() => {
              try {
                localStorage.setItem('zaboraa_dr_export', JSON.stringify({
                  vms: protectedVMs,
                  storageTB: protectedStorageTB,
                  rpoMin: targetRpoMinutes,
                  wanMbps: wanBandwidthMbps,
                  requiredBandwidthMbps: calculations.requiredBandwidthMbps,
                  rtoMin: calculations.totalEstimatedRtoMin,
                  timestamp: new Date().toISOString()
                }));
              } catch {}
              navigate('/tools/design-generator');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
          >
            <span>Pass to Blueprint Generator</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-400" />
                <span>Replication & Disaster Recovery Parameters</span>
              </h2>
              <button
                onClick={() => {
                  setProtectedVMs(120);
                  setProtectedStorageTB(45);
                  setDailyChangeRatePercent(5);
                  setTargetRpoMinutes(60);
                  setWanBandwidthMbps(1000);
                  setCompressionRatio(35);
                }}
                className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Slider 1: Protected VMs */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Protected Virtual Machines</span>
                <span className="font-mono text-cyan-300 font-bold">{protectedVMs} VMs</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={protectedVMs}
                onChange={e => setProtectedVMs(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded cursor-pointer"
              />
            </div>

            {/* Slider 2: Protected Storage */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Aggregate Protected Datastore Footprint</span>
                <span className="font-mono text-cyan-300 font-bold">{protectedStorageTB} TB</span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={protectedStorageTB}
                onChange={e => setProtectedStorageTB(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded cursor-pointer"
              />
            </div>

            {/* Select 3: Target RPO */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Target Recovery Point Objective (RPO)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { label: '15 Minutes', val: 15 },
                  { label: '30 Minutes', val: 30 },
                  { label: '1 Hour (Standard)', val: 60 },
                  { label: '4 Hours (Tier 2)', val: 240 },
                ].map(rpo => (
                  <button
                    key={rpo.val}
                    onClick={() => setTargetRpoMinutes(rpo.val)}
                    className={`p-2.5 rounded-lg border font-mono text-center transition-colors cursor-pointer ${
                      targetRpoMinutes === rpo.val
                        ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {rpo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 4: Daily Data Change Rate % */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Daily Data Change Rate</span>
                <span className="font-mono text-rose-300 font-bold">{dailyChangeRatePercent}% / day ({calculations.dailyChangeGB} GB/day)</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={dailyChangeRatePercent}
                onChange={e => setDailyChangeRatePercent(Number(e.target.value))}
                className="w-full accent-rose-400 bg-slate-800 h-2 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1% (Read-heavy)</span>
                <span>5% (Enterprise Avg)</span>
                <span>10% (Transactional DB)</span>
                <span>20% (Heavy churn)</span>
              </div>
            </div>

            {/* Dedicated WAN Speed Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Dedicated Replication WAN Throughput</span>
                <span className="font-mono text-cyan-300 font-bold">{wanBandwidthMbps >= 1000 ? `${wanBandwidthMbps / 1000} Gbps` : `${wanBandwidthMbps} Mbps`}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { label: '100 Mbps', val: 100 },
                  { label: '500 Mbps', val: 500 },
                  { label: '1 Gbps', val: 1000 },
                  { label: '10 Gbps', val: 10000 },
                ].map(wan => (
                  <button
                    key={wan.val}
                    onClick={() => setWanBandwidthMbps(wan.val)}
                    className={`p-2 rounded-lg border font-mono text-center transition-colors cursor-pointer ${
                      wanBandwidthMbps === wan.val
                        ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {wan.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Calculations (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="space-y-1">
              <div className="text-xs font-mono text-rose-400 uppercase tracking-wider font-semibold">
                Bandwidth & Replication Assessment
              </div>
              <h3 className="text-xl font-bold text-white">
                WAN Replication Sizing
              </h3>
            </div>

            {/* Bandwidth Requirement Verdict */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                calculations.isBandwidthAdequate
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
              }`}
            >
              {calculations.isBandwidthAdequate ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <div className="font-bold text-white">
                  {calculations.isBandwidthAdequate
                    ? 'Target RPO Achievable on Current WAN'
                    : 'WAN Capacity Warning: RPO at Risk'}
                </div>
                <div className="text-slate-300">
                  Required throughput: <span className="font-mono font-bold text-white">{calculations.requiredBandwidthMbps} Mbps</span> ({calculations.bandwidthUtilizationPercent}% of line).
                </div>
              </div>
            </div>

            {/* Baseline Seeding Time */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Initial Baseline Seeding Time:</span>
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  {calculations.initialSeedDays} Days ({calculations.initialSeedHours} hrs)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Duration required to transfer initial full data footprint ({protectedStorageTB} TB compressed) prior to delta synchronization.
              </p>
            </div>

            {/* Protection Groups & SRM Sizing */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300">
                Site Recovery Manager (SRM) Architecture:
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Recommended Protection Groups:</span>
                <span className="text-cyan-400 font-bold">{calculations.recommendedProtectionGroups} Groups</span>
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Total Estimated RTO Duration:</span>
                <span className="text-rose-400 font-bold">{calculations.totalEstimatedRtoMin} Minutes</span>
              </div>
            </div>

            {/* RTO Execution Timeline Simulation */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Simulated RTO Failover Sequencing ({calculations.totalEstimatedRtoMin} min)
              </div>
              <div className="space-y-2">
                {calculations.rtoBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300 truncate">{item.phase}</span>
                      <span className="font-mono text-cyan-300 font-bold shrink-0">{item.time}m</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color}`}
                        style={{ width: `${(item.time / calculations.totalEstimatedRtoMin) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
