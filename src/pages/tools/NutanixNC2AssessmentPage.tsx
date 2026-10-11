import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Layers,
  HardDrive,
  ShieldCheck,
  ShieldAlert,
  Server,
  Cloud,
  ArrowRight,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Filter,
  Search,
  Sliders,
  Sparkles,
  ExternalLink,
  Zap,
  Network,
  Activity,
  FileSpreadsheet,
  Check,
  FileText
} from 'lucide-react';
import { SAMPLE_ENTERPRISE_VMS, ParsedVMRecord } from '../../data/sampleRvToolsData';
import {
  AzureBareMetalSku,
  ReplicationFactor,
  AhvReadinessCategory,
  AZURE_NC2_NODE_SPECS,
  NutanixClusterConfig,
  DEFAULT_NUTANIX_CONFIG,
  EvaluatedNutanixVM,
  generateNutanixAssessmentReport,
  parseNutanixRVToolsFile
} from '../../services/nutanixAssessmentService';

export const NutanixNC2AssessmentPage: React.FC = () => {
  // Raw inventory state
  const [vmInventory, setVmInventory] = useState<ParsedVMRecord[]>(SAMPLE_ENTERPRISE_VMS);
  const [isUsingSampleData, setIsUsingSampleData] = useState<boolean>(true);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cluster sizing configuration state
  const [config, setConfig] = useState<NutanixClusterConfig>(DEFAULT_NUTANIX_CONFIG);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'sizing' | 'readiness' | 'waves' | 'inventory'>('overview');

  // Inventory filtering state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');

  // Selected VM for deep dive modal/inspection
  const [inspectedVm, setInspectedVm] = useState<EvaluatedNutanixVM | null>(null);

  // Status message
  const [notification, setNotification] = useState<string>('');

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // Generate assessment report memoized based on inventory & config
  const report = useMemo(() => {
    return generateNutanixAssessmentReport(vmInventory, config);
  }, [vmInventory, config]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      const parsed = await parseNutanixRVToolsFile(file);
      setVmInventory(parsed);
      setIsUsingSampleData(false);
      setUploadedFileName(file.name);
      triggerNotification(`Loaded ${parsed.length} VMs from ${file.name}`);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse RVTools file. Verify sheet structure.');
    }
  };

  // Reset to sample data
  const handleLoadSample = () => {
    setVmInventory(SAMPLE_ENTERPRISE_VMS);
    setIsUsingSampleData(true);
    setUploadedFileName('');
    setUploadError('');
    triggerNotification('Loaded 148 Enterprise RVTools Sample Workloads');
  };

  // Filtered inventory list
  const filteredVms = useMemo(() => {
    return report.evaluatedVms.filter(vm => {
      const matchesSearch =
        vm.vmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vm.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vm.cluster || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory =
        categoryFilter === 'all' || vm.ahvCategory === categoryFilter;

      const matchesScope =
        scopeFilter === 'all' ||
        (scopeFilter === 'inScope' && vm.scope !== 'Out of Scope') ||
        (scopeFilter === 'outOfScope' && vm.scope === 'Out of Scope');

      return matchesSearch && matchesCategory && matchesScope;
    });
  }, [report.evaluatedVms, searchTerm, categoryFilter, scopeFilter]);

  // Export Assessment as CSV
  const handleExportCSV = () => {
    const headers = [
      'VM Name',
      'Scope',
      'Power State',
      'vCPUs',
      'RAM GiB',
      'Used Storage GiB',
      'Provisioned GiB',
      'Guest OS',
      'AHV Readiness Category',
      'VirtIO Required',
      'Storage Controller Translation',
      'vNIC Modernization',
      'RDM Flag',
      'Multi-Writer Flag',
      'Recommended Move Method',
      'Suggested Wave',
      'Target Azure Flow Subnet'
    ];

    const rows = report.evaluatedVms.map(vm => [
      `"${vm.vmName}"`,
      `"${vm.scope}"`,
      `"${vm.powerState}"`,
      vm.cpus,
      vm.memoryGiB,
      vm.inUseDiskGiB,
      vm.provisionedDiskGiB,
      `"${vm.os}"`,
      `"${vm.ahvCategory}"`,
      vm.virtIoRequired ? 'Yes' : 'No',
      `"${vm.controllerRemediation}"`,
      `"${vm.vnicRemediation}"`,
      vm.rdmWarning ? `"${vm.rdmWarning}"` : 'None',
      vm.multiWriterWarning ? `"${vm.multiWriterWarning}"` : 'None',
      `"${vm.recommendedMoveMethod}"`,
      `"Wave 0${vm.suggestedWave}"`,
      `"${vm.targetVNetSubnet}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nutanix_NC2_Azure_Assessment_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    triggerNotification('Nutanix NC2 Assessment CSV Exported');
  };

  // Export Executive Markdown Report
  const handleExportMarkdown = () => {
    const s = report.sizing;
    const md = `# VMware SDDC to Nutanix NC2 on Azure Migration Assessment Report
Generated: ${new Date().toLocaleDateString()} | Confidential Architecture Assessment

## 1. Executive Summary
- Total Evaluated Virtual Machines: ${report.summary.totalVMs}
- In-Scope Workloads: ${report.summary.inScopeVMs} (${report.summary.readyPercent}% Direct / Automated Move Ready)
- Flagged Architectural Items: ${report.summary.flaggedPercent}% (RDMs, Multi-Writer, Legacy Controllers)
- Target Cloud Environment: Nutanix Cloud Clusters (NC2) on Microsoft Azure
- Recommended Bare-Metal Hardware: ${s.totalRecommendedNodes}x ${s.selectedSku.name} (${s.baseNodesRequired} Active + ${s.haNodes} ${config.haTolerance} Spare)
- Primary Resource Constraint: ${s.limitingFactor}

## 2. Cluster Architecture & Sizing Verdict
- Bare-Metal Node SKU: ${s.selectedSku.name} (${s.selectedSku.physicalCores} Cores / ${s.selectedSku.threads} Threads, ${s.selectedSku.rawMemoryGiB} GB RAM, ${s.selectedSku.rawNvmeTiB} TB NVMe)
- Cluster vCPU Capacity: ${s.clusterTotalVcpuCapacity} vCPUs (${s.clusterVcpuUtilizationPercent}% Allocated at ${config.vcpuOvercommit}:1 Overcommit)
- Cluster Usable RAM: ${s.clusterTotalUsableRamGiB} GB (${s.clusterRamUtilizationPercent}% Utilized)
- Distributed Storage Fabric (DSF) Usable: ${s.clusterTotalUsableDsfTiB} TB (${s.clusterStorageUtilizationPercent}% Utilized with ${config.replicationFactor})
- Data Efficiency Multiplier: ${config.dedupCompressionFactor}x (Deduplication & Compression + ${config.erasureCodingEnabled ? 'EC-X Erasure Coding' : 'No EC-X'})
- Nutanix CVM Overhead Reserved: ${s.cvmOverheadVcpusTotal} vCPUs and ${s.cvmOverheadRamGiBTotal} GB RAM across cluster

## 3. AHV Hypervisor Compatibility
- Direct Move Ready: ${report.categorization['Direct Move Ready']} VMs
- VirtIO Driver Automated Injection: ${report.categorization['VirtIO Driver Injection Required']} VMs
- Legacy Controller / vNIC Modernization: ${report.categorization['Legacy Controller / vNIC Modernization']} VMs
- Complex Architecture (RDMs / Multi-Writer): ${report.categorization['Architectural Intervention (RDM / Multi-Writer)']} VMs

## 4. Nutanix Move Migration Wave Sequencing
${report.waves
  .map(
    w =>
      `- **${w.waveName}**: ${w.vmCount} VMs | ${w.totalVcpus} vCPUs | ${w.totalRamGiB} GB RAM | ${w.totalUsedStorageTiB} TB Storage | Est. Delta Sync: ${w.estimatedSyncHours} hrs (${config.expressRouteBandwidthGbps}Gbps ExpressRoute) | Maintenance Window: ${w.suggestedCutoverWindow}`
  )
  .join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nutanix_NC2_Executive_Assessment_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    triggerNotification('Executive Markdown Report Exported');
  };

  const s = report.sizing;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/tools" className="hover:text-cyan-400 transition-colors">Workbench</Link>
        <span>/</span>
        <span className="text-emerald-400 font-semibold">Nutanix NC2 on Azure Assessment Engine</span>
      </div>

      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                NUTANIX NC2 ON AZURE · DEDICATED ASSESSMENT
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                AHV & NUTANIX MOVE ENGINE
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                ZERO-COSTING ARCHITECTURE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              VMware SDDC to Nutanix NC2 on Azure Assessment & Sizing
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Automated RVTools inventory ingestion, AHV VirtIO driver inspection, disk controller translation,
              Azure bare-metal node (AN36 / AN64 / AN100) cluster sizing with Distributed Storage Fabric (DSF), and
              Nutanix Move wave sequencing.
            </p>
          </div>

          {/* Ingestion & Export Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSample}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isUsingSampleData
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
                title="Populate assessment with 148 realistic enterprise VMware VMs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample RVTools</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Upload custom RVTools Excel (.xlsx) export"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload RVTools</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleExportMarkdown}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Executive Summary</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Notification Ribbon */}
        {notification && (
          <div className="mt-4 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {uploadError && (
          <div className="mt-4 p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadedFileName && (
          <div className="mt-4 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Loaded File: <strong className="text-white">{uploadedFileName}</strong></span>
            </div>
            <span className="font-mono text-emerald-400">{vmInventory.length} VMs in inventory</span>
          </div>
        )}
      </div>

      {/* Top Level Metric KPIs Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Total VMs</div>
          <div className="text-2xl font-black text-white mt-1">{report.summary.totalVMs}</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-mono">{report.summary.inScopeVMs} In-Scope</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Demand vCPUs</div>
          <div className="text-2xl font-black text-white mt-1">{s.totalVcpusDemanded}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Assigned cores</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Demand RAM</div>
          <div className="text-2xl font-black text-white mt-1">{s.totalRamDemandedGiB} <span className="text-xs font-normal text-slate-400">GB</span></div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Active memory</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Used Storage</div>
          <div className="text-2xl font-black text-white mt-1">{s.totalUsedStorageTiB} <span className="text-xs font-normal text-slate-400">TB</span></div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">{s.totalProvisionedStorageTiB} TB Prov.</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
          <div className="text-[11px] font-mono text-emerald-300 uppercase">AHV Readiness</div>
          <div className="text-2xl font-black text-emerald-300 mt-1">{report.summary.readyPercent}%</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-mono">Direct / Move Ready</div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40">
          <div className="text-[11px] font-mono text-cyan-300 uppercase">Recommended Nodes</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">
            {s.totalRecommendedNodes} <span className="text-xs font-normal text-cyan-400">x {s.selectedSku.sku}</span>
          </div>
          <div className="text-[10px] text-cyan-400 mt-1 font-mono">{config.haTolerance} HA protected</div>
        </div>
      </div>

      {/* Primary Tool Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/60 p-1.5 rounded-xl gap-1.5 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Executive Summary', icon: Activity },
          { id: 'sizing', label: 'NC2 on Azure Sizing & DSF Storage', icon: Server },
          { id: 'readiness', label: 'AHV Hypervisor & Move Compatibility', icon: ShieldCheck },
          { id: 'waves', label: 'Nutanix Move Wave Planner', icon: Layers },
          { id: 'inventory', label: 'VM Inventory & Attributes', icon: FileSpreadsheet }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sizing Summary Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Recommended NC2 Topology</h3>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                  {s.selectedSku.sku} Bare-Metal
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Bare-Metal Nodes:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {s.totalRecommendedNodes} Nodes ({s.baseNodesRequired} Active + {s.haNodes} Spare)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Limiting Resource Driver:</span>
                  <span className="font-mono font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
                    {s.limitingFactor}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Cluster Physical Cores:</span>
                  <span className="font-mono text-slate-200">{s.clusterTotalPhysicalCores} Physical Cores</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Cluster Usable vCPUs:</span>
                  <span className="font-mono text-slate-200">{s.clusterTotalVcpuCapacity} vCPUs ({s.clusterVcpuUtilizationPercent}% Utilized)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Cluster Usable RAM:</span>
                  <span className="font-mono text-slate-200">{s.clusterTotalUsableRamGiB} GB ({s.clusterRamUtilizationPercent}% Utilized)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Net Usable DSF Storage:</span>
                  <span className="font-mono text-emerald-400 font-bold">{s.clusterTotalUsableDsfTiB} TB ({s.clusterStorageUtilizationPercent}% Utilized)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Storage Replication:</span>
                  <span className="font-mono text-slate-200">{config.replicationFactor} · {config.dedupCompressionFactor}x Data Reduction</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('sizing')}
                  className="w-full py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Fine-Tune Sizing & Overhead Buffers</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AHV Readiness Breakdown Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">AHV Migration Readiness</h3>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40">
                  {report.summary.readyPercent}% Automated
                </span>
              </div>

              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Direct Move Ready</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {report.categorization['Direct Move Ready']} VMs
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400"
                      style={{
                        width: `${(report.categorization['Direct Move Ready'] / Math.max(1, report.summary.inScopeVMs)) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">VirtIO Driver Automated Injection</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {report.categorization['VirtIO Driver Injection Required']} VMs
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400"
                      style={{
                        width: `${(report.categorization['VirtIO Driver Injection Required'] / Math.max(1, report.summary.inScopeVMs)) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Legacy SCSI / vNIC Modernization</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {report.categorization['Legacy Controller / vNIC Modernization']} VMs
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{
                        width: `${(report.categorization['Legacy Controller / vNIC Modernization'] / Math.max(1, report.summary.inScopeVMs)) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Complex Storage (RDMs / Multi-Writer)</span>
                    <span className="font-mono text-rose-400 font-bold">
                      {report.categorization['Architectural Intervention (RDM / Multi-Writer)']} VMs
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-rose-400"
                      style={{
                        width: `${((report.categorization['Architectural Intervention (RDM / Multi-Writer)'] || 0) / Math.max(1, report.summary.inScopeVMs)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('readiness')}
                  className="w-full py-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Inspect Driver & Controller Blockers</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Nutanix Move Wave Staging Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Migration Wave Plan</h3>
                </div>
                <span className="text-xs font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/40">
                  {report.waves.length} Waves
                </span>
              </div>

              <div className="space-y-3">
                {report.waves.map(wave => (
                  <div key={wave.waveIndex} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{wave.waveName}</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {wave.vmCount} VMs
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{wave.totalUsedStorageTiB} TB Storage</span>
                      <span className="text-indigo-400 font-mono">Sync: ~{wave.estimatedSyncHours} hrs</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('waves')}
                  className="w-full py-2.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Review Wave Cutover Runbooks</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Architecture Highlights & Guidance */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Key Nutanix NC2 on Azure Architectural Advantages for this Assessment</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Native Azure VNet Flow Integration</span>
                </div>
                <p className="text-slate-400">
                  Nutanix NC2 user VMs acquire native Azure IP addresses directly on Azure Virtual Networks without
                  encapsulation or double-NAT bottlenecks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Nutanix Move Agentless Cutover</span>
                </div>
                <p className="text-slate-400">
                  Captures changed data blocks in the background while production VMs continue running, automatically
                  injects VirtIO drivers, and executes the final cutover in minutes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-indigo-400" />
                  <span>Distributed Storage Fabric (DSF)</span>
                </div>
                <p className="text-slate-400">
                  Pools all local NVMe disks into a resilient RF2/RF3 datastore with deduplication, inline compression,
                  and automated tiering to Azure Blob Storage for cold snapshot data.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NC2 ON AZURE SIZING & DSF STORAGE CALCULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'sizing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Sizing Parameters Form (5 Cols) */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Cluster Sizing Parameters</h3>
              </div>
              <button
                onClick={() => setConfig(DEFAULT_NUTANIX_CONFIG)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                title="Reset to default architecture values"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-5 text-xs">
              {/* Azure Bare-Metal Node SKU Selector */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-200 block">
                  Azure Bare-Metal Node SKU:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(AZURE_NC2_NODE_SPECS) as AzureBareMetalSku[]).map(sku => {
                    const spec = AZURE_NC2_NODE_SPECS[sku];
                    const isSelected = config.selectedSku === sku;
                    return (
                      <button
                        key={sku}
                        onClick={() => setConfig({ ...config, selectedSku: sku })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-sm flex items-center justify-between">
                          <span>{spec.sku}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          {spec.physicalCores} Cores · {spec.rawMemoryGiB}GB RAM
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          {spec.rawNvmeTiB} TB NVMe
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  {AZURE_NC2_NODE_SPECS[config.selectedSku].recommendedFor}
                </p>
              </div>

              {/* vCPU Overcommit Ratio Dropdown */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="font-semibold text-slate-200">vCPU Overcommit Ratio:</label>
                  <span className="font-mono text-emerald-400 font-bold">{config.vcpuOvercommit}:1</span>
                </div>
                <select
                  value={config.vcpuOvercommit}
                  onChange={e => setConfig({ ...config, vcpuOvercommit: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 outline-none"
                >
                  <option value="1">1:1 (Zero Overcommit · Dedicated SAP / Oracle)</option>
                  <option value="1.5">1.5:1 (Conservative Enterprise Production)</option>
                  <option value="2">2:1 (Balanced Enterprise Standard · Recommended)</option>
                  <option value="3">3:1 (Aggressive General Purpose)</option>
                  <option value="4">4:1 (High-Density Dev / Test / VDI)</option>
                </select>
              </div>

              {/* RAM Overhead Buffer Dropdown */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="font-semibold text-slate-200">RAM Overhead Buffer:</label>
                  <span className="font-mono text-emerald-400 font-bold">{Math.round(config.ramBufferPercent * 100)}%</span>
                </div>
                <select
                  value={config.ramBufferPercent}
                  onChange={e => setConfig({ ...config, ramBufferPercent: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 outline-none"
                >
                  <option value="0.05">5% (Tight buffer)</option>
                  <option value="0.10">10% (Recommended Enterprise Standard)</option>
                  <option value="0.15">15% (Conservative Headroom)</option>
                  <option value="0.20">20% (High Surge Allowance)</option>
                </select>
              </div>

              {/* DSF Storage Policy: RF2 vs RF3 */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-200 block">
                  Distributed Storage Policy (DSF Replication Factor):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setConfig({ ...config, replicationFactor: 'RF2' })}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      config.replicationFactor === 'RF2'
                        ? 'bg-emerald-950/80 border-emerald-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold">RF2 (2-Copy Mirror)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Tolerates 1 node failure (50% usable)</div>
                  </button>

                  <button
                    onClick={() => setConfig({ ...config, replicationFactor: 'RF3' })}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      config.replicationFactor === 'RF3'
                        ? 'bg-emerald-950/80 border-emerald-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold">RF3 (3-Copy Mirror)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Tolerates 2 node failures (33.3% usable)</div>
                  </button>
                </div>
              </div>

              {/* Data Reduction & Deduplication Multiplier */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="font-semibold text-slate-200">Data Reduction & Compression Multiplier:</label>
                  <span className="font-mono text-emerald-400 font-bold">{config.dedupCompressionFactor}x</span>
                </div>
                <select
                  value={config.dedupCompressionFactor}
                  onChange={e => setConfig({ ...config, dedupCompressionFactor: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 outline-none"
                >
                  <option value="1.0">1.0x (No Data Reduction)</option>
                  <option value="1.2">1.2x (Conservative Mixed Workloads)</option>
                  <option value="1.4">1.4x (Standard Enterprise VM Density · Recommended)</option>
                  <option value="1.6">1.6x (Database & File Servers)</option>
                  <option value="1.8">1.8x (High Homogeneity / VDI)</option>
                </select>
              </div>

              {/* Erasure Coding (EC-X) Toggle */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Erasure Coding (EC-X)</div>
                  <div className="text-[10px] text-slate-400">Adds ~20% usable storage efficiency on cold data</div>
                </div>
                <button
                  onClick={() => setConfig({ ...config, erasureCodingEnabled: !config.erasureCodingEnabled })}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    config.erasureCodingEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      config.erasureCodingEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Nutanix CVM Overhead Allocation */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium text-[11px]">CVM vCPUs per Node:</label>
                  <input
                    type="number"
                    min="8"
                    max="24"
                    value={config.cvmVcpuAllocation}
                    onChange={e => setConfig({ ...config, cvmVcpuAllocation: parseInt(e.target.value, 10) || 12 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium text-[11px]">CVM RAM per Node (GB):</label>
                  <input
                    type="number"
                    min="24"
                    max="64"
                    value={config.cvmRamGiB}
                    onChange={e => setConfig({ ...config, cvmRamGiB: parseInt(e.target.value, 10) || 32 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              {/* High Availability (HA) Buffer */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-200 block">High Availability Spare Nodes:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setConfig({ ...config, haTolerance: 'N+1' })}
                    className={`p-2 rounded-lg border text-center font-bold cursor-pointer transition-colors ${
                      config.haTolerance === 'N+1'
                        ? 'bg-emerald-950/80 border-emerald-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    N+1 Node Spare
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, haTolerance: 'N+2' })}
                    className={`p-2 rounded-lg border text-center font-bold cursor-pointer transition-colors ${
                      config.haTolerance === 'N+2'
                        ? 'bg-emerald-950/80 border-emerald-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    N+2 Node Spare
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sizing Results & Utilization Meters (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Verdict Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                    CALCULATED NC2 CLUSTER FOOTPRINT
                  </div>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    {s.totalRecommendedNodes}x Bare-Metal {s.selectedSku.sku} Nodes
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Primary Driver</div>
                  <div className="text-xs font-bold text-amber-300 font-mono mt-0.5">{s.limitingFactor}</div>
                </div>
              </div>

              {/* Node Calculation Breakdown */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Compute Sizing</div>
                  <div className="text-lg font-bold text-white mt-1">{s.nodesForCompute} Nodes</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{s.usableVcpusPerNode} vCPU/node</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Memory Sizing</div>
                  <div className="text-lg font-bold text-white mt-1">{s.nodesForMemory} Nodes</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{s.usableRamPerNodeGiB} GB/node</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Storage Sizing</div>
                  <div className="text-lg font-bold text-white mt-1">{s.nodesForStorage} Nodes</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{s.usableStoragePerNodeTiB} TB/node</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 italic">
                * Nutanix NC2 on Azure requires a minimum of 3 nodes for cluster quorum. Base sizing selects maximum of
                resource demands + {s.haNodes} spare node for {config.haTolerance} resilience.
              </div>
            </div>

            {/* Detailed Utilization Meters */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Cluster Resource Allocation vs. Workload Demand
              </h4>

              {/* vCPU Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">vCPU Allocation ({config.vcpuOvercommit}:1 Overcommit)</span>
                  <span className="font-mono text-white">
                    {s.totalVcpusDemanded} / {s.clusterTotalVcpuCapacity} vCPUs ({s.clusterVcpuUtilizationPercent}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      s.clusterVcpuUtilizationPercent > 85 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, s.clusterVcpuUtilizationPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Physical Cores: {s.clusterTotalPhysicalCores} Cores</span>
                  <span>CVM Overhead Reserved: {s.cvmOverheadVcpusTotal} vCPUs</span>
                </div>
              </div>

              {/* Memory Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Memory Allocation ({Math.round(config.ramBufferPercent * 100)}% Headroom)</span>
                  <span className="font-mono text-white">
                    {s.totalRamDemandedGiB} / {s.clusterTotalUsableRamGiB} GB ({s.clusterRamUtilizationPercent}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      s.clusterRamUtilizationPercent > 85 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${Math.min(100, s.clusterRamUtilizationPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Raw RAM: {s.totalRecommendedNodes * s.selectedSku.rawMemoryGiB} GB</span>
                  <span>CVM RAM Reserved: {s.cvmOverheadRamGiBTotal} GB</span>
                </div>
              </div>

              {/* DSF Storage Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Distributed Storage Fabric (DSF) Usable</span>
                  <span className="font-mono text-white">
                    {s.totalUsedStorageTiB} / {s.clusterTotalUsableDsfTiB} TB ({s.clusterStorageUtilizationPercent}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      s.clusterStorageUtilizationPercent > 85 ? 'bg-amber-400' : 'bg-indigo-400'
                    }`}
                    style={{ width: `${Math.min(100, s.clusterStorageUtilizationPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Raw Cluster NVMe: {s.totalRecommendedNodes * s.selectedSku.rawNvmeTiB} TB</span>
                  <span>Policy: {config.replicationFactor} + {Math.round(config.storageSlackPercent * 100)}% Slack</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AHV HYPERVISOR & NUTANIX MOVE COMPATIBILITY */}
      {/* ========================================================================= */}
      {activeTab === 'readiness' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1">
              <div className="text-xs font-mono text-emerald-400">Direct Move Ready</div>
              <div className="text-2xl font-bold text-white">{report.categorization['Direct Move Ready']} VMs</div>
              <p className="text-[11px] text-slate-400">Native VirtIO drivers present in guest kernel</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-1">
              <div className="text-xs font-mono text-cyan-400">VirtIO Auto-Injection</div>
              <div className="text-2xl font-bold text-white">{report.categorization['VirtIO Driver Injection Required']} VMs</div>
              <p className="text-[11px] text-slate-400">Windows guests injected automatically by Nutanix Move</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-1">
              <div className="text-xs font-mono text-amber-400">SCSI / vNIC Modernization</div>
              <div className="text-2xl font-bold text-white">{report.categorization['Legacy Controller / vNIC Modernization']} VMs</div>
              <p className="text-[11px] text-slate-400">E1000 or BusLogic translated to VirtIO-SCSI & Net</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 space-y-1">
              <div className="text-xs font-mono text-rose-400">Complex / Architectural</div>
              <div className="text-2xl font-bold text-white">{report.categorization['Architectural Intervention (RDM / Multi-Writer)']} VMs</div>
              <p className="text-[11px] text-slate-400">Physical RDMs or shared SCSI require Volume Groups</p>
            </div>
          </div>

          {/* Deep Dive Category Inspection Table */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Guest Operating System & Driver Inspection</h3>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none"
                >
                  <option value="all">All AHV Categories ({report.evaluatedVms.length})</option>
                  <option value="Direct Move Ready">Direct Move Ready</option>
                  <option value="VirtIO Driver Injection Required">VirtIO Injection Required</option>
                  <option value="Legacy Controller / vNIC Modernization">Controller / vNIC Modernization</option>
                  <option value="Architectural Intervention (RDM / Multi-Writer)">Complex Architecture (RDM / Multi-Writer)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="pb-3 font-semibold">VM Name</th>
                    <th className="pb-3 font-semibold">Guest OS</th>
                    <th className="pb-3 font-semibold">AHV Readiness Category</th>
                    <th className="pb-3 font-semibold">Disk Controller Translation</th>
                    <th className="pb-3 font-semibold">vNIC Modernization</th>
                    <th className="pb-3 font-semibold">Recommended Move Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredVms.slice(0, 20).map(vm => (
                    <tr
                      key={vm.vmName}
                      onClick={() => setInspectedVm(vm)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>{vm.vmName}</span>
                          {vm.rdmWarning && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                              RDM
                            </span>
                          )}
                          {vm.multiWriterWarning && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                              SHARED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-slate-300">{vm.os}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            vm.ahvCategory === 'Direct Move Ready'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : vm.ahvCategory === 'VirtIO Driver Injection Required'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : vm.ahvCategory === 'Legacy Controller / vNIC Modernization'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {vm.ahvCategory}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">{vm.controllerRemediation}</td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">{vm.vnicRemediation}</td>
                      <td className="py-3 text-emerald-400 font-semibold">{vm.recommendedMoveMethod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredVms.length > 20 && (
              <div className="text-center text-xs text-slate-500 pt-2">
                Showing 20 of {filteredVms.length} VMs. Switch to the Inventory tab for complete searching & paging.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: NUTANIX MOVE WAVE PLANNER */}
      {/* ========================================================================= */}
      {activeTab === 'waves' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>Staged Nutanix Move Migration Wave Sequencing</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sequences virtual machines into risk-mitigated waves with estimated data sync times based on Azure
                  ExpressRoute bandwidth.
                </p>
              </div>

              {/* ExpressRoute Bandwidth Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Replication Uplink:</span>
                <select
                  value={config.expressRouteBandwidthGbps}
                  onChange={e => setConfig({ ...config, expressRouteBandwidthGbps: parseInt(e.target.value, 10) || 10 })}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400 outline-none"
                >
                  <option value="1">1 Gbps ExpressRoute Circuit</option>
                  <option value="2">2 Gbps ExpressRoute Circuit</option>
                  <option value="5">5 Gbps ExpressRoute Circuit</option>
                  <option value="10">10 Gbps ExpressRoute FastPath (Recommended)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.waves.map(wave => (
                <div
                  key={wave.waveIndex}
                  className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">
                        {wave.complexity} RISK TIER
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">{wave.waveName}</h4>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800 text-white">
                      {wave.vmCount} Workloads
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Compute</div>
                      <div className="font-bold text-white font-mono mt-0.5">{wave.totalVcpus} vCPU</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Memory</div>
                      <div className="font-bold text-white font-mono mt-0.5">{wave.totalRamGiB} GB</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Storage</div>
                      <div className="font-bold text-emerald-400 font-mono mt-0.5">{wave.totalUsedStorageTiB} TB</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estimated Initial Sync Duration:</span>
                      <span className="font-mono text-indigo-300 font-semibold">~{wave.estimatedSyncHours} Hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Suggested Cutover Window:</span>
                      <span className="font-mono text-slate-200">{wave.suggestedCutoverWindow}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Flow Virtual Subnet:</span>
                      <span className="font-mono text-cyan-400">{wave.targetSubnet}</span>
                    </div>
                  </div>

                  {wave.vms.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-[11px] text-slate-400 mb-1.5">Sample Assigned VMs:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {wave.vms.slice(0, 5).map(v => (
                          <span
                            key={v.vmName}
                            onClick={() => setInspectedVm(v)}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                          >
                            {v.vmName}
                          </span>
                        ))}
                        {wave.vms.length > 5 && (
                          <span className="text-[10px] text-slate-500 self-center">
                            +{wave.vms.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INVENTORY & COMPATIBILITY ATTRIBUTES */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Full Workload Inventory Inspection</h3>
              <span className="text-xs font-mono text-slate-400">({filteredVms.length} Filtered)</span>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search VM name or OS..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 w-48 sm:w-60"
                />
              </div>

              <select
                value={scopeFilter}
                onChange={e => setScopeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none"
              >
                <option value="all">All Scopes</option>
                <option value="inScope">In-Scope Only</option>
                <option value="outOfScope">Out-of-Scope (Infra)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="pb-3 font-semibold">VM Name</th>
                  <th className="pb-3 font-semibold">Scope</th>
                  <th className="pb-3 font-semibold">vCPUs</th>
                  <th className="pb-3 font-semibold">RAM (GB)</th>
                  <th className="pb-3 font-semibold">Used Storage</th>
                  <th className="pb-3 font-semibold">Guest OS</th>
                  <th className="pb-3 font-semibold">AHV Readiness Category</th>
                  <th className="pb-3 font-semibold">Move Action</th>
                  <th className="pb-3 font-semibold">Wave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredVms.map(vm => (
                  <tr
                    key={vm.vmName}
                    onClick={() => setInspectedVm(vm)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{vm.vmName}</span>
                        {vm.rdmWarning && (
                          <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                            RDM
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          vm.scope === 'In Scope'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {vm.scope}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-200">{vm.cpus}</td>
                    <td className="py-3 font-mono text-slate-200">{vm.memoryGiB} GB</td>
                    <td className="py-3 font-mono text-emerald-400">{vm.inUseDiskGiB} GB</td>
                    <td className="py-3 text-slate-300 max-w-xs truncate">{vm.os}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          vm.ahvCategory === 'Direct Move Ready'
                            ? 'text-emerald-300 bg-emerald-950/80 border border-emerald-800'
                            : vm.ahvCategory === 'VirtIO Driver Injection Required'
                            ? 'text-cyan-300 bg-cyan-950/80 border border-cyan-800'
                            : vm.ahvCategory === 'Legacy Controller / vNIC Modernization'
                            ? 'text-amber-300 bg-amber-950/80 border border-amber-800'
                            : 'text-rose-300 bg-rose-950/80 border border-rose-800'
                        }`}
                      >
                        {vm.ahvCategory}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300 font-medium">{vm.recommendedMoveMethod}</td>
                    <td className="py-3 font-mono text-indigo-400 font-semibold">Wave 0{vm.suggestedWave}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VM Detail Drawer / Inspection Modal */}
      {inspectedVm && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  AHV COMPATIBILITY AUDIT
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{inspectedVm.vmName}</h3>
              </div>
              <button
                onClick={() => setInspectedVm(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Key VM Attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">vCPUs Demanded</span>
                <span className="font-bold text-white font-mono text-base">{inspectedVm.cpus} vCPU</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Assigned RAM</span>
                <span className="font-bold text-white font-mono text-base">{inspectedVm.memoryGiB} GB</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Used Storage</span>
                <span className="font-bold text-emerald-400 font-mono text-base">{inspectedVm.inUseDiskGiB} GB</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Target Wave</span>
                <span className="font-bold text-indigo-400 font-mono text-base">Wave 0{inspectedVm.suggestedWave}</span>
              </div>
            </div>

            {/* AHV Remediation Notes */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-emerald-400">
                Nutanix Move Translation Verdict
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">AHV Category:</span>
                  <span className="font-mono text-white font-semibold">{inspectedVm.ahvCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Disk Controller:</span>
                  <span className="font-mono text-slate-300">{inspectedVm.controllerRemediation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network Adapter:</span>
                  <span className="font-mono text-slate-300">{inspectedVm.vnicRemediation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Flow Subnet:</span>
                  <span className="font-mono text-cyan-400">{inspectedVm.targetVNetSubnet}</span>
                </div>
              </div>
            </div>

            {/* Warnings if any */}
            {inspectedVm.rdmWarning && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Raw Device Mapping (RDM) Blocker</span>
                </div>
                <p className="leading-relaxed">{inspectedVm.rdmWarning}</p>
              </div>
            )}

            {inspectedVm.multiWriterWarning && (
              <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Shared SCSI / Multi-Writer Detected</span>
                </div>
                <p className="leading-relaxed">{inspectedVm.multiWriterWarning}</p>
              </div>
            )}

            {/* Detailed Notes List */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-300">Architectural Observations:</h4>
              <ul className="space-y-1.5 text-slate-400">
                {inspectedVm.migrationNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setInspectedVm(null)}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
