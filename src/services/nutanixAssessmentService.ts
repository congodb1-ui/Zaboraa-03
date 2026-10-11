import * as XLSX from 'xlsx';
import { ParsedVMRecord, SAMPLE_ENTERPRISE_VMS } from '../data/sampleRvToolsData';

export type AzureBareMetalSku = 'AN36' | 'AN36P' | 'AN64' | 'AN100';
export type ReplicationFactor = 'RF2' | 'RF3';
export type AhvReadinessCategory = 
  | 'Direct Move Ready'
  | 'VirtIO Driver Injection Required'
  | 'Legacy Controller / vNIC Modernization'
  | 'Architectural Intervention (RDM / Multi-Writer)';

export interface AzureNodeSpec {
  sku: AzureBareMetalSku;
  name: string;
  physicalCores: number;
  threads: number;
  rawMemoryGiB: number;
  rawNvmeTiB: number;
  recommendedFor: string;
}

export const AZURE_NC2_NODE_SPECS: Record<AzureBareMetalSku, AzureNodeSpec> = {
  AN36: {
    sku: 'AN36',
    name: 'Azure Bare-Metal AN36',
    physicalCores: 36,
    threads: 72,
    rawMemoryGiB: 768,
    rawNvmeTiB: 19.2,
    recommendedFor: 'Balanced compute & memory workloads; web/app tiers'
  },
  AN36P: {
    sku: 'AN36P',
    name: 'Azure Bare-Metal AN36P (High Memory)',
    physicalCores: 36,
    threads: 72,
    rawMemoryGiB: 1536,
    rawNvmeTiB: 38.4,
    recommendedFor: 'Memory-heavy transactional databases and caching nodes'
  },
  AN64: {
    sku: 'AN64',
    name: 'Azure Bare-Metal AN64 (High Compute & Storage)',
    physicalCores: 64,
    threads: 128,
    rawMemoryGiB: 1536,
    rawNvmeTiB: 38.4,
    recommendedFor: 'Dense compute consolidation, analytics & core databases'
  },
  AN100: {
    sku: 'AN100',
    name: 'Azure Bare-Metal AN100 (Ultra High-Density)',
    physicalCores: 104,
    threads: 208,
    rawMemoryGiB: 2048,
    rawNvmeTiB: 61.4,
    recommendedFor: 'Tier-1 enterprise SAP, Oracle RAC, large SQL data estates'
  }
};

export interface NutanixClusterConfig {
  selectedSku: AzureBareMetalSku;
  vcpuOvercommit: number; // 1 to 4
  ramBufferPercent: number; // 0.05 to 0.20
  replicationFactor: ReplicationFactor;
  dedupCompressionFactor: number; // 1.1 to 2.0 (default 1.4)
  erasureCodingEnabled: boolean; // EC-X adds ~20% usable efficiency
  storageSlackPercent: number; // 0.20 to 0.30 (default 0.25)
  cvmVcpuAllocation: number; // default 12
  cvmRamGiB: number; // default 32
  haTolerance: 'N+1' | 'N+2';
  expressRouteBandwidthGbps: number; // 1, 2, 5, 10
}

export const DEFAULT_NUTANIX_CONFIG: NutanixClusterConfig = {
  selectedSku: 'AN36',
  vcpuOvercommit: 2,
  ramBufferPercent: 0.10,
  replicationFactor: 'RF2',
  dedupCompressionFactor: 1.4,
  erasureCodingEnabled: true,
  storageSlackPercent: 0.25,
  cvmVcpuAllocation: 12,
  cvmRamGiB: 32,
  haTolerance: 'N+1',
  expressRouteBandwidthGbps: 10
};

export interface EvaluatedNutanixVM extends ParsedVMRecord {
  ahvCategory: AhvReadinessCategory;
  virtIoRequired: boolean;
  controllerRemediation: string;
  vnicRemediation: string;
  rdmWarning?: string;
  multiWriterWarning?: string;
  recommendedMoveMethod: 'Move Live Replication' | 'Move Cold Cutover' | 'Volume Group (iSCSI)';
  suggestedWave: number;
  targetVNetSubnet: string;
  migrationNotes: string[];
}

export interface NutanixSizingVerdict {
  totalInScopeVMs: number;
  totalVcpusDemanded: number;
  totalRamDemandedGiB: number;
  totalUsedStorageTiB: number;
  totalProvisionedStorageTiB: number;

