/**
 * Enterprise RVTools Multi-Sheet Ingestion & Migration Readiness Analyzer
 * Ingests vInfo, vDisk, vMemory, vNetwork, vTools, vSnapshot.
 * Scans for migration blockers (RDMs, Multi-Writer, Shared SCSI, Legacy Controllers & vNICs).
 * ZERO COSTING: Strictly technical telemetry, readiness scoring, and sizing attributes.
 */

import * as XLSX from 'xlsx';
import { NormalizedToolsStatus, VMScope, VMEnvironment, StorageTierOption } from '../data/sampleRvToolsData';

export type BlockerSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'READY';

export interface MigrationBlocker {
  id: string;
  category: 'RDM' | 'SHARED_DISK' | 'CONTROLLER' | 'VNIC' | 'HARDWARE_VERSION' | 'TOOLS' | 'SNAPSHOT';
  severity: BlockerSeverity;
  title: string;
  description: string;
  remediationAction: string;
  hcxImpact: string;
}

export interface DiskTelemetry {
  diskName: string;
  capacityGiB: number;
  inUseGiB: number;
  controllerType: 'PVSCSI' | 'LSI_LOGIC_SAS' | 'LSI_LOGIC_PARALLEL' | 'BUSLOGIC' | 'IDE' | 'OTHER';
  controllerRaw: string;
  isRDM: boolean;
  rdmMode?: 'Physical' | 'Virtual' | 'None';
  isSharedScsiBus: boolean;
  isMultiWriter: boolean;
  rawDeviceBacking?: string;
}

export interface NetworkTelemetry {
  adapterName: string;
  adapterType: 'VMXNET3' | 'E1000' | 'E1000E' | 'FLEXIBLE' | 'PCNET32' | 'OTHER';
  portGroup: string;
  vlanId: number;
  ipAddress?: string;
  macAddress?: string;
  isLegacyVnic: boolean;
}

export interface IngestedVM {
  vmName: string;
  vmId?: string;
  scope: VMScope;
  isManagementInfra: boolean;
  powerState: 'poweredOn' | 'poweredOff' | 'suspended';
  isTemplate: boolean;
  cpus: number;
  memoryGiB: number; // Base-2
  provisionedDiskGiB: number; // Sum across all attached disks
  inUseDiskGiB: number; // Sum across all attached disks
  storageTiB: number;
  provisioningType: 'Thin' | 'Thick';
  os: string;
  datacenter: string;
  cluster: string;
  esxiHost?: string;

  // Hypervisor Compatibility
  hardwareVersionNumber: number; // e.g. 13, 15, 19
  hardwareVersionRaw: string; // e.g. "vmx-15"
  isHardwareObsolete: boolean; // < 11 is obsolete, < 15 is aging
  toolsStatus: NormalizedToolsStatus;
  toolsVersion?: string;

  // Multi-Disk & Storage Architecture
  disks: DiskTelemetry[];
  primaryController: string;
  hasLegacyController: boolean;
  hasRdmPhysical: boolean;
  hasRdmVirtual: boolean;
  hasMultiWriter: boolean;
  hasSharedScsiBus: boolean;

  // Networking
  nics: NetworkTelemetry[];
  portGroup: string;
  vlanId: number;
  hasLegacyVnic: boolean;

  // Snapshots
  hasSnapshot: boolean;
  snapshotAgeHours: number;
  snapshotSizeGiB: number;

  // Classification & Migration Planning
  environment: VMEnvironment;
  assignedWave: number;
  targetStorageTier: StorageTierOption;
  recommendedMethod: 'HCX RAV (Live vMotion)' | 'HCX Bulk Migration' | 'HCX Cold Migration' | 'Re-architect Required';
  readinessScore: number; // 0 - 100
  blockers: MigrationBlocker[];
}

export interface WorkloadInventoryAssessment {
  fileName: string;
  totalVmsParsed: number;
  inScopeCount: number;
  outOfScopeCount: number;
  tbdCount: number;
  poweredOnCount: number;
  poweredOffCount: number;
  templatesFilteredCount: number;

