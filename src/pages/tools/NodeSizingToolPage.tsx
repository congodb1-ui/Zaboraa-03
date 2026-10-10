import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, HardDrive, ArrowRight, ShieldCheck, Zap, Info, Sliders, CheckCircle2, RotateCcw, Download } from 'lucide-react';

interface CloudPreset {
  name: string;
  provider: 'Azure AVS' | 'AWS VMC' | 'Google Cloud GCVE';
  nodeModel: string;
  nodeCores: number;
  nodeRamGB: number;
  rawStoragePerNodeTB: number;
  usableStoragePerNodeTB: number;
  nodeMonthlyCostUSD: number;
  externalStorageName: string;
  externalStorageCostPerTB: number;
}

const CLOUD_PRESETS: Record<string, CloudPreset> = {
  'avs-av36p': {
    name: 'Azure VMware Solution',
    provider: 'Azure AVS',
    nodeModel: 'AV36P (Intel Xeon Gold 6354)',
    nodeCores: 36,
    nodeRamGB: 576,
    rawStoragePerNodeTB: 15.4,
    usableStoragePerNodeTB: 11.5,
    nodeMonthlyCostUSD: 5200,
    externalStorageName: 'Azure NetApp Files (ANF Standard/Premium)',
    externalStorageCostPerTB: 180
  },
  'avs-av36': {
    name: 'Azure VMware Solution',
    provider: 'Azure AVS',
    nodeModel: 'AV36 (Intel Xeon Gold 6140)',
    nodeCores: 36,
    nodeRamGB: 576,
    rawStoragePerNodeTB: 15.4,
    usableStoragePerNodeTB: 11.5,
    nodeMonthlyCostUSD: 4800,
    externalStorageName: 'Azure NetApp Files (ANF)',
    externalStorageCostPerTB: 180
  },
  'avs-av48': {
    name: 'Azure VMware Solution',
    provider: 'Azure AVS',
    nodeModel: 'AV48 (Intel Xeon Platinum 8368)',
    nodeCores: 48,
    nodeRamGB: 768,
    rawStoragePerNodeTB: 23.0,
    usableStoragePerNodeTB: 17.2,
    nodeMonthlyCostUSD: 6500,
    externalStorageName: 'Azure NetApp Files (ANF)',
    externalStorageCostPerTB: 180
  },
  'avs-av52': {
    name: 'Azure VMware Solution',
    provider: 'Azure AVS',
    nodeModel: 'AV52 (Intel Xeon Platinum 8470Q)',
    nodeCores: 52,
    nodeRamGB: 1536,
    rawStoragePerNodeTB: 38.4,
    usableStoragePerNodeTB: 28.8,
    nodeMonthlyCostUSD: 8200,
    externalStorageName: 'Azure NetApp Files (ANF)',
    externalStorageCostPerTB: 180
  },
  'avs-av64': {
    name: 'Azure VMware Solution',
    provider: 'Azure AVS',
    nodeModel: 'AV64 (Intel Xeon Platinum 8470)',
    nodeCores: 64,
    nodeRamGB: 1024,
    rawStoragePerNodeTB: 30.7,
    usableStoragePerNodeTB: 24.0,
    nodeMonthlyCostUSD: 7800,
    externalStorageName: 'Azure NetApp Files (ANF)',
    externalStorageCostPerTB: 180
  },
  'vmc-i4i': {
    name: 'VMware Cloud on AWS',
    provider: 'AWS VMC',
    nodeModel: 'i4i.metal (Intel Xeon Ice Lake)',
    nodeCores: 64,
    nodeRamGB: 1024,
    rawStoragePerNodeTB: 30.0,
    usableStoragePerNodeTB: 20.5,
    nodeMonthlyCostUSD: 7800,
    externalStorageName: 'Amazon FSx for NetApp ONTAP (Multi-AZ)',
    externalStorageCostPerTB: 195
  },
  'vmc-i3en': {
    name: 'VMware Cloud on AWS',
    provider: 'AWS VMC',
    nodeModel: 'i3en.metal (Storage-Optimized)',
    nodeCores: 48,
    nodeRamGB: 768,
    rawStoragePerNodeTB: 60.0,
    usableStoragePerNodeTB: 45.0,
    nodeMonthlyCostUSD: 9200,
    externalStorageName: 'Amazon FSx for NetApp ONTAP',
    externalStorageCostPerTB: 195
  },
  'vmc-m7i': {
    name: 'VMware Cloud on AWS',
    provider: 'AWS VMC',
    nodeModel: 'm7i.metal-24xl (Compute-Intensive)',
    nodeCores: 96,
    nodeRamGB: 384,
    rawStoragePerNodeTB: 15.0,
    usableStoragePerNodeTB: 10.5,
    nodeMonthlyCostUSD: 6900,
    externalStorageName: 'Amazon FSx for NetApp ONTAP',
    externalStorageCostPerTB: 195
  },
  'gcve-ve1': {
    name: 'Google Cloud VMware Engine',
    provider: 'Google Cloud GCVE',
    nodeModel: 've1-standard-72 (Intel Xeon 6240)',
    nodeCores: 72,
    nodeRamGB: 768,
    rawStoragePerNodeTB: 19.2,
    usableStoragePerNodeTB: 14.0,
    nodeMonthlyCostUSD: 6400,
    externalStorageName: 'Google Cloud NetApp Volumes (GCNV)',
    externalStorageCostPerTB: 175
  },
  'gcve-ve2': {
    name: 'Google Cloud VMware Engine',
    provider: 'Google Cloud GCVE',
    nodeModel: 've2-standard-128 (Emerald Rapids)',
    nodeCores: 128,
    nodeRamGB: 2048,
    rawStoragePerNodeTB: 51.2,
    usableStoragePerNodeTB: 38.0,
    nodeMonthlyCostUSD: 11500,
    externalStorageName: 'Google Cloud NetApp Volumes (GCNV)',
    externalStorageCostPerTB: 175
  }
};

