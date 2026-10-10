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
  assignedWave: 0 | 1 | 2 | 3 | 4;
  targetStorageTier: StorageTierOption;
  recommendedMethod: 'HCX Bulk Migration' | 'HCX Cold Migration' | 'HCX RAV (Live vMotion)' | 'Re-architect Required';
  readinessReason: string;

  // Hypervisor Compatibility & Hardware Attributes
  hardwareVersion?: number;
  vnicType?: string;
  storageController?: string;
  isRdmPhysical?: boolean;
  isRdmVirtual?: boolean;
  isMultiWriter?: boolean;
  isSharedScsi?: boolean;
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
    readinessReason: 'Local management domain controller. Flagged as Management Infra (Out of Scope by default) to prevent sizing distortion.',
    hardwareVersion: 19,
    vnicType: 'VMXNET3',
    storageController: 'PVSCSI'
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
    readinessReason: 'Core Enterprise DNS / IPAM appliance. Management network detected. Out of scope for target cloud tenant sizing.',
    hardwareVersion: 17,
    vnicType: 'VMXNET3',
    storageController: 'PVSCSI'
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
    readinessReason: 'Enterprise log indexer on management VLAN. User toggled In Scope for migration monitoring.',
    hardwareVersion: 19,
    vnicType: 'VMXNET3',
    storageController: 'PVSCSI'
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
    readinessReason: 'CRITICAL SNAPSHOT RISK: Active snapshot is 45 days old (45 GiB). Consolidate snapshot in vCenter before performing cold sync.',
    hardwareVersion: 13,
    vnicType: 'E1000E',
    storageController: 'LSI_LOGIC_SAS'
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
    toolsStatus: 'Healthy (Running)',
    portGroup: 'VLAN-50-STAGING-APP',
    vlanId: 50,
    environment: 'Staging',
    assignedWave: 1,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'Healthy staging application server. High memory footprint, ideal candidate for initial migration verification wave.',
    hardwareVersion: 19,
    vnicType: 'VMXNET3',
    storageController: 'PVSCSI'
  },
  {
    vmName: 'QA-PORTAL-WEB-01',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 4,
    memoryGiB: 16,
    provisionedDiskGiB: 200,
    inUseDiskGiB: 80,
    storageTiB: 0.195,
    provisioningType: 'Thin',
    os: 'Ubuntu Linux 20.04 (64-bit)',
    datacenter: 'DC-West-Oregon',
    cluster: 'DEV-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Linux Open-VM-Tools (Verified)',
    portGroup: 'VLAN-40-DEV-WORKLOADS',
    vlanId: 40,
    environment: 'QA',
    assignedWave: 1,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'QA front-end node. Zero dependencies; ready for Wave 1 live migration.',
    hardwareVersion: 17,
    vnicType: 'VMXNET3',
    storageController: 'PVSCSI'
  },

  // Wave 2: Production Web & Middleware Tier
  {
    vmName: 'PRD-WEB-FRONTEND-01',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 8,
    memoryGiB: 32,
    provisionedDiskGiB: 300,
    inUseDiskGiB: 120,
    storageTiB: 0.293,
    provisioningType: 'Thin',
    os: 'Red Hat Enterprise Linux 8 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Healthy (Running)',
    portGroup: 'VLAN-10-PROD-WEB',
    vlanId: 10,
    environment: 'Prod',
    assignedWave: 2,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'Production web layer node. Member of Avi Vantage load balancer pool. Zero-downtime RAV candidate.',
    hardwareVersion: 19,
    vnicType: 'VMXNET3',
    storageController: 'PVSCSI'
  },
  {
    vmName: 'PRD-WEB-FRONTEND-02',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 8,
    memoryGiB: 32,
    provisionedDiskGiB: 300,
    inUseDiskGiB: 125,
    storageTiB: 0.293,
    provisioningType: 'Thin',
    os: 'Red Hat Enterprise Linux 8 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Healthy (Running)',
    portGroup: 'VLAN-10-PROD-WEB',
    vlanId: 10,
    environment: 'Prod',
    assignedWave: 2,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'Second web frontend node. Pair with PRD-WEB-FRONTEND-01 during Wave 2 cutover.',
    hardwareVersion: 19,
    vnicType: 'VMXNET3',
    storageController: 'PVSCSI'
  },
  {
    vmName: 'PRD-APP-MIDDLEWARE-01',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 16,
    memoryGiB: 64,
    provisionedDiskGiB: 600,
    inUseDiskGiB: 280,
    storageTiB: 0.586,
    provisioningType: 'Thin',
    os: 'Microsoft Windows Server 2019 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Healthy (Running)',
    portGroup: 'VLAN-20-PROD-APP',
    vlanId: 20,
    environment: 'Prod',
    assignedWave: 2,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'Core enterprise business middleware. High compute allocation, optimized for vSAN.',
    hardwareVersion: 19,
    vnicType: 'VMXNET3',
    storageController: 'PVSCSI'
  },
  {
    vmName: 'LEGACY-APP-REPORTING',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 4,
    memoryGiB: 16,
    provisionedDiskGiB: 400,
    inUseDiskGiB: 210,
    storageTiB: 0.39,
    provisioningType: 'Thin',
    os: 'Microsoft Windows Server 2012 R2 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Outdated (Update Prior to Cutover)',
    portGroup: 'VLAN-20-PROD-APP',
    vlanId: 20,
    environment: 'Prod',
    assignedWave: 2,
    targetStorageTier: 'Local vSAN',
    recommendedMethod: 'HCX Bulk Migration',
    readinessReason: 'LEGACY DRIVER WARNING: Configured with emulated E1000E vNIC and LSI Logic Parallel controller. Recommend converting to VMXNET3/PVSCSI.',
    hardwareVersion: 13,
    vnicType: 'E1000E',
    storageController: 'LSI_LOGIC_PARALLEL'
  },

  // Wave 3: Mission-Critical Databases & Storage-Intensive Backend
  {
    vmName: 'PRD-SQL-ENTERPRISE-01',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 32,
    memoryGiB: 256,
    provisionedDiskGiB: 8192,
    inUseDiskGiB: 6400,
    storageTiB: 6.25,
    provisioningType: 'Thick',
    os: 'Microsoft Windows Server 2022 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Healthy (Running)',
    portGroup: 'VLAN-30-PROD-DB',
    vlanId: 30,
    environment: 'Prod',
    assignedWave: 3,
    targetStorageTier: 'External NFS',
    recommendedMethod: 'HCX Bulk Migration',
    readinessReason: 'MISSION-CRITICAL DATABASE: 6.25 TiB active storage. Target External NFS datastore (Azure NetApp Files / AWS FSx ONTAP / Google Cloud NetApp Volumes) recommended.',
    hardwareVersion: 19,
    vnicType: 'VMXNET3',
    storageController: 'PVSCSI'
  },
  {
    vmName: 'PRD-SQL-ENTERPRISE-02',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 32,
    memoryGiB: 256,
    provisionedDiskGiB: 8192,
    inUseDiskGiB: 6400,
    storageTiB: 6.25,
    provisioningType: 'Thick',
    os: 'Microsoft Windows Server 2022 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Healthy (Running)',
    portGroup: 'VLAN-30-PROD-DB',
    vlanId: 30,
    environment: 'Prod',
    assignedWave: 3,
    targetStorageTier: 'External NFS',
    recommendedMethod: 'HCX Bulk Migration',
    readinessReason: 'Partner node in SQL Always-On Availability Group. Offload to External NFS datastore to prevent vSAN node sprawl.',
    hardwareVersion: 19,
    vnicType: 'VMXNET3',
    storageController: 'PVSCSI'
  },

  // Wave 4: Blocker Remediation Wave (RDM Physical & Multi-Writer)
  {
    vmName: 'PRD-ORACLE-RAC-01',
    scope: 'In Scope',
    isManagementInfra: false,
    powerState: 'poweredOn',
    cpus: 24,
    memoryGiB: 128,
    provisionedDiskGiB: 4096,
    inUseDiskGiB: 3200,
    storageTiB: 3.125,
    provisioningType: 'Thick',
    os: 'Oracle Enterprise Linux 8 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    snapshotAgeHours: 0,
    snapshotSizeGiB: 0,
    toolsStatus: 'Healthy (Running)',
    portGroup: 'VLAN-30-PROD-DB',
    vlanId: 30,
    environment: 'Prod',
    assignedWave: 4,
    targetStorageTier: 'External NFS',
    recommendedMethod: 'Re-architect Required',
    readinessReason: 'CRITICAL BLOCKER: Attached to Physical Compatibility RDM (RDM-P) and Shared SCSI Bus. Must be re-architected or converted to VMDK before HCX replication.',
    hardwareVersion: 17,
    vnicType: 'VMXNET3',
    storageController: 'PVSCSI',
    isRdmPhysical: true,
    isSharedScsi: true,
    isMultiWriter: true
  }
];

