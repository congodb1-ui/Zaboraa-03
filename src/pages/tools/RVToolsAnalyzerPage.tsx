import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Sparkles,
  Server,
  HardDrive,
  Cpu,
  Layers,
  Search,
  RefreshCw,
  FolderGit2
} from 'lucide-react';
import {
  ParsedVMRecord,
  SAMPLE_ENTERPRISE_VMS,
  generateSampleRvToolsXlsx
} from '../../data/sampleRvToolsData';
import { GOOGLE_DRIVE_CONFIG } from '../../data/mediaAssets';

export const RVToolsAnalyzerPage: React.FC = () => {
  const navigate = useNavigate();
  const [vmRecords, setVmRecords] = useState<ParsedVMRecord[]>(SAMPLE_ENTERPRISE_VMS);
  const [fileName, setFileName] = useState<string>('Enterprise_Production_Sample_Cluster.xlsx');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Parse Excel File in browser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setUploadError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        // Find vInfo sheet
        const sheetName = wb.SheetNames.find(s => s.toLowerCase() === 'vinfo') || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!jsonData || jsonData.length === 0) {
          throw new Error('No rows found in vInfo sheet. Please ensure valid RVTools export.');
        }

        // Map rows to ParsedVMRecord
        const parsed: ParsedVMRecord[] = jsonData.slice(0, 500).map((row, idx) => {
          const vmName = row['VM'] || row['VM Name'] || `VM-${idx + 1}`;
          const powerState = String(row['Powerstate'] || row['Power state'] || 'poweredOn').toLowerCase().includes('off') ? 'poweredOff' : 'poweredOn';
          const cpus = Number(row['CPUs'] || row['Num CPU'] || 2);
          const memoryMB = Number(row['Memory'] || row['Memory MB'] || 8192);
          const memoryGB = Math.round(memoryMB / 1024) || 8;
          const provisionedMB = Number(row['Provisioned MB'] || row['Provisioned Storage MB'] || 102400);
          const provisionedDiskGB = Math.round(provisionedMB / 1024) || 100;
          const inUseMB = Number(row['In Use MB'] || provisionedMB * 0.7);
          const inUseDiskGB = Math.round(inUseMB / 1024) || 70;
          const os = String(row['OS according to the configuration file'] || row['OS'] || 'Linux / Windows');
          const datacenter = String(row['Datacenter'] || 'Primary-DC');
          const cluster = String(row['Cluster'] || 'Compute-Cluster-01');
          const tools = String(row['VMware Tools'] || '').toLowerCase();
          const toolsStatus = tools.includes('not') ? 'toolsNotInstalled' : tools.includes('old') ? 'toolsOld' : 'toolsOk';

          let recommendedMethod: ParsedVMRecord['recommendedMethod'] = 'HCX Bulk Migration';
          let readinessReason = 'Standard multi-tier workload suitable for scheduled bulk replication.';

          if (powerState === 'poweredOff') {
            recommendedMethod = 'HCX Cold Migration';
            readinessReason = 'Powered-off workload. Cold sync without memory state ensures rapid transfer.';
          } else if (provisionedDiskGB < 500 && toolsStatus === 'toolsOk') {
            recommendedMethod = 'HCX RAV (Live vMotion)';
            readinessReason = 'Moderate disk footprint with healthy VMware Tools. Live zero-downtime vMotion supported.';
          } else if (provisionedDiskGB >= 1500) {
            recommendedMethod = 'HCX Bulk Migration';
            readinessReason = 'High data capacity (>1.5 TB). Baseline initial sync with scheduled cutover window required.';
          }

          return {
            vmName,
            powerState,
            cpus,
            memoryGB,
            provisionedDiskGB,
            inUseDiskGB,
            os,
            datacenter,
            cluster,
            hasSnapshot: false,
            toolsStatus,
            recommendedMethod,
            readinessReason
          };
        });

        setVmRecords(parsed);
      } catch (err: any) {
        setUploadError(err.message || 'Failed to parse RVTools spreadsheet.');
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file.');
      setIsParsing(false);
    };
    reader.readAsBinaryString(file);
  };

  // Aggregated Calculations
  const totalVMs = vmRecords.length;
  const totalVCPUs = vmRecords.reduce((acc, vm) => acc + vm.cpus, 0);
  const totalRAMGB = vmRecords.reduce((acc, vm) => acc + vm.memoryGB, 0);
  const totalStorageTB = Math.round((vmRecords.reduce((acc, vm) => acc + vm.provisionedDiskGB, 0) / 1024) * 10) / 10;
  const bulkCount = vmRecords.filter(vm => vm.recommendedMethod === 'HCX Bulk Migration').length;
  const ravCount = vmRecords.filter(vm => vm.recommendedMethod === 'HCX RAV (Live vMotion)').length;
  const coldCount = vmRecords.filter(vm => vm.recommendedMethod === 'HCX Cold Migration').length;
  const snapshotsCount = vmRecords.filter(vm => vm.hasSnapshot).length;
  const obsoleteToolsCount = vmRecords.filter(vm => vm.toolsStatus !== 'toolsOk').length;

  // Migration Readiness Score: 0 - 100
  const readinessScore = Math.max(
    40,
    Math.min(
      100,
      100 - snapshotsCount * 4 - obsoleteToolsCount * 3
    )
  );

  const filteredRecords = vmRecords.filter(vm => {
    const matchesSearch =
      vm.vmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vm.os.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vm.cluster.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod =
      methodFilter === 'all' ||
      (methodFilter === 'bulk' && vm.recommendedMethod === 'HCX Bulk Migration') ||
      (methodFilter === 'rav' && vm.recommendedMethod === 'HCX RAV (Live vMotion)') ||
      (methodFilter === 'cold' && vm.recommendedMethod === 'HCX Cold Migration');
    return matchesSearch && matchesMethod;
  });

  const handleSendToGenerator = () => {
    try {
      localStorage.setItem('zaboraa_rvtools_assessment', JSON.stringify({
        fileName,
        totalVMs,
        totalVCPUs,
        totalRAMGB,
        totalStorageTB,
        readinessScore,
        bulkCount,
        ravCount,
        coldCount,
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
          <span className="text-cyan-300">RVTools Ingestion & Readiness Engine</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              RVTools Migration Readiness & HCX Wave Analyzer
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              100% Client-Side Ingestion. Parse VMware RVTools spreadsheets locally in your browser to inspect cluster dimensions, calculate migration readiness scores, and classify workloads into HCX Bulk, RAV, or Cold migration paths.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateSampleRvToolsXlsx}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              title="Download sample Excel RVTools file"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sample .xlsx</span>
            </button>
            <button
              onClick={handleSendToGenerator}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <span>Push to Blueprint Generator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Zone & Quick Sample Ingestion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Drag and Drop Box */}
        <div className="md:col-span-2 p-6 rounded-xl bg-slate-900/80 border border-dashed border-slate-700 hover:border-cyan-500/60 transition-colors flex flex-col items-center justify-center text-center relative group">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="p-3 rounded-full bg-slate-800 text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-white">
            {isParsing ? 'Parsing RVTools Spreadsheet...' : 'Drop RVTools .xlsx File Here'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            or click to browse your local computer. Supports all standard RVTools exports.
          </div>
          <div className="text-[11px] font-mono text-emerald-400 mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero server upload · Secure client-side in-memory processing</span>
          </div>
          {uploadError && (
            <div className="mt-3 text-xs text-rose-400 bg-rose-950/60 border border-rose-500/40 px-3 py-1.5 rounded">
              {uploadError}
            </div>
          )}
        </div>

        {/* Demo Data Preset Card */}
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-mono text-cyan-400 font-semibold uppercase">Instant Demo</div>
            <h3 className="text-base font-bold text-white">Need a Test Dataset?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Load our pre-configured enterprise cluster dataset representing Oracle DBs, SQL servers, web tiers, and domain controllers.
            </p>
          </div>
          <button
            onClick={() => {
              setVmRecords(SAMPLE_ENTERPRISE_VMS);
              setFileName('Enterprise_Production_Sample_Cluster.xlsx');
              setUploadError(null);
            }}
            className="w-full py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Sample Enterprise Cluster</span>
          </button>
        </div>
      </div>

      {/* KPI & Readiness Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
          <div className="text-[11px] font-mono text-slate-400">Total Workloads</div>
          <div className="text-2xl font-black text-white font-mono">{totalVMs}</div>
          <div className="text-[10px] text-slate-500">Virtual Machines</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
          <div className="text-[11px] font-mono text-slate-400">Total vCPUs</div>
          <div className="text-2xl font-black text-cyan-300 font-mono">{totalVCPUs}</div>
          <div className="text-[10px] text-slate-500">vCPU Cores</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
          <div className="text-[11px] font-mono text-slate-400">Total Memory</div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            {totalRAMGB >= 1024 ? `${(totalRAMGB / 1024).toFixed(1)} TB` : `${totalRAMGB} GB`}
          </div>
          <div className="text-[10px] text-slate-500">RAM Allocated</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
          <div className="text-[11px] font-mono text-slate-400">Total Storage</div>
          <div className="text-2xl font-black text-cyan-300 font-mono">{totalStorageTB} TB</div>
          <div className="text-[10px] text-slate-500">Provisioned Disk</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
          <div className="text-[11px] font-mono text-slate-400">Readiness Score</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{readinessScore}%</div>
          <div className="text-[10px] text-emerald-300/80">Migration Ready</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
          <div className="text-[11px] font-mono text-slate-400">HCX RAV (Live)</div>
          <div className="text-2xl font-black text-teal-400 font-mono">{ravCount}</div>
          <div className="text-[10px] text-teal-300/80">Zero Downtime</div>
        </div>
      </div>

      {/* Migration Wave Strategy Breakdown */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Recommended HCX Migration Paths</span>
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Active File: <span className="text-cyan-300 font-mono">{fileName}</span>
            </div>
          </div>

          {/* Filter Segmented Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setMethodFilter('all')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                methodFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({totalVMs})
            </button>
            <button
              onClick={() => setMethodFilter('rav')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                methodFilter === 'rav' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              RAV ({ravCount})
            </button>
            <button
              onClick={() => setMethodFilter('bulk')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                methodFilter === 'bulk' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bulk ({bulkCount})
            </button>
            <button
              onClick={() => setMethodFilter('cold')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                methodFilter === 'cold' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cold ({coldCount})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by VM name, operating system, or cluster..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Workload Inventory Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Virtual Machine</th>
                <th className="py-3 px-3">State</th>
                <th className="py-3 px-3">vCPU</th>
                <th className="py-3 px-3">RAM</th>
                <th className="py-3 px-3">Disk (GB)</th>
                <th className="py-3 px-4">Operating System</th>
                <th className="py-3 px-4">Recommended HCX Method</th>
                <th className="py-3 px-4">Architectural Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
              {filteredRecords.map((vm, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{vm.vmName}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                        vm.powerState === 'poweredOn'
                          ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30'
                          : 'text-slate-400 bg-slate-800 border border-slate-700'
                      }`}
                    >
                      {vm.powerState}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-cyan-300">{vm.cpus}</td>
                  <td className="py-3 px-3">{vm.memoryGB} GB</td>
                  <td className="py-3 px-3">{vm.provisionedDiskGB} GB</td>
                  <td className="py-3 px-4 font-sans text-slate-400 truncate max-w-[150px]">{vm.os}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        vm.recommendedMethod === 'HCX RAV (Live vMotion)'
                          ? 'bg-teal-950/80 text-teal-300 border border-teal-500/40'
                          : vm.recommendedMethod === 'HCX Bulk Migration'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {vm.recommendedMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-400 max-w-[280px] leading-relaxed">
                    {vm.readinessReason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
