/**
 * Enterprise Migration Wave Planner & Capacity Sizing Engine
 * Supports vCPU Overcommit Ratios (1:1, 2:1, 3:1, 4:1) and RAM Buffers (10%, 15%, 20%).
 * Groups workloads by dependencies, storage volume, and HCX migration method (RAV vs Bulk vs Cold).
 * ZERO COSTING: Exclusively technical compute, memory, WAN replication time, and execution sequencing.
 */

import { IngestedVM } from '../services/workloadAnalyzer';

export type VCpuOvercommitRatio = 1 | 2 | 3 | 4;
export type RamOverheadBuffer = 10 | 15 | 20;

export interface WavePlannerConfig {
  vCpuOvercommit: VCpuOvercommitRatio; // 1:1, 2:1, 3:1, 4:1
  ramBufferPercent: RamOverheadBuffer; // 10%, 15%, 20%
  migrationWanMbps: number; // e.g. 500, 1000, 2000, 5000, 10000 Mbps
  dataCompressionRatio: number; // e.g. 0.35 (35% after HCX dedupe/compression)
  dailyChurnPercent: number; // e.g. 15% daily change rate
  concurrentMigrationsPerAppliance: number; // default 8 concurrent syncs per HCX-IX
}

export interface MigrationWaveSummary {
  waveIndex: number;
  waveCode: string;
  title: string;
  description: string;
  targetRiskTier: 'Low' | 'Medium' | 'High' | 'Critical Blocker Remediation';
  cutoverWindow: string;

  // Workload Inventory
  workloadCount: number;
  workloads: IngestedVM[];

  // Technical Compute & Memory Sizing
  rawVCPUs: number;
  effectiveCoresRequired: number; // rawVCPUs / vCpuOvercommit
  rawRAMGiB: number;
  bufferedRAMGiB: number; // rawRAMGiB * (1 + ramBufferPercent / 100)

  // Storage Partitioning
  totalStorageTiB: number;
  vsanStorageTiB: number;
  externalStorageTiB: number;

  // HCX Method Breakdown
  ravCount: number; // Replication Assisted vMotion (Zero downtime)
  bulkCount: number; // HCX Bulk Migration (Scheduled cutover)
  coldCount: number; // HCX Cold Migration
  rearchitectCount: number; // Blockers requiring refactoring

  // Data Sync & Replication Timeline
  initialSeedDataGB: number;
  compressedTransferGB: number;
  initialSyncHours: number;
  deltaSyncHours: number;
  recommendedHcxAppliances: number;

  // Blocker Warnings
  blockerCount: number;
  hasCriticalBlockers: boolean;
}

export interface WavePlanAnalysisResult {
  config: WavePlannerConfig;
  totalInScopeVMs: number;
  totalRawVCPUs: number;
  totalEffectiveCores: number;
  totalRawRAMGiB: number;
  totalBufferedRAMGiB: number;
  totalStorageTiB: number;
  totalInitialSyncHours: number;
  totalHcxAppliancesRequired: number;
  waves: MigrationWaveSummary[];
}

/**
 * Calculates end-to-end wave planning metrics for ingested workloads.
 */
