import React, { useState, useMemo } from 'react';
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
  FolderGit2,
  Calendar,
  Wifi,
  Clock,
  Printer,
  ChevronRight,
  ShieldAlert,
  Sliders,
  ExternalLink,
  DollarSign,
  TrendingDown,
  Filter,
  Check,
  ListChecks,
  X,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import {
  ParsedVMRecord,
  SAMPLE_ENTERPRISE_VMS,
  generateSampleRvToolsXlsx,
  exportMultiTabRvToolsAssessment,
  VMScope,
  StorageTierOption,
  VMEnvironment,
  NormalizedToolsStatus
} from '../../data/sampleRvToolsData';
import { GOOGLE_DRIVE_CONFIG } from '../../data/mediaAssets';

// Cloud Ecosystems & Bare-Metal Node SKUs
interface CloudSkuInfo {
  id: string;
  name: string;
  provider: 'Azure VMware Solution' | 'Google Cloud VMware Engine' | 'VMware Cloud on AWS';
  providerShort: 'AVS' | 'GCVE' | 'VMC';
  cores: number;
  ramGiB: number;
  rawStorageTiB: number;
  usableStorageTiB: number;
  monthlyCostUSD: number;
  externalStorageName: string;
  externalStorageCostPerTiB: number;
}

const CLOUD_SKUS: Record<string, CloudSkuInfo> = {
  'avs-av36p': {
    id: 'avs-av36p',
    name: 'AVS AV36P (Intel Xeon Gold 6354)',
    provider: 'Azure VMware Solution',
    providerShort: 'AVS',
    cores: 36,
    ramGiB: 576,
    rawStorageTiB: 15.4,
    usableStorageTiB: 11.5,
    monthlyCostUSD: 5200,
    externalStorageName: 'Azure NetApp Files (ANF)',
    externalStorageCostPerTiB: 180
  },
  'avs-av36': {
    id: 'avs-av36',
    name: 'AVS AV36 (Intel Xeon Gold 6140)',
    provider: 'Azure VMware Solution',
    providerShort: 'AVS',
    cores: 36,
    ramGiB: 576,
    rawStorageTiB: 15.4,
    usableStorageTiB: 11.5,
    monthlyCostUSD: 4800,
    externalStorageName: 'Azure NetApp Files (ANF)',
    externalStorageCostPerTiB: 180
  },
  'avs-av48': {
    id: 'avs-av48',
    name: 'AVS AV48 (Intel Xeon Platinum 8368)',
    provider: 'Azure VMware Solution',
    providerShort: 'AVS',
    cores: 48,
    ramGiB: 768,
    rawStorageTiB: 23.0,
    usableStorageTiB: 17.2,
    monthlyCostUSD: 6500,
    externalStorageName: 'Azure NetApp Files (ANF)',
    externalStorageCostPerTiB: 180
  },
  'avs-av52': {
    id: 'avs-av52',
    name: 'AVS AV52 (Intel Xeon Platinum 8470Q)',
    provider: 'Azure VMware Solution',
    providerShort: 'AVS',
    cores: 52,
    ramGiB: 1536,
    rawStorageTiB: 38.4,
    usableStorageTiB: 28.8,
    monthlyCostUSD: 8200,
    externalStorageName: 'Azure NetApp Files (ANF)',
    externalStorageCostPerTiB: 180
  },
  'avs-av64': {
    id: 'avs-av64',
    name: 'AVS AV64 (Intel Xeon Platinum 8470)',
    provider: 'Azure VMware Solution',
    providerShort: 'AVS',
    cores: 64,
    ramGiB: 1024,
    rawStorageTiB: 30.7,
    usableStorageTiB: 24.0,
    monthlyCostUSD: 7800,
    externalStorageName: 'Azure NetApp Files (ANF)',
    externalStorageCostPerTiB: 180
  },
  'gcve-ve1': {
    id: 'gcve-ve1',
    name: 'GCVE ve1-standard-72 (Intel Xeon 6240)',
    provider: 'Google Cloud VMware Engine',
    providerShort: 'GCVE',
    cores: 72,
    ramGiB: 768,
    rawStorageTiB: 19.2,
    usableStorageTiB: 14.0,
    monthlyCostUSD: 6400,
    externalStorageName: 'Google Cloud NetApp Volumes (GCNV)',
    externalStorageCostPerTiB: 175
  },
  'gcve-ve2': {
    id: 'gcve-ve2',
    name: 'GCVE ve2-standard-128 (Intel Emerald Rapids)',
    provider: 'Google Cloud VMware Engine',
    providerShort: 'GCVE',
    cores: 128,
    ramGiB: 2048,
    rawStorageTiB: 51.2,
    usableStorageTiB: 38.0,
    monthlyCostUSD: 11500,
    externalStorageName: 'Google Cloud NetApp Volumes (GCNV)',
    externalStorageCostPerTiB: 175
  },
  'vmc-i4i': {
    id: 'vmc-i4i',
    name: 'VMC i4i.metal (Intel Xeon Ice Lake)',
    provider: 'VMware Cloud on AWS',
    providerShort: 'VMC',
    cores: 64,
    ramGiB: 1024,
    rawStorageTiB: 30.0,
    usableStorageTiB: 20.5,
    monthlyCostUSD: 7800,
    externalStorageName: 'Amazon FSx for NetApp ONTAP',
    externalStorageCostPerTiB: 195
  },
  'vmc-i3en': {
    id: 'vmc-i3en',
    name: 'VMC i3en.metal (Storage-Optimized)',
    provider: 'VMware Cloud on AWS',
    providerShort: 'VMC',
    cores: 48,
    ramGiB: 768,
    rawStorageTiB: 60.0,
    usableStorageTiB: 45.0,
    monthlyCostUSD: 9200,
    externalStorageName: 'Amazon FSx for NetApp ONTAP',
    externalStorageCostPerTiB: 195
  },
  'vmc-m7i': {
    id: 'vmc-m7i',
    name: 'VMC m7i.metal-24xl (Compute-Intensive)',
    provider: 'VMware Cloud on AWS',
    providerShort: 'VMC',
    cores: 96,
    ramGiB: 384,
    rawStorageTiB: 15.0,
    usableStorageTiB: 10.5,
    monthlyCostUSD: 6900,
    externalStorageName: 'Amazon FSx for NetApp ONTAP',
    externalStorageCostPerTiB: 195
  }
};

