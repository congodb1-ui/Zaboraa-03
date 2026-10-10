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
  Filter,
  Check,
  ListChecks,
  X,
  CheckSquare,
  AlertCircle,
  Zap,
  Info,
  Network
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
import {
  IngestedVM,
  parseRVToolsWorkbook,
  WorkloadInventoryAssessment
} from '../../services/workloadAnalyzer';
import {
  StoragePolicyId,
  ENTERPRISE_STORAGE_POLICIES,
  calculateStorageCapacity
} from '../../utils/storageCalculator';
import { MigrationPlanner } from '../../components/MigrationPlanner';
import { AriaNetworkDeepDiveSection } from '../../components/AriaNetworkDeepDiveSection';
import { GOOGLE_DRIVE_CONFIG } from '../../data/mediaAssets';

// Cloud Bare-Metal Node SKUs (Technical specifications only - ZERO COSTING)
interface CloudSkuInfo {
  id: string;
  name: string;
  provider: 'Azure VMware Solution' | 'Google Cloud VMware Engine' | 'VMware Cloud on AWS';
  providerShort: 'AVS' | 'GCVE' | 'VMC';
  cores: number;
  ramGiB: number;
  rawStorageTiB: number;
  usableStorageTiB: number;
  externalStorageName: string;
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
    externalStorageName: 'Azure NetApp Files (ANF)'
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
    externalStorageName: 'Azure NetApp Files (ANF)'
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
    externalStorageName: 'Azure NetApp Files (ANF)'
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
    externalStorageName: 'Azure NetApp Files (ANF)'
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
    externalStorageName: 'Azure NetApp Files (ANF)'
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
    externalStorageName: 'Google Cloud NetApp Volumes (GCNV)'
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
    externalStorageName: 'Google Cloud NetApp Volumes (GCNV)'
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
    externalStorageName: 'Amazon FSx for NetApp ONTAP'
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
    externalStorageName: 'Amazon FSx for NetApp ONTAP'
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
    externalStorageName: 'Amazon FSx for NetApp ONTAP'
  }
};

/**
 * Hydrates parsed records into full IngestedVM models with blockers
 */
