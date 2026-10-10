import * as XLSX from 'xlsx';

export interface ParsedVMRecord {
  vmName: string;
  powerState: 'poweredOn' | 'poweredOff';
  cpus: number;
  memoryGB: number;
  provisionedDiskGB: number;
  inUseDiskGB: number;
  os: string;
  datacenter: string;
  cluster: string;
  hasSnapshot: boolean;
  snapshotAgeDays?: number;
  toolsStatus: 'toolsOk' | 'toolsOld' | 'toolsNotInstalled';
  recommendedMethod: 'HCX Bulk Migration' | 'HCX Cold Migration' | 'HCX RAV (Live vMotion)';
  readinessReason: string;
}

export const SAMPLE_ENTERPRISE_VMS: ParsedVMRecord[] = [
  {
    vmName: 'PRD-DB-ORACLE-01',
    powerState: 'poweredOn',
    cpus: 16,
    memoryGB: 128,
    provisionedDiskGB: 2400,
    inUseDiskGB: 1850,
    os: 'Red Hat Enterprise Linux 8 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    toolsStatus: 'toolsOk',
    recommendedMethod: 'HCX Bulk Migration',
    readinessReason: 'Large database disk (>2TB). Bulk replication with scheduled maintenance cutover window minimizes risk.'
  },
  {
    vmName: 'PRD-DB-SQL-01',
    powerState: 'poweredOn',
    cpus: 12,
    memoryGB: 64,
    provisionedDiskGB: 1200,
    inUseDiskGB: 890,
    os: 'Microsoft Windows Server 2022 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    toolsStatus: 'toolsOk',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'Mission-critical SQL backend requiring zero downtime. RAV live migration supported.'
  },
  {
    vmName: 'PRD-APP-WEBSVC-01',
    powerState: 'poweredOn',
    cpus: 4,
    memoryGB: 16,
    provisionedDiskGB: 150,
    inUseDiskGB: 62,
    os: 'Ubuntu Linux (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-02',
    hasSnapshot: false,
    toolsStatus: 'toolsOk',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'Stateless web tier. Zero cutover disruption with RAV.'
  },
  {
    vmName: 'PRD-APP-WEBSVC-02',
    powerState: 'poweredOn',
    cpus: 4,
    memoryGB: 16,
    provisionedDiskGB: 150,
    inUseDiskGB: 64,
    os: 'Ubuntu Linux (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-02',
    hasSnapshot: false,
    toolsStatus: 'toolsOk',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'Stateless web tier. Zero cutover disruption with RAV.'
  },
  {
    vmName: 'DEV-BATCH-PROCESSING',
    powerState: 'poweredOff',
    cpus: 8,
    memoryGB: 32,
    provisionedDiskGB: 500,
    inUseDiskGB: 310,
    os: 'Red Hat Enterprise Linux 7 (64-bit)',
    datacenter: 'DC-West-Oregon',
    cluster: 'DEV-Cluster-01',
    hasSnapshot: true,
    snapshotAgeDays: 45,
    toolsStatus: 'toolsOld',
    recommendedMethod: 'HCX Cold Migration',
    readinessReason: 'Powered off workload with aging snapshot. Snapshot consolidation recommended before cold sync.'
  },
  {
    vmName: 'STG-SAP-APP-01',
    powerState: 'poweredOn',
    cpus: 8,
    memoryGB: 64,
    provisionedDiskGB: 800,
    inUseDiskGB: 450,
    os: 'SUSE Linux Enterprise 15 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'PRD-Compute-Cluster-01',
    hasSnapshot: false,
    toolsStatus: 'toolsOk',
    recommendedMethod: 'HCX Bulk Migration',
    readinessReason: 'Staging ERP service with high memory footprint. Baseline bulk seed with scheduled reboot.'
  },
  {
    vmName: 'CORP-DC-AD01',
    powerState: 'poweredOn',
    cpus: 4,
    memoryGB: 16,
    provisionedDiskGB: 200,
    inUseDiskGB: 85,
    os: 'Microsoft Windows Server 2019 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'MGMT-Cluster-01',
    hasSnapshot: false,
    toolsStatus: 'toolsOk',
    recommendedMethod: 'HCX RAV (Live vMotion)',
    readinessReason: 'Active Directory domain controller. Zero-downtime live vMotion preserving DNS queries.'
  },
  {
    vmName: 'LEGACY-MONITOR-SRV',
    powerState: 'poweredOn',
    cpus: 2,
    memoryGB: 8,
    provisionedDiskGB: 300,
    inUseDiskGB: 220,
    os: 'CentOS 6 (64-bit)',
    datacenter: 'DC-East-Ashburn',
    cluster: 'MGMT-Cluster-01',
    hasSnapshot: true,
    snapshotAgeDays: 180,
    toolsStatus: 'toolsNotInstalled',
    recommendedMethod: 'HCX Bulk Migration',
    readinessReason: 'Legacy OS without VMware Tools. Install open-vm-tools and commit 180-day snapshot before migration wave.'
  }
];

/**
 * Generates and downloads a realistic RVTools .xlsx file for testing
 */
export function generateSampleRvToolsXlsx(): void {
  const vInfoRows = SAMPLE_ENTERPRISE_VMS.map(vm => ({
    'VM': vm.vmName,
    'Powerstate': vm.powerState,
    'CPUs': vm.cpus,
    'Memory': vm.memoryGB * 1024,
    'Provisioned MB': vm.provisionedDiskGB * 1024,
    'In Use MB': vm.inUseDiskGB * 1024,
    'OS according to the configuration file': vm.os,
    'Datacenter': vm.datacenter,
    'Cluster': vm.cluster,
    'VMware Tools': vm.toolsStatus === 'toolsOk' ? 'guestToolsRunning' : 'guestToolsNotRunning',
    'Annotation': 'Production migration wave candidate'
  }));

  const vSnapshotRows = SAMPLE_ENTERPRISE_VMS
    .filter(vm => vm.hasSnapshot)
    .map(vm => ({
      'VM': vm.vmName,
      'Snapshot': 'Snapshot-PrePatch-Backup',
      'Date / time': new Date(Date.now() - (vm.snapshotAgeDays || 10) * 86400000).toISOString(),
      'Size MB': Math.round(vm.inUseDiskGB * 0.15 * 1024),
      'Quiesced': 'False'
    }));

  const vDiskRows = SAMPLE_ENTERPRISE_VMS.map(vm => ({
    'VM': vm.vmName,
    'Disk': 'Hard disk 1',
    'Capacity MB': vm.provisionedDiskGB * 1024,
    'Disk Type': 'Thin',
    'Datastore': 'vsanDatastore'
  }));

  const wb = XLSX.utils.book_new();
  const wsInfo = XLSX.utils.json_to_sheet(vInfoRows);
  const wsSnapshot = XLSX.utils.json_to_sheet(vSnapshotRows);
  const wsDisk = XLSX.utils.json_to_sheet(vDiskRows);

  XLSX.utils.book_append_sheet(wb, wsInfo, 'vInfo');
  XLSX.utils.book_append_sheet(wb, wsSnapshot, 'vSnapshot');
  XLSX.utils.book_append_sheet(wb, wsDisk, 'vDisk');

  XLSX.writeFile(wb, 'RVTools_Enterprise_Cluster_Sample.xlsx');
}
