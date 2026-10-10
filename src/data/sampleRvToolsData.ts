import * as XLSX from 'xlsx';

export type VMScope = 'In Scope' | 'Out of Scope' | 'To Be Decided';
export type StorageTierOption = 'Local vSAN' | 'External NFS';
export type VMEnvironment = 'Dev' | 'Staging' | 'Pre-Prod' | 'Prod' | 'DR' | 'UAT' | 'QA';
export type NormalizedToolsStatus =
  | 'Healthy (Running)'
  | 'Outdated (Update Prior to Cutover)'
  | 'Missing / Stopped (Critical Migration Risk)'
  | 'Linux Open-VM-Tools (Verified)';

export interface ParsedVMRecord {
  vmName: string;
  scope: VMScope;
  isManagementInfra: boolean;
  powerState: 'poweredOn' | 'poweredOff';
  cpus: number;
  memoryGiB: number; // Base-2: MiB / 1024
  provisionedDiskGiB: number; // Base-2: MiB / 1024
  inUseDiskGiB: number; // Base-2: MiB / 1024
  storageTiB: number; // Base-2: MiB / (1024 * 1024)
  provisioningType: 'Thin' | 'Thick';
  os: string;
  datacenter: string;
  cluster: string;
  hasSnapshot: boolean;
  snapshotAgeHours: number;
  snapshotSizeGiB: number;
  toolsStatus: NormalizedToolsStatus;
  portGroup: string;
  vlanId: number;
  environment: VMEnvironment;
  assignedWave: 0 | 1 | 2 | 3;
  targetStorageTier: StorageTierOption;
  recommendedMethod: 'HCX Bulk Migration' | 'HCX Cold Migration' | 'HCX RAV (Live vMotion)';
  readinessReason: string;
}