function hydrateSampleVMs(records: ParsedVMRecord[]): IngestedVM[] {
  return records.map((r, idx) => {
    const blockers: IngestedVM['blockers'] = [];

    if (r.isRdmPhysical) {
      blockers.push({
        id: `blk-rdmp-${r.vmName}`,
        category: 'RDM',
        severity: 'CRITICAL',
        title: 'Raw Device Mapping (Physical Mode RDM-P)',
        description: 'Physical compatibility RDMs cannot be migrated live via HCX or vMotion without data corruption.',
        remediationAction: 'Convert RDM-P to virtual VMDK or re-provision native Cloud NFS/Block storage before cutover.',
        hcxImpact: 'Hard blocker for live HCX RAV. Requires cold migration or storage re-architecture.'
      });
    }

    if (r.isSharedScsi || r.isMultiWriter) {
      blockers.push({
        id: `blk-multiwriter-${r.vmName}`,
        category: 'SHARED_DISK',
        severity: 'CRITICAL',
        title: 'Multi-Writer Flag / Shared SCSI Bus Sharing',
        description: 'Multi-node clustering (Oracle RAC, SQL Server FCI) detects shared disks with concurrent access enabled.',
        remediationAction: 'Stage cluster nodes together in a dedicated migration wave with maintenance downtime window.',
        hcxImpact: 'HCX RAV cannot replicate multi-writer disks live. Requires HCX Bulk / Cold or shared VMDK re-config.'
      });
    }

    if (r.hardwareVersion && r.hardwareVersion < 11) {
      blockers.push({
        id: `blk-hw-${r.vmName}`,
        category: 'HARDWARE_VERSION',
        severity: 'CRITICAL',
        title: `Legacy Virtual Hardware Version (vHardware ${r.hardwareVersion})`,
        description: `Virtual hardware is version ${r.hardwareVersion}. Target Cloud ESXi baselines require HW version 14+.`,
        remediationAction: 'Schedule hardware compatibility upgrade in vCenter before initiating migration.',
        hcxImpact: 'Target cloud cluster will refuse to boot or generate compatibility fault on power-on.'
      });
    } else if (r.hardwareVersion && r.hardwareVersion < 15) {
      blockers.push({
        id: `blk-hw-warn-${r.vmName}`,
        category: 'HARDWARE_VERSION',
        severity: 'WARNING',
        title: `Aging Virtual Hardware (vHardware ${r.hardwareVersion})`,
        description: `Running below target cloud baseline (ESXi 7.0/8.0 uses HW 19/20).`,
        remediationAction: 'Upgrade virtual hardware during migration cutover reboot.',
        hcxImpact: 'Supported via backward compatibility, but prevents modern vCPU scaling features.'
      });
    }

    if (r.toolsStatus === 'Missing / Stopped (Critical Migration Risk)') {
      blockers.push({
        id: `blk-tools-${r.vmName}`,
        category: 'TOOLS',
        severity: 'CRITICAL',
        title: 'VMware Tools Missing or Stopped',
        description: 'VMware guest tools are not communicating with ESXi.',
        remediationAction: 'Install or start VMware Tools / open-vm-tools inside guest OS prior to migration.',
        hcxImpact: 'HCX RAV cannot perform guest quiescing or IP verification during live cutover.'
      });
    } else if (r.toolsStatus === 'Outdated (Update Prior to Cutover)') {
      blockers.push({
        id: `blk-tools-warn-${r.vmName}`,
        category: 'TOOLS',
        severity: 'WARNING',
        title: 'VMware Tools Outdated',
        description: 'Installed Tools version is outdated compared to target ESXi host daemon.',
        remediationAction: 'Update VMware Tools during next maintenance window.',
        hcxImpact: 'Supported, but recommended to update to prevent vNIC driver timeouts.'
      });
    }

    if (r.hasSnapshot && (r.snapshotAgeHours > 24 || r.snapshotSizeGiB > 20)) {
      blockers.push({
        id: `blk-snap-${r.vmName}`,
        category: 'SNAPSHOT',
        severity: 'CRITICAL',
        title: `High-Risk Stale Snapshot (${r.snapshotAgeHours}h / ${r.snapshotSizeGiB} GiB)`,
        description: 'Workload has an active snapshot older than 24 hours or exceeding 20 GiB.',
        remediationAction: 'Consolidate snapshots in source vCenter immediately before initiating HCX baseline sync.',
        hcxImpact: 'Severe delta sync performance degradation and risk of guest stun during consolidation.'
      });
    }

    if (r.vnicType && (r.vnicType === 'E1000' || r.vnicType === 'E1000E')) {
      blockers.push({
        id: `blk-vnic-${r.vmName}`,
        category: 'VNIC',
        severity: 'WARNING',
        title: `Legacy Network Adapter Detected (${r.vnicType})`,
        description: 'Virtual machine is configured with emulated legacy E1000/E1000E network adapters.',
        remediationAction: 'Convert network adapters to paravirtualized VMXNET3 to enable 10/25/100 Gbps line-rate throughput.',
        hcxImpact: 'Supported, but causes high host CPU interrupts and throttles network throughput in cloud.'
      });
    }

    if (r.storageController && (r.storageController.includes('PARALLEL') || r.storageController.includes('BUSLOGIC'))) {
      blockers.push({
        id: `blk-controller-${r.vmName}`,
        category: 'CONTROLLER',
        severity: 'WARNING',
        title: `Legacy Storage Controller (${r.storageController})`,
        description: 'Storage controller uses legacy parallel SCSI emulation.',
        remediationAction: 'Upgrade storage controller driver to VMware Paravirtual SCSI (PVSCSI).',
        hcxImpact: 'Increases host CPU cycles during high I/O burst. Upgrade recommended.'
      });
    }

    let score = 100;
    const criticals = blockers.filter(b => b.severity === 'CRITICAL').length;
    const warnings = blockers.filter(b => b.severity === 'WARNING').length;
    score = Math.max(20, 100 - criticals * 30 - warnings * 10);

    return {
      vmName: r.vmName,
      vmId: `vm-${1000 + idx}`,
      scope: r.scope,
      isManagementInfra: r.isManagementInfra,
      powerState: r.powerState,
      isTemplate: false,
      cpus: r.cpus,
      memoryGiB: r.memoryGiB,
      provisionedDiskGiB: r.provisionedDiskGiB,
      inUseDiskGiB: r.inUseDiskGiB,
      storageTiB: r.storageTiB,
      provisioningType: r.provisioningType,
      os: r.os,
      datacenter: r.datacenter,
      cluster: r.cluster,
      hardwareVersionNumber: r.hardwareVersion || 19,
      hardwareVersionRaw: `vmx-${r.hardwareVersion || 19}`,
      isHardwareObsolete: (r.hardwareVersion || 19) < 11,
      toolsStatus: r.toolsStatus,
      disks: [
        {
          diskName: 'Hard disk 1',
          capacityGiB: r.provisionedDiskGiB,
          inUseGiB: r.inUseDiskGiB,
          controllerType: r.storageController === 'LSI_LOGIC_PARALLEL' ? 'LSI_LOGIC_PARALLEL' : 'PVSCSI',
          controllerRaw: r.storageController || 'PVSCSI',
          isRDM: Boolean(r.isRdmPhysical || r.isRdmVirtual),
          rdmMode: r.isRdmPhysical ? 'Physical' : r.isRdmVirtual ? 'Virtual' : 'None',
          isSharedScsiBus: Boolean(r.isSharedScsi),
          isMultiWriter: Boolean(r.isMultiWriter)
        }
      ],
      primaryController: r.storageController || 'PVSCSI',
      hasLegacyController: Boolean(r.storageController && r.storageController.includes('PARALLEL')),
      hasRdmPhysical: Boolean(r.isRdmPhysical),
      hasRdmVirtual: Boolean(r.isRdmVirtual),
      hasMultiWriter: Boolean(r.isMultiWriter),
      hasSharedScsiBus: Boolean(r.isSharedScsi),
      nics: [
        {
          adapterName: 'Network adapter 1',
          adapterType: r.vnicType === 'E1000E' ? 'E1000E' : 'VMXNET3',
          portGroup: r.portGroup,
          vlanId: r.vlanId,
          isLegacyVnic: Boolean(r.vnicType && (r.vnicType === 'E1000' || r.vnicType === 'E1000E'))
        }
      ],
      portGroup: r.portGroup,
      vlanId: r.vlanId,
      hasLegacyVnic: Boolean(r.vnicType && (r.vnicType === 'E1000' || r.vnicType === 'E1000E')),
      hasSnapshot: r.hasSnapshot,
      snapshotAgeHours: r.snapshotAgeHours,
      snapshotSizeGiB: r.snapshotSizeGiB,
      environment: r.environment,
      assignedWave: r.assignedWave,
      targetStorageTier: r.targetStorageTier,
      recommendedMethod: r.recommendedMethod,
      readinessScore: score,
      blockers
    };
  });
}