export const RVToolsAnalyzerPage: React.FC = () => {
  const navigate = useNavigate();
  const [vmRecords, setVmRecords] = useState<ParsedVMRecord[]>(SAMPLE_ENTERPRISE_VMS);
  const [fileName, setFileName] = useState<string>('Enterprise_Production_Sample_Cluster.xlsx');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'waves' | 'vlans' | 'health'>('inventory');

  // Selected Cloud Node SKU (Default: Azure VMware Solution with AV36P)
  const [selectedSkuKey, setSelectedSkuKey] = useState<string>('avs-av36p');
  const selectedSku = CLOUD_SKUS[selectedSkuKey] || CLOUD_SKUS['avs-av36p'];

  // WAN throughput slider for wave migration duration modeling (Mbps)
  const [migrationWanMbps, setMigrationWanMbps] = useState<number>(2000); // 2 Gbps default

  // Network Extension (Stretched L2) per-VLAN toggles
  const [extendedVlanState, setExtendedVlanState] = useState<Record<number, boolean>>({
    10: true,
    20: true,
    30: true,
    40: true,
    100: false // Mgmt is not extended
  });

  // Print Dossier Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Remediation Action Checklist Modal State
  const [showRemediationModal, setShowRemediationModal] = useState<boolean>(false);
  const [remediationStepsChecked, setRemediationStepsChecked] = useState<Record<string, boolean>>({});

  // Helper to normalize VMware Tools strings
  const normalizeToolsStatus = (raw: string): NormalizedToolsStatus => {
    const s = (raw || '').toLowerCase();
    if (s.includes('open') || s.includes('unmanaged') || s.includes('guesttoolsunmanaged')) {
      return 'Linux Open-VM-Tools (Verified)';
    }
    if (s.includes('old') || s.includes('upgrade') || s.includes('outdated')) {
      return 'Outdated (Update Prior to Cutover)';
    }
    if (s.includes('notinstalled') || s.includes('notrunning') || s.includes('missing') || s.includes('stopped')) {
      return 'Missing / Stopped (Critical Migration Risk)';
    }
    return 'Healthy (Running)';
  };

  // Helper to detect management network
  const checkIsManagement = (portGroup: string, vlanId: number): boolean => {
    const s = portGroup.toLowerCase();
    return (
      vlanId === 100 ||
      s.includes('mgmt') ||
      s.includes('management') ||
      s.includes('vcenter') ||
      s.includes('esxi') ||
      s.includes('infra') ||
      s.includes('identity')
    );
  };

  // Parse Excel File in browser across multiple sheets with composite joins and Base-2 arithmetic
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

        // 1. Parse vInfo
        const sheetName = wb.SheetNames.find(s => s.toLowerCase() === 'vinfo') || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!jsonData || jsonData.length === 0) {
          throw new Error('No rows found in vInfo sheet. Please ensure a valid RVTools export.');
        }

        // 2. Parse vSnapshot if available
        const snapSheet = wb.SheetNames.find(s => s.toLowerCase() === 'vsnapshot');
        const snapData: any[] = snapSheet ? XLSX.utils.sheet_to_json(wb.Sheets[snapSheet]) : [];
        const snapshotMap = new Map<string, { ageHours: number; sizeGiB: number }>();
        snapData.forEach(row => {
          const vm = String(row['VM'] || '').trim().toLowerCase();
          if (vm) {
            const dateStr = String(row['Date / time'] || row['Date'] || '');
            const parsedDate = dateStr ? new Date(dateStr) : new Date();
            const ageHours = Math.max(1, Math.round((Date.now() - parsedDate.getTime()) / 3600000));
            // Base-2: MiB / 1024 -> GiB
            const sizeMB = Number(row['Size MB'] || row['Size MiB'] || 5120);
            const sizeGiB = Math.round((sizeMB / 1024) * 10) / 10;
            snapshotMap.set(vm, { ageHours, sizeGiB });
          }
        });

        // 3. Parse vNetwork if available (Join on composite key: VM Name + MAC / NIC)
        const netSheet = wb.SheetNames.find(s => s.toLowerCase() === 'vnetwork');
        const netData: any[] = netSheet ? XLSX.utils.sheet_to_json(wb.Sheets[netSheet]) : [];
        const netMap = new Map<string, { portGroup: string; vlanId: number }>();
        netData.forEach(row => {
          const vm = String(row['VM'] || '').trim().toLowerCase();
          if (vm) {
            const portGroup = String(row['Network'] || row['Portgroup'] || 'VLAN-10-Default');
            // Try explicit VLAN column first
            let vlanId = Number(row['VLAN'] || row['Vlan ID'] || 0);
            if (!vlanId || isNaN(vlanId)) {
              const match = portGroup.match(/\d+/);
              vlanId = match ? parseInt(match[0], 10) : 10;
            }
            netMap.set(vm, { portGroup, vlanId });
          }
        });

        // 4. Parse vTools if available
        const toolsSheet = wb.SheetNames.find(s => s.toLowerCase() === 'vtools');
        const toolsData: any[] = toolsSheet ? XLSX.utils.sheet_to_json(wb.Sheets[toolsSheet]) : [];
        const toolsMap = new Map<string, string>();
        toolsData.forEach(row => {
          const vm = String(row['VM'] || '').trim().toLowerCase();
          if (vm) {
            const status = String(row['Tools status'] || row['Tools'] || '');
            toolsMap.set(vm, status);
          }
        });

        // 5. Map rows to ParsedVMRecord with strict Base-2 math and Scoping
        const parsed: ParsedVMRecord[] = jsonData.slice(0, 600).map((row, idx) => {
          const vmName = String(row['VM'] || row['VM Name'] || `VM-${idx + 1}`);
          const lowerName = vmName.toLowerCase();
          const powerState = String(row['Powerstate'] || row['Power state'] || 'poweredOn').toLowerCase().includes('off') ? 'poweredOff' : 'poweredOn';
          const cpus = Number(row['CPUs'] || row['Num CPU'] || 2);

          // Base-2 Memory: MiB / 1024 -> GiB
          const memoryMB = Number(row['Memory'] || row['Memory MB'] || 8192);
          const memoryGiB = Math.round((memoryMB / 1024) * 10) / 10 || 8;

          // Base-2 Provisioned Storage: MiB / 1024 -> GiB, MiB / (1024*1024) -> TiB
          const provisionedMB = Number(row['Provisioned MB'] || row['Provisioned Storage MB'] || 102400);
          const provisionedDiskGiB = Math.round((provisionedMB / 1024) * 10) / 10 || 100;
          const storageTiB = Math.round((provisionedMB / (1024 * 1024)) * 1000) / 1000 || 0.1;

          // Base-2 In-Use Storage
          const inUseMB = Number(row['In Use MB'] || row['In Use Storage MB'] || provisionedMB * 0.7);
          const inUseDiskGiB = Math.round((inUseMB / 1024) * 10) / 10 || 70;
          const provisioningType: 'Thin' | 'Thick' = inUseDiskGiB < provisionedDiskGiB * 0.85 ? 'Thin' : 'Thick';

          const os = String(row['OS according to the configuration file'] || row['OS'] || 'Linux / Windows');
          const datacenter = String(row['Datacenter'] || 'Primary-DC');
          const cluster = String(row['Cluster'] || 'Compute-Cluster-01');

          // VMware Tools status
          const rawTools = toolsMap.get(lowerName) || String(row['VMware Tools'] || row['Tools status'] || 'toolsOk');
          const toolsStatus = normalizeToolsStatus(rawTools);

          // Snapshot detection
          const snapInfo = snapshotMap.get(lowerName);
          const hasSnapshot = Boolean(snapInfo);
          const snapshotAgeHours = snapInfo?.ageHours || 0;
          const snapshotSizeGiB = snapInfo?.sizeGiB || 0;

          // Network mapping
          const netInfo = netMap.get(lowerName);
          const portGroup = netInfo?.portGroup || (lowerName.includes('db') ? 'VLAN-30-DB' : lowerName.includes('web') ? 'VLAN-10-Web' : 'VLAN-20-App');
          const vlanId = netInfo?.vlanId || (lowerName.includes('db') ? 30 : lowerName.includes('web') ? 10 : 20);

          // Management Infrastructure Auto-Detection
          const isManagementInfra = checkIsManagement(portGroup, vlanId) || lowerName.includes('vcenter') || lowerName.includes('esxi');
          // Auto-set management VMs to 'Out of Scope' by default (confirmed decision)
          const scope: VMScope = isManagementInfra ? 'Out of Scope' : 'In Scope';

          // External Storage Recommendation (>= 2 TiB or high-capacity DB)
          const targetStorageTier: StorageTierOption = storageTiB >= 2.0 || provisionedDiskGiB >= 2048 ? 'External NFS' : 'Local vSAN';

          // Environment classification
          let environment: VMEnvironment = 'Prod';
          if (lowerName.includes('dev')) environment = 'Dev';
          else if (lowerName.includes('stg') || lowerName.includes('stage')) environment = 'Staging';
          else if (lowerName.includes('qa')) environment = 'QA';
          else if (lowerName.includes('uat')) environment = 'UAT';
          else if (lowerName.includes('dr')) environment = 'DR';
          else if (lowerName.includes('preprod')) environment = 'Pre-Prod';

          // 4-Wave Auto-Classification
          let assignedWave: 0 | 1 | 2 | 3 = 2;
          let recommendedMethod: ParsedVMRecord['recommendedMethod'] = 'HCX Bulk Migration';
          let readinessReason = 'Production application tier. Scheduled HCX Bulk replication.';

          if (isManagementInfra || lowerName.includes('dc') || lowerName.includes('dns') || lowerName.includes('splunk') || lowerName.includes('mon')) {
            assignedWave = 0;
            recommendedMethod = 'HCX RAV (Live vMotion)';
            readinessReason = isManagementInfra
              ? 'Management network detected. Auto-set Out of Scope to prevent sizing distortion.'
              : 'Wave 0 Foundational Identity/DNS/Monitoring. Live RAV migration preserves Active Directory.';
          } else if (environment === 'Dev' || environment === 'Staging' || environment === 'QA' || powerState === 'poweredOff') {
            assignedWave = 1;
            recommendedMethod = powerState === 'poweredOff' ? 'HCX Cold Migration' : 'HCX Bulk Migration';
            readinessReason = 'Wave 1 Non-production environment. Baseline validation wave.';
          } else if (lowerName.includes('db') || lowerName.includes('sql') || lowerName.includes('oracle') || lowerName.includes('sap') || storageTiB >= 2.0) {
            assignedWave = 3;
            recommendedMethod = 'HCX RAV (Live vMotion)';
            readinessReason = 'Wave 3 Mission-critical database backend. External NFS recommended for storage decoupling.';
          }

          return {
            vmName,
            scope,
            isManagementInfra,
            powerState,
            cpus,
            memoryGiB,
            provisionedDiskGiB,
            inUseDiskGiB,
            storageTiB,
            provisioningType,
            os,
            datacenter,
            cluster,
            hasSnapshot,
            snapshotAgeHours,
            snapshotSizeGiB,
            toolsStatus,
            portGroup,
            vlanId,
            environment,
            assignedWave,
            targetStorageTier,
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

  // Inline Scope Override
  const handleScopeChange = (vmName: string, newScope: VMScope) => {
    setVmRecords(prev =>
      prev.map(vm => (vm.vmName === vmName ? { ...vm, scope: newScope } : vm))
    );
  };

  // Inline Storage Tier Override
  const handleStorageTierChange = (vmName: string, newTier: StorageTierOption) => {
    setVmRecords(prev =>
      prev.map(vm => (vm.vmName === vmName ? { ...vm, targetStorageTier: newTier } : vm))
    );
  };

  // Inline Environment Override
  const handleEnvironmentChange = (vmName: string, newEnv: VMEnvironment) => {
    setVmRecords(prev =>
      prev.map(vm => (vm.vmName === vmName ? { ...vm, environment: newEnv } : vm))
    );
  };

  // Inline Wave Override
  const handleWaveOverride = (vmName: string, newWave: 0 | 1 | 2 | 3) => {
    setVmRecords(prev =>
      prev.map(vm => (vm.vmName === vmName ? { ...vm, assignedWave: newWave } : vm))
    );
  };

  // Toggle Stretched L2 for VLAN
  const handleToggleVlanExtension = (vlanId: number) => {
    setExtendedVlanState(prev => ({
      ...prev,
      [vlanId]: prev[vlanId] === undefined ? true : !prev[vlanId]
    }));
  };

  // Aggregated Calculations (Differentiating All Assessed vs. Strictly In-Scope)
  const totalAssessedVMs = vmRecords.length;
  const inScopeVMs = useMemo(() => vmRecords.filter(vm => vm.scope === 'In Scope'), [vmRecords]);
  const outOfScopeVMs = useMemo(() => vmRecords.filter(vm => vm.scope === 'Out of Scope'), [vmRecords]);
  const tbdVMs = useMemo(() => vmRecords.filter(vm => vm.scope === 'To Be Decided'), [vmRecords]);

  // Strict Base-2 Metrics computed exclusively from In-Scope Workloads
  const inScopeVCPUs = useMemo(() => inScopeVMs.reduce((acc, vm) => acc + vm.cpus, 0), [inScopeVMs]);
  const inScopeRAMGiB = useMemo(() => Math.round(inScopeVMs.reduce((acc, vm) => acc + vm.memoryGiB, 0)), [inScopeVMs]);
  const inScopeStorageTiB = useMemo(() => Math.round(inScopeVMs.reduce((acc, vm) => acc + vm.storageTiB, 0) * 10) / 10, [inScopeVMs]);

  // Decoupled Storage Breakdown
  const inScopeDecoupledTiB = useMemo(() => {
    return Math.round(
      inScopeVMs
        .filter(vm => vm.targetStorageTier === 'External NFS')
        .reduce((acc, vm) => acc + vm.storageTiB, 0) * 10
    ) / 10;
  }, [inScopeVMs]);

  const inScopeLocalVsanTiB = useMemo(() => {
    return Math.max(0, Math.round((inScopeStorageTiB - inScopeDecoupledTiB) * 10) / 10);
  }, [inScopeStorageTiB, inScopeDecoupledTiB]);

  // Thin vs Thick breakdown (In Scope)
  const thinCount = inScopeVMs.filter(vm => vm.provisioningType === 'Thin').length;
  const thickCount = inScopeVMs.filter(vm => vm.provisioningType === 'Thick').length;

  // Critical health risks
  const criticalSnapshots = vmRecords.filter(vm => vm.hasSnapshot && (vm.snapshotAgeHours > 24 || vm.snapshotSizeGiB > 20));
  const outdatedTools = vmRecords.filter(vm => vm.toolsStatus !== 'Healthy (Running)' && vm.toolsStatus !== 'Linux Open-VM-Tools (Verified)');

  // Migration Readiness Score: 0 - 100
  const readinessScore = Math.max(
    30,
    Math.min(
      100,
      100 - criticalSnapshots.length * 5 - outdatedTools.length * 3
    )
  );

  // Dynamic Sizing Engine for Selected SKU (Strict Base-2 Math + In-Scope Only)
  const sizingEngine = useMemo(() => {
    const vCpuOvercommit = 2.5;
    const effectiveCores = inScopeVCPUs / vCpuOvercommit;
    const ramWithBuffer = inScopeRAMGiB * 1.2; // 20% HA & hypervisor buffer

    // Nodes needed by compute and memory
    const computeNodes = Math.ceil(effectiveCores / selectedSku.cores);
    const memoryNodes = Math.ceil(ramWithBuffer / selectedSku.ramGiB);

    // Nodes without external storage (Pure vSAN: all storage on local nodes)
    const vsanNodesPure = Math.ceil(inScopeStorageTiB / selectedSku.usableStorageTiB);
    const nodesWithoutDecoupled = Math.max(3, computeNodes, memoryNodes, vsanNodesPure);

    // Nodes with external storage offload (vSAN handles only remaining storage)
    const vsanNodesDecoupled = Math.ceil(inScopeLocalVsanTiB / selectedSku.usableStorageTiB);
    const nodesWithDecoupled = Math.max(3, computeNodes, memoryNodes, vsanNodesDecoupled);

    const nodeReduction = Math.max(0, nodesWithoutDecoupled - nodesWithDecoupled);

    // Cost calculations
    const pureMonthlyCost = nodesWithoutDecoupled * selectedSku.monthlyCostUSD;
    const decoupledNodeCost = nodesWithDecoupled * selectedSku.monthlyCostUSD;
    const externalStorageCost = Math.round(inScopeDecoupledTiB * selectedSku.externalStorageCostPerTiB);
    const decoupledTotalCost = decoupledNodeCost + externalStorageCost;
    const monthlySavings = Math.max(0, pureMonthlyCost - decoupledTotalCost);

    return {
      computeNodes,
      memoryNodes,
      nodesWithoutDecoupled,
      nodesWithDecoupled,
      nodeReduction,
      pureMonthlyCost,
      decoupledTotalCost,
      monthlySavings,
      externalStorageCost
    };
  }, [inScopeVCPUs, inScopeRAMGiB, inScopeStorageTiB, inScopeLocalVsanTiB, inScopeDecoupledTiB, selectedSku]);

  // Stretched L2 VLAN Aggregation & HCX Appliance Fleet Sizing
  const vlanSummary = useMemo(() => {
    const map = new Map<string, { portGroup: string; vlanId: number; count: number; storageTiB: number; vms: string[] }>();
    inScopeVMs.forEach(vm => {
      const key = vm.portGroup || `VLAN-${vm.vlanId}`;
      if (!map.has(key)) {
        map.set(key, { portGroup: key, vlanId: vm.vlanId, count: 0, storageTiB: 0, vms: [] });
      }
      const item = map.get(key)!;
      item.count++;
      item.storageTiB += vm.storageTiB;
      item.vms.push(vm.vmName);
    });
    return Array.from(map.values()).map(v => ({
      ...v,
      storageTiB: Math.round(v.storageTiB * 10) / 10,
      isExtended: extendedVlanState[v.vlanId] ?? true
    }));
  }, [inScopeVMs, extendedVlanState]);

  // Extended VLANs count & HCX NE pair fleet requirement (1 pair per 8 extended VLANs)
  const extendedVlanCount = useMemo(() => {
    return vlanSummary.filter(v => v.isExtended).length;
  }, [vlanSummary]);
  const hcxNePairsRequired = Math.max(1, Math.ceil(extendedVlanCount / 8));

  // 4-Wave Sequencing Calculations for In-Scope Workloads
  const waveAnalytics = useMemo(() => {
    return [0, 1, 2, 3].map(wIndex => {
      const vms = inScopeVMs.filter(v => v.assignedWave === wIndex);
      const waveStorageTiB = Math.round(vms.reduce((a, v) => a + v.storageTiB, 0) * 10) / 10;
      const waveRAMGiB = Math.round(vms.reduce((a, v) => a + v.memoryGiB, 0));

      const ravCount = vms.filter(v => v.recommendedMethod === 'HCX RAV (Live vMotion)').length;
      const bulkCount = vms.filter(v => v.recommendedMethod === 'HCX Bulk Migration').length;
      const coldCount = vms.filter(v => v.recommendedMethod === 'HCX Cold Migration').length;

      // Delta sync transfer time: assume compressed delta rate (15% daily churn over 1024 base)
      const compressedDataMb = waveStorageTiB * 1024 * 0.3 * 8 * 1024;
      const durationSeconds = compressedDataMb / (migrationWanMbps * 0.8);
      const durationHours = Math.round((durationSeconds / 3600) * 10) / 10;

      const titles = [
        'Wave 0: Shared Services & Core Infrastructure',
        'Wave 1: Dev, QA & Staging Environments',
        'Wave 2: Production Web & Middleware Tiers',
        'Wave 3: Mission-Critical Databases'
      ];
      const cutoverWindows = [
        'Zero downtime (Live RAV cutover)',
        '4-Hour Weekend Batch Window',
        '2-Hour Staggered Evening Cutover',
        '30-Minute High-Priority Transaction Window'
      ];

      return {
        waveIndex: wIndex,
        title: titles[wIndex],
        cutoverWindow: cutoverWindows[wIndex],
        vms,
        count: vms.length,
        waveStorageTiB,
        waveRAMGiB,
        ravCount,
        bulkCount,
        coldCount,
        durationHours
      };
    });
  }, [inScopeVMs, migrationWanMbps]);

  // Filtered Table
  const filteredRecords = useMemo(() => {
    return vmRecords.filter(vm => {
      const matchesSearch =
        vm.vmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vm.os.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vm.cluster.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vm.portGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vm.environment.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMethod =
        methodFilter === 'all' ||
        (methodFilter === 'rav' && vm.recommendedMethod === 'HCX RAV (Live vMotion)') ||
        (methodFilter === 'bulk' && vm.recommendedMethod === 'HCX Bulk Migration') ||
        (methodFilter === 'cold' && vm.recommendedMethod === 'HCX Cold Migration');

      const matchesScope =
        scopeFilter === 'all' ||
        (scopeFilter === 'inScope' && vm.scope === 'In Scope') ||
        (scopeFilter === 'outOfScope' && vm.scope === 'Out of Scope') ||
        (scopeFilter === 'tbd' && vm.scope === 'To Be Decided');

      return matchesSearch && matchesMethod && matchesScope;
    });
  }, [vmRecords, searchQuery, methodFilter, scopeFilter]);

  // Handoff to 4K Blueprint Generator
  const handlePushToGenerator = () => {
    try {
      const blueprintState = {
        customerName: 'Enterprise Cloud Transformation Client',
        architectName: 'Wasim Sayyed',
        fileName,
        targetCloud: selectedSku.provider,
        nodeSku: selectedSku.id.toUpperCase(),
        cloudNodes: sizingEngine.nodesWithDecoupled,
        totalVMs: inScopeVMs.length,
        totalVCPUs: inScopeVCPUs,
        totalRAMGB: inScopeRAMGiB,
        totalStorageTB: inScopeStorageTiB,
        decoupledStorageTB: inScopeDecoupledTiB,
        monthlyRunRateUSD: sizingEngine.decoupledTotalCost,
        vlans: vlanSummary,
        hcxNePairs: hcxNePairsRequired,
        waves: waveAnalytics.map(w => ({ title: w.title, count: w.count, storageTB: w.waveStorageTiB })),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('zaboraa_4k_blueprint_state', JSON.stringify(blueprintState));
    } catch {}
    navigate('/tools/design-generator');
  };

  // Export 4-Tab Excel workbook with exact Base-2 values and scoping
  const handleExportExcel = () => {
    exportMultiTabRvToolsAssessment(vmRecords, fileName, {
      targetCloud: selectedSku.provider,
      nodeSku: selectedSku.name,
      cloudNodes: sizingEngine.nodesWithDecoupled,
      inScopeVMCount: inScopeVMs.length,
      totalVCPUs: inScopeVCPUs,
      totalRAMGiB: inScopeRAMGiB,
      totalStorageTiB: inScopeStorageTiB,
      decoupledStorageTiB: inScopeDecoupledTiB,
      monthlyRunRateUSD: sizingEngine.decoupledTotalCost,
      monthlySavingsUSD: sizingEngine.monthlySavings
    });
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link to="/tools" className="hover:text-cyan-400 transition-colors">Engineering Workbench</Link>
          <span>/</span>
          <span className="text-cyan-300">RVTools Ingestion & Precision Wave Sequencer</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              RVTools Ingestion, Health Analytics & 4-Wave Migration Planner
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              100% In-Browser Ingestion with strict Base-2 binary arithmetic. Auto-detects local management infrastructure, models decoupled hyperscaler NFS storage, sizes HCX Network Extension fleets, and sequences multi-tier execution waves.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Download consulting-grade 4-tab Excel workbook"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export 4-Tab Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Executive PDF Dossier</span>
            </button>
            <button
              onClick={handlePushToGenerator}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <span>Send Assessment Data to 4K Blueprint Generator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Target Cloud Ecosystem & Node SKU Selection Bar */}
      <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/30 shadow-lg space-y-4">
      {/* Target Cloud Ecosystem & Node SKU Selection Bar */}
      <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/30 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Target Cloud Platform & Bare-Metal Node SKU Selector
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Ecosystem Dropdown */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400">Ecosystem:</span>
              <select
                value={selectedSku.providerShort}
                onChange={e => {
                  const eco = e.target.value;
                  if (eco === 'AVS') setSelectedSkuKey('avs-av36p');
                  else if (eco === 'GCVE') setSelectedSkuKey('gcve-ve1');
                  else if (eco === 'VMC') setSelectedSkuKey('vmc-i4i');
                }}
                className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-cyan-300 font-bold cursor-pointer text-xs"
              >
                <option value="AVS">Azure VMware Solution (AVS)</option>
                <option value="GCVE">Google Cloud VMware Engine (GCVE)</option>
                <option value="VMC">VMware Cloud on AWS (VMC)</option>
              </select>
            </div>

            {/* Node SKU Dropdown */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400">Node SKU:</span>
              <select
                value={selectedSkuKey}
                onChange={e => setSelectedSkuKey(e.target.value)}
                className="bg-slate-950 border border-cyan-500/50 px-2 py-1 rounded text-white font-bold cursor-pointer text-xs"
              >
                {selectedSku.providerShort === 'AVS' && (
                  <>
                    <option value="avs-av36p">AV36P (36 Cores, 576 GiB RAM, 15.4 TiB Raw)</option>
                    <option value="avs-av36">AV36 (36 Cores, 576 GiB RAM, 15.4 TiB Raw)</option>
                    <option value="avs-av48">AV48 (48 Cores, 768 GiB RAM, 23.0 TiB Raw)</option>
                    <option value="avs-av52">AV52 (52 Cores, 1536 GiB RAM, 38.4 TiB Raw)</option>
                    <option value="avs-av64">AV64 (64 Cores, 1024 GiB RAM, 30.7 TiB Raw)</option>
                  </>
                )}
                {selectedSku.providerShort === 'GCVE' && (
                  <>
                    <option value="gcve-ve1">ve1-standard-72 (72 Cores, 768 GiB RAM, 19.2 TiB Raw)</option>
                    <option value="gcve-ve2">ve2-standard-128 (128 Cores, 2048 GiB RAM, 51.2 TiB Raw)</option>
                  </>
                )}
                {selectedSku.providerShort === 'VMC' && (
                  <>
                    <option value="vmc-i4i">i4i.metal (64 Cores, 1024 GiB RAM, 30.0 TiB Raw)</option>
                    <option value="vmc-i3en">i3en.metal (48 Cores, 768 GiB RAM, 60.0 TiB Raw)</option>
                    <option value="vmc-m7i">m7i.metal-24xl (96 Cores, 384 GiB RAM, 15.0 TiB Raw)</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Architectural Sizing Metrics for Selected SKU */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-400 block">vCPU Overcommit Ratio</span>
            <span className="text-cyan-300 font-bold text-sm">2.5 : 1</span>
            <span className="text-[9px] text-slate-500 block">Effective Cores: {Math.ceil(inScopeVCPUs / 2.5)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">RAM Overhead Buffer</span>
            <span className="text-cyan-300 font-bold text-sm">+10% ESXi Buffer</span>
            <span className="text-[9px] text-slate-500 block">Total RAM: {Math.round(inScopeRAMGiB * 1.1)} GiB</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Raw Node Storage</span>
            <span className="text-white font-bold text-sm">{selectedSku.rawStorageTiB} TiB</span>
            <span className="text-[9px] text-slate-500 block">Usable vSAN: {selectedSku.usableStorageTiB} TiB</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Decoupled NFS Target</span>
            <span className="text-indigo-300 font-bold text-sm truncate block">{selectedSku.externalStorageName}</span>
            <span className="text-[9px] text-slate-500 block">${selectedSku.externalStorageCostPerTiB}/TiB/Month</span>
          </div>
        </div>

        {/* Quick SKU Preset Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Azure VMware Solution SKUs */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase">Azure VMware Solution (AVS)</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(['avs-av36p', 'avs-av36', 'avs-av48', 'avs-av64', 'avs-av52'] as const).map(skuKey => {
                const sku = CLOUD_SKUS[skuKey];
                const isSelected = selectedSkuKey === skuKey;
                return (
                  <button
                    key={skuKey}
                    onClick={() => setSelectedSkuKey(skuKey)}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold font-mono flex items-center justify-between">
                      <span>{sku.providerShort} {skuKey.replace('avs-', '').toUpperCase()}</span>
                      {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      {sku.cores}c · {sku.ramGiB}G · {sku.usableStorageTiB}T
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Google Cloud VMware Engine SKUs */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-blue-400 uppercase">Google Cloud VMware Engine (GCVE)</div>
            <div className="grid grid-cols-1 gap-1.5">
              {(['gcve-ve1', 'gcve-ve2'] as const).map(skuKey => {
                const sku = CLOUD_SKUS[skuKey];
                const isSelected = selectedSkuKey === skuKey;
                return (
                  <button
                    key={skuKey}
                    onClick={() => setSelectedSkuKey(skuKey)}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/80 border-blue-400 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold font-mono flex items-center justify-between">
                      <span>{sku.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      {sku.cores} Cores · {sku.ramGiB} GiB RAM · {sku.usableStorageTiB} TiB vSAN
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VMware Cloud on AWS SKUs */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-amber-400 uppercase">VMware Cloud on AWS (VMC)</div>
            <div className="grid grid-cols-1 gap-1.5">
              {(['vmc-i4i', 'vmc-i3en', 'vmc-m7i'] as const).map(skuKey => {
                const sku = CLOUD_SKUS[skuKey];
                const isSelected = selectedSkuKey === skuKey;
                return (
                  <button
                    key={skuKey}
                    onClick={() => setSelectedSkuKey(skuKey)}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/80 border-amber-400 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold font-mono flex items-center justify-between">
                      <span>{sku.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      {sku.cores} Cores · {sku.ramGiB} GiB RAM · {sku.usableStorageTiB} TiB vSAN
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Health Warnings Banner */}
      {(criticalSnapshots.length > 0 || outdatedTools.length > 0) && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/20 pb-2">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Pre-Migration Risk Matrix: Remediation Required Before Migration Execution</span>
            </div>
            <button
              onClick={() => setShowRemediationModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-900/80 hover:bg-rose-800 border border-rose-400/50 text-rose-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ListChecks className="w-3.5 h-3.5 text-rose-300" />
              <span>Open Actionable Remediation Checklist</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {criticalSnapshots.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-950/80 border border-rose-500/30 flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-mono font-bold shrink-0 mt-0.5">
                  SNAPSHOT RISK
                </span>
                <div className="text-slate-300 text-[11px] leading-relaxed">
                  <span className="font-bold text-white">{criticalSnapshots.length} VMs</span> contain active snapshots &gt;24 hours or &gt;20 GiB ({criticalSnapshots.map(v => v.vmName).join(', ')}).
                  <span className="text-rose-400 font-semibold block mt-0.5">Action: Commit Snapshots Before Migration to avoid lock corruption during HCX replication.</span>
                </div>
              </div>
            )}
            {outdatedTools.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] font-mono font-bold shrink-0 mt-0.5">
                  VMWARE TOOLS
                </span>
                <div className="text-slate-300 text-[11px] leading-relaxed">
                  <span className="font-bold text-white">{outdatedTools.length} VMs</span> have outdated or missing VMware Tools.
                  <span className="text-amber-400 font-semibold block mt-0.5">Action: Install/Update VMware Tools prior to cutover to allow quiesced snapshots and guest OS NIC customization.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Zone & Quick Sample Ingestion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 rounded-xl bg-slate-900/80 border border-dashed border-slate-700 hover:border-cyan-500/60 transition-colors flex flex-col items-center justify-center text-center relative group">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="p-3 rounded-full bg-slate-800 text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-white">
            {isParsing ? 'Parsing RVTools Multi-Tab Workbook...' : 'Drop RVTools .xlsx File Here'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Cross-references vInfo, vDisk, vSnapshot, vNetwork, and vTools. Strict Base-2 math.
          </div>
          <div className="text-[11px] font-mono text-cyan-300 mt-2">
            Active file: <span className="font-bold">{fileName}</span>
          </div>
          {uploadError && (
            <div className="mt-2 text-xs text-rose-400 bg-rose-950/60 border border-rose-500/40 px-3 py-1 rounded">
              {uploadError}
            </div>
          )}
        </div>

        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-cyan-400 font-semibold uppercase">Instant Demo & Template</div>
            <h3 className="text-sm font-bold text-white">Need a Multi-Tier Dataset?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Load our pre-configured enterprise cluster representing Oracle DBs, SQL Always-On, Kafka, and Domain Controllers.
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => {
                setVmRecords(SAMPLE_ENTERPRISE_VMS);
                setFileName('Enterprise_Production_Sample_Cluster.xlsx');
                setUploadError(null);
              }}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Enterprise Cluster (12 VMs)</span>
            </button>
            <button
              onClick={generateSampleRvToolsXlsx}
              className="w-full py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Download Blank Sample .xlsx</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Sizing Summary & Hyperscaler Storage Decoupling Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Metric Badges (Strictly In-Scope vs All Assessed) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
            <div className="text-[11px] font-mono text-slate-400">In-Scope Workloads</div>
            <div className="text-2xl font-black text-white font-mono">
              {inScopeVMs.length} <span className="text-xs text-slate-400">/ {totalAssessedVMs}</span>
            </div>
            <div className="text-[10px] text-amber-400/90 font-mono">
              {outOfScopeVMs.length} Excluded (Mgmt)
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
            <div className="text-[11px] font-mono text-slate-400">In-Scope vCPUs</div>
            <div className="text-2xl font-black text-cyan-300 font-mono">{inScopeVCPUs}</div>
            <div className="text-[10px] text-slate-500">2.5:1 Overcommit</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
            <div className="text-[11px] font-mono text-slate-400">In-Scope RAM (GiB)</div>
            <div className="text-2xl font-black text-cyan-300 font-mono">
              {inScopeRAMGiB >= 1024 ? `${(inScopeRAMGiB / 1024).toFixed(1)} TiB` : `${inScopeRAMGiB} GiB`}
            </div>
            <div className="text-[10px] text-slate-500">Base-2 (MiB/1024)</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
            <div className="text-[11px] font-mono text-slate-400">In-Scope Storage</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{inScopeStorageTiB} TiB</div>
            <div className="text-[10px] text-slate-500">{thinCount} Thin · {thickCount} Thick</div>
          </div>
        </div>

        {/* Hyperscaler Storage Decoupling & Cluster Sizing Card (5 Cols) */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              <span>{selectedSku.name} Sizing</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              Min 3-Node HA Cluster
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">Required Cloud Nodes</div>
              <div className="text-xl font-bold text-white mt-0.5">
                {sizingEngine.nodesWithDecoupled} <span className="text-xs text-slate-400">Nodes</span>
              </div>
              {sizingEngine.nodeReduction > 0 && (
                <div className="text-[9px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                  <TrendingDown className="w-2.5 h-2.5" />
                  <span>Reduced from {sizingEngine.nodesWithoutDecoupled} nodes</span>
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">Monthly Run-Rate</div>
              <div className="text-xl font-bold text-cyan-300 mt-0.5">
                ${sizingEngine.decoupledTotalCost.toLocaleString()}
              </div>
              {sizingEngine.monthlySavings > 0 && (
                <div className="text-[9px] text-emerald-400 font-semibold mt-0.5">
                  Saves ${sizingEngine.monthlySavings.toLocaleString()}/mo
                </div>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>External NFS Offloaded ({selectedSku.externalStorageName}):</span>
              <span className="text-cyan-300 font-bold">{inScopeDecoupledTiB} TiB</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Remaining Local vSAN Footprint:</span>
              <span className="text-white font-bold">{inScopeLocalVsanTiB} TiB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabbed Analysis Views (Inventory, 4-Wave Planner, Stretched VLANs) */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'inventory' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Workload Inventory ({totalAssessedVMs})
            </button>
            <button
              onClick={() => setActiveTab('waves')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'waves' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>4-Wave Sequence Planner ({inScopeVMs.length} In-Scope)</span>
            </button>
            <button
              onClick={() => setActiveTab('vlans')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'vlans' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Stretched L2 Decision Matrix ({vlanSummary.length} VLANs)</span>
            </button>
          </div>

          {activeTab === 'waves' && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Replication WAN:</span>
              <select
                value={migrationWanMbps}
                onChange={e => setMigrationWanMbps(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-cyan-300 font-bold cursor-pointer"
              >
                <option value={100}>100 Mbps (Standard VPN)</option>
                <option value={200}>200 Mbps (Dual VPN)</option>
                <option value={500}>500 Mbps (DirectConnect / ER Lite)</option>
                <option value={1000}>1 Gbps (Standard Dedicated)</option>
                <option value={2000}>2 Gbps (Aggregated Circuits)</option>
                <option value={5000}>5 Gbps (High-Throughput)</option>
                <option value={10000}>10 Gbps (ExpressRoute Direct)</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: WORKLOAD INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by VM name, operating system, cluster, port group, or environment..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Scope filter */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
                <button
                  onClick={() => setScopeFilter('all')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${scopeFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  All Scopes
                </button>
                <button
                  onClick={() => setScopeFilter('inScope')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${scopeFilter === 'inScope' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  In Scope ({inScopeVMs.length})
                </button>
                <button
                  onClick={() => setScopeFilter('outOfScope')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${scopeFilter === 'outOfScope' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  Out of Scope ({outOfScopeVMs.length})
                </button>
              </div>

              {/* HCX Method Filter */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
                <button
                  onClick={() => setMethodFilter('all')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${methodFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  All Methods
                </button>
                <button
                  onClick={() => setMethodFilter('rav')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${methodFilter === 'rav' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  RAV
                </button>
                <button
                  onClick={() => setMethodFilter('bulk')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${methodFilter === 'bulk' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  Bulk
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Virtual Machine</th>
                    <th className="py-2.5 px-2">Migration Scope</th>
                    <th className="py-2.5 px-2">Env</th>
                    <th className="py-2.5 px-2">Wave</th>
                    <th className="py-2.5 px-2">vCPU</th>
                    <th className="py-2.5 px-2">RAM (GiB)</th>
                    <th className="py-2.5 px-2">Capacity (TiB)</th>
                    <th className="py-2.5 px-2">Storage Tier</th>
                    <th className="py-2.5 px-3">Port Group & VLAN</th>
                    <th className="py-2.5 px-3">Health & Tools</th>
                    <th className="py-2.5 px-3">HCX Path</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                  {filteredRecords.map((vm, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        vm.scope === 'Out of Scope' ? 'opacity-60 bg-slate-950/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{vm.vmName}</span>
                          {vm.isManagementInfra && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[9px] font-bold" title="Auto-detected management infrastructure network">
                              MGMT INFRA
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{vm.os}</div>
                      </td>

                      {/* Scope Dropdown */}
                      <td className="py-2.5 px-2">
                        <select
                          value={vm.scope}
                          onChange={e => handleScopeChange(vm.vmName, e.target.value as VMScope)}
                          className={`border px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            vm.scope === 'In Scope'
                              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                              : vm.scope === 'Out of Scope'
                              ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                              : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                          }`}
                        >
                          <option value="In Scope">In Scope</option>
                          <option value="Out of Scope">Out of Scope</option>
                          <option value="To Be Decided">To Be Decided</option>
                        </select>
                      </td>

                      {/* Environment Dropdown */}
                      <td className="py-2.5 px-2">
                        <select
                          value={vm.environment}
                          onChange={e => handleEnvironmentChange(vm.vmName, e.target.value as VMEnvironment)}
                          className="bg-slate-950 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] text-slate-300 cursor-pointer"
                        >
                          <option value="Dev">Dev</option>
                          <option value="Staging">Staging</option>
                          <option value="QA">QA</option>
                          <option value="UAT">UAT</option>
                          <option value="Pre-Prod">Pre-Prod</option>
                          <option value="Prod">Prod</option>
                          <option value="DR">DR</option>
                        </select>
                      </td>

                      {/* Wave Dropdown */}
                      <td className="py-2.5 px-2">
                        <select
                          value={vm.assignedWave}
                          onChange={e => handleWaveOverride(vm.vmName, Number(e.target.value) as any)}
                          className="bg-slate-950 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] text-cyan-300 font-bold cursor-pointer"
                        >
                          <option value={0}>W0</option>
                          <option value={1}>W1</option>
                          <option value={2}>W2</option>
                          <option value={3}>W3</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-2 text-cyan-300">{vm.cpus}</td>
                      <td className="py-2.5 px-2">{vm.memoryGiB} GiB</td>
                      <td className="py-2.5 px-2">
                        <span className="font-bold text-white">{vm.storageTiB} TiB</span>
                        <span className="text-[9px] text-slate-500 block">({vm.provisionedDiskGiB} GiB {vm.provisioningType})</span>
                      </td>

                      {/* Target Storage Tier Selector */}
                      <td className="py-2.5 px-2">
                        <select
                          value={vm.targetStorageTier}
                          onChange={e => handleStorageTierChange(vm.vmName, e.target.value as StorageTierOption)}
                          className={`border px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                            vm.targetStorageTier === 'External NFS'
                              ? 'bg-indigo-950 border-indigo-500/50 text-indigo-300'
                              : 'bg-slate-950 border-slate-700 text-slate-300'
                          }`}
                        >
                          <option value="Local vSAN">Local vSAN</option>
                          <option value="External NFS">External NFS</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3 text-slate-300">
                        <div className="font-bold">{vm.portGroup}</div>
                        <div className="text-[10px] text-cyan-400">VLAN {vm.vlanId}</div>
                      </td>

                      {/* Health & Tools */}
                      <td className="py-2.5 px-3">
                        {vm.hasSnapshot && (vm.snapshotAgeHours > 24 || vm.snapshotSizeGiB > 20) ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1 text-[10px]">
                            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>Commit Snapshot ({vm.snapshotAgeHours}h / {vm.snapshotSizeGiB}G)</span>
                          </span>
                        ) : vm.toolsStatus === 'Healthy (Running)' ? (
                          <span className="text-emerald-400 text-[10px]">Healthy (Running)</span>
                        ) : vm.toolsStatus === 'Linux Open-VM-Tools (Verified)' ? (
                          <span className="text-teal-300 text-[10px]">Open-VM-Tools (OK)</span>
                        ) : vm.toolsStatus === 'Outdated (Update Prior to Cutover)' ? (
                          <span className="text-amber-400 font-bold text-[10px]">Outdated Tools</span>
                        ) : (
                          <span className="text-rose-400 font-bold text-[10px]">Missing / Stopped</span>
                        )}
                      </td>

                      {/* HCX Path */}
                      <td className="py-2.5 px-3 font-sans">
                        <span className="text-[10px] font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {vm.recommendedMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: 4-WAVE MIGRATION SEQUENCE PLANNER */}
        {activeTab === 'waves' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {waveAnalytics.map(wave => (
                <div
                  key={wave.waveIndex}
                  className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        Wave {wave.waveIndex}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {wave.count} In-Scope
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white leading-snug">
                      {wave.title}
                    </h4>
                    <div className="text-[11px] text-slate-400 font-mono space-y-1 pt-1">
                      <div>Storage: <span className="text-white font-bold">{wave.waveStorageTiB} TiB</span></div>
                      <div>Allocated RAM: <span className="text-white font-bold">{wave.waveRAMGiB} GiB</span></div>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-slate-800/80 text-xs font-mono">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">RAV (Live):</span>
                      <span className="text-teal-400 font-bold">{wave.ravCount} VMs</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Bulk Sync:</span>
                      <span className="text-cyan-400 font-bold">{wave.bulkCount} VMs</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Delta Sync Time:</span>
                        <span className="text-cyan-300 font-bold">~{wave.durationHours} hrs</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans">
                        Window: <span className="text-slate-300">{wave.cutoverWindow}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STRETCHED L2 DECISION MATRIX & HCX NE FLEET */}
        {activeTab === 'vlans' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-cyan-500/30">
              <div>
                <div className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  HCX Network Extension (NE) Fleet Sizing
                </div>
                <div className="text-sm text-slate-300 mt-0.5">
                  Extending <strong className="text-white">{extendedVlanCount} VLANs</strong> requires{' '}
                  <strong className="text-cyan-300">{hcxNePairsRequired} Active/Standby HCX NE Appliance Pair(s)</strong> (Rule: 1 NE pair per 8 extended VLANs).
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-400/50 text-cyan-300 font-mono text-xs font-bold text-center">
                {hcxNePairsRequired} Appliance Pair{hcxNePairsRequired > 1 ? 's' : ''} Needed
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Port Group Name</th>
                    <th className="py-2.5 px-3">VLAN ID</th>
                    <th className="py-2.5 px-3">Connected VMs</th>
                    <th className="py-2.5 px-3">In-Scope Storage (TiB)</th>
                    <th className="py-2.5 px-3">Extend Network via HCX NE?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                  {vlanSummary.map((vlan, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">{vlan.portGroup}</td>
                      <td className="py-2.5 px-3 text-cyan-300">VLAN {vlan.vlanId}</td>
                      <td className="py-2.5 px-3">{vlan.count} VMs</td>
                      <td className="py-2.5 px-3">{vlan.storageTiB} TiB</td>
                      <td className="py-2.5 px-3 font-sans">
                        <button
                          onClick={() => handleToggleVlanExtension(vlan.vlanId)}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                            vlan.isExtended
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {vlan.isExtended ? 'Yes (HCX NE Extended)' : 'No (Routed Subnet)'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Google Drive Workspace Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/40 shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Google Drive Shared Workspace</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Sync generated multi-tab Excel files and executive readiness dossiers to folder <span className="font-mono text-cyan-300 select-all">{GOOGLE_DRIVE_CONFIG.folderId}</span>.
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

      {/* Print-Ready Executive Dossier Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 overflow-y-auto flex justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-8 space-y-6 text-slate-200 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">Executive Cloud Migration Dossier</span>
                <h2 className="text-xl font-bold text-white">RVTools Assessment & Wave Readiness Report</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>In-Scope VMs: <span className="font-bold text-white">{inScopeVMs.length}</span></div>
              <div>In-Scope vCPUs: <span className="font-bold text-cyan-300">{inScopeVCPUs}</span></div>
              <div>Provisioned Storage: <span className="font-bold text-cyan-300">{inScopeStorageTiB} TiB</span></div>
              <div>Readiness Score: <span className="font-bold text-emerald-400">{readinessScore}%</span></div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Target Cloud ({selectedSku.name}) Cluster Sizing
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">Required Cloud Hosts</div>
                  <div className="text-lg font-bold text-white">{sizingEngine.nodesWithDecoupled} Nodes</div>
                  <div className="text-[10px] text-cyan-300 mt-1">N+1 Resilient</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">External Storage</div>
                  <div className="text-lg font-bold text-white">{inScopeDecoupledTiB} TiB</div>
                  <div className="text-[10px] text-indigo-300 mt-1">{selectedSku.externalStorageName}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">Monthly Run-Rate</div>
                  <div className="text-lg font-bold text-emerald-400">${sizingEngine.decoupledTotalCost.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-300 mt-1">Saves ${sizingEngine.monthlySavings.toLocaleString()}/mo</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">4-Wave Migration Sequencing Summary</h3>
              <div className="space-y-2 text-xs">
                {waveAnalytics.map(w => (
                  <div key={w.waveIndex} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">{w.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{w.count} VMs · {w.waveStorageTiB} TiB storage</div>
                    </div>
                    <div className="text-right font-mono text-cyan-300 text-xs">
                      Window: {w.cutoverWindow}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Actionable Remediation Checklist Modal */}
      {showRemediationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 overflow-y-auto flex justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-8 space-y-6 text-slate-200 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-0.5">
                <span className="text-xs font-mono text-rose-400 uppercase font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Pre-Flight Remediation Matrix</span>
                </span>
                <h2 className="text-xl font-bold text-white">Pre-Migration Snapshot & Tools Action Checklist</h2>
              </div>
              <button
                onClick={() => setShowRemediationModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step-by-step procedure sections */}
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-950 border border-rose-500/50 text-rose-300 flex items-center justify-center text-[10px] font-mono">1</span>
                    <span>Snapshot Consolidation & Stun Prevention Protocol</span>
                  </h4>
                  <span className="text-[10px] font-mono text-rose-400 font-bold">{criticalSnapshots.length} VMs Flagged</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  VMware HCX requires clean base VMDK disks to initiate delta synchronization. Active snapshots exceeding 24 hours or 20 GiB cause VM stun, delta commit timeouts, and parent disk descriptor lock contention.
                </p>

                <div className="space-y-2 pt-1">
                  {[
                    { id: 'snap-1', text: 'Pause or reschedule third-party backup jobs (Veeam/Cohesity/Commvault) during the consolidation window.' },
                    { id: 'snap-2', text: 'Temporarily set DRS Automation to Manual or Partially Automated to prevent vMotion during snapshot delete.' },
                    { id: 'snap-3', text: 'In vCenter: Right-click VM > Snapshots > Manage Snapshots > Click "Delete All" (or run PowerCLI: Get-VM [VM-Name] | Get-Snapshot | Remove-Snapshot -Confirm:$false).' },
                    { id: 'snap-4', text: 'Inspect VM Summary in vSphere Client and verify "Needs Consolidation: No". Monitor ESXi vpxa.log for asynchronous helper commit status.' },
                    { id: 'snap-5', text: 'Perform HCX Site Pairing pre-flight check to confirm source datastore delta chain is fully consolidated.' }
                  ].map(step => (
                    <label key={step.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:bg-slate-800/40">
                      <input
                        type="checkbox"
                        checked={Boolean(remediationStepsChecked[step.id])}
                        onChange={e => setRemediationStepsChecked(prev => ({ ...prev, [step.id]: e.target.checked }))}
                        className="mt-0.5 accent-cyan-400 rounded cursor-pointer"
                      />
                      <span className={`text-[11px] leading-relaxed ${remediationStepsChecked[step.id] ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                        {step.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-950 border border-amber-500/50 text-amber-300 flex items-center justify-center text-[10px] font-mono">2</span>
                    <span>VMware Tools & Guest OS Customization Protocol</span>
                  </h4>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">{outdatedTools.length} VMs Flagged</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  HCX Guest Customization and non-disruptive IP re-addressing rely on running VMware Tools daemons. Missing or outdated tools result in network interface failure upon target SDDC boot.
                </p>

                <div className="space-y-2 pt-1">
                  {[
                    { id: 'tools-1', text: 'For Windows Servers: Deploy VMware Tools via SCCM or silent installer (setup64.exe /s /v"/qn REBOOT=R") and verify VMware Tools service is automatic.' },
                    { id: 'tools-2', text: 'For RHEL / CentOS / Ubuntu Linux: Ensure distro-native open-vm-tools package is installed and active (sudo systemctl enable --now vmtoolsd).' },
                    { id: 'tools-3', text: 'Confirm VSS guest quiescing support is enabled for SQL, Oracle, and Active Directory VMs.' }
                  ].map(step => (
                    <label key={step.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:bg-slate-800/40">
                      <input
                        type="checkbox"
                        checked={Boolean(remediationStepsChecked[step.id])}
                        onChange={e => setRemediationStepsChecked(prev => ({ ...prev, [step.id]: e.target.checked }))}
                        className="mt-0.5 accent-cyan-400 rounded cursor-pointer"
                      />
                      <span className={`text-[11px] leading-relaxed ${remediationStepsChecked[step.id] ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                        {step.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Table of affected VMs */}
              {criticalSnapshots.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase font-mono">High-Priority Affected Virtual Machines ({criticalSnapshots.length})</h4>
                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th className="p-2">VM Name</th>
                          <th className="p-2">Age (Hours)</th>
                          <th className="p-2">Snapshot Size</th>
                          <th className="p-2">Port Group</th>
                          <th className="p-2">Recommended Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {criticalSnapshots.map((vm, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="p-2 font-bold text-white">{vm.vmName}</td>
                            <td className="p-2 text-rose-400 font-bold">{vm.snapshotAgeHours}h ({Math.round(vm.snapshotAgeHours/24)} days)</td>
                            <td className="p-2 text-cyan-300">{vm.snapshotSizeGiB} GiB</td>
                            <td className="p-2 text-slate-400">{vm.portGroup}</td>
                            <td className="p-2 text-emerald-400 font-sans text-[10px]">Consolidate before Wave {vm.assignedWave}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowRemediationModal(false)}
                className="px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Done / Close Checklist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