export const SAMPLE_ENTERPRISE_VMS: ParsedVMRecord[] = [
  // Wave 0: Shared Infrastructure & Management (Auto-detected as Management -> Out of Scope by default)
  {
    vmName: 'CORP-DC-AD01',
    scope: 'Out of Scope',
    isManagementInfra: true,
    powerState: 'poweredOn',
    cpus: 4,
    memoryGiB: 16,
    provisionedDiskGiB: 200,
    inUseDiskGiB: 85,
    storageTiB: 0.195,
    provisioningType: 'Thin',
    os: 'Microsoft Windows Server 2022 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'MGMT-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Healthy (Running)',
    portGroup: 'VLAN-100-MGMT-IDENTITY',
    vlanId: 100,
    environment: 'Prod',
    assignedWave: 0,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'Local management domain controller. Flagged as Management Infra (Out of Scope by default) to prevent sizing distortion.'
  },
  {
    vmName: 'CORP-DNS-INFOBLOX-01',
    scope: 'Out of Scope',
    isManagementInfra: true,
    powerState: 'poweredOn',
    cpus: 4,
    memoryGiB: 16,
    provisionedDiskGiB: 120,
    inUseDiskGiB: 45,
    storageTiB: 0.117,
    provisioningType: 'Thin',
    os: 'Red Hat Enterprise Linux 8 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'MGMT-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Linux Open-VM-Tools (Verified)',
    portGroup: 'VLAN-100-MGMT-IDENTITY',
    vlanId: 100,
    environment: 'Prod',
    assignedWave: 0,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'Core Enterprise DNS / IPAM appliance. Management network detected. Out of scope for target cloud tenant sizing.'
  },
  {
    vmName: 'MON-SPLUNK-INDEXER-01',
    scope: 'In Scope',
    isManagementInfra: true,
    powerState: 'poweredOn',
    cpus: 8,
    memoryGiB: 32,
    provisionedDiskGiB: 1536,
    inUseDiskGiB: 980,
    storageTiB: 1.5,
    provisioningType: 'Thick',
    os: 'Ubuntu Linux 22.04 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'MGMT-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Healthy (Running)',
    portGroup: 'VLAN-100-MGMT-IDENTITY',
    vlanId: 100,
    environment: 'Prod',
    assignedWave: 0,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX Bulk Migration',
    readinessReason: 'Enterprise log indexer on management VLAN. User toggled In Scope for migration monitoring.'
  },

  // Wave 1: Development, QA & Staging Workloads
  {
    vmName: 'DEV-BATCH-PROCESSING',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOff',
    cpus: 8,
    memoryGiB: 32,
    provisionedDiskGiB: 512,
    inUseDiskGiB: 310,
    storageTiB: 0.5,
    provisioningType: 'Thin',
    os: 'Red Hat Enterprise Linux 7 (64-bit)',
    datacenter: 'DC-West-Oregon',
    cluster: 'DEV-Cluster-01',
    hasSnapshot: true,
    snapshotAgeHours: 1080, // 45 days
    snapshotSizeGiB: 45,
    toolsStatus: 'Outdated (Update Prior to Cutover)',
    portGroup: 'VLAN-40-DEV-WORKLOADS',
    vlanId: 40,
    environment: 'Dev',
    assignedWave: 1,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX Cold Migration',
    readinessReason: 'CRITICAL SNAPSHOT RISK: Active snapshot is 45 days old (45 GiB). Consolidate snapshot in vCenter before performing cold sync.'
  },
  {
    vmName: 'STG-SAP-APP-01',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 8,
    memoryGiB: 64,
    provisionedDiskGiB: 800,
    inUseDiskGiB: 450,
    storageTiB: 0.781,
    provisioningType: 'Thin',
    os: 'SUSE Linux Enterprise 15 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Linux Open-VM-Tools (Verified)',
    portGroup: 'VLAN-20-APP-TIER',
    vlanId: 20,
    environment: 'Staging',
    assignedWave: 1,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX Bulk Migration',
    readinessReason: 'Staging ERP service. Baseline bulk seed with scheduled reboot to validate SAP cloud connectivity.'
  },
  {
    vmName: 'DEV-QA-API-GATEWAY',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 4,
    memoryGiB: 16,
    provisionedDiskGiB: 256,
    inUseDiskGiB: 110,
    storageTiB: 0.25,
    provisioningType: 'Thin',
    os: 'Ubuntu Linux 20.04 (64-bit)',
    datacenter: 'DC-West-Oregon',
    cluster: 'DEV-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Healthy (Running)',
    portGroup: 'VLAN-40-DEV-WORKLOADS',
    vlanId: 40,
    environment: 'QA',
    assignedWave: 1,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX Bulk Migration',
    readinessReason: 'Non-production API gateway. Scheduled cutover in Wave 1 validates HCX Network Extension latency.'
  },

  // Wave 2: Production Web & Application Middleware Tiers
  {
    vmName: 'PRD-APP-WEBSVC-01',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 4,
    memoryGiB: 16,
    provisionedDiskGiB: 160,
    inUseDiskGiB: 62,
    storageTiB: 0.156,
    provisioningType: 'Thin',
    os: 'Ubuntu Linux 22.04 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-02',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Healthy (Running)',
    portGroup: 'VLAN-10-WEB-TIER',
    vlanId: 10,
    environment: 'Prod',
    assignedWave: 2,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'Stateless production web tier node. Zero user session disruption via live RAV migration.'
  },
  {
    vmName: 'PRD-APP-WEBSVC-02',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 4,
    memoryGiB: 16,
    provisionedDiskGiB: 160,
    inUseDiskGiB: 64,
    storageTiB: 0.156,
    provisioningType: 'Thin',
    os: 'Ubuntu Linux 22.04 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-02',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Healthy (Running)',
    portGroup: 'VLAN-10-WEB-TIER',
    vlanId: 10,
    environment: 'Prod',
    assignedWave: 2,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'Paired production web tier node. Migrate in Wave 2 with MON enabled to eliminate hairpin routing.'
  },
  {
    vmName: 'PRD-MID-KAFKA-BROKER-01',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 8,
    memoryGiB: 32,
    provisionedDiskGiB: 1024,
    inUseDiskGiB: 620,
    storageTiB: 1.0,
    provisioningType: 'Thick',
    os: 'Red Hat Enterprise Linux 8 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Linux Open-VM-Tools (Verified)',
    portGroup: 'VLAN-20-APP-TIER',
    vlanId: 20,
    environment: 'Prod',
    assignedWave: 2,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX Bulk Migration',
    readinessReason: 'Streaming middleware broker. Bulk seed overnight; execute 5-minute maintenance reboot during scheduled window.'
  },
  {
    vmName: 'LEGACY-MONITOR-SRV',
    scope: 'To Be Decided',
    isManagementInfra: true,
    powerState: 'poweredOn',
    cpus: 2,
    memoryGiB: 8,
    provisionedDiskGiB: 300,
    inUseDiskGiB: 220,
    storageTiB: 0.293,
    provisioningType: 'Thick',
    os: 'CentOS 6 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'MGMT-Cluster-01',
    hasSnapshot: true,
    snapshotAgeHours: 4320, // 180 days
    snapshotSizeGiB: 38,
    toolsStatus: 'Missing / Stopped (Critical Migration Risk)',
    portGroup: 'VLAN-100-MGMT-IDENTITY',
    vlanId: 100,
    environment: 'Prod',
    assignedWave: 2,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX Bulk Migration',
    readinessReason: 'CRITICAL RISK: Missing VMware Tools and 180-day snapshot (38 GiB). Status set to To Be Decided pending remediation.'
  },

  // Wave 3: Mission-Critical Transactional Databases (Auto-recommended for External NFS if >= 2 TiB)
  {
    vmName: 'PRD-DB-ORACLE-RAC01',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 16,
    memoryGiB: 128,
    provisionedDiskGiB: 2457.6, // 2.4 TiB
    inUseDiskGiB: 1850,
    storageTiB: 2.4,
    provisioningType: 'Thick',
    os: 'Red Hat Enterprise Linux 8 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Linux Open-VM-Tools (Verified)',
    portGroup: 'VLAN-30-DB-TIER',
    vlanId: 30,
    environment: 'Prod',
    assignedWave: 3,
    targetStorageTier: 'External NFS', // Auto-recommended due to >= 2 TiB
    recommendedMethod: 'HCX Bulk Migration',
    readinessReason: 'High-capacity Oracle RAC node (2.4 TiB >= 2 TiB). Auto-recommended for Decoupled External NFS Storage (ANF/FSx) to prevent vSAN node sprawl.'
  },
  {
    vmName: 'PRD-DB-SQL-ALWAYS-ON01',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 12,
    memoryGiB: 64,
    provisionedDiskGiB: 1228.8, // 1.2 TiB
    inUseDiskGiB: 890,
    storageTiB: 1.2,
    provisioningType: 'Thick',
    os: 'Microsoft Windows Server 2022 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Healthy (Running)',
    portGroup: 'VLAN-30-DB-TIER',
    vlanId: 30,
    environment: 'Prod',
    assignedWave: 3,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'SQL Always-On primary node (< 2 TiB). High IOPs transactional IO assigned to Local vSAN tier. Live RAV migration preserves cluster quorum.'
  }
];