  selectedSku: AzureNodeSpec;
  usableVcpusPerNode: number;
  usableRamPerNodeGiB: number;
  usableStoragePerNodeTiB: number;

  nodesForCompute: number;
  nodesForMemory: number;
  nodesForStorage: number;
  baseNodesRequired: number;
  haNodes: number;
  totalRecommendedNodes: number;

  limitingFactor: 'Compute (vCPUs)' | 'Memory (RAM)' | 'Storage (DSF Usable)';
  
  clusterTotalPhysicalCores: number;
  clusterTotalVcpuCapacity: number;
  clusterVcpuUtilizationPercent: number;

  clusterTotalUsableRamGiB: number;
  clusterRamUtilizationPercent: number;

  clusterTotalUsableDsfTiB: number;
  clusterStorageUtilizationPercent: number;

  cvmOverheadVcpusTotal: number;
  cvmOverheadRamGiBTotal: number;
}

export interface NutanixWaveSummary {
  waveIndex: number;
  waveName: string;
  vmCount: number;
  totalVcpus: number;
  totalRamGiB: number;
  totalUsedStorageTiB: number;
  complexity: 'Low' | 'Medium' | 'High' | 'Complex Architectural';
  estimatedSyncHours: number;
  suggestedCutoverWindow: string;
  targetSubnet: string;
  vms: EvaluatedNutanixVM[];
}

export interface NutanixAssessmentReport {
  summary: {
    totalVMs: number;
    inScopeVMs: number;
    outOfScopeVMs: number;
    readyPercent: number;
    flaggedPercent: number;
  };
  categorization: Record<AhvReadinessCategory, number>;
  sizing: NutanixSizingVerdict;
  waves: NutanixWaveSummary[];
  evaluatedVms: EvaluatedNutanixVM[];
}

/**
 * Classifies an RVTools VM record for Nutanix AHV and Nutanix Move cross-hypervisor migration.
 */