export const NodeSizingToolPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCloudKey, setSelectedCloudKey] = useState<string>('avs-av36p');
  const [vmCount, setVmCount] = useState<number>(300);
  const [avgVcpu, setAvgVcpu] = useState<number>(4);
  const [avgRamGB, setAvgRamGB] = useState<number>(16);
  const [totalStorageTB, setTotalStorageTB] = useState<number>(180);
  const [vCpuOvercommit, setVCpuOvercommit] = useState<number>(2.5);
  const [ramBufferPercent, setRamBufferPercent] = useState<number>(20);
  const [enableDecoupledStorage, setEnableDecoupledStorage] = useState<boolean>(true);
  const [decoupledOffloadPercent, setDecoupledOffloadPercent] = useState<number>(65);

  const preset = CLOUD_PRESETS[selectedCloudKey];

  const calculations = useMemo(() => {
    const totalRequiredVcpu = vmCount * avgVcpu;
    const effectiveCoresNeeded = totalRequiredVcpu / vCpuOvercommit;
    const computeNodesNeeded = Math.ceil(effectiveCoresNeeded / preset.nodeCores);

    const totalRawRam = vmCount * avgRamGB;
    const totalRamWithBuffer = totalRawRam * (1 + ramBufferPercent / 100);
    const memoryNodesNeeded = Math.ceil(totalRamWithBuffer / preset.nodeRamGB);

    // Pure vSAN Nodes calculation
    const vsanNodesNeeded = Math.ceil(totalStorageTB / preset.usableStoragePerNodeTB);
    const nodesWithoutDecoupled = Math.max(3, computeNodesNeeded, memoryNodesNeeded, vsanNodesNeeded);

    // With Decoupled External Storage
    let nodesWithDecoupled = nodesWithoutDecoupled;
    let externalStorageTB = 0;
    if (enableDecoupledStorage) {
      externalStorageTB = Math.round(totalStorageTB * (decoupledOffloadPercent / 100));
      const remainingStorageTB = Math.max(0, totalStorageTB - externalStorageTB);
      const reducedVsanNodes = Math.ceil(remainingStorageTB / preset.usableStoragePerNodeTB);
      // Nodes still bounded by compute, memory, and minimum cluster size of 3 nodes
      nodesWithDecoupled = Math.max(3, computeNodesNeeded, memoryNodesNeeded, reducedVsanNodes);
    }

    const nodeReduction = Math.max(0, nodesWithoutDecoupled - nodesWithDecoupled);
    const percentReduction = Math.round((nodeReduction / nodesWithoutDecoupled) * 100);

    // Monthly cost estimates
    const monthlyCostPure = nodesWithoutDecoupled * preset.nodeMonthlyCostUSD;
    const monthlyCostDecoupled =
      nodesWithDecoupled * preset.nodeMonthlyCostUSD +
      (enableDecoupledStorage ? externalStorageTB * preset.externalStorageCostPerTB : 0);
    const monthlySavings = Math.max(0, monthlyCostPure - monthlyCostDecoupled);
    const annualSavings = monthlySavings * 12;

    return {
      totalRequiredVcpu,
      totalRamGB: totalRawRam,
      computeNodesNeeded,
      memoryNodesNeeded,
      vsanNodesNeeded,
      nodesWithoutDecoupled,
      nodesWithDecoupled,
      nodeReduction,
      percentReduction,
      externalStorageTB,
      monthlyCostPure,
      monthlyCostDecoupled,
      monthlySavings,
      annualSavings
    };
  }, [
    vmCount,
    avgVcpu,
    avgRamGB,
    totalStorageTB,
    vCpuOvercommit,
    ramBufferPercent,
    enableDecoupledStorage,
    decoupledOffloadPercent,
    preset
  ]);

  const handleExportToGenerator = () => {
    // Store in localStorage or navigate with state
    try {
      localStorage.setItem('zaboraa_sizing_export', JSON.stringify({
        cloud: selectedCloudKey,
        provider: preset.provider,
        vms: vmCount,
        storageTB: totalStorageTB,
        nodes: calculations.nodesWithDecoupled,
        decoupledStorageTB: calculations.externalStorageTB,
        timestamp: new Date().toISOString()
      }));
    } catch {}
    navigate('/tools/design-generator');
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link to="/tools" className="hover:text-cyan-400 transition-colors">Engineering Workbench</Link>
          <span>/</span>
          <span className="text-cyan-300">Node Sizing & Decoupled Storage Estimator</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Multi-Cloud Node & Storage Sizing Estimator
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Model bare-metal node requirements and prevent storage-driven cluster sprawl by decoupling heavy capacity to enterprise NFS tiers (Azure NetApp Files, Amazon FSx ONTAP, Google Cloud NetApp Volumes).
            </p>
          </div>
          <button
            onClick={handleExportToGenerator}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
          >
            <span>Send to Blueprint Generator</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cloud & SKU Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AVS */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-mono font-bold text-cyan-400 uppercase">Azure VMware Solution (AVS)</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(['avs-av36p', 'avs-av36', 'avs-av48', 'avs-av64', 'avs-av52'] as const).map(k => (
              <button
                key={k}
                onClick={() => setSelectedCloudKey(k)}
                className={`p-2 rounded-lg text-left text-xs font-mono transition-all cursor-pointer border ${
                  selectedCloudKey === k
                    ? 'bg-cyan-950 border-cyan-400 text-white font-bold shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>{k.replace('avs-', '').toUpperCase()}</div>
                <div className="text-[9px] text-slate-500">{CLOUD_PRESETS[k].nodeCores}c · {CLOUD_PRESETS[k].nodeRamGB}G</div>
              </button>
            ))}
          </div>
        </div>

        {/* GCVE */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-mono font-bold text-blue-400 uppercase">Google Cloud VMware Engine (GCVE)</div>
          <div className="space-y-1.5">
            {(['gcve-ve1', 'gcve-ve2'] as const).map(k => (
              <button
                key={k}
                onClick={() => setSelectedCloudKey(k)}
                className={`w-full p-2.5 rounded-lg text-left text-xs font-mono transition-all cursor-pointer border ${
                  selectedCloudKey === k
                    ? 'bg-blue-950 border-blue-400 text-white font-bold shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>{CLOUD_PRESETS[k].nodeModel}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{CLOUD_PRESETS[k].nodeCores} Cores · {CLOUD_PRESETS[k].nodeRamGB} GiB · {CLOUD_PRESETS[k].usableStoragePerNodeTB} TiB</div>
              </button>
            ))}
          </div>
        </div>

        {/* VMC */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-mono font-bold text-amber-400 uppercase">VMware Cloud on AWS (VMC)</div>
          <div className="space-y-1.5">
            {(['vmc-i4i', 'vmc-i3en', 'vmc-m7i'] as const).map(k => (
              <button
                key={k}
                onClick={() => setSelectedCloudKey(k)}
                className={`w-full p-2 rounded-lg text-left text-xs font-mono transition-all cursor-pointer border ${
                  selectedCloudKey === k
                    ? 'bg-amber-950 border-amber-400 text-white font-bold shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>{CLOUD_PRESETS[k].nodeModel}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{CLOUD_PRESETS[k].nodeCores} Cores · {CLOUD_PRESETS[k].nodeRamGB} GiB · {CLOUD_PRESETS[k].usableStoragePerNodeTB} TiB</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Sizing Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Workload Parameters & SLA Assumptions</span>
              </h2>
              <button
                onClick={() => {
                  setVmCount(300);
                  setAvgVcpu(4);
                  setAvgRamGB(16);
                  setTotalStorageTB(180);
                  setVCpuOvercommit(2.5);
                  setRamBufferPercent(20);
                  setEnableDecoupledStorage(true);
                  setDecoupledOffloadPercent(65);
                }}
                className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Slider 1: VM Count */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Total Workload VMs</span>
                <span className="font-mono text-cyan-300 font-bold">{vmCount} VMs</span>
              </div>
              <input
                type="range"
                min="20"
                max="2000"
                step="10"
                value={vmCount}
                onChange={e => setVmCount(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>20 VMs</span>
                <span>500 VMs</span>
                <span>1000 VMs</span>
                <span>2000 VMs</span>
              </div>
            </div>

            {/* Grid 2: vCPU & RAM per VM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Avg vCPU per VM</span>
                  <span className="font-mono text-cyan-300 font-bold">{avgVcpu} vCPUs</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={avgVcpu}
                  onChange={e => setAvgVcpu(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Avg RAM per VM</span>
                  <span className="font-mono text-cyan-300 font-bold">{avgRamGB} GB</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="64"
                  step="2"
                  value={avgRamGB}
                  onChange={e => setAvgRamGB(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Slider 3: Total Storage Footprint */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Aggregate Provisioned Storage Footprint</span>
                <span className="font-mono text-cyan-300 font-bold">{totalStorageTB} TB</span>
              </div>
              <input
                type="range"
                min="10"
                max="800"
                step="5"
                value={totalStorageTB}
                onChange={e => setTotalStorageTB(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10 TB</span>
                <span>200 TB</span>
                <span>400 TB</span>
                <span>800 TB</span>
              </div>
            </div>

            {/* Advanced Overcommit & Buffer Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">vCPU Overcommit Ratio</label>
                <select
                  value={vCpuOvercommit}
                  onChange={e => setVCpuOvercommit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-slate-200 cursor-pointer"
                >
                  <option value={1.5}>1.5:1 (Ultra-conservative)</option>
                  <option value={2.0}>2.0:1 (Balanced Enterprise)</option>
                  <option value={2.5}>2.5:1 (Recommended Standard)</option>
                  <option value={3.0}>3.0:1 (High Density)</option>
                  <option value={4.0}>4.0:1 (VDI / Dev clusters)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">RAM N+1 HA & Buffer %</label>
                <select
                  value={ramBufferPercent}
                  onChange={e => setRamBufferPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-slate-200 cursor-pointer"
                >
                  <option value={15}>15% (Tight)</option>
                  <option value={20}>20% (Standard N+1)</option>
                  <option value={25}>25% (High Availability N+2)</option>
                  <option value={30}>30% (Future Growth headroom)</option>
                </select>
              </div>
            </div>

            {/* Decoupled Storage Switcher Box */}
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span>Decouple External Storage ({preset.externalStorageName})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Offload large VM disks to cloud-native NFS datastores to avoid adding idle CPU/RAM nodes.
                  </div>
                </div>
                <button
                  onClick={() => setEnableDecoupledStorage(!enableDecoupledStorage)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    enableDecoupledStorage ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      enableDecoupledStorage ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {enableDecoupledStorage && (
                <div className="space-y-2 pt-2 border-t border-cyan-500/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Capacity Offloaded to NFS Datastore</span>
                    <span className="font-mono text-cyan-300 font-bold">{decoupledOffloadPercent}% ({calculations.externalStorageTB} TB)</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    step="5"
                    value={decoupledOffloadPercent}
                    onChange={e => setDecoupledOffloadPercent(Number(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sizing Results & Savings (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Node Reduction Outcome Card */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="space-y-1">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Sizing Outcome & Cluster Footprint
              </div>
              <h3 className="text-xl font-bold text-white">
                Cluster Nodes Required
              </h3>
            </div>

            {/* Comparison Columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center space-y-1">
                <div className="text-[11px] text-slate-400 font-mono">Traditional vSAN Only</div>
                <div className="text-3xl font-black text-rose-400 font-mono">
                  {calculations.nodesWithoutDecoupled}
                </div>
                <div className="text-[10px] text-slate-500">Nodes (Storage Bound)</div>
              </div>

              <div className="p-4 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-center space-y-1">
                <div className="text-[11px] text-cyan-300 font-mono">With Decoupled Storage</div>
                <div className="text-3xl font-black text-cyan-300 font-mono">
                  {calculations.nodesWithDecoupled}
                </div>
                <div className="text-[10px] text-cyan-400 font-semibold">
                  {calculations.nodeReduction > 0 ? `-${calculations.nodeReduction} Nodes (-${calculations.percentReduction}%)` : 'Optimized'}
                </div>
              </div>
            </div>

            {/* Constraints Breakdown */}
            <div className="space-y-2 text-xs font-mono pt-2 border-t border-slate-800">
              <div className="text-slate-400 font-sans font-semibold">Bounding Dimension Analysis:</div>
              <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                <span>Compute Bound (vCPU):</span>
                <span>{calculations.computeNodesNeeded} nodes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                <span>Memory Bound (RAM):</span>
                <span>{calculations.memoryNodesNeeded} nodes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                <span>Raw Storage Bound (vSAN):</span>
                <span className="text-rose-400 font-bold">{calculations.vsanNodesNeeded} nodes</span>
              </div>
            </div>

            {/* Financial Savings Estimate */}
            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <Zap className="w-4 h-4" />
                <span>Estimated TCO Savings</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Monthly Run-Rate Savings</div>
                  <div className="text-lg font-bold text-emerald-300 font-mono">
                    ${calculations.monthlySavings.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Projected Annual Savings</div>
                  <div className="text-lg font-bold text-emerald-300 font-mono">
                    ${calculations.annualSavings.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA action */}
            <button
              onClick={handleExportToGenerator}
              className="w-full py-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <span>Apply Sizing to Hybrid Blueprint Generator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