/**
 * Generates and downloads a realistic RVTools .xlsx file for testing with multi-sheet structure
 */
export function generateSampleRvToolsXlsx(): void {
  const vInfoRows = SAMPLE_ENTERPRISE_VMS.map(vm => ({
    VM: vm.vmName,
    Powerstate: vm.powerState,
    CPUs: vm.cpus,
    Memory: vm.memoryGiB * 1024, // Raw MiB
    'Provisioned MB': Math.round(vm.provisionedDiskGiB * 1024),
    'In Use MB': Math.round(vm.inUseDiskGiB * 1024),
    'OS according to the configuration file': vm.os,
    Datacenter: vm.datacenter,
    Cluster: vm.cluster,
    'VMware Tools':
      vm.toolsStatus === 'Healthy (Running)' || vm.toolsStatus === 'Linux Open-VM-Tools (Verified)'
        ? 'guestToolsRunning'
        : 'guestToolsNotRunning',
    Annotation: `Migration Wave ${vm.assignedWave} · ${vm.scope}`
  }));

  const vDiskRows = SAMPLE_ENTERPRISE_VMS.map(vm => ({
    VM: vm.vmName,
    Disk: 'Hard disk 1',
    'Capacity MB': Math.round(vm.provisionedDiskGiB * 1024),
    'Disk Type': vm.provisioningType,
    Datastore: 'vsanDatastore'
  }));

  const vSnapshotRows = SAMPLE_ENTERPRISE_VMS
    .filter(vm => vm.hasSnapshot)
    .map(vm => ({
      VM: vm.vmName,
      Snapshot: 'Pre-Migration-Backup',
      'Date / time': new Date(Date.now() - vm.snapshotAgeHours * 3600000).toISOString(),
      'Size MB': vm.snapshotSizeGiB * 1024,
      Quiesced: 'False'
    }));

  const vNetworkRows = SAMPLE_ENTERPRISE_VMS.map(vm => ({
    VM: vm.vmName,
    NIC: 'Network adapter 1',
    Network: vm.portGroup,
    VLAN: vm.vlanId,
    'IP Address': `10.${vm.vlanId}.10.${Math.floor(Math.random() * 200) + 10}`,
    'Mac Address': `00:50:56:a1:b2:${vm.vlanId.toString(16).padStart(2, '0')}`
  }));

  const vToolsRows = SAMPLE_ENTERPRISE_VMS.map(vm => ({
    VM: vm.vmName,
    'Tools status':
      vm.toolsStatus === 'Healthy (Running)' || vm.toolsStatus === 'Linux Open-VM-Tools (Verified)'
        ? 'toolsOk'
        : 'toolsNotInstalled',
    'Tools Version': vm.toolsStatus === 'Healthy (Running)' ? '12352' : '10346'
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vInfoRows), 'vInfo');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vDiskRows), 'vDisk');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vSnapshotRows), 'vSnapshot');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vNetworkRows), 'vNetwork');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vToolsRows), 'vTools');

  XLSX.writeFile(wb, 'RVTools_Enterprise_Production_Export.xlsx');
}