export function calculateMigrationWaves(
  workloads: IngestedVM[],
  config: WavePlannerConfig
): WavePlanAnalysisResult {
  const inScope = workloads.filter(w => w.scope === 'In Scope');

  const waveDefinitions = [
    {
      index: 0,
      code: 'WAVE-0',
      title: 'Wave 0: Management & Core Shared Services',
      description: 'Domain Controllers, DNS, IPAM, NTP, Monitoring, and Enterprise Security appliances.',
      targetRiskTier: 'Medium' as const,
      cutoverWindow: 'Zero downtime (Continuous RAV live migration)'
    },
    {
      index: 1,
      code: 'WAVE-1',
      title: 'Wave 1: Non-Production & Staging Environments',
      description: 'Development, QA, Test, and Staging tiers. Validates L2 extension routing and verifies app performance.',
      targetRiskTier: 'Low' as const,
      cutoverWindow: '4-Hour Weekend Batch Window'
    },
    {
      index: 2,
      code: 'WAVE-2',
      title: 'Wave 2: Production Web & Middleware Applications',
      description: 'Stateless web frontends, API gateways, application middleware, and load-balanced tiers.',
      targetRiskTier: 'Medium' as const,
      cutoverWindow: '2-Hour Staggered Evening Cutover'
    },
    {
      index: 3,
      code: 'WAVE-3',
      title: 'Wave 3: Mission-Critical Databases & Backend Systems',
      description: 'High-transaction SQL Server, Oracle, SAP, multi-terabyte data platforms, and persistent ERP systems.',
      targetRiskTier: 'High' as const,
      cutoverWindow: '30-Minute High-Priority Transaction Maintenance Window'
    },
    {
      index: 4,
      code: 'WAVE-REMEDIATION',
      title: 'Remediation Wave: Complex Architectures & Blockers',
      description: 'Workloads with RDM Physical disks, Multi-Writer flags, shared SCSI bus clusters, or obsolete vHardware.',
      targetRiskTier: 'Critical Blocker Remediation' as const,
      cutoverWindow: 'Scheduled Re-architecture & Cold Re-host Window'
    }
  ];

  const waveSummaries: MigrationWaveSummary[] = waveDefinitions.map(def => {
    // Partition workloads into waves
    const waveVms = inScope.filter(vm => {
      // If VM has critical blockers and wave is remediation wave
      if (def.index === 4) {
        return vm.blockers.some(b => b.severity === 'CRITICAL');
      }
      // If VM has critical blockers, exclude from normal waves so it sits in remediation
      if (vm.blockers.some(b => b.severity === 'CRITICAL')) {
        return false;
      }
      return vm.assignedWave === def.index;
    });

    const rawVCPUs = waveVms.reduce((a, v) => a + v.cpus, 0);
    const effectiveCoresRequired = Math.ceil(rawVCPUs / config.vCpuOvercommit);
    const rawRAMGiB = Math.round(waveVms.reduce((a, v) => a + v.memoryGiB, 0));
    const bufferedRAMGiB = Math.round(rawRAMGiB * (1 + config.ramBufferPercent / 100));

    const totalStorageTiB = Math.round(waveVms.reduce((a, v) => a + v.storageTiB, 0) * 10) / 10;
    const vsanStorageTiB = Math.round(
      waveVms.filter(v => v.targetStorageTier === 'Local vSAN').reduce((a, v) => a + v.storageTiB, 0) * 10
    ) / 10;
    const externalStorageTiB = Math.round(
      waveVms.filter(v => v.targetStorageTier === 'External NFS').reduce((a, v) => a + v.storageTiB, 0) * 10
    ) / 10;

    const ravCount = waveVms.filter(v => v.recommendedMethod === 'HCX RAV (Live vMotion)').length;
    const bulkCount = waveVms.filter(v => v.recommendedMethod === 'HCX Bulk Migration').length;
    const coldCount = waveVms.filter(v => v.recommendedMethod === 'HCX Cold Migration').length;
    const rearchitectCount = waveVms.filter(v => v.recommendedMethod === 'Re-architect Required').length;

    // Replication Bandwidth & Seeding Math
    // Initial Seed: Total storage in GB * compression ratio
    const initialSeedDataGB = totalStorageTiB * 1024;
    const compressedTransferGB = initialSeedDataGB * config.dataCompressionRatio;
    const effectiveWanMbps = Math.max(50, config.migrationWanMbps * 0.85); // 85% WAN utilization efficiency

    // Initial sync hours = (compressedTransferGB * 8 * 1024 Mb) / (effectiveWanMbps * 3600 seconds)
    const initialSyncSeconds = (compressedTransferGB * 8 * 1024) / effectiveWanMbps;
    const initialSyncHours = Math.round((initialSyncSeconds / 3600) * 10) / 10;

    // Delta sync hours = daily churn (e.g. 15%) * compression
    const deltaSyncDataGB = initialSeedDataGB * (config.dailyChurnPercent / 100) * config.dataCompressionRatio;
    const deltaSyncSeconds = (deltaSyncDataGB * 8 * 1024) / effectiveWanMbps;
    const deltaSyncHours = Math.round((deltaSyncSeconds / 3600) * 10) / 10;

    // Appliance Fleet: HCX-IX (Interconnect) handles 8-16 concurrent transfers
    const recommendedHcxAppliances = Math.max(1, Math.ceil(waveVms.length / config.concurrentMigrationsPerAppliance));

    const blockerCount = waveVms.reduce((a, v) => a + v.blockers.length, 0);
    const hasCriticalBlockers = waveVms.some(v => v.blockers.some(b => b.severity === 'CRITICAL'));

    return {
      waveIndex: def.index,
      waveCode: def.code,
      title: def.title,
      description: def.description,
      targetRiskTier: def.targetRiskTier,
      cutoverWindow: def.cutoverWindow,
      workloadCount: waveVms.length,
      workloads: waveVms,
      rawVCPUs,
      effectiveCoresRequired,
      rawRAMGiB,
      bufferedRAMGiB,
      totalStorageTiB,
      vsanStorageTiB,
      externalStorageTiB,
      ravCount,
      bulkCount,
      coldCount,
      rearchitectCount,
      initialSeedDataGB: Math.round(initialSeedDataGB),
      compressedTransferGB: Math.round(compressedTransferGB),
      initialSyncHours,
      deltaSyncHours,
      recommendedHcxAppliances,
      blockerCount,
      hasCriticalBlockers
    };
  });

  // Calculate Global Plan Totals
  const totalInScopeVMs = inScope.length;
  const totalRawVCPUs = inScope.reduce((a, v) => a + v.cpus, 0);
  const totalEffectiveCores = Math.ceil(totalRawVCPUs / config.vCpuOvercommit);
  const totalRawRAMGiB = Math.round(inScope.reduce((a, v) => a + v.memoryGiB, 0));
  const totalBufferedRAMGiB = Math.round(totalRawRAMGiB * (1 + config.ramBufferPercent / 100));
  const totalStorageTiB = Math.round(inScope.reduce((a, v) => a + v.storageTiB, 0) * 10) / 10;
  const totalInitialSyncHours = Math.round(waveSummaries.reduce((a, w) => a + w.initialSyncHours, 0) * 10) / 10;
  const totalHcxAppliancesRequired = Math.max(...waveSummaries.map(w => w.recommendedHcxAppliances), 1);

  return {
    config,
    totalInScopeVMs,
    totalRawVCPUs,
    totalEffectiveCores,
    totalRawRAMGiB,
    totalBufferedRAMGiB,
    totalStorageTiB,
    totalInitialSyncHours,
    totalHcxAppliancesRequired,
    waves: waveSummaries
  };
}