export function evaluateVmForNutanixAHV(vm: ParsedVMRecord): EvaluatedNutanixVM {
  const notes: string[] = [];
  let ahvCategory: AhvReadinessCategory = 'Direct Move Ready';
  let virtIoRequired = false;
  let recommendedMoveMethod: EvaluatedNutanixVM['recommendedMoveMethod'] = 'Move Live Replication';

  // 1. Inspect OS and VirtIO driver needs
  const osLower = (vm.os || '').toLowerCase();
  const isWindows = osLower.includes('windows');
  const isOlderWindows = osLower.includes('2008') || osLower.includes('2012') || osLower.includes('7');
  const isModernWindows = osLower.includes('2016') || osLower.includes('2019') || osLower.includes('2022') || osLower.includes('10') || osLower.includes('11');
  
  if (isWindows) {
    virtIoRequired = true;
    notes.push('Guest OS is Windows: Nutanix Move will automatically inject AHV VirtIO drivers during staging prep.');
  } else if (osLower.includes('rhel 6') || osLower.includes('centos 6')) {
    virtIoRequired = true;
    notes.push('Legacy Linux kernel: Verify VirtIO kernel modules exist prior to cutover.');
  } else {
    notes.push('Linux guest OS: Native VirtIO drivers bundled in modern Linux kernels.');
  }

  // 2. Storage controller inspection
  const controller = (vm.storageController || 'LSI Logic SAS').toLowerCase();
  let controllerRemediation = 'Direct Translation';
  if (controller.includes('buslogic') || controller.includes('parallel')) {
    controllerRemediation = 'Convert BusLogic/Parallel to AHV VirtIO-SCSI (Nutanix Move automated)';
    notes.push('Legacy SCSI controller detected: Nutanix Move converts to high-performance AHV VirtIO-SCSI.');
    if (ahvCategory === 'Direct Move Ready') {
      ahvCategory = 'Legacy Controller / vNIC Modernization';
    }
  } else if (controller.includes('pvscsi')) {
    controllerRemediation = 'VMware PVSCSI -> AHV VirtIO-SCSI (Direct Mapping)';
  } else {
    controllerRemediation = 'LSI Logic SAS -> AHV VirtIO-SCSI (Direct Translation)';
  }

  // 3. Network adapter inspection
  const vnic = (vm.vnicType || 'VMXNET3').toLowerCase();
  let vnicRemediation = 'Standard VirtIO Net';
  if (vnic.includes('e1000') || vnic.includes('flexible')) {
    vnicRemediation = 'Upgrade legacy E1000/Flexible to AHV VirtIO-Net (Replaces 1Gbps emulated NIC)';
    notes.push('Legacy E1000 virtual NIC detected: Nutanix Move will replace with AHV 10/25Gbps VirtIO-Net.');
    if (ahvCategory === 'Direct Move Ready') {
      ahvCategory = 'Legacy Controller / vNIC Modernization';
    }
  }

  // 4. Blockers: RDMs, Multi-Writer, Shared SCSI
  let rdmWarning: string | undefined = undefined;
  let multiWriterWarning: string | undefined = undefined;

  if (vm.isRdmPhysical) {
    ahvCategory = 'Architectural Intervention (RDM / Multi-Writer)';
    recommendedMoveMethod = 'Volume Group (iSCSI)';
    rdmWarning = 'Physical RDM (RDM-P) cannot be snapshot-replicated directly. Convert to Nutanix Volume Group (VG) via iSCSI or ingest raw LUN via in-guest tool.';
    notes.push('CRITICAL: Physical RDM detected. Requires target Nutanix Volume Group or conversion to virtual disk.');
  } else if (vm.isRdmVirtual) {
    ahvCategory = 'Architectural Intervention (RDM / Multi-Writer)';
    recommendedMoveMethod = 'Move Cold Cutover';
    rdmWarning = 'Virtual RDM (RDM-V) detected: Can be cloned to AHV vDisk or mapped to Volume Group.';
    notes.push('Virtual RDM detected: Nutanix Move can convert to AHV vDisk during scheduled cutover.');
  }

  if (vm.isMultiWriter || vm.isSharedScsi) {
    ahvCategory = 'Architectural Intervention (RDM / Multi-Writer)';
    recommendedMoveMethod = 'Volume Group (iSCSI)';
    multiWriterWarning = 'Multi-Node Shared Disk (Oracle RAC / SQL FCI): Map disks to Nutanix Volume Group with multi-attach enabled to preserve shared quorum/data disks.';
    notes.push('Clustered Shared SCSI / Multi-Writer: Attach target disks to shared Nutanix Volume Group across cluster nodes.');
  }

  // 5. Hardware Version Check
  const hwVer = vm.hardwareVersion || 14;
  if (hwVer < 11) {
    notes.push(`Hardware version vmx-${hwVer} is legacy: AHV will modernize virtual hardware attributes upon conversion.`);
  }

  // If requires VirtIO and no severe blocker, assign category
  if (virtIoRequired && ahvCategory === 'Direct Move Ready') {
    ahvCategory = 'VirtIO Driver Injection Required';
  }

  // Suggested Wave assignment
  let suggestedWave = 2;
  const nameLower = vm.vmName.toLowerCase();
  if (vm.scope === 'Out of Scope') {
    suggestedWave = 0;
  } else if (ahvCategory === 'Architectural Intervention (RDM / Multi-Writer)') {
    suggestedWave = 4;
  } else if (nameLower.includes('dev') || nameLower.includes('test') || nameLower.includes('qa') || nameLower.includes('uat')) {
    suggestedWave = 1;
  } else if (nameLower.includes('db') || nameLower.includes('sql') || nameLower.includes('oracle') || nameLower.includes('postgres')) {
    suggestedWave = 3;
  } else {
    suggestedWave = 2;
  }

  const targetVNetSubnet = `Azure-VNet-Subnet-VLAN-${vm.vlanId || 100} (Flow L2)`;

  return {
    ...vm,
    ahvCategory,
    virtIoRequired,
    controllerRemediation,
    vnicRemediation,
    rdmWarning,
    multiWriterWarning,
    recommendedMoveMethod,
    suggestedWave,
    targetVNetSubnet,
    migrationNotes: notes
  };
}

/**
 * Calculates Nutanix NC2 on Azure bare-metal node sizing based on enterprise formulas.
 * Zero costing metrics included.
 */