  // Aggregate Sizing Metrics (In-Scope Only)
  totalVCPUs: number;
  totalRAMGiB: number;
  totalProvisionedStorageTiB: number;
  totalInUseStorageTiB: number;

  // Blockers & Risk Telemetry
  rdmPhysicalCount: number;
  rdmVirtualCount: number;
  sharedScsiCount: number;
  multiWriterCount: number;
  legacyVnicCount: number;
  legacyControllerCount: number;
  outdatedToolsCount: number;
  criticalSnapshotCount: number;
  hardwareUpgradeNeededCount: number;

  // Readiness Index
  overallReadinessScore: number;
  workloads: IngestedVM[];
}

/**
 * Normalizes VMware Tools raw status strings
 */
export function normalizeToolsStatus(raw: string): NormalizedToolsStatus {
  const s = String(raw || '').toLowerCase();
  if (s.includes('open-vm') || s.includes('guestoperation') || s.includes('linux')) {
    return 'Linux Open-VM-Tools (Verified)';
  }
  if (s.includes('ok') || s.includes('running') || s.includes('supported') || s.includes('current')) {
    return 'Healthy (Running)';
  }
  if (s.includes('old') || s.includes('upgrade') || s.includes('outdated')) {
    return 'Outdated (Update Prior to Cutover)';
  }
  return 'Missing / Stopped (Critical Migration Risk)';
}

/**
 * Normalizes adapter type and flags legacy vNICs
 */
export function normalizeAdapterType(raw: string): { type: NetworkTelemetry['adapterType']; isLegacy: boolean } {
  const s = String(raw || '').toLowerCase();
  if (s.includes('vmxnet3')) {
    return { type: 'VMXNET3', isLegacy: false };
  }
  if (s.includes('e1000e')) {
    return { type: 'E1000E', isLegacy: true };
  }
  if (s.includes('e1000')) {
    return { type: 'E1000', isLegacy: true };
  }
  if (s.includes('flexible')) {
    return { type: 'FLEXIBLE', isLegacy: true };
  }
  if (s.includes('pcnet')) {
    return { type: 'PCNET32', isLegacy: true };
  }
  return { type: 'OTHER', isLegacy: false };
}

/**
 * Normalizes SCSI Controller type
 */
export function normalizeControllerType(raw: string): DiskTelemetry['controllerType'] {
  const s = String(raw || '').toLowerCase();
  if (s.includes('pvscsi') || s.includes('paravirtual')) return 'PVSCSI';
  if (s.includes('lsi') && s.includes('sas')) return 'LSI_LOGIC_SAS';
  if (s.includes('lsi') || s.includes('parallel')) return 'LSI_LOGIC_PARALLEL';
  if (s.includes('buslogic')) return 'BUSLOGIC';
  if (s.includes('ide')) return 'IDE';
  return 'OTHER';
}

/**
 * Extracts integer hardware version from raw string (e.g. "vmx-15" -> 15)
 */
export function extractHardwareVersion(raw: string): number {
  if (!raw) return 15;
  const match = String(raw).match(/\d+/);
  return match ? parseInt(match[0], 10) : 15;
}

/**
 * Parses RVTools workbook across vInfo, vDisk, vMemory, vNetwork, vTools, vSnapshot.
 */