/**
 * Downloads a sample raw RVTools Excel workbook (.xlsx) containing all standard sheets:
 * vInfo, vDisk, vMemory, vNetwork, vTools, vSnapshot.
 */
export function generateSampleRvToolsXlsx(): void {
  const vInfoRows = SAMPLE_ENTERPRISE_VMS.map((vm, idx) => ({
    VM: vm.vmName,
    Powerstate: vm.powerState,
    Template: false,
    CPUs: vm.cpus,
    Memory: vm.memoryGiB * 1024,
    'Provisioned MB': vm.provisionedDiskGiB * 1024,
    'In Use MB': vm.inUseDiskGiB * 1024,
    'OS according to the configuration file': vm.os,
    'Configured HW version': `vmx-${vm.hardwareVersion || 19}`,
    Datacenter: vm.datacenter,
    Cluster: vm.cluster,
    Host: `esxi-blade-0${(idx % 4) + 1}.corp.internal`,
    'VM ID': `vm-${1000 + idx}`,
    'Tools status': vm.toolsStatus.includes('Healthy') ? 'toolsOk' : 'toolsOld'
  }));

  const vDiskRows = SAMPLE_ENTERPRISE_VMS.flatMap((vm, idx) => {
    const isBig = vm.storageTiB > 2.0;
    const disks = [
      {
        VM: vm.vmName,
        Disk: 'Hard disk 1',
        'Capacity MB': Math.round((vm.provisionedDiskGiB * 1024) * (isBig ? 0.3 : 1)),
        'Free MB': Math.round((vm.provisionedDiskGiB - vm.inUseDiskGiB) * 1024 * (isBig ? 0.3 : 1)),
        Controller: vm.storageController || 'SCSI controller 0 (PVSCSI)',
        'Disk Type': vm.isRdmPhysical ? 'Raw Device Mapping (Physical)' : 'Flat',
        Sharing: vm.isSharedScsi ? 'physicalSharing' : 'none',
        'Multi-Writer': vm.isMultiWriter ? 'true' : 'false'
      }
    ];

    if (isBig) {
      disks.push({
        VM: vm.vmName,
        Disk: 'Hard disk 2 (Data Volume)',
        'Capacity MB': Math.round((vm.provisionedDiskGiB * 1024) * 0.7),
        'Free MB': Math.round((vm.provisionedDiskGiB - vm.inUseDiskGiB) * 1024 * 0.7),
        Controller: vm.storageController || 'SCSI controller 0 (PVSCSI)',
        'Disk Type': vm.isRdmPhysical ? 'Raw Device Mapping (Physical)' : 'Flat',
        Sharing: vm.isSharedScsi ? 'physicalSharing' : 'none',
        'Multi-Writer': vm.isMultiWriter ? 'true' : 'false'
      });
    }

    return disks;
  });

  const vSnapshotRows = SAMPLE_ENTERPRISE_VMS.filter(vm => vm.hasSnapshot).map(vm => ({
    VM: vm.vmName,
    Snapshot: 'Pre-Patching Snapshot',
    'Date / time': new Date(Date.now() - vm.snapshotAgeHours * 3600000).toISOString(),
    'Size MB': vm.snapshotSizeGiB * 1024
  }));

  const vNetworkRows = SAMPLE_ENTERPRISE_VMS.map(vm => ({
    VM: vm.vmName,
    NIC: 'Network adapter 1',
    Adapter: vm.vnicType || 'VMXNET3',
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

  const vMemoryRows = SAMPLE_ENTERPRISE_VMS.map(vm => ({
    VM: vm.vmName,
    Size: vm.memoryGiB * 1024,
    Shares: 'Normal',
    Reservation: 0,
    Overhead: 128
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vInfoRows), 'vInfo');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vDiskRows), 'vDisk');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vMemoryRows), 'vMemory');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vSnapshotRows), 'vSnapshot');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vNetworkRows), 'vNetwork');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vToolsRows), 'vTools');

  XLSX.writeFile(wb, 'RVTools_Enterprise_Production_Export.xlsx');
}