export function calculateNutanixNC2Sizing(
  vms: ParsedVMRecord[],
  config: NutanixClusterConfig = DEFAULT_NUTANIX_CONFIG
): NutanixSizingVerdict {
  const inScopeVMs = vms.filter(v => v.scope !== 'Out of Scope');
  const totalInScopeVMs = inScopeVMs.length;

  // Workload demands
  const totalVcpusDemanded = inScopeVMs.reduce((acc, v) => acc + (v.cpus || 1), 0);
  const totalRamDemandedGiB = inScopeVMs.reduce((acc, v) => acc + (v.memoryGiB || 4), 0);
  const totalUsedStorageTiB = inScopeVMs.reduce((acc, v) => acc + (v.inUseDiskGiB || 50) / 1024, 0);
  const totalProvisionedStorageTiB = inScopeVMs.reduce((acc, v) => acc + (v.provisionedDiskGiB || 100) / 1024, 0);

  const nodeSpec = AZURE_NC2_NODE_SPECS[config.selectedSku] || AZURE_NC2_NODE_SPECS.AN36;

  // Per Node Usable Compute:
  // (Total Threads - CVM vCPUs - AHV Overhead) * Overcommit Ratio
  const rawThreads = nodeSpec.threads;
  const ahvVcpuOverhead = 4;
  const availableCoresForVMs = Math.max(8, rawThreads - config.cvmVcpuAllocation - ahvVcpuOverhead);
  const usableVcpusPerNode = Math.round(availableCoresForVMs * config.vcpuOvercommit);

  // Per Node Usable Memory:
  // (Raw Memory - CVM RAM - AHV RAM) * (1 - ramBufferPercent)
  const ahvRamOverhead = 8;
  const availableRamForVMs = Math.max(64, nodeSpec.rawMemoryGiB - config.cvmRamGiB - ahvRamOverhead);
  const usableRamPerNodeGiB = Math.round(availableRamForVMs * (1 - config.ramBufferPercent));

  // Per Node Usable Storage (Distributed Storage Fabric - DSF):
  // Raw NVMe * RF Factor (RF2 = 0.50, RF3 = 0.333) * Dedup/Compression * (EC-X if true: 1.20) * (1 - Slack)
  const rfFactor = config.replicationFactor === 'RF3' ? 1 / 3 : 1 / 2;
  const ecxMultiplier = config.erasureCodingEnabled ? 1.20 : 1.0;
  const usableStoragePerNodeTiB = Number(
    (
      nodeSpec.rawNvmeTiB *
      rfFactor *
      config.dedupCompressionFactor *
      ecxMultiplier *
      (1 - config.storageSlackPercent)
    ).toFixed(2)
  );

  // Sizing requirements
  const nodesForCompute = Math.ceil(totalVcpusDemanded / Math.max(1, usableVcpusPerNode));
  const nodesForMemory = Math.ceil(totalRamDemandedGiB / Math.max(1, usableRamPerNodeGiB));
  const nodesForStorage = Math.ceil(totalUsedStorageTiB / Math.max(0.1, usableStoragePerNodeTiB));

  // Base nodes: Minimum 3 nodes for NC2 cluster quorum
  const baseNodesRequired = Math.max(3, Math.max(nodesForCompute, nodesForMemory, nodesForStorage));

  const haNodes = config.haTolerance === 'N+2' ? 2 : 1;
  const totalRecommendedNodes = baseNodesRequired + haNodes;

  // Determine limiting factor
  let limitingFactor: NutanixSizingVerdict['limitingFactor'] = 'Compute (vCPUs)';
  if (nodesForMemory >= nodesForCompute && nodesForMemory >= nodesForStorage) {
    limitingFactor = 'Memory (RAM)';
  } else if (nodesForStorage >= nodesForCompute && nodesForStorage >= nodesForMemory) {
    limitingFactor = 'Storage (DSF Usable)';
  }

  // Cluster aggregate capacities across recommended nodes
  const clusterTotalPhysicalCores = totalRecommendedNodes * nodeSpec.physicalCores;
  const clusterTotalVcpuCapacity = totalRecommendedNodes * usableVcpusPerNode;
  const clusterVcpuUtilizationPercent = Math.min(
    100,
    Math.round((totalVcpusDemanded / Math.max(1, clusterTotalVcpuCapacity)) * 100)
  );

  const clusterTotalUsableRamGiB = totalRecommendedNodes * usableRamPerNodeGiB;
  const clusterRamUtilizationPercent = Math.min(
    100,
    Math.round((totalRamDemandedGiB / Math.max(1, clusterTotalUsableRamGiB)) * 100)
  );

  const clusterTotalUsableDsfTiB = Number((totalRecommendedNodes * usableStoragePerNodeTiB).toFixed(2));
  const clusterStorageUtilizationPercent = Math.min(
    100,
    Math.round((totalUsedStorageTiB / Math.max(0.1, clusterTotalUsableDsfTiB)) * 100)
  );

  const cvmOverheadVcpusTotal = totalRecommendedNodes * config.cvmVcpuAllocation;
  const cvmOverheadRamGiBTotal = totalRecommendedNodes * config.cvmRamGiB;

  return {
    totalInScopeVMs,
    totalVcpusDemanded,
    totalRamDemandedGiB,
    totalUsedStorageTiB: Number(totalUsedStorageTiB.toFixed(2)),
    totalProvisionedStorageTiB: Number(totalProvisionedStorageTiB.toFixed(2)),

    selectedSku: nodeSpec,
    usableVcpusPerNode,
    usableRamPerNodeGiB,
    usableStoragePerNodeTiB,

    nodesForCompute,
    nodesForMemory,
    nodesForStorage,
    baseNodesRequired,
    haNodes,
    totalRecommendedNodes,

    limitingFactor,

    clusterTotalPhysicalCores,
    clusterTotalVcpuCapacity,
    clusterVcpuUtilizationPercent,

    clusterTotalUsableRamGiB,
    clusterRamUtilizationPercent,

    clusterTotalUsableDsfTiB,
    clusterStorageUtilizationPercent,

    cvmOverheadVcpusTotal,
    cvmOverheadRamGiBTotal
  };
}

