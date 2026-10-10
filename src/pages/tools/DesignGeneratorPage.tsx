import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  HardDrive,
  Cpu,
  ShieldCheck,
  FileText,
  Download,
  Calendar,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  FolderGit2,
  RefreshCw,
  Server
} from 'lucide-react';
import { useCustomization } from '../../context/CustomizationContext';
import { GOOGLE_DRIVE_CONFIG } from '../../data/mediaAssets';

export const DesignGeneratorPage: React.FC = () => {
  const { setIsBriefingModalOpen } = useCustomization();

  // Inputs
  const [hyperscaler, setHyperscaler] = useState<'Azure AVS' | 'AWS VMC' | 'Google Cloud GCVE'>('Azure AVS');
  const [vmTier, setVmTier] = useState<number>(350);
  const [storageTierTB, setStorageTierTB] = useState<number>(120);
  const [storageStrategy, setStorageStrategy] = useState<'Decoupled NFS' | 'Native vSAN Only'>('Decoupled NFS');
  const [highAvailabilitySla, setHighAvailabilitySla] = useState<'Standard (99.9%)' | 'Mission Critical Dual-AZ (99.99%)'>('Standard (99.9%)');
  const [networkInterconnect, setNetworkInterconnect] = useState<'10 Gbps ExpressRoute / DirectConnect' | '1 Gbps Dedicated Peering'>('10 Gbps ExpressRoute / DirectConnect');
  const [importedNotice, setImportedNotice] = useState<string | null>(null);

  // Check for passed state from RVTools Analyzer or Sizing Tool
  useEffect(() => {
    try {
      const rvAssessment = localStorage.getItem('zaboraa_rvtools_assessment');
      if (rvAssessment) {
        const parsed = JSON.parse(rvAssessment);
        setVmTier(parsed.totalVMs || 350);
        setStorageTierTB(Math.round(parsed.totalStorageTB) || 120);
        setImportedNotice(`Imported from RVTools Analysis: ${parsed.totalVMs} VMs, ${parsed.totalStorageTB} TB storage`);
      } else {
        const sizingExport = localStorage.getItem('zaboraa_sizing_export');
        if (sizingExport) {
          const parsed = JSON.parse(sizingExport);
          if (parsed.provider) setHyperscaler(parsed.provider);
          if (parsed.vms) setVmTier(parsed.vms);
          if (parsed.storageTB) setStorageTierTB(parsed.storageTB);
          setImportedNotice(`Imported from Sizing Tool: ${parsed.vms} VMs, ${parsed.storageTB} TB`);
        }
      }
    } catch {}
  }, []);

  // Compute Bill of Materials (BOM)
  const nodeCount = Math.max(3, Math.ceil(vmTier / 60));
  const decoupledStorageTB = storageStrategy === 'Decoupled NFS' ? Math.round(storageTierTB * 0.7) : 0;
  const vsanStorageTB = storageTierTB - decoupledStorageTB;

  const handleExportJson = () => {
    const blueprintData = {
      title: `${hyperscaler} Production Hybrid Blueprint`,
      timestamp: new Date().toISOString(),
      architectureSpecs: {
        hyperscaler,
        workloadVMs: vmTier,
        aggregateStorageTB: storageTierTB,
        storageArchitecture: storageStrategy,
        decoupledStorageTB,
        vsanStorageTB,
        highAvailabilitySla,
        networkInterconnect,
        bareMetalNodes: nodeCount,
        clusterModel: hyperscaler === 'Azure AVS' ? 'AV36P' : hyperscaler === 'AWS VMC' ? 'i4i.metal' : 've1-standard-72'
      },
      deliverablesBOM: [
        { item: 'Bare-Metal VMware SDDC Nodes', count: `${nodeCount} Nodes`, spec: `${hyperscaler} Host` },
        { item: 'External Decoupled Storage Tier', count: `${decoupledStorageTB} TB`, spec: hyperscaler === 'Azure AVS' ? 'Azure NetApp Files (ANF)' : hyperscaler === 'AWS VMC' ? 'Amazon FSx ONTAP' : 'Google Cloud NetApp Volumes' },
        { item: 'VMware HCX Enterprise Mobility Fleet', count: '1 Service Mesh', spec: 'Interconnect (IX) + WAN Opt (WO) + Network Extension (NE)' },
        { item: 'NSX-T Edge Transport Cluster', count: '2 Large Edges', spec: 'Active-Active ECMP Tier-0 Gateway' },
        { item: 'Dedicated Cloud Express Interconnect', count: 'Dual Redundant', spec: networkInterconnect }
      ],
      cloudDriveWorkspace: GOOGLE_DRIVE_CONFIG.folderUrl
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(blueprintData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Zaboraa_Blueprint_${hyperscaler.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link to="/tools" className="hover:text-cyan-400 transition-colors">Engineering Workbench</Link>
          <span>/</span>
          <span className="text-cyan-300">Automated Hybrid Blueprint Generator</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Automated Hybrid Infrastructure Blueprint Generator
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Synthesize sizing inputs and RVTools workload discovery into a validated production bill of materials (BOM), visual architecture specification, and cloud deliverable dossier.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Blueprint JSON</span>
            </button>
            <button
              onClick={() => setIsBriefingModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Architecture Review</span>
            </button>
          </div>
        </div>
      </div>

      {importedNotice && (
        <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-300 flex items-center justify-between">
          <span className="flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            {importedNotice}
          </span>
          <button
            onClick={() => setImportedNotice(null)}
            className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Generator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Specification Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Target Cloud & Parameters</span>
            </h2>

            {/* Hyperscaler */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Hyperscaler Platform</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['Azure AVS', 'AWS VMC', 'Google Cloud GCVE'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setHyperscaler(p)}
                    className={`py-2 px-2 rounded-lg border text-center font-medium transition-colors cursor-pointer text-xs ${
                      hyperscaler === p
                        ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* VMs */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Workload Footprint</span>
                <span className="font-mono text-cyan-300 font-bold">{vmTier} VMs</span>
              </div>
              <input
                type="range"
                min="50"
                max="1500"
                step="25"
                value={vmTier}
                onChange={e => setVmTier(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Storage */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Aggregate Storage</span>
                <span className="font-mono text-cyan-300 font-bold">{storageTierTB} TB</span>
              </div>
              <input
                type="range"
                min="20"
                max="600"
                step="10"
                value={storageTierTB}
                onChange={e => setStorageTierTB(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Storage Strategy */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Storage Architecture Model</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['Decoupled NFS', 'Native vSAN Only'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStorageStrategy(s)}
                    className={`py-2 px-2 rounded-lg border text-center transition-colors cursor-pointer ${
                      storageStrategy === s
                        ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* SLA & Interconnect */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Availability & SLA Target</label>
              <select
                value={highAvailabilitySla}
                onChange={e => setHighAvailabilitySla(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
              >
                <option value="Standard (99.9%)">Single-AZ Standard (99.9% SLA)</option>
                <option value="Mission Critical Dual-AZ (99.99%)">Dual-AZ Stretched Cluster (99.99% SLA)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Hybrid Cloud Peering</label>
              <select
                value={networkInterconnect}
                onChange={e => setNetworkInterconnect(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
              >
                <option value="10 Gbps ExpressRoute / DirectConnect">10 Gbps Dedicated Interconnect (ExpressRoute / DirectConnect)</option>
                <option value="1 Gbps Dedicated Peering">1 Gbps Cloud Interconnect</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right BOM & Visual Blueprint (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">Generated Specification</span>
                <h3 className="text-lg font-bold text-white">{hyperscaler} Architecture BOM</h3>
              </div>
              <span className="text-xs font-mono px-2 py-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 rounded">
                Validated
              </span>
            </div>

            {/* BOM Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Infrastructure Component</th>
                    <th className="py-2.5 px-3">Allocated Qty</th>
                    <th className="py-2.5 px-3">Specification Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                  <tr>
                    <td className="py-3 px-3 font-bold text-white">Bare-Metal SDDC Hosts</td>
                    <td className="py-3 px-3 text-cyan-400 font-bold">{nodeCount} Hosts</td>
                    <td className="py-3 px-3 text-slate-400 font-sans">
                      {hyperscaler === 'Azure AVS' ? 'AV36P Intel Xeon Gold (36 cores, 576 GB RAM)' : hyperscaler === 'AWS VMC' ? 'i4i.metal (64 cores, 1024 GB RAM)' : 've1-standard-72 (72 cores, 768 GB RAM)'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-white">Decoupled External Storage</td>
                    <td className="py-3 px-3 text-cyan-400 font-bold">{decoupledStorageTB} TB</td>
                    <td className="py-3 px-3 text-slate-400 font-sans">
                      {hyperscaler === 'Azure AVS' ? 'Azure NetApp Files NFS Datastore' : hyperscaler === 'AWS VMC' ? 'Amazon FSx for NetApp ONTAP' : 'Google Cloud NetApp Volumes'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-white">VMware HCX Mobility Fleet</td>
                    <td className="py-3 px-3 text-cyan-400 font-bold">1 Mesh</td>
                    <td className="py-3 px-3 text-slate-400 font-sans">
                      HCX Cloud + Enterprise License (Interconnect, Network Extension, WAN Opt)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-white">NSX-T Edge Gateway Cluster</td>
                    <td className="py-3 px-3 text-cyan-400 font-bold">2 Large Nodes</td>
                    <td className="py-3 px-3 text-slate-400 font-sans">
                      Tier-0 Active-Active ECMP Gateway with BGP Route Peering
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-white">Hybrid Cloud Peering</td>
                    <td className="py-3 px-3 text-cyan-400 font-bold">Dual Circuit</td>
                    <td className="py-3 px-3 text-slate-400 font-sans">{networkInterconnect}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Google Drive Direct Folder Action Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/40 shrink-0">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Google Drive Shared Workspace</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Save this blueprint JSON to your shared Google Drive folder for team collaboration.
                  </div>
                </div>
              </div>
              <a
                href={GOOGLE_DRIVE_CONFIG.folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shrink-0"
              >
                <span>Open Drive Folder</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* CTA action */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleExportJson}
                className="w-full sm:w-1/2 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Download Blueprint Dossier</span>
              </button>
              <button
                onClick={() => setIsBriefingModalOpen(true)}
                className="w-full sm:w-1/2 py-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Principal Architect Review</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
