/**
 * Enterprise VMware Storage Policy & Usable Capacity Sizing Engine
 * Supports vSAN RAID/FTT policies, slack factors, and external SAN (NFS) capacity tiers.
 * ZERO COSTING: Exclusively technical capacity, parity, and node density calculations.
 */

export type StoragePolicyId = 'raid1_ftt1' | 'raid5_ftt1' | 'raid6_ftt2';

export interface StoragePolicyDefinition {
  id: StoragePolicyId;
  name: string;
  shortLabel: string;
  overheadMultiplier: number;
  parityEfficiencyPercent: number; // e.g. 50% for RAID 1, 75% for RAID 5, 66.7% for RAID 6
  minHosts: number;
  faultTolerance: string;
  description: string;
  technicalTradeoff: string;
}

export const ENTERPRISE_STORAGE_POLICIES: Record<StoragePolicyId, StoragePolicyDefinition> = {
  raid1_ftt1: {
    id: 'raid1_ftt1',
    name: 'RAID-1 (Mirroring) - FTT=1',
    shortLabel: 'RAID 1 (2x Overhead)',
    overheadMultiplier: 2.0, // 2x raw capacity overhead factor
    parityEfficiencyPercent: 50,
    minHosts: 3,
    faultTolerance: '1 Host Failure',
    description: 'Classic 2-way host mirroring. Highest random write IOPS efficiency with 100% capacity overhead.',
    technicalTradeoff: 'Fastest commit latency; requires 200 GB raw for every 100 GB usable data.'
  },
  raid5_ftt1: {
    id: 'raid5_ftt1',
    name: 'RAID-5 (Erasure Coding) - FTT=1',
    shortLabel: 'RAID 5 (~1.33x Overhead)',
    overheadMultiplier: 1.33333333, // ~1.33x overhead
    parityEfficiencyPercent: 75,
    minHosts: 4,
    faultTolerance: '1 Host Failure',
    description: '3+1 parity erasure coding stripe across 4+ nodes. Balances enterprise capacity savings with resilience.',
    technicalTradeoff: 'Saves 33% raw capacity vs RAID-1; small CPU parity calculation overhead during write spikes.'
  },
  raid6_ftt2: {
    id: 'raid6_ftt2',
    name: 'RAID-6 (Erasure Coding) - FTT=2',
    shortLabel: 'RAID 6 (~1.50x Overhead)',
    overheadMultiplier: 1.5, // ~1.50x overhead
    parityEfficiencyPercent: 66.7,
    minHosts: 6,
    faultTolerance: '2 Simultaneous Host Failures',
    description: '4+2 dual parity erasure coding stripe across 6+ nodes. Maximum resilience for tier-0 production.',
    technicalTradeoff: 'Tolerates 2 concurrent host crashes; requires minimum 6 hosts in the target cluster.'
  }
};

export interface StorageSizingInput {
  totalUsedStorageTB: number;
  totalProvisionedStorageTB: number;
  vsanPercentage: number; // 0 to 100% (Remainder goes to External Storage)
  storagePolicyId: StoragePolicyId;
  slackFactorPercent: number; // typically 20% to 30%, default 25%
  nodeRawStorageTB: number;
}

export interface StorageSizingResult {
  policy: StoragePolicyDefinition;
  totalUsedStorageTB: number;
  totalProvisionedStorageTB: number;
  vsanPercentage: number;
  externalPercentage: number;

  // vSAN Capacity Breakdown
  vsanUsedDataTB: number;
  vsanPolicyOverheadTB: number;
  vsanNetDataAndParityTB: number;
  vsanSlackTB: number;
  vsanRawRequiredTB: number;
  vsanUsablePerNodeTB: number;
  vsanStorageNodesRequired: number;

  // External SAN (NFS) Breakdown (e.g. ANF, FSx ONTAP, GCNV)
  externalUsedStorageTB: number;
  externalProvisionedTB: number;
  externalSlackTB: number;