/**
 * Generates an end-to-end Nutanix Assessment Report.
 */
export function generateNutanixAssessmentReport(
  rawVms: ParsedVMRecord[],
  config: NutanixClusterConfig = DEFAULT_NUTANIX_CONFIG
): NutanixAssessmentReport {
  const evaluatedVms = rawVms.map(evaluateVmForNutanixAHV);
  const sizing = calculateNutanixNC2Sizing(rawVms, config);

  const inScope = evaluatedVms.filter(v => v.scope !== 'Out of Scope');
  const outOfScope = evaluatedVms.filter(v => v.scope === 'Out of Scope');

  const categorization: Record<AhvReadinessCategory, number> = {
    'Direct Move Ready': 0,
    'VirtIO Driver Injection Required': 0,
    'Legacy Controller / vNIC Modernization': 0,
    'Architectural Intervention (RDM / Multi-Writer)': 0
  };

  inScope.forEach(vm => {
    categorization[vm.ahvCategory] = (categorization[vm.ahvCategory] || 0) + 1;
  });

  const readyCount = (categorization['Direct Move Ready'] || 0) + (categorization['VirtIO Driver Injection Required'] || 0);
  const readyPercent = inScope.length > 0 ? Math.round((readyCount / inScope.length) * 100) : 100;
  const flaggedPercent = 100 - readyPercent;

  // Build waves
  const waveDefs: { index: number; name: string; complexity: NutanixWaveSummary['complexity'] }[] = [
    { index: 1, name: 'Wave 01: Dev, Test & Non-Critical Workloads', complexity: 'Low' },
    { index: 2, name: 'Wave 02: Core Web & Application Clusters', complexity: 'Medium' },
    { index: 3, name: 'Wave 03: Production Databases & High-Throughput Services', complexity: 'High' },
    { index: 4, name: 'Wave 04: Clustered & Shared Storage (RDMs / Multi-Writer)', complexity: 'Complex Architectural' }
  ];

  // Bandwidth in MB/sec: config.expressRouteBandwidthGbps * 1000 / 8 * 0.70 (effective throughput)
  const effectiveTransferMBps = (config.expressRouteBandwidthGbps * 125) * 0.75;

  const waves: NutanixWaveSummary[] = waveDefs.map(def => {
    const waveVms = inScope.filter(v => v.suggestedWave === def.index);
    const totalVcpus = waveVms.reduce((acc, v) => acc + (v.cpus || 1), 0);
    const totalRamGiB = waveVms.reduce((acc, v) => acc + (v.memoryGiB || 4), 0);
    const totalUsedStorageTiB = Number(
      waveVms.reduce((acc, v) => acc + (v.inUseDiskGiB || 50) / 1024, 0).toFixed(2)
    );

    // Calculate replication sync time
    const totalUsedMB = totalUsedStorageTiB * 1024 * 1024;
    const syncSeconds = effectiveTransferMBps > 0 ? totalUsedMB / effectiveTransferMBps : 0;
    const estimatedSyncHours = Number((syncSeconds / 3600).toFixed(1));

    let suggestedCutoverWindow = '4 Hours (Weekend)';
    if (def.index === 1) suggestedCutoverWindow = '2 Hours (Mid-week or Weekend)';
    else if (def.index === 3) suggestedCutoverWindow = '6 Hours (Maintenance Window)';
    else if (def.index === 4) suggestedCutoverWindow = '8 Hours (Planned Outage)';

    return {
      waveIndex: def.index,
      waveName: def.name,
      vmCount: waveVms.length,
      totalVcpus,
      totalRamGiB,
      totalUsedStorageTiB,
      complexity: def.complexity,
      estimatedSyncHours,
      suggestedCutoverWindow,
      targetSubnet: `Azure-VNet-Subnet-Wave0${def.index} (Flow L2)`,
      vms: waveVms
    };
  });

  return {
    summary: {
      totalVMs: evaluatedVms.length,
      inScopeVMs: inScope.length,
      outOfScopeVMs: outOfScope.length,
      readyPercent,
      flaggedPercent
    },
    categorization,
    sizing,
    waves,
    evaluatedVms
  };
}