export const RVToolsAnalyzerPage: React.FC = () => {
  const navigate = useNavigate();

  // Ingested Workload Inventory
  const [ingestedVMs, setIngestedVMs] = useState<IngestedVM[]>(() => hydrateSampleVMs(SAMPLE_ENTERPRISE_VMS));
  const [fileName, setFileName] = useState<string>('Enterprise_Production_Sample_Cluster.xlsx');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Active View Tabs
  const [activeTab, setActiveTab] = useState<'inventory' | 'waves' | 'aria' | 'blockers' | 'storage' | 'vlans'>('inventory');

  // Selected Cloud Node SKU (Default: Azure VMware Solution with AV36P)
  const [selectedSkuKey, setSelectedSkuKey] = useState<string>('avs-av36p');
  const selectedSku = CLOUD_SKUS[selectedSkuKey] || CLOUD_SKUS['avs-av36p'];

  // Global Sizing & Overcommit Controls
  const [vCpuOvercommit, setVCpuOvercommit] = useState<number>(2.0); // 1:1, 2:1, 3:1, 4:1
  const [ramBufferPercent, setRamBufferPercent] = useState<number>(15); // 10%, 15%, 20%
  const [storagePolicyId, setStoragePolicyId] = useState<StoragePolicyId>('raid5_ftt1');
  const [slackFactorPercent, setSlackFactorPercent] = useState<number>(25); // 25% default

  // Storage Allocation Split (vSAN % vs External SAN %)
  const [vsanPercentage, setVsanPercentage] = useState<number>(40); // 40% vSAN, 60% External SAN
  const [enableDecoupledStorage, setEnableDecoupledStorage] = useState<boolean>(true);

  // Network Extension (Stretched L2) per-VLAN toggles
  const [extendedVlanState, setExtendedVlanState] = useState<Record<number, boolean>>({
    10: true,
    20: true,
    30: true,
    40: true,
    50: true,
    100: false // Mgmt is not extended
  });

  // Print Dossier Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Remediation Action Checklist Modal State
  const [showRemediationModal, setShowRemediationModal] = useState<boolean>(false);
  const [remediationStepsChecked, setRemediationStepsChecked] = useState<Record<string, boolean>>({});

  // Parse Excel File in browser across multiple sheets with automated workloadAnalyzer
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

        const assessment: WorkloadInventoryAssessment = parseRVToolsWorkbook(wb, file.name);
        setIngestedVMs(assessment.workloads);
        setIsParsing(false);
      } catch (err: any) {
        setUploadError(err.message || 'Failed to parse RVTools export. Verify vInfo and vDisk sheets.');
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setUploadError('File reading failed. Please try again.');
      setIsParsing(false);
    };
    reader.readAsBinaryString(file);
  };

  // Scoping Toggle
  const toggleScope = (vmName: string) => {
    setIngestedVMs(prev =>
      prev.map(vm => {
        if (vm.vmName !== vmName) return vm;
        const nextScope: VMScope =
          vm.scope === 'In Scope' ? 'Out of Scope' : vm.scope === 'Out of Scope' ? 'To Be Decided' : 'In Scope';
        return { ...vm, scope: nextScope };
      })
    );
  };

  // Storage Tier Toggle
  const toggleStorageTier = (vmName: string) => {
    setIngestedVMs(prev =>
      prev.map(vm => {
        if (vm.vmName !== vmName) return vm;
        const nextTier: StorageTierOption = vm.targetStorageTier === 'Local vSAN' ? 'External NFS' : 'Local vSAN';
        return { ...vm, targetStorageTier: nextTier };
      })
    );
  };

  // In-Scope Aggregates
  const inScopeVMs = useMemo(() => ingestedVMs.filter(v => v.scope === 'In Scope'), [ingestedVMs]);
  const inScopeVCPUs = useMemo(() => inScopeVMs.reduce((acc, vm) => acc + vm.cpus, 0), [inScopeVMs]);
  const inScopeRAMGiB = useMemo(() => inScopeVMs.reduce((acc, vm) => acc + vm.memoryGiB, 0), [inScopeVMs]);
  const inScopeStorageTiB = useMemo(() => {
    return Math.round(inScopeVMs.reduce((acc, vm) => acc + vm.storageTiB, 0) * 10) / 10;
  }, [inScopeVMs]);

  // Usable Storage Capacity Calculation using storageCalculator engine
  const effectiveVsanPercent = enableDecoupledStorage ? vsanPercentage : 100;
  const storageAnalysis = useMemo(() => {
    return calculateStorageCapacity({
      totalUsedStorageTB: inScopeStorageTiB,
      totalProvisionedStorageTB: Math.round(inScopeStorageTiB * 1.3 * 10) / 10,
      vsanPercentage: effectiveVsanPercent,
      storagePolicyId,
      slackFactorPercent,
      nodeRawStorageTB: selectedSku.rawStorageTiB
    });
  }, [inScopeStorageTiB, effectiveVsanPercent, storagePolicyId, slackFactorPercent, selectedSku.rawStorageTiB]);

  const selectedPolicy = ENTERPRISE_STORAGE_POLICIES[storagePolicyId];

  // Dynamic Sizing Engine for Selected SKU (Strict Technical Capacity - ZERO COSTING)
  const sizingEngine = useMemo(() => {
    const effectiveCores = Math.ceil(inScopeVCPUs / vCpuOvercommit);
    const ramWithBuffer = Math.round(inScopeRAMGiB * (1 + ramBufferPercent / 100));

    // Nodes needed by compute and memory
    const computeNodes = Math.ceil(effectiveCores / selectedSku.cores);
    const memoryNodes = Math.ceil(ramWithBuffer / selectedSku.ramGiB);

    // Nodes without external storage (Pure 100% vSAN)
    const pureStorage = calculateStorageCapacity({
      totalUsedStorageTB: inScopeStorageTiB,
      totalProvisionedStorageTB: inScopeStorageTiB * 1.3,
      vsanPercentage: 100,
      storagePolicyId,
      slackFactorPercent,
      nodeRawStorageTB: selectedSku.rawStorageTiB
    });
    const nodesWithoutDecoupled = Math.max(selectedPolicy.minHosts, computeNodes, memoryNodes, pureStorage.vsanStorageNodesRequired);

    // Nodes with external storage offload
    const nodesWithDecoupled = Math.max(selectedPolicy.minHosts, computeNodes, memoryNodes, storageAnalysis.vsanStorageNodesRequired);
    const nodeReduction = Math.max(0, nodesWithoutDecoupled - nodesWithDecoupled);

    // Determine limiting resource driver
    let limitingDriver = 'Compute (vCPU Cores)';
    if (memoryNodes >= computeNodes && memoryNodes >= storageAnalysis.vsanStorageNodesRequired) {
      limitingDriver = 'Memory (RAM Footprint)';
    } else if (storageAnalysis.vsanStorageNodesRequired >= computeNodes && storageAnalysis.vsanStorageNodesRequired >= memoryNodes) {
      limitingDriver = 'vSAN Storage Parity';
    }

    return {
      computeNodes,
      memoryNodes,
      nodesWithoutDecoupled,
      nodesWithDecoupled,
      nodeReduction,
      limitingDriver,
      effectiveCores,
      ramWithBuffer
    };
  }, [inScopeVCPUs, inScopeRAMGiB, inScopeStorageTiB, vCpuOvercommit, ramBufferPercent, storagePolicyId, slackFactorPercent, selectedSku, selectedPolicy, storageAnalysis]);

  // Blockers & Compatibility Scanner Summaries
  const allBlockers = useMemo(() => {
    return ingestedVMs.flatMap(vm => vm.blockers);
  }, [ingestedVMs]);

  const criticalBlockers = useMemo(() => {
    return ingestedVMs.filter(vm => vm.blockers.some(b => b.severity === 'CRITICAL'));
  }, [ingestedVMs]);

  const rdmPhysicalVMs = useMemo(() => ingestedVMs.filter(vm => vm.hasRdmPhysical), [ingestedVMs]);
  const sharedScsiVMs = useMemo(() => ingestedVMs.filter(vm => vm.hasSharedScsiBus || vm.hasMultiWriter), [ingestedVMs]);
  const legacyVnicVMs = useMemo(() => ingestedVMs.filter(vm => vm.hasLegacyVnic), [ingestedVMs]);
  const legacyControllerVMs = useMemo(() => ingestedVMs.filter(vm => vm.hasLegacyController), [ingestedVMs]);
  const obsoleteHwVMs = useMemo(() => ingestedVMs.filter(vm => vm.isHardwareObsolete), [ingestedVMs]);
  const outdatedToolsVMs = useMemo(() => ingestedVMs.filter(vm => vm.toolsStatus !== 'Healthy (Running)' && vm.toolsStatus !== 'Linux Open-VM-Tools (Verified)'), [ingestedVMs]);
  const criticalSnapshotsVMs = useMemo(() => ingestedVMs.filter(vm => vm.hasSnapshot && (vm.snapshotAgeHours > 24 || vm.snapshotSizeGiB > 20)), [ingestedVMs]);

  // Overall Readiness Score
  const readinessScore = useMemo(() => {
    if (ingestedVMs.length === 0) return 85;
    return Math.round(ingestedVMs.reduce((a, v) => a + v.readinessScore, 0) / ingestedVMs.length);
  }, [ingestedVMs]);

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

  const extendedVlanCount = useMemo(() => {
    return vlanSummary.filter(v => v.isExtended).length;
  }, [vlanSummary]);
  const hcxNePairsRequired = Math.max(1, Math.ceil(extendedVlanCount / 8));

  // Filtered Table
  const filteredRecords = useMemo(() => {
    return ingestedVMs.filter(vm => {
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
        (methodFilter === 'cold' && vm.recommendedMethod === 'HCX Cold Migration') ||
        (methodFilter === 'rearchitect' && vm.recommendedMethod === 'Re-architect Required');

      const matchesScope =
        scopeFilter === 'all' ||
        (scopeFilter === 'inScope' && vm.scope === 'In Scope') ||
        (scopeFilter === 'outOfScope' && vm.scope === 'Out of Scope') ||
        (scopeFilter === 'tbd' && vm.scope === 'To Be Decided') ||
        (scopeFilter === 'blockers' && vm.blockers.length > 0);

      return matchesSearch && matchesMethod && matchesScope;
    });
  }, [ingestedVMs, searchQuery, methodFilter, scopeFilter]);

  // Handoff to 4K Blueprint Generator (Zero Costing)
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
        decoupledStorageTB: storageAnalysis.externalUsedStorageTB,
        storagePolicy: selectedPolicy.name,
        limitingDriver: sizingEngine.limitingDriver,
        vlans: vlanSummary,
        hcxNePairs: hcxNePairsRequired,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('zaboraa_4k_blueprint_state', JSON.stringify(blueprintState));
    } catch {}
    navigate('/tools/design-generator');
  };

  // Export Technical Excel Assessment (Zero Costing)
  const handleExportExcel = () => {
    // Map IngestedVM back to ParsedVMRecord for workbook export
    const exportRecords: ParsedVMRecord[] = ingestedVMs.map(vm => ({
      vmName: vm.vmName,
      scope: vm.scope,
      isManagementInfra: vm.isManagementInfra,
      powerState: vm.powerState === 'poweredOff' ? 'poweredOff' : 'poweredOn',
      cpus: vm.cpus,
      memoryGiB: vm.memoryGiB,
      provisionedDiskGiB: vm.provisionedDiskGiB,
      inUseDiskGiB: vm.inUseDiskGiB,
      storageTiB: vm.storageTiB,
      provisioningType: vm.provisioningType,
      os: vm.os,
      datacenter: vm.datacenter,
      cluster: vm.cluster,
      hasSnapshot: vm.hasSnapshot,
      snapshotAgeHours: vm.snapshotAgeHours,
      snapshotSizeGiB: vm.snapshotSizeGiB,
      toolsStatus: vm.toolsStatus,
      portGroup: vm.portGroup,
      vlanId: vm.vlanId,
      environment: vm.environment,
      assignedWave: vm.assignedWave as any,
      targetStorageTier: vm.targetStorageTier,
      recommendedMethod: vm.recommendedMethod,
      readinessReason: vm.blockers[0]?.description || 'Verified for cloud migration.',
      hardwareVersion: vm.hardwareVersionNumber,
      vnicType: vm.nics[0]?.adapterType,
      storageController: vm.primaryController,
      isRdmPhysical: vm.hasRdmPhysical,
      isRdmVirtual: vm.hasRdmVirtual,
      isMultiWriter: vm.hasMultiWriter,
      isSharedScsi: vm.hasSharedScsiBus
    }));

    exportMultiTabRvToolsAssessment(exportRecords, fileName, {
      targetCloud: selectedSku.provider,
      nodeSku: selectedSku.name,
      cloudNodes: sizingEngine.nodesWithDecoupled,
      inScopeVMCount: inScopeVMs.length,
      totalVCPUs: inScopeVCPUs,
      effectiveCores: sizingEngine.effectiveCores,
      totalRAMGiB: inScopeRAMGiB,
      bufferedRAMGiB: sizingEngine.ramWithBuffer,
      totalStorageTiB: inScopeStorageTiB,
      vsanStorageTiB: storageAnalysis.vsanUsedDataTB,
      decoupledStorageTiB: storageAnalysis.externalUsedStorageTB,
      storagePolicyApplied: selectedPolicy.name,
      vCpuOvercommit,
      ramBufferPercent,
      blockersCount: allBlockers.length
    });
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header & Breadcrumbs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link to="/tools" className="hover:text-cyan-400 transition-colors">Engineering Workbench</Link>
          <span>/</span>
          <span className="text-cyan-300">RVTools Ingestion & Migration Wave Engine</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Zero Costing Technical Assessment
              </span>
              <span className="text-xs text-slate-400">Enterprise Hyperscaler Migration Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-cyan-400" />
              <span>RVTools Ingestion, Sizing & Migration Wave Planner</span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Ingest multi-sheet RVTools exports (vInfo, vDisk, vMemory). Deep scan for RDMs, multi-writer shared disks, and legacy hardware. Calculate true usable storage with enterprise RAID/FTT policies, and sequence dependency-aware migration waves.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={generateSampleRvToolsXlsx}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
              title="Download sample multi-sheet RVTools export"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sample Export</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export .xlsx</span>
            </button>
            <button
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Executive PDF</span>
            </button>
            <button
              onClick={handlePushToGenerator}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Send to Blueprint</span>
            </button>
          </div>
        </div>
      </div>

      {/* File Upload & Ingestion Zone */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Upload className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Active RVTools Dataset:</span>
                <span className="font-mono text-cyan-300 text-xs bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  {fileName}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Parsed {ingestedVMs.length} virtual machines across vInfo, vDisk, vMemory, vNetwork, and vTools.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg transition-all">
              <Upload className="w-4 h-4" />
              <span>{isParsing ? 'Parsing Worksheets...' : 'Upload RVTools Spreadsheet'}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isParsing}
                className="hidden"
              />
            </label>
            <button
              onClick={() => {
                setIngestedVMs(hydrateSampleVMs(SAMPLE_ENTERPRISE_VMS));
                setFileName('Enterprise_Production_Sample_Cluster.xlsx');
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs cursor-pointer"
              title="Reset to Sample Cluster"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Target Cloud Ecosystem & Node SKU Selector Bar */}
      <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/30 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Target Cloud Platform & Bare-Metal Host SKU Selector
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Ecosystem Selector */}
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

            {/* Node SKU Selector */}
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

        {/* Global Technical Parameters Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-400 block">vCPU Overcommit Ratio</span>
            <select
              value={vCpuOvercommit}
              onChange={e => setVCpuOvercommit(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-cyan-300 font-bold px-1.5 py-0.5 rounded text-xs mt-0.5 w-full cursor-pointer"
            >
              <option value={1}>1:1 Ratio (Dedicated Cores)</option>
              <option value={2}>2:1 Ratio (Balanced Enterprise)</option>
              <option value={3}>3:1 Ratio (Standard Density)</option>
              <option value={4}>4:1 Ratio (High-Density Dev)</option>
            </select>
            <span className="text-[9px] text-slate-500 block mt-0.5">Effective: {sizingEngine.effectiveCores} Cores</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">RAM Overhead Buffer</span>
            <select
              value={ramBufferPercent}
              onChange={e => setRamBufferPercent(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-indigo-300 font-bold px-1.5 py-0.5 rounded text-xs mt-0.5 w-full cursor-pointer"
            >
              <option value={10}>+10% Buffer (ESXi baseline)</option>
              <option value={15}>+15% Buffer (Standard N+1)</option>
              <option value={20}>+20% Buffer (High Resiliency)</option>
            </select>
            <span className="text-[9px] text-slate-500 block mt-0.5">Buffered: {sizingEngine.ramWithBuffer} GiB</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">Storage Policy (RAID/FTT)</span>
            <select
              value={storagePolicyId}
              onChange={e => setStoragePolicyId(e.target.value as StoragePolicyId)}
              className="bg-slate-900 border border-slate-700 text-amber-300 font-bold px-1.5 py-0.5 rounded text-xs mt-0.5 w-full cursor-pointer"
            >
              <option value="raid1_ftt1">RAID 1 (2x overhead)</option>
              <option value="raid5_ftt1">RAID 5 (~1.33x overhead)</option>
              <option value="raid6_ftt2">RAID 6 (~1.50x overhead)</option>
            </select>
            <span className="text-[9px] text-slate-500 block mt-0.5">Slack Factor: {slackFactorPercent}%</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">Decoupled External NFS</span>
            <span className="text-emerald-300 font-bold text-xs truncate block mt-0.5">{selectedSku.externalStorageName}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">{storageAnalysis.externalUsedStorageTB} TiB Offloaded</span>
          </div>
        </div>
      </div>

      {/* Critical Blockers Alert Ribbon */}
      {criticalBlockers.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-2">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span>Migration Blocker Warning: {criticalBlockers.length} Workloads require pre-cutover remediation!</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('blockers')}
                className="px-3 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-100 text-xs font-semibold cursor-pointer border border-rose-500/50"
              >
                Inspect Blockers
              </button>
              <button
                onClick={() => setShowRemediationModal(true)}
                className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs cursor-pointer border border-slate-700"
              >
                Remediation Checklist
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {rdmPhysicalVMs.length > 0 && (
              <div className="bg-rose-950/80 p-2 rounded border border-rose-600/40 text-rose-200">
                <span className="text-[10px] text-rose-400 block">RDM Physical Mode</span>
                <span className="font-bold">{rdmPhysicalVMs.length} VMs Flagged</span>
              </div>
            )}
            {sharedScsiVMs.length > 0 && (
              <div className="bg-rose-950/80 p-2 rounded border border-rose-600/40 text-rose-200">
                <span className="text-[10px] text-rose-400 block">Multi-Writer / Shared SCSI</span>
                <span className="font-bold">{sharedScsiVMs.length} VMs Flagged</span>
              </div>
            )}
            {legacyVnicVMs.length > 0 && (
              <div className="bg-amber-950/80 p-2 rounded border border-amber-600/40 text-amber-200">
                <span className="text-[10px] text-amber-400 block">Legacy E1000/E1000E vNIC</span>
                <span className="font-bold">{legacyVnicVMs.length} VMs Flagged</span>
              </div>
            )}
            {criticalSnapshotsVMs.length > 0 && (
              <div className="bg-rose-950/80 p-2 rounded border border-rose-600/40 text-rose-200">
                <span className="text-[10px] text-rose-400 block">Stale Snapshots (&gt;24h)</span>
                <span className="font-bold">{criticalSnapshotsVMs.length} VMs Flagged</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Engineering Metrics Bar (Zero Costing) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Workload Inventory Sizing (7 Cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
            <div className="text-[11px] font-mono text-slate-400">In-Scope VMs</div>
            <div className="text-2xl font-black text-white font-mono">{inScopeVMs.length}</div>
            <div className="text-[10px] text-slate-500">{ingestedVMs.length} Total Assessed</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
            <div className="text-[11px] font-mono text-slate-400">Raw vCPUs</div>
            <div className="text-2xl font-black text-cyan-300 font-mono">{inScopeVCPUs}</div>
            <div className="text-[10px] text-slate-500">{vCpuOvercommit}:1 Overcommit</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
            <div className="text-[11px] font-mono text-slate-400">RAM (GiB)</div>
            <div className="text-2xl font-black text-indigo-300 font-mono">{inScopeRAMGiB}</div>
            <div className="text-[10px] text-slate-500">+{ramBufferPercent}% Buffer</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
            <div className="text-[11px] font-mono text-slate-400">In-Use Storage</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{inScopeStorageTiB} <span className="text-xs font-normal">TiB</span></div>
            <div className="text-[10px] text-slate-500">Base-2 Exact Math</div>
          </div>
        </div>

        {/* Cluster Host Sizing Card (5 Cols - Zero Costing) */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              <span>{selectedSku.name} Sizing</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              N+1 Resilient
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">Required Cloud Hosts</div>
              <div className="text-xl font-bold text-white mt-0.5">
                {sizingEngine.nodesWithDecoupled} <span className="text-xs text-slate-400">Hosts</span>
              </div>
              {sizingEngine.nodeReduction > 0 && (
                <div className="text-[9px] text-emerald-400 font-semibold mt-0.5">
                  Decoupled saves {sizingEngine.nodeReduction} hosts
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">Limiting Constraint</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5 truncate">
                {sizingEngine.limitingDriver}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                {selectedPolicy.shortLabel}
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Local vSAN Usable Footprint:</span>
              <span className="text-cyan-300 font-bold">{storageAnalysis.vsanUsedDataTB} TiB</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Offloaded to External NFS ({selectedSku.externalStorageName}):</span>
              <span className="text-emerald-300 font-bold">{storageAnalysis.externalUsedStorageTB} TiB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabbed Analysis Navigation */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'inventory' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Workload Inventory ({ingestedVMs.length})
            </button>
            <button
              onClick={() => setActiveTab('waves')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'waves' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Migration Wave Planner ({inScopeVMs.length} In-Scope)</span>
            </button>
            <button
              onClick={() => setActiveTab('aria')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'aria' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Aria Flow & DFW Discovery</span>
            </button>
            <button
              onClick={() => setActiveTab('blockers')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'blockers' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Blockers & Readiness Scanner ({allBlockers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'storage' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Storage Policy & Capacity Sizing</span>
            </button>
            <button
              onClick={() => setActiveTab('vlans')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'vlans' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Stretched L2 VLANs ({vlanSummary.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Workload Inventory */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Search and Filter Ribbon */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search VM name, OS, cluster, VLAN, port group..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
                <select
                  value={scopeFilter}
                  onChange={e => setScopeFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-300 text-xs px-2.5 py-2 rounded-lg cursor-pointer"
                >
                  <option value="all">All Scopes</option>
                  <option value="inScope">In Scope Only</option>
                  <option value="outOfScope">Out of Scope</option>
                  <option value="blockers">Has Blockers</option>
                </select>

                <select
                  value={methodFilter}
                  onChange={e => setMethodFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-300 text-xs px-2.5 py-2 rounded-lg cursor-pointer"
                >
                  <option value="all">All HCX Methods</option>
                  <option value="rav">RAV (Live vMotion)</option>
                  <option value="bulk">Bulk Migration</option>
                  <option value="cold">Cold Migration</option>
                  <option value="rearchitect">Re-architect Required</option>
                </select>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Scope</th>
                    <th className="py-3 px-3">VM Name</th>
                    <th className="py-3 px-2">vCPU</th>
                    <th className="py-3 px-2">RAM</th>
                    <th className="py-3 px-2">Storage (Used)</th>
                    <th className="py-3 px-2">Storage Tier</th>
                    <th className="py-3 px-2">vNIC</th>
                    <th className="py-3 px-2">Controller</th>
                    <th className="py-3 px-2">HW</th>
                    <th className="py-3 px-2">Method</th>
                    <th className="py-3 px-3 text-right">Readiness & Blockers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                  {filteredRecords.map(vm => {
                    const hasBlocker = vm.blockers.length > 0;
                    return (
                      <tr key={vm.vmName} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => toggleScope(vm.vmName)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                              vm.scope === 'In Scope'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-600/60'
                                : vm.scope === 'Out of Scope'
                                ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {vm.scope}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${vm.powerState === 'poweredOn' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            <span>{vm.vmName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{vm.os}</div>
                        </td>
                        <td className="py-2.5 px-2 text-slate-300">{vm.cpus} vCPU</td>
                        <td className="py-2.5 px-2 text-slate-300">{vm.memoryGiB} GiB</td>
                        <td className="py-2.5 px-2 text-slate-300">
                          {vm.storageTiB} TiB
                          <span className="text-[10px] text-slate-500 block">{vm.inUseDiskGiB} GiB</span>
                        </td>
                        <td className="py-2.5 px-2">
                          <button
                            onClick={() => toggleStorageTier(vm.vmName)}
                            className={`text-[10px] px-2 py-0.5 rounded cursor-pointer border ${
                              vm.targetStorageTier === 'External NFS'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                            }`}
                          >
                            {vm.targetStorageTier}
                          </button>
                        </td>
                        <td className="py-2.5 px-2 text-[11px]">
                          <span className={vm.hasLegacyVnic ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                            {vm.nics[0]?.adapterType || 'VMXNET3'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-[11px]">
                          <span className={vm.hasLegacyController ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                            {vm.primaryController}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-[11px]">
                          <span className={vm.isHardwareObsolete ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            vHW {vm.hardwareVersionNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                              vm.recommendedMethod === 'HCX RAV (Live vMotion)'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                : vm.recommendedMethod === 'HCX Bulk Migration'
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                                : vm.recommendedMethod === 'HCX Cold Migration'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {vm.recommendedMethod.replace('HCX ', '')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {hasBlocker ? (
                            <div className="flex flex-col items-end gap-1">
                              {vm.blockers.map(b => (
                                <span
                                  key={b.id}
                                  className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                    b.severity === 'CRITICAL'
                                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                                  }`}
                                  title={b.remediationAction}
                                >
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>{b.title}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Ready ({vm.readinessScore}/100)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Migration Wave Planner */}
        {activeTab === 'waves' && (
          <MigrationPlanner workloads={ingestedVMs} />
        )}

        {/* Tab 3: Aria Operations for Networks Flow Analytics & DFW Engine */}
        {activeTab === 'aria' && (
          <AriaNetworkDeepDiveSection />
        )}

        {/* Tab 3: Advanced Migration Readiness & Blockers Dashboard */}
        {activeTab === 'blockers' && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Deep Technical Readiness & Migration Blockers Scanner</span>
              </h3>
              <p className="text-xs text-slate-400">
                Automated inspection of RVTools inventory against hyperscaler migration constraints (HCX, vSphere 7.0/8.0). Categorizes critical blockers, hardware obsolescence, and emulated driver bottlenecks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Raw Device Mappings */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Raw Device Mappings (RDMs)</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${rdmPhysicalVMs.length > 0 ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-emerald-950 text-emerald-300'}`}>
                    {rdmPhysicalVMs.length} Physical · {ingestedVMs.filter(v => v.hasRdmVirtual).length} Virtual
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  RDM-P (Physical Mode) maps raw SCSI commands directly to storage LUNs and cannot be replicated live via HCX RAV. RDM-V (Virtual Mode) can be converted to VMDK during HCX Bulk Migration.
                </p>
                {rdmPhysicalVMs.length > 0 ? (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs font-mono">
                    <span className="text-[11px] text-rose-400 font-bold block">Affected Workloads:</span>
                    {rdmPhysicalVMs.map(vm => (
                      <div key={vm.vmName} className="p-2 rounded bg-slate-950 border border-rose-900/40 text-slate-300 flex justify-between">
                        <span>{vm.vmName}</span>
                        <span className="text-rose-400">RDM-P</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 font-mono">No Physical RDMs detected in inventory.</div>
                )}
              </div>

              {/* Card 2: Shared Disks & Multi-Writer */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Multi-Writer & Shared SCSI</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${sharedScsiVMs.length > 0 ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-emerald-950 text-emerald-300'}`}>
                    {sharedScsiVMs.length} Cluster Nodes
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Workloads with disk.enableConcurrentAccess="true" (Oracle RAC, SQL Server Failover Cluster Instances). Concurrent access must be sequenced in a dedicated cluster wave.
                </p>
                {sharedScsiVMs.length > 0 ? (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs font-mono">
                    <span className="text-[11px] text-rose-400 font-bold block">Clustered VMs:</span>
                    {sharedScsiVMs.map(vm => (
                      <div key={vm.vmName} className="p-2 rounded bg-slate-950 border border-rose-900/40 text-slate-300 flex justify-between">
                        <span>{vm.vmName}</span>
                        <span className="text-amber-400">Shared SCSI</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 font-mono">No shared multi-writer disks detected.</div>
                )}
              </div>

              {/* Card 3: Virtual Hardware Version */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Virtual Hardware Versions</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${obsoleteHwVMs.length > 0 ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-emerald-950 text-emerald-300'}`}>
                    {obsoleteHwVMs.length} Obsolete (&lt;HW11)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Target cloud platforms (AVS, AWS VMC, GCVE) run on ESXi 7.0/8.0 (HW 19/20). Workloads running below HW 11 fail power-on checks in cloud SDDC.
                </p>
                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span>Target Baseline:</span>
                    <span className="text-cyan-300 font-bold">ESXi 7.0/8.0 (HW 19/20)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aging HW (11-14):</span>
                    <span className="text-amber-300">{ingestedVMs.filter(v => v.hardwareVersionNumber >= 11 && v.hardwareVersionNumber < 15).length} VMs</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Legacy Network Adapters */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Network Adapters (vNICs)</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${legacyVnicVMs.length > 0 ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-emerald-950 text-emerald-300'}`}>
                    {legacyVnicVMs.length} Legacy E1000/E
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Emulated Intel E1000/E1000E drivers generate CPU interrupt bottlenecks and are capped at 1 Gbps. Convert to VMXNET3 prior to cutover for 25/100 Gbps cloud line-rate.
                </p>
                <div className="text-xs font-mono text-slate-300 pt-2 border-t border-slate-800 flex justify-between">
                  <span>Paravirtual VMXNET3:</span>
                  <span className="text-emerald-400 font-bold">{ingestedVMs.filter(v => !v.hasLegacyVnic).length} VMs</span>
                </div>
              </div>

              {/* Card 5: Storage Controllers */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Storage Controllers</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${legacyControllerVMs.length > 0 ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-emerald-950 text-emerald-300'}`}>
                    {legacyControllerVMs.length} Legacy SCSI
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Legacy LSI Logic Parallel or BusLogic controllers should be upgraded to VMware Paravirtual SCSI (PVSCSI) to minimize host CPU consumption during I/O bursts.
                </p>
                <div className="text-xs font-mono text-slate-300 pt-2 border-t border-slate-800 flex justify-between">
                  <span>PVSCSI Optimized:</span>
                  <span className="text-cyan-400 font-bold">{ingestedVMs.filter(v => !v.hasLegacyController).length} VMs</span>
                </div>
              </div>

              {/* Card 6: VMware Tools & Snapshots */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Tools & Snapshot Health</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${criticalSnapshotsVMs.length > 0 ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-emerald-950 text-emerald-300'}`}>
                    {criticalSnapshotsVMs.length} Stale Snapshots
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  VMware Tools must be active for HCX guest quiescing. Active snapshots older than 24 hours trigger disk stun during delta synchronization.
                </p>
                <div className="text-xs font-mono text-slate-300 pt-2 border-t border-slate-800 flex justify-between">
                  <span>Outdated Tools:</span>
                  <span className="text-amber-400 font-bold">{outdatedToolsVMs.length} VMs</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Storage Policy & Capacity Sizing */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Controls (6 Cols) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="text-xs font-bold text-white uppercase font-mono flex items-center justify-between">
                    <span>Enterprise Storage Policy Selector</span>
                    <span className="text-cyan-400">{selectedPolicy.shortLabel}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-300">Target RAID / FTT Policy</label>
                    <select
                      value={storagePolicyId}
                      onChange={e => setStoragePolicyId(e.target.value as StoragePolicyId)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white cursor-pointer"
                    >
                      <option value="raid1_ftt1">RAID 1, FTT 1 (2.0x raw capacity factor - Mirroring)</option>
                      <option value="raid5_ftt1">RAID 5, FTT 1 (~1.33x efficiency factor - 3+1 Erasure Coding)</option>
                      <option value="raid6_ftt2">RAID 6, FTT 2 (~1.50x dual parity factor - 4+2 Erasure Coding)</option>
                    </select>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {selectedPolicy.description} Minimum {selectedPolicy.minHosts} bare-metal hosts required in target cluster.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">vSAN Operational Slack Factor</span>
                      <span className="text-cyan-400 font-mono font-bold">{slackFactorPercent}%</span>
                    </div>
                    <select
                      value={slackFactorPercent}
                      onChange={e => setSlackFactorPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white cursor-pointer"
                    >
                      <option value={20}>20% Slack (VMware Minimum Safety Baseline)</option>
                      <option value={25}>25% Slack (Enterprise Recommended Standard)</option>
                      <option value={30}>30% Slack (High Resync & Snapshot Growth)</option>
                    </select>
                  </div>

                  {/* Storage Allocation Split */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-cyan-300 font-bold">Cluster vSAN: {vsanPercentage}% ({storageAnalysis.vsanUsedDataTB} TiB)</span>
                      <span className="text-emerald-300 font-bold">External NFS: {100 - vsanPercentage}% ({storageAnalysis.externalUsedStorageTB} TiB)</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={vsanPercentage}
                      onChange={e => setVsanPercentage(Number(e.target.value))}
                      className="w-full accent-cyan-400 bg-slate-800 h-2 rounded cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>10% vSAN (Maximum NFS Offload)</span>
                      <span>50% Balanced</span>
                      <span>90% vSAN Heavy</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Output Capacity Cards (6 Cols) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-5 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-4">
                  <div className="text-xs font-bold text-white uppercase font-mono flex items-center justify-between">
                    <span>True Usable Capacity & Parity Breakdown</span>
                    <span className="text-emerald-400 font-mono font-bold">N+1 Resilient</span>
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>In-Scope Active Workload Data:</span>
                      <span className="text-white font-bold">{storageAnalysis.totalUsedStorageTB} TiB</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>vSAN Active Data Share ({storageAnalysis.vsanPercentage}%):</span>
                      <span className="text-cyan-300 font-bold">{storageAnalysis.vsanUsedDataTB} TiB</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>vSAN Policy Parity Overhead ({selectedPolicy.shortLabel}):</span>
                      <span className="text-amber-400 font-bold">+{storageAnalysis.vsanPolicyOverheadTB} TiB</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>vSAN Operational Slack Reserve ({slackFactorPercent}%):</span>
                      <span className="text-indigo-400 font-bold">+{storageAnalysis.vsanSlackTB} TiB</span>
                    </div>
                    <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800">
                      <span className="font-bold">Raw vSAN Node Storage Required:</span>
                      <span className="text-cyan-400 font-black text-sm">{storageAnalysis.vsanRawRequiredTB} TiB</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="font-bold">External SAN Provisioned ({selectedSku.externalStorageName}):</span>
                      <span className="text-emerald-400 font-black text-sm">{storageAnalysis.externalProvisionedTB} TiB</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                    <div className="text-slate-400">Required Storage Hosts for vSAN ({selectedSku.name}):</div>
                    <div className="text-xl font-bold text-white mt-1">
                      {storageAnalysis.vsanStorageNodesRequired} <span className="text-xs text-slate-400">Hosts</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Provides {storageAnalysis.vsanUsablePerNodeTB} TiB net usable capacity per node under {selectedPolicy.shortLabel}.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Stretched L2 VLAN Decision Matrix */}
        {activeTab === 'vlans' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-cyan-400" />
                  <span>Stretched Layer-2 Network Extensions (HCX Network Extension)</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Extending VLANs eliminates VM IP address changes and routing cutover delays during migration.
                </div>
              </div>
              <div className="text-xs font-mono text-cyan-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                HCX-NE Appliance Fleet: <span className="font-bold text-white">{hcxNePairsRequired} Pair(s)</span> (1 pair per 8 extended VLANs)
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Port Group / VLAN</th>
                    <th className="py-2.5 px-3">Connected VMs</th>
                    <th className="py-2.5 px-3">Aggregated Storage</th>
                    <th className="py-2.5 px-3">HCX Extension</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {vlanSummary.map(v => (
                    <tr key={v.vlanId} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {v.portGroup} (VLAN {v.vlanId})
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{v.count} VMs</td>
                      <td className="py-2.5 px-3 text-cyan-300">{v.storageTiB} TiB</td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => setExtendedVlanState(prev => ({ ...prev, [v.vlanId]: !v.isExtended }))}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer border ${
                            v.isExtended
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {v.isExtended ? 'Extended (Stretched L2)' : 'Isolated (No Extension)'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {v.isExtended ? 'Zero IP Mutation' : 'Re-IP in Cloud Tier-1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Print Dossier Modal (Zero Costing) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 overflow-y-auto flex justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-8 space-y-6 text-slate-200 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">Executive Architecture Dossier</span>
                <h2 className="text-xl font-bold text-white">RVTools Technical Assessment & Wave Schedule</h2>
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
              <div>Effective Cores: <span className="font-bold text-cyan-300">{sizingEngine.effectiveCores}</span></div>
              <div>Buffered RAM: <span className="font-bold text-indigo-300">{sizingEngine.ramWithBuffer} GiB</span></div>
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
                  <div className="text-slate-400">Storage Policy Applied</div>
                  <div className="text-sm font-bold text-amber-300 mt-1">{selectedPolicy.shortLabel}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{slackFactorPercent}% Slack Factor</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">External NFS Offload</div>
                  <div className="text-lg font-bold text-emerald-400">{storageAnalysis.externalUsedStorageTB} TiB</div>
                  <div className="text-[10px] text-slate-400 mt-1">{selectedSku.externalStorageName}</div>
                </div>
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
                <h2 className="text-xl font-bold text-white">Pre-Migration Snapshot & Driver Action Checklist</h2>
              </div>
              <button
                onClick={() => setShowRemediationModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-950 border border-rose-500/50 text-rose-300 flex items-center justify-center text-[10px] font-mono">1</span>
                    <span>Snapshot Consolidation Protocol</span>
                  </h4>
                  <span className="text-[10px] font-mono text-rose-400 font-bold">{criticalSnapshotsVMs.length} VMs Flagged</span>
                </div>
                <div className="space-y-2 pt-1">
                  {[
                    { id: 'snap-1', text: 'Delete or commit stale snapshots exceeding 24 hours prior to initiating HCX replication.' },
                    { id: 'snap-2', text: 'Verify "Needs Consolidation" flag in vCenter is cleared on all source ESXi hosts.' },
                    { id: 'snap-3', text: 'Confirm source datastore delta chains are clean to prevent VM stun during live migration cutovers.' }
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
                    <span>Hardware & Driver Modernization</span>
                  </h4>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">{legacyVnicVMs.length + legacyControllerVMs.length} Adapters/Controllers</span>
                </div>
                <div className="space-y-2 pt-1">
                  {[
                    { id: 'drv-1', text: 'Convert legacy emulated E1000/E1000E network adapters to VMXNET3 to enable cloud line-rate throughput.' },
                    { id: 'drv-2', text: 'Update legacy LSI Logic Parallel controllers to VMware Paravirtual SCSI (PVSCSI).' },
                    { id: 'drv-3', text: 'Upgrade virtual hardware version to baseline vHardware 15+ during scheduled maintenance cutover reboot.' }
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
