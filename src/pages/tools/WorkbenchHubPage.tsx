import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, FileSpreadsheet, ShieldAlert, CpuIcon, Layers, HardDrive, ArrowRight, CheckCircle2, ExternalLink, FolderGit2, Sparkles, Download, Network } from 'lucide-react';
import { GOOGLE_DRIVE_CONFIG } from '../../data/mediaAssets';

export const WorkbenchHubPage: React.FC = () => {
  const tools = [
    {
      id: 'sizing',
      path: '/tools/sizing',
      icon: Cpu,
      title: 'Multi-Cloud Node & Storage Sizing Estimator',
      subtitle: 'Decoupled Storage & Usable Policy Optimizer',
      badge: 'Compute & Storage',
      accentColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20',
      description: 'Model real-world bare-metal node requirements across Azure AVS (AV36P/AV64), AWS VMC (i3en/i4i), and Google Cloud GCVE (ve1/ve2). Calculate node reduction gains when offloading data to external NFS storage (ANF / Amazon FSx ONTAP).',
      capabilities: [
        'Dynamic vSAN node sprawl vs. decoupled storage comparison',
        'vCPU overcommit ratios (1:1 to 4:1) & RAM buffers',
        'Storage policy modeling (RAID 1, RAID 5, RAID 6) with slack factors',
        'Export sizing specifications into Blueprint Generator'
      ]
    },
    {
      id: 'rvtools-analyzer',
      path: '/tools/rvtools-analyzer',
      icon: FileSpreadsheet,
      title: 'RVTools Ingestion & Migration Readiness Engine',
      subtitle: 'Client-Side Excel Parser & HCX Path Classifier',
      badge: 'Workload Discovery',
      accentColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20',
      description: 'Drag and drop standard VMware RVTools .xlsx export files directly in your browser. Generates an instant Migration Readiness Score and maps candidate VMs to HCX Bulk, RAV (Live vMotion), or Cold migration.',
      capabilities: [
        'Zero-server client-side privacy: data never leaves the browser',
        'Identifies stale snapshots, obsolete VMware Tools, and large disks',
        'HCX migration wave grouping & scheduling classification',
        'One-click sample enterprise cluster loader & demo export'
      ]
    },
    {
      id: 'nutanix-nc2-assessment',
      path: '/tools/nutanix-nc2-assessment',
      icon: Cpu,
      title: 'Nutanix NC2 on Azure Migration Assessment Engine',
      subtitle: 'Dedicated AHV Compatibility, Move Pipeline & Azure Node Sizing',
      badge: 'Dedicated NC2 Assessment',
      accentColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/30',
      description: 'Dedicated assessment tool for transitioning enterprise VMware vSphere SDDC workloads to Nutanix Cloud Clusters (NC2) on Microsoft Azure bare-metal nodes (AN36, AN36P, AN64, AN100). Evaluates AHV VirtIO drivers, controller translation, and Distributed Storage Fabric (DSF) RF2/RF3 usable capacity.',
      capabilities: [
        'AHV Hypervisor inspection: VirtIO drivers, SCSI controllers, legacy E1000 vNICs, and HW versions',
        'Nutanix NC2 on Azure bare-metal node (AN36, AN36P, AN64, AN100) cluster sizing engine',
        'Distributed Storage Fabric (DSF) RF2/RF3 usable storage calculator with dedup & compression',
        'Nutanix Move wave sequencing, cutover windows, and Flow Virtual Network subnet mapping'
      ]
    },
    {
      id: 'aria-networks',
      path: '/tools/aria-networks',
      icon: Network,
      title: 'Aria Operations for Networks (vRNI) Data Engine',
      subtitle: 'Flow Discovery, Application Tiers & NSX DFW Matrix',
      badge: 'Flow Analytics & Security',
      accentColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/30',
      description: 'Eliminate migration blind spots through IPFIX flow capture. Map multi-tier application dependencies (Web, App, DB), generate NSX Distributed Firewall zero-trust rules, and export color-coded wave execution spreadsheets.',
      capabilities: [
        'Dual ingestion: Embedded 3-tier sample data or manual JSON/CSV upload',
        'Interactive application topology maps & East-West latency matrix',
        'Automated NSX Distributed Firewall (DFW) zero-trust recommendations',
        'Color-coded multi-tab Excel export & Wave Planner synchronization'
      ]
    },
    {
      id: 'dr-planner',
      path: '/tools/dr-planner',
      icon: ShieldAlert,
      title: 'Disaster Recovery RPO/RTO & WAN Replication Calculator',
      subtitle: 'vSphere Replication & SRM Protection Group Sizing',
      badge: 'Disaster Recovery',
      accentColor: 'border-rose-500/40 text-rose-400 bg-rose-950/20',
      description: 'Quantify WAN bandwidth requirements for vSphere Replication delta sync across 15-min to 24-hr RPO windows. Model SRM protection groups, failover bubble network configurations, and recovery timelines.',
      capabilities: [
        'WAN throughput calculator accounting for deduplication & compression',
        'Initial baseline seeding vs steady-state delta sync modeling',
        'SRM test failover non-disruptive bubble network designer',
        'Detailed RTO breakdown for tiered recovery sequencing'
      ]
    },
    {
      id: 'design-generator',
      path: '/tools/design-generator',
      icon: Layers,
      title: 'Automated Hybrid Blueprint Generator',
      subtitle: 'Dynamic BOM Deliverable & Architecture Exporter',
      badge: 'Architecture Engine',
      accentColor: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/20',
      description: 'Synthesize sizing inputs or imported RVTools assessments into a verified bill of materials (BOM), visual multi-tier topology cards, and advisory briefing dossiers. Directly connected to your dedicated Google Drive workspace.',
      capabilities: [
        'Dual inputs: Automated RVTools inventory or manual parameter forms',
        'Generates hardware BOM, networking interconnects, and license mapping',
        'One-click PDF/JSON export linking to Google Drive and advisory briefing',
        'Enterprise architecture standards tailored to AVS, GCVE, and VMC'
      ]
    }
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs font-mono text-cyan-300">
          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          <span>ENTERPRISE ENGINEERING WORKBENCH</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
          Interactive Cloud Engineering Tools
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          Production-calibrated tools designed for enterprise cloud architects. Size bare-metal clusters, assess migration readiness from real RVTools spreadsheets, compute DR bandwidth windows, and generate validated architectural blueprints.
        </p>
      </div>

      {/* Google Drive Workspace Banner */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-cyan-500/30 shadow-lg backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shrink-0">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Dedicated Google Drive Cloud Storage</h2>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                Connected
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              All architectural blueprints, exported migration reports, and media deliverables are synchronized with your dedicated Google Drive workspace.
            </p>
            <div className="text-xs font-mono text-slate-500 mt-2 flex items-center gap-2">
              <span>Folder ID:</span>
              <span className="text-cyan-300 select-all">{GOOGLE_DRIVE_CONFIG.folderId}</span>
            </div>
          </div>
        </div>
        <a
          href={GOOGLE_DRIVE_CONFIG.folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all hover:scale-[1.02] shrink-0"
        >
          <span>Open Cloud Drive Folder</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* 4 Core Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {tools.map(tool => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              className="flex flex-col justify-between p-8 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all duration-300 group shadow-md"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg border ${tool.accentColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono text-slate-400 border border-slate-800 rounded px-2.5 py-1">
                    {tool.badge}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {tool.title}
                  </h3>
                  <div className="text-xs font-mono text-cyan-300/80">
                    {tool.subtitle}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed pt-2">
                    {tool.description}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Core Capabilities:
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {tool.capabilities.map((cap, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-800/80 mt-8">
                <Link
                  to={tool.path}
                  className="inline-flex items-center justify-between w-full px-5 py-3 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 font-semibold text-sm transition-all duration-200 group-hover:shadow-lg"
                >
                  <span>Launch Tool</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