/**
 * Helper to parse RVTools spreadsheet file locally
 */
export async function parseNutanixRVToolsFile(file: File): Promise<ParsedVMRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const vInfoSheet = workbook.Sheets['vInfo'] || workbook.Sheets['vinfo'] || workbook.Sheets[workbook.SheetNames[0]];
        if (!vInfoSheet) {
          throw new Error('Could not find vInfo inventory sheet in spreadsheet.');
        }

        const jsonRows: any[] = XLSX.utils.sheet_to_json(vInfoSheet);
        const parsed: ParsedVMRecord[] = jsonRows
          .filter(row => {
            const name = row['VM'] || row['VM Name'] || row['Name'] || '';
            const power = (row['Powerstate'] || row['Power State'] || '').toLowerCase();
            const isTemplate = row['Template'] === true || String(row['Template']).toLowerCase() === 'true';
            return name && !isTemplate && (!power || power.includes('on') || power.includes('powered'));
          })
          .map((row, idx) => {
            const vmName = String(row['VM'] || row['VM Name'] || row['Name'] || `VM-${idx + 1}`);
            const cpus = parseInt(row['CPUs'] || row['vCPUs'] || '2', 10) || 2;
            const memoryMiB = parseInt(row['Memory'] || row['Memory MB'] || '4096', 10) || 4096;
            const memoryGiB = Math.round(memoryMiB / 1024);
            const inUseMiB = parseInt(row['In Use MB'] || row['In Use MiB'] || row['Provisioned MB'] || '40960', 10) || 40960;
            const inUseDiskGiB = Math.round(inUseMiB / 1024);
            const provMiB = parseInt(row['Provisioned MB'] || row['Provisioned MiB'] || '81920', 10) || 81920;
            const provisionedDiskGiB = Math.round(provMiB / 1024);
            const os = String(row['OS'] || row['Guest OS'] || 'Microsoft Windows Server 2019 (64-bit)');

            const isManagement =
              vmName.toUpperCase().includes('VSPHERE') ||
              vmName.toUpperCase().includes('VCENTER') ||
              vmName.toUpperCase().includes('NSX') ||
              vmName.toUpperCase().includes('ESXI');

            return {
              vmName,
              scope: isManagement ? 'Out of Scope' : 'In Scope',
              isManagementInfra: isManagement,
              powerState: 'poweredOn',
              cpus,
              memoryGiB: Math.max(1, memoryGiB),
              provisionedDiskGiB: Math.max(10, provisionedDiskGiB),
              inUseDiskGiB: Math.max(5, inUseDiskGiB),
              storageTiB: Number((inUseDiskGiB / 1024).toFixed(3)),
              provisioningType: 'Thin',
              os,
              datacenter: String(row['Datacenter'] || 'DC-Primary'),
              cluster: String(row['Cluster'] || 'Cluster-Prod-01'),
              hasSnapshot: false,
              snapshotAgeHours: 0,
              snapshotSizeGiB: 0,
              toolsStatus: 'Healthy (Running)',
              portGroup: String(row['Portgroup'] || row['Network'] || 'VLAN-100-PROD'),
              vlanId: 100,
              environment: 'Prod',
              assignedWave: 2,
              targetStorageTier: 'Local vSAN',
              recommendedMethod: 'HCX Bulk Migration',
              readinessReason: 'Assessed for Nutanix NC2 on Azure',
              hardwareVersion: 14,
              vnicType: 'VMXNET3',
              storageController: 'PVSCSI'
            };
          });

        resolve(parsed.length > 0 ? parsed : SAMPLE_ENTERPRISE_VMS);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = err => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