/**
 * Generates an executive technical assessment workbook (.xlsx) with strict Base-2 values and scoping.
 * ZERO COSTING: Completely devoid of currency, monthly run rate, and pricing models.
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
    effectiveCores: number;
    totalRAMGiB: number;
    bufferedRAMGiB: number;
    totalStorageTiB: number;
    vsanStorageTiB: number;
    decoupledStorageTiB: number;
    storagePolicyApplied: string;
    vCpuOvercommit: number;
    ramBufferPercent: number;
    blockersCount: number;
  }
): void {
  const wb = XLSX.utils.book_new();

  // Tab 1: Executive Summary & Cloud Capacity Sizing (Zero Costing)
  const summaryRows = [
    { Metric: 'RVTools Assessment Source', Value: fileName },
    { Metric: 'Target Hyperscaler Ecosystem', Value: cloudEstimate.targetCloud },
    { Metric: 'Selected Bare-Metal Host SKU', Value: cloudEstimate.nodeSku },
    { Metric: 'Total Workloads Assessed', Value: vmRecords.length },
    { Metric: 'Workloads In-Scope', Value: cloudEstimate.inScopeVMCount },
    { Metric: 'Workloads Out-of-Scope (Mgmt / Retired)', Value: vmRecords.filter(v => v.scope === 'Out of Scope').length },
    { Metric: 'Workloads To Be Decided', Value: vmRecords.filter(v => v.scope === 'To Be Decided').length },
    { Metric: 'In-Scope Raw vCPUs', Value: cloudEstimate.totalVCPUs },
    { Metric: 'vCPU Overcommit Ratio Applied', Value: `${cloudEstimate.vCpuOvercommit}:1` },
    { Metric: 'Calculated Physical Cores Required', Value: cloudEstimate.effectiveCores },
    { Metric: 'In-Scope Allocated Memory (GiB - Base-2)', Value: cloudEstimate.totalRAMGiB },
    { Metric: 'RAM Overhead Buffer Applied', Value: `+${cloudEstimate.ramBufferPercent}%` },
    { Metric: 'Buffered Memory Required (GiB)', Value: cloudEstimate.bufferedRAMGiB },
    { Metric: 'Total Workload Storage (TiB - Base-2)', Value: cloudEstimate.totalStorageTiB },
    { Metric: 'Storage Policy Applied', Value: cloudEstimate.storagePolicyApplied },
    { Metric: 'Cluster vSAN Usable Storage (TiB)', Value: cloudEstimate.vsanStorageTiB },
    { Metric: 'Storage Offloaded to External NFS (TiB)', Value: cloudEstimate.decoupledStorageTiB },
    { Metric: 'Required Bare-Metal Cloud Hosts (N+1 Resiliency)', Value: cloudEstimate.cloudNodes },
    { Metric: 'Migration Blockers & Complex Configurations Flagged', Value: cloudEstimate.blockersCount },
    { Metric: 'Assessment Export Date', Value: new Date().toISOString() }
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Executive Summary');

  // Tab 2: Workload Assessment & Compatibility Mapping
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
    'In-Use Capacity (TiB)': vm.storageTiB,
    'Provisioning': vm.provisioningType,
    'Virtual Hardware': `vHardware ${vm.hardwareVersion || 19}`,
    'Network Adapter': vm.vnicType || 'VMXNET3',
    'Storage Controller': vm.storageController || 'PVSCSI',
    'RDM Physical Mode': vm.isRdmPhysical ? 'YES (CRITICAL BLOCKER)' : 'No',
    'Multi-Writer / Shared SCSI': vm.isMultiWriter || vm.isSharedScsi ? 'YES (CLUSTER STAGING REQUIRED)' : 'No',
    'Operating System': vm.os,
    'Port Group': vm.portGroup,
    'VLAN ID': vm.vlanId,
    'Snapshot Health': vm.hasSnapshot ? `RISK (${vm.snapshotAgeHours}h / ${vm.snapshotSizeGiB}GiB)` : 'Healthy',
    'VMware Tools Status': vm.toolsStatus,
    'Recommended Migration Method': vm.recommendedMethod,
    'Architectural Rationale': vm.readinessReason
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(workloadRows), 'Workload Assessment');

  // Tab 3: Migration Wave Plan (Zero Costing)
  const waveNames = [
    'Wave 0: Shared Services & Core Infrastructure',
    'Wave 1: Dev, QA & Staging Systems',
    'Wave 2: Production Web & Middleware Tiers',
    'Wave 3: Mission-Critical Databases',
    'Wave 4: Blocker Remediation Wave'
  ];
  const waveRows = [0, 1, 2, 3, 4].map(w => {
    const inWave = vmRecords.filter(v => v.assignedWave === w && v.scope === 'In Scope');
    return {
      'Migration Wave': waveNames[w],
      'In-Scope Workload Count': inWave.length,
      'Total vCPUs': inWave.reduce((a, v) => a + v.cpus, 0),
      'Total RAM (GiB)': inWave.reduce((a, v) => a + v.memoryGiB, 0),
      'Total Storage (TiB)': Math.round(inWave.reduce((a, v) => a + v.storageTiB, 0) * 10) / 10,
      'vSAN Storage (TiB)': Math.round(
        inWave.filter(v => v.targetStorageTier === 'Local vSAN').reduce((a, v) => a + v.storageTiB, 0) * 10
      ) / 10,
      'External NFS Storage (TiB)': Math.round(
        inWave.filter(v => v.targetStorageTier === 'External NFS').reduce((a, v) => a + v.storageTiB, 0) * 10
      ) / 10,
      'RAV (Live vMotion)': inWave.filter(v => v.recommendedMethod === 'HCX RAV (Live vMotion)').length,
      'Bulk Migration': inWave.filter(v => v.recommendedMethod === 'HCX Bulk Migration').length,
      'Cold Migration': inWave.filter(v => v.recommendedMethod === 'HCX Cold Migration').length,
      'Re-architect Required': inWave.filter(v => v.recommendedMethod === 'Re-architect Required').length
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(waveRows), 'Wave Schedule');

  // Tab 4: Stretched L2 Network Extensions
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

  XLSX.writeFile(wb, `Zaboraa_Technical_Assessment_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}