/**
 * Generates an executive 4-tab assessment workbook (.xlsx) with exact Base-2 values and scoping
 */
export function exportMultiTabRvToolsAssessment(
  vmRecords: ParsedVMRecord[],
  fileName: string,
  cloudEstimate: {
    targetCloud: string;
    nodeSku: string;
    cloudNodes: number;
    inScopeVMCount: number;
    totalVCPUs: number;
    totalRAMGiB: number;
    totalStorageTiB: number;
    decoupledStorageTiB: number;
    monthlyRunRateUSD: number;
    monthlySavingsUSD: number;
  }
): void {
  const wb = XLSX.utils.book_new();

  // Tab 1: Executive Summary & Cloud Sizing
  const summaryRows = [
    { Metric: 'RVTools Assessment Source', Value: fileName },
    { Metric: 'Target Hyperscaler Ecosystem', Value: cloudEstimate.targetCloud },
    { Metric: 'Selected Bare-Metal Node SKU', Value: cloudEstimate.nodeSku },
    { Metric: 'Total Workloads Assessed', Value: vmRecords.length },
    { Metric: 'Workloads Included In-Scope', Value: cloudEstimate.inScopeVMCount },
    { Metric: 'Workloads Marked Out-of-Scope (Mgmt / Retired)', Value: vmRecords.filter(v => v.scope === 'Out of Scope').length },
    { Metric: 'Workloads To Be Decided', Value: vmRecords.filter(v => v.scope === 'To Be Decided').length },
    { Metric: 'In-Scope Total vCPU Cores', Value: cloudEstimate.totalVCPUs },
    { Metric: 'In-Scope Allocated Memory (GiB - Base-2)', Value: cloudEstimate.totalRAMGiB },
    { Metric: 'In-Scope Provisioned Storage (TiB - Base-2)', Value: cloudEstimate.totalStorageTiB },
    { Metric: 'Storage Offloaded to External NFS (TiB)', Value: cloudEstimate.decoupledStorageTiB },
    { Metric: 'Required Bare-Metal Cloud Hosts (N+1 HA)', Value: cloudEstimate.cloudNodes },
    { Metric: 'Estimated Monthly Run-Rate (USD)', Value: `$${cloudEstimate.monthlyRunRateUSD.toLocaleString()}` },
    { Metric: 'Projected Monthly Storage Sprawl Savings', Value: `$${cloudEstimate.monthlySavingsUSD.toLocaleString()}` },
    { Metric: 'Assessment Export Date', Value: new Date().toISOString() }
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Executive Summary');

  // Tab 2: Workload Assessment & HCX Mapping
  const workloadRows = vmRecords.map(vm => ({
    'VM Name': vm.vmName,
    'Scope Decision': vm.scope,
    'Management Infra': vm.isManagementInfra ? 'Yes (Detected)' : 'No',
    'Environment': vm.environment,
    'Assigned Wave': `Wave ${vm.assignedWave}`,
    'Target Storage Tier': vm.targetStorageTier,
    'Power State': vm.powerState,
    'vCPUs': vm.cpus,
    'RAM (GiB)': vm.memoryGiB,
    'Provisioned Disk (GiB)': vm.provisionedDiskGiB,
    'Capacity (TiB)': vm.storageTiB,
    'Provisioning': vm.provisioningType,
    'Operating System': vm.os,
    'Port Group': vm.portGroup,
    'VLAN ID': vm.vlanId,
    'Snapshot Health': vm.hasSnapshot ? `CRITICAL (${vm.snapshotAgeHours}h / ${vm.snapshotSizeGiB}GiB)` : 'Healthy',
    'VMware Tools Status': vm.toolsStatus,
    'Recommended HCX Method': vm.recommendedMethod,
    'Architectural Rationale': vm.readinessReason
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(workloadRows), 'Workload Assessment');

  // Tab 3: Wave Schedule & Execution Sequence
  const waveNames = [
    'Wave 0: Shared Services & Core Infrastructure',
    'Wave 1: Dev, QA & Staging Systems',
    'Wave 2: Production Web & Middleware Tiers',
    'Wave 3: Mission-Critical Databases'
  ];
  const waveRows = [0, 1, 2, 3].map(w => {
    const inWave = vmRecords.filter(v => v.assignedWave === w && v.scope === 'In Scope');
    return {
      'Migration Wave': waveNames[w],
      'In-Scope Workload Count': inWave.length,
      'Total vCPUs': inWave.reduce((a, v) => a + v.cpus, 0),
      'Total RAM (GiB)': inWave.reduce((a, v) => a + v.memoryGiB, 0),
      'Total Storage (TiB)': Math.round(inWave.reduce((a, v) => a + v.storageTiB, 0) * 10) / 10,
      'External NFS Storage (TiB)': Math.round(
        inWave.filter(v => v.targetStorageTier === 'External NFS').reduce((a, v) => a + v.storageTiB, 0) * 10
      ) / 10,
      'RAV (Live vMotion)': inWave.filter(v => v.recommendedMethod === 'HCX RAV (Live vMotion)').length,
      'Bulk Migration': inWave.filter(v => v.recommendedMethod === 'HCX Bulk Migration').length,
      'Cold Migration': inWave.filter(v => v.recommendedMethod === 'HCX Cold Migration').length
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(waveRows), 'Wave Schedule');

  // Tab 4: Stretched L2 VLAN & Subnet Inventory
  const vlanMap = new Map<string, { portGroup: string; vlanId: number; vmCount: number; vms: string[] }>();
  vmRecords.filter(v => v.scope === 'In Scope').forEach(vm => {
    const key = vm.portGroup || `VLAN-${vm.vlanId}`;
    if (!vlanMap.has(key)) {
      vlanMap.set(key, { portGroup: key, vlanId: vm.vlanId || 10, vmCount: 0, vms: [] });
    }
    const item = vlanMap.get(key)!;
    item.vmCount++;
    item.vms.push(vm.vmName);
  });
  const vlanRows = Array.from(vlanMap.values()).map(v => ({
    'Port Group Name': v.portGroup,
    'VLAN ID': v.vlanId,
    'In-Scope Connected VMs': v.vmCount,
    'HCX Network Extension Required': 'Yes (Recommended)',
    'Sample Workloads': v.vms.slice(0, 4).join(', ')
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vlanRows), 'Stretched L2 VLANs');

  XLSX.writeFile(wb, `Zaboraa_RVTools_Precision_Assessment_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}