  // Global Combined Usable & Raw Footprint
  totalRawStorageRequiredTB: number;
  totalUsableCapacityDeliveredTB: number;
  storageEfficiencyRatio: number;
}

/**
 * Calculates net usable storage, parity overhead, vSAN slack factor, and required node footprint.
 */
export function calculateStorageCapacity(input: StorageSizingInput): StorageSizingResult {
  const policy = ENTERPRISE_STORAGE_POLICIES[input.storagePolicyId] || ENTERPRISE_STORAGE_POLICIES.raid1_ftt1;
  const clampedVsanPercent = Math.max(0, Math.min(100, input.vsanPercentage));
  const externalPercent = 100 - clampedVsanPercent;
  const slackPercent = Math.max(10, Math.min(40, input.slackFactorPercent || 25));

  // Partition used storage between vSAN and External SAN
  const vsanUsedDataTB = Math.round(input.totalUsedStorageTB * (clampedVsanPercent / 100) * 100) / 100;
  const externalUsedStorageTB = Math.round(input.totalUsedStorageTB * (externalPercent / 100) * 100) / 100;

  // vSAN Math:
  // Parity raw data = UsedData * policy.overheadMultiplier
  const vsanNetDataAndParityTB = Math.round(vsanUsedDataTB * policy.overheadMultiplier * 100) / 100;
  const vsanPolicyOverheadTB = Math.round((vsanNetDataAndParityTB - vsanUsedDataTB) * 100) / 100;

  // vSAN Slack Factor calculation:
  // Raw Required = NetDataAndParity / (1 - slackPercent / 100)
  const vsanRawRequiredTB =
    clampedVsanPercent > 0
      ? Math.round((vsanNetDataAndParityTB / (1 - slackPercent / 100)) * 100) / 100
      : 0;
  const vsanSlackTB = Math.round((vsanRawRequiredTB - vsanNetDataAndParityTB) * 100) / 100;

  // Usable capacity delivered per node under this policy and slack factor:
  const rawPerNode = Math.max(1, input.nodeRawStorageTB);
  const vsanUsablePerNodeTB =
    Math.round(((rawPerNode * (1 - slackPercent / 100)) / policy.overheadMultiplier) * 10) / 10;

  // Minimum nodes strictly driven by vSAN raw storage requirement:
  const vsanStorageNodesRequired =
    clampedVsanPercent > 0
      ? Math.max(policy.minHosts, Math.ceil(vsanRawRequiredTB / rawPerNode))
      : 0;

  // External SAN (NFS Datastores) Sizing:
  // Decoupled storage does not consume host disks. Includes 15% operational buffer.
  const externalSlackTB = Math.round(externalUsedStorageTB * 0.15 * 100) / 100;
  const externalProvisionedTB = Math.round((externalUsedStorageTB + externalSlackTB) * 100) / 100;

  // Global totals
  const totalRawStorageRequiredTB = Math.round((vsanRawRequiredTB + externalProvisionedTB) * 100) / 100;
  const totalUsableCapacityDeliveredTB = Math.round((vsanUsedDataTB + externalUsedStorageTB) * 100) / 100;
  const storageEfficiencyRatio =
    totalUsableCapacityDeliveredTB > 0
      ? Math.round((totalRawStorageRequiredTB / totalUsableCapacityDeliveredTB) * 100) / 100
      : 1;

  return {
    policy,
    totalUsedStorageTB: input.totalUsedStorageTB,
    totalProvisionedStorageTB: input.totalProvisionedStorageTB,
    vsanPercentage: clampedVsanPercent,
    externalPercentage: externalPercent,
    vsanUsedDataTB,
    vsanPolicyOverheadTB,
    vsanNetDataAndParityTB,
    vsanSlackTB,
    vsanRawRequiredTB,
    vsanUsablePerNodeTB,
    vsanStorageNodesRequired,
    externalUsedStorageTB,
    externalProvisionedTB,
    externalSlackTB,
    totalRawStorageRequiredTB,
    totalUsableCapacityDeliveredTB,
    storageEfficiencyRatio
  };
}