export function parseRVToolsWorkbook(wb: XLSX.WorkBook, fileName: string): WorkloadInventoryAssessment {
  // 1. Find and parse vInfo
  const vInfoSheetName = wb.SheetNames.find(s => s.toLowerCase() === 'vinfo') || wb.SheetNames[0];
  const vInfoRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[vInfoSheetName]) || [];

  if (vInfoRows.length === 0) {
    throw new Error('RVTools export is empty or missing the vInfo sheet.');
  }

  // 2. Parse vDisk (Multi-disk aggregation per VM)
  const vDiskSheetName = wb.SheetNames.find(s => s.toLowerCase() === 'vdisk');
  const vDiskRows: any[] = vDiskSheetName ? XLSX.utils.sheet_to_json(wb.Sheets[vDiskSheetName]) : [];
  const diskMap = new Map<string, DiskTelemetry[]>();

  vDiskRows.forEach(row => {
    const vmNameKey = String(row['VM'] || row['VM Name'] || '').trim().toLowerCase();
    if (!vmNameKey) return;

    const rawCapMB = Number(row['Capacity MB'] || row['Capacity MiB'] || row['Size MB'] || 51200);
    const capacityGiB = Math.round((rawCapMB / 1024) * 10) / 10;
    const rawFreeMB = Number(row['Free MB'] || row['Free MiB'] || 0);
    const rawInUseMB = Math.max(0, rawCapMB - rawFreeMB);
    const inUseGiB = Math.round((rawInUseMB / 1024) * 10) / 10 || Math.round(capacityGiB * 0.7);

    const controllerRaw = String(row['Controller'] || row['SCSI Controller'] || 'SCSI controller 0');
    const controllerType = normalizeControllerType(controllerRaw);

    // RDM Detection
    const diskTypeRaw = String(row['Disk Type'] || row['Disk format'] || row['Raw Device'] || row['Path'] || '').toLowerCase();
    const isRdmPhysical = diskTypeRaw.includes('physical') || diskTypeRaw.includes('rdmp') || diskTypeRaw.includes('rawdevice');
    const isRdmVirtual = diskTypeRaw.includes('virtualrdm') || diskTypeRaw.includes('rdmv');
    const isRDM = isRdmPhysical || isRdmVirtual || diskTypeRaw.includes('rdm');
    const rdmMode: DiskTelemetry['rdmMode'] = isRdmPhysical ? 'Physical' : isRdmVirtual ? 'Virtual' : isRDM ? 'Physical' : 'None';

    // Shared SCSI Bus & Multi-Writer Flag Detection
    const sharingRaw = String(row['Sharing'] || row['SCSI Sharing'] || row['Bus Sharing'] || '').toLowerCase();
    const isSharedScsiBus = sharingRaw.includes('virtual') || sharingRaw.includes('physical') || sharingRaw.includes('shared');

    const multiWriterRaw = String(row['Multi-Writer'] || row['MultiWriter'] || row['ConcurrentAccess'] || '').toLowerCase();
    const isMultiWriter = multiWriterRaw.includes('true') || multiWriterRaw.includes('enabled') || isSharedScsiBus;

    const diskItem: DiskTelemetry = {
      diskName: String(row['Disk'] || row['Device'] || 'Hard disk 1'),
      capacityGiB,
      inUseGiB,
      controllerType,
      controllerRaw,
      isRDM,
      rdmMode,
      isSharedScsiBus,
      isMultiWriter,
      rawDeviceBacking: row['Raw Device'] || row['Backing'] || undefined
    };

    if (!diskMap.has(vmNameKey)) {
      diskMap.set(vmNameKey, []);
    }
    diskMap.get(vmNameKey)!.push(diskItem);
  });

  // 3. Parse vNetwork
  const vNetSheetName = wb.SheetNames.find(s => s.toLowerCase() === 'vnetwork');
  const vNetRows: any[] = vNetSheetName ? XLSX.utils.sheet_to_json(wb.Sheets[vNetSheetName]) : [];
  const netMap = new Map<string, NetworkTelemetry[]>();

  vNetRows.forEach(row => {
    const vmNameKey = String(row['VM'] || row['VM Name'] || '').trim().toLowerCase();
    if (!vmNameKey) return;

    const rawAdapter = String(row['Adapter'] || row['NIC'] || row['Type'] || 'VMXNET3');
    const { type: adapterType, isLegacy: isLegacyVnic } = normalizeAdapterType(rawAdapter);
    const portGroup = String(row['Network'] || row['Portgroup'] || 'VLAN-10-Default');

    let vlanId = Number(row['VLAN'] || row['Vlan ID'] || 0);
    if (!vlanId || isNaN(vlanId)) {
      const match = portGroup.match(/\d+/);
      vlanId = match ? parseInt(match[0], 10) : 10;
    }

    const netItem: NetworkTelemetry = {
      adapterName: String(row['NIC'] || row['Device'] || 'Network adapter 1'),
      adapterType,
      portGroup,
      vlanId,
      ipAddress: row['IP Address'] || undefined,
      macAddress: row['Mac Address'] || undefined,
      isLegacyVnic
    };

    if (!netMap.has(vmNameKey)) {
      netMap.set(vmNameKey, []);
    }
    netMap.get(vmNameKey)!.push(netItem);
  });

  // 4. Parse vTools
  const vToolsSheetName = wb.SheetNames.find(s => s.toLowerCase() === 'vtools');
  const vToolsRows: any[] = vToolsSheetName ? XLSX.utils.sheet_to_json(wb.Sheets[vToolsSheetName]) : [];
  const toolsMap = new Map<string, { status: string; version: string }>();

  vToolsRows.forEach(row => {
    const vmNameKey = String(row['VM'] || '').trim().toLowerCase();
    if (!vmNameKey) return;
    toolsMap.set(vmNameKey, {
      status: String(row['Tools status'] || row['Tools'] || 'toolsOk'),
      version: String(row['Tools Version'] || row['Version'] || '')
    });
  });

  // 5. Parse vSnapshot
  const vSnapSheetName = wb.SheetNames.find(s => s.toLowerCase() === 'vsnapshot');
  const vSnapRows: any[] = vSnapSheetName ? XLSX.utils.sheet_to_json(wb.Sheets[vSnapSheetName]) : [];
  const snapMap = new Map<string, { ageHours: number; sizeGiB: number }>();

  vSnapRows.forEach(row => {
    const vmNameKey = String(row['VM'] || '').trim().toLowerCase();
    if (!vmNameKey) return;
    const dateStr = String(row['Date / time'] || row['Date'] || '');
    const parsedDate = dateStr ? new Date(dateStr) : new Date();
    const ageHours = Math.max(1, Math.round((Date.now() - parsedDate.getTime()) / 3600000));
    const sizeMB = Number(row['Size MB'] || row['Size MiB'] || 5120);
    const sizeGiB = Math.round((sizeMB / 1024) * 10) / 10;
    snapMap.set(vmNameKey, { ageHours, sizeGiB });
  });

  // 6. Ingestion & Transformation Loop
  let templatesFiltered = 0;
  const processedVMs: IngestedVM[] = [];

  vInfoRows.forEach((row, idx) => {
    const rawVmName = String(row['VM'] || row['VM Name'] || `VM-${idx + 1}`);
    const vmName = rawVmName.trim();
    const vmNameKey = vmName.toLowerCase();

    // Template filter
    const isTemplate = Boolean(row['Template']) || String(row['Template'] || '').toLowerCase() === 'true';
    if (isTemplate) {
      templatesFiltered++;
    }

    // Power State
    const powerRaw = String(row['Powerstate'] || row['Power state'] || 'poweredOn').toLowerCase();
    const powerState: 'poweredOn' | 'poweredOff' | 'suspended' =
      powerRaw.includes('off') ? 'poweredOff' : powerRaw.includes('susp') ? 'suspended' : 'poweredOn';

    // vCPU & Memory (Base-2 MiB -> GiB)
    const cpus = Number(row['CPUs'] || row['Num CPU'] || 2);
    const memoryMB = Number(row['Memory'] || row['Memory MB'] || 8192);
    const memoryGiB = Math.round((memoryMB / 1024) * 10) / 10 || 8;

    // Disks telemetry join
    const attachedDisks = diskMap.get(vmNameKey) || [];
    let provisionedDiskGiB = 0;
    let inUseDiskGiB = 0;

    if (attachedDisks.length > 0) {
      provisionedDiskGiB = Math.round(attachedDisks.reduce((a, d) => a + d.capacityGiB, 0) * 10) / 10;
      inUseDiskGiB = Math.round(attachedDisks.reduce((a, d) => a + d.inUseGiB, 0) * 10) / 10;
    } else {
      // Fallback to vInfo provisioned and in-use columns if vDisk sheet was omitted
      const provMB = Number(row['Provisioned MB'] || row['Provisioned Storage MB'] || 102400);
      provisionedDiskGiB = Math.round((provMB / 1024) * 10) / 10;
      const inUseMB = Number(row['In Use MB'] || row['In Use Storage MB'] || provMB * 0.7);
      inUseDiskGiB = Math.round((inUseMB / 1024) * 10) / 10;
    }

    const storageTiB = Math.round((inUseDiskGiB / 1024) * 1000) / 1000 || 0.1;
    const provisioningType: 'Thin' | 'Thick' = inUseDiskGiB < provisionedDiskGiB * 0.85 ? 'Thin' : 'Thick';

    // Hardware Version
    const hwVersionRaw = String(row['Configured HW version'] || row['HW Version'] || row['Hardware version'] || 'vmx-15');
    const hardwareVersionNumber = extractHardwareVersion(hwVersionRaw);
    const isHardwareObsolete = hardwareVersionNumber < 11;

    // VMware Tools
    const toolEntry = toolsMap.get(vmNameKey);
    const rawTools = toolEntry?.status || String(row['VMware Tools'] || row['Tools status'] || 'toolsOk');
    const toolsStatus = normalizeToolsStatus(rawTools);
    const toolsVersion = toolEntry?.version || row['Tools Version'];

    // Network Telemetry
    const nics = netMap.get(vmNameKey) || [];
    const primaryNic = nics[0];
    const portGroup = primaryNic?.portGroup || (vmNameKey.includes('db') ? 'VLAN-30-DB' : vmNameKey.includes('web') ? 'VLAN-10-Web' : 'VLAN-20-App');
    const vlanId = primaryNic?.vlanId || (vmNameKey.includes('db') ? 30 : vmNameKey.includes('web') ? 10 : 20);
    const hasLegacyVnic = nics.some(n => n.isLegacyVnic);

    // Snapshot Info
    const snapInfo = snapMap.get(vmNameKey);
    const hasSnapshot = Boolean(snapInfo);
    const snapshotAgeHours = snapInfo?.ageHours || 0;
    const snapshotSizeGiB = snapInfo?.sizeGiB || 0;

    // Disk Flags
    const hasRdmPhysical = attachedDisks.some(d => d.rdmMode === 'Physical');
    const hasRdmVirtual = attachedDisks.some(d => d.rdmMode === 'Virtual');
    const hasMultiWriter = attachedDisks.some(d => d.isMultiWriter);
    const hasSharedScsiBus = attachedDisks.some(d => d.isSharedScsiBus);
    const hasLegacyController = attachedDisks.some(d => d.controllerType === 'LSI_LOGIC_PARALLEL' || d.controllerType === 'BUSLOGIC');
    const primaryController = attachedDisks[0]?.controllerType || 'PVSCSI';

    // Management Infrastructure Detection
    const isMgmtPortGroup =
      vlanId === 100 ||
      portGroup.toLowerCase().includes('mgmt') ||
      portGroup.toLowerCase().includes('management') ||
      portGroup.toLowerCase().includes('infra') ||
      vmNameKey.includes('vcenter') ||
      vmNameKey.includes('esxi') ||
      vmNameKey.includes('infoblox');
    const isManagementInfra = isMgmtPortGroup;
    const scope: VMScope = isManagementInfra ? 'Out of Scope' : 'In Scope';

    // Environment Auto-Classification
    let environment: VMEnvironment = 'Prod';
    if (vmNameKey.includes('dev')) environment = 'Dev';
    else if (vmNameKey.includes('stg') || vmNameKey.includes('staging')) environment = 'Staging';
    else if (vmNameKey.includes('qa') || vmNameKey.includes('test')) environment = 'QA';
    else if (vmNameKey.includes('uat')) environment = 'UAT';
    else if (vmNameKey.includes('dr')) environment = 'DR';

    // Storage Tier Recommendation
    const targetStorageTier: StorageTierOption =
      storageTiB >= 2.0 || provisionedDiskGiB >= 2048 || hasSharedScsiBus || hasRdmVirtual
        ? 'External NFS'
        : 'Local vSAN';

    // Migration Blockers & Warnings Scanner
    const blockers: MigrationBlocker[] = [];

    // Check 1: RDM Physical Mode (Hard Blocker for live HCX)
    if (hasRdmPhysical) {
      blockers.push({
        id: `blk-rdmp-${vmName}`,
        category: 'RDM',
        severity: 'CRITICAL',
        title: 'Raw Device Mapping (Physical Mode RDM-P)',
        description: 'Physical compatibility RDMs cannot be migrated via HCX or vMotion directly without data corruption.',
        remediationAction: 'Convert RDM-P to virtual VMDK or re-provision native Cloud Block/NFS storage before cutover.',
        hcxImpact: 'Blocks HCX RAV live migration. Workload must be migrated cold or re-architected.'
      });
    }

    // Check 2: Shared SCSI Bus / Multi-Writer
    if (hasSharedScsiBus || hasMultiWriter) {
      blockers.push({
        id: `blk-multiwriter-${vmName}`,
        category: 'SHARED_DISK',
        severity: 'CRITICAL',
        title: 'Multi-Writer Flag / Shared SCSI Bus Sharing',
        description: 'Multi-node clustering (Oracle RAC, SQL FCI) detects shared disks with concurrent access enabled.',
        remediationAction: 'Stage cluster nodes together in a dedicated migration wave with maintenance downtime window.',
        hcxImpact: 'HCX RAV cannot replicate multi-writer disks live. Requires HCX Bulk / Cold or shared VMDK re-config.'
      });
    }

    // Check 3: Obsolete Virtual Hardware
    if (isHardwareObsolete) {
      blockers.push({
        id: `blk-hw-${vmName}`,
        category: 'HARDWARE_VERSION',
        severity: 'CRITICAL',
        title: `Legacy Virtual Hardware Version (vHardware ${hardwareVersionNumber})`,
        description: `Virtual hardware is version ${hardwareVersionNumber}. Target Cloud ESXi baselines require HW version 14+.`,
        remediationAction: `Schedule hardware compatibility upgrade in vCenter before initiating migration.`,
        hcxImpact: 'Target cloud cluster will refuse to boot or generate compatibility fault on power-on.'
      });
    } else if (hardwareVersionNumber < 15) {
      blockers.push({
        id: `blk-hw-warn-${vmName}`,
        category: 'HARDWARE_VERSION',
        severity: 'WARNING',
        title: `Aging Virtual Hardware (vHardware ${hardwareVersionNumber})`,
        description: `Running below target cloud baseline (ESXi 7.0/8.0 uses HW 19/20).`,
        remediationAction: 'Upgrade virtual hardware during migration cutover reboot.',
        hcxImpact: 'Supported via backward compatibility, but prevents modern vCPU scaling features.'
      });
    }

    // Check 4: VMware Tools Not Running or Missing
    if (toolsStatus === 'Missing / Stopped (Critical Migration Risk)') {
      blockers.push({
        id: `blk-tools-${vmName}`,
        category: 'TOOLS',
        severity: 'CRITICAL',
        title: 'VMware Tools Missing or Stopped',
        description: 'VMware guest tools are not communicating with ESXi.',
        remediationAction: 'Install or start VMware Tools / open-vm-tools inside guest OS prior to migration.',
        hcxImpact: 'HCX RAV cannot perform guest quiescing or IP verification during live cutover.'
      });
    } else if (toolsStatus === 'Outdated (Update Prior to Cutover)') {
      blockers.push({
        id: `blk-tools-warn-${vmName}`,
        category: 'TOOLS',
        severity: 'WARNING',
        title: 'VMware Tools Outdated',
        description: 'Installed Tools version is outdated compared to target ESXi host daemon.',
        remediationAction: 'Update VMware Tools during next maintenance window.',
        hcxImpact: 'Supported, but recommended to update to prevent vNIC driver timeouts.'
      });
    }

    // Check 5: Stale Snapshot Risk
    if (hasSnapshot && (snapshotAgeHours > 24 || snapshotSizeGiB > 20)) {
      blockers.push({
        id: `blk-snap-${vmName}`,
        category: 'SNAPSHOT',
        severity: 'CRITICAL',
        title: `High-Risk Stale Snapshot (${snapshotAgeHours}h / ${snapshotSizeGiB} GiB)`,
        description: 'Workload has an active snapshot older than 24 hours or exceeding 20 GiB.',
        remediationAction: 'Consolidate snapshots in source vCenter immediately before initiating HCX baseline sync.',
        hcxImpact: 'Severe delta sync performance degradation and risk of guest stun during consolidation.'
      });
    }

    // Check 6: Legacy Network Adapters (E1000/E1000E)
    if (hasLegacyVnic) {
      blockers.push({
        id: `blk-vnic-${vmName}`,
        category: 'VNIC',
        severity: 'WARNING',
        title: 'Legacy Network Adapter Detected (E1000 / E1000E)',
        description: 'Virtual machine is configured with emulated legacy E1000/E1000E network adapters.',
        remediationAction: 'Convert network adapters to paravirtualized VMXNET3 to enable 10/25/100 Gbps line-rate throughput.',
        hcxImpact: 'Supported, but causes high host CPU interrupts and throttles network throughput in cloud.'
      });
    }

    // Check 7: Legacy Storage Controller (LSI Logic Parallel / BusLogic)
    if (hasLegacyController) {
      blockers.push({
        id: `blk-controller-${vmName}`,
        category: 'CONTROLLER',
        severity: 'WARNING',
        title: 'Legacy Storage Controller (LSI Logic Parallel / BusLogic)',
        description: 'Storage controller uses legacy parallel SCSI emulation.',
        remediationAction: 'Upgrade storage controller driver to VMware Paravirtual SCSI (PVSCSI).',
        hcxImpact: 'Increases host CPU cycles during high I/O burst. Upgrade recommended.'
      });
    }

    // Determine Recommended Migration Method
    let recommendedMethod: IngestedVM['recommendedMethod'] = 'HCX RAV (Live vMotion)';
    if (hasRdmPhysical || (isHardwareObsolete && powerState === 'poweredOn')) {
      recommendedMethod = 'Re-architect Required';
    } else if (powerState === 'poweredOff') {
      recommendedMethod = 'HCX Cold Migration';
    } else if (
      hasSharedScsiBus ||
      hasMultiWriter ||
      hasRdmVirtual ||
      toolsStatus === 'Missing / Stopped (Critical Migration Risk)' ||
      storageTiB > 2.0
    ) {
      recommendedMethod = 'HCX Bulk Migration';
    }

    // Calculate individual VM Readiness Score (0 - 100)
    let vmScore = 100;
    const criticals = blockers.filter(b => b.severity === 'CRITICAL').length;
    const warnings = blockers.filter(b => b.severity === 'WARNING').length;
    vmScore = Math.max(20, 100 - criticals * 30 - warnings * 10);

    // Initial Wave Assignment
    let assignedWave = 2; // Default Prod Web/App
    if (isManagementInfra) assignedWave = 0;
    else if (environment === 'Dev' || environment === 'QA' || environment === 'Staging') assignedWave = 1;
    else if (vmNameKey.includes('db') || vmNameKey.includes('sql') || vmNameKey.includes('oracle') || storageTiB > 3.0) assignedWave = 3;
    if (blockers.some(b => b.severity === 'CRITICAL')) assignedWave = 4; // Blocker remediation wave

    processedVMs.push({
      vmName,
      vmId: String(row['VM ID'] || row['MoRef'] || `vm-${idx + 1}`),
      scope,
      isManagementInfra,
      powerState,
      isTemplate,
      cpus,
      memoryGiB,
      provisionedDiskGiB,
      inUseDiskGiB,
      storageTiB,
      provisioningType,
      os: String(row['OS according to the configuration file'] || row['OS'] || 'Linux / Windows Server'),
      datacenter: String(row['Datacenter'] || 'Primary-DC'),
      cluster: String(row['Cluster'] || 'Compute-Cluster-01'),
      esxiHost: row['Host'] ? String(row['Host']) : undefined,
      hardwareVersionNumber,
      hardwareVersionRaw: hwVersionRaw,
      isHardwareObsolete,
      toolsStatus,
      toolsVersion,
      disks: attachedDisks,
      primaryController,
      hasLegacyController,
      hasRdmPhysical,
      hasRdmVirtual,
      hasMultiWriter,
      hasSharedScsiBus,
      nics,
      portGroup,
      vlanId,
      hasLegacyVnic,
      hasSnapshot,
      snapshotAgeHours,
      snapshotSizeGiB,
      environment,
      assignedWave,
      targetStorageTier,
      recommendedMethod,
      readinessScore: vmScore,
      blockers
    });
  });

  // Calculate Aggregates for In-Scope Workloads
  const inScopeVMs = processedVMs.filter(v => v.scope === 'In Scope');
  const outOfScopeCount = processedVMs.filter(v => v.scope === 'Out of Scope').length;
  const tbdCount = processedVMs.filter(v => v.scope === 'To Be Decided').length;
  const poweredOnCount = processedVMs.filter(v => v.powerState === 'poweredOn').length;
  const poweredOffCount = processedVMs.filter(v => v.powerState === 'poweredOff').length;

  const totalVCPUs = inScopeVMs.reduce((a, v) => a + v.cpus, 0);
  const totalRAMGiB = Math.round(inScopeVMs.reduce((a, v) => a + v.memoryGiB, 0));
  const totalProvisionedStorageTiB =
    Math.round((inScopeVMs.reduce((a, v) => a + v.provisionedDiskGiB, 0) / 1024) * 10) / 10;
  const totalInUseStorageTiB =
    Math.round((inScopeVMs.reduce((a, v) => a + v.inUseDiskGiB, 0) / 1024) * 10) / 10;

  // Blockers Totals across all parsed VMs
  const rdmPhysicalCount = processedVMs.filter(v => v.hasRdmPhysical).length;
  const rdmVirtualCount = processedVMs.filter(v => v.hasRdmVirtual).length;
  const sharedScsiCount = processedVMs.filter(v => v.hasSharedScsiBus).length;
  const multiWriterCount = processedVMs.filter(v => v.hasMultiWriter).length;
  const legacyVnicCount = processedVMs.filter(v => v.hasLegacyVnic).length;
  const legacyControllerCount = processedVMs.filter(v => v.hasLegacyController).length;
  const outdatedToolsCount = processedVMs.filter(
    v => v.toolsStatus !== 'Healthy (Running)' && v.toolsStatus !== 'Linux Open-VM-Tools (Verified)'
  ).length;
  const criticalSnapshotCount = processedVMs.filter(
    v => v.hasSnapshot && (v.snapshotAgeHours > 24 || v.snapshotSizeGiB > 20)
  ).length;
  const hardwareUpgradeNeededCount = processedVMs.filter(v => v.isHardwareObsolete).length;

  // Global readiness score
  const avgScore =
    processedVMs.length > 0
      ? Math.round(processedVMs.reduce((a, v) => a + v.readinessScore, 0) / processedVMs.length)
      : 85;

  return {
    fileName,
    totalVmsParsed: processedVMs.length,
    inScopeCount: inScopeVMs.length,
    outOfScopeCount,
    tbdCount,
    poweredOnCount,
    poweredOffCount,
    templatesFilteredCount: templatesFiltered,
    totalVCPUs,
    totalRAMGiB,
    totalProvisionedStorageTiB,
    totalInUseStorageTiB,
    rdmPhysicalCount,
    rdmVirtualCount,
    sharedScsiCount,
    multiWriterCount,
    legacyVnicCount,
    legacyControllerCount,
    outdatedToolsCount,
    criticalSnapshotCount,
    hardwareUpgradeNeededCount,
    overallReadinessScore: avgScore,
    workloads: processedVMs
  };
}
