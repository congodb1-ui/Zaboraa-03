# Precision Enterprise Architecture Workbench: Advanced RVTools Parsing, Base-2 Sizing & Multi-Engine DR

Refine and implement the core data parsing, mathematical calculation engines, scoping rules, storage recommendation algorithms, and cross-tool state transfer across all four interactive modules in the Zaboraa Technologies engineering suite.

***

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural directions below incorporate the confirmed choices:
> - **Target Cloud Ecosystem & Node SKU Default**: Pre-selected to **Azure VMware Solution (AVS)** with **AV36P SKU** (36 Cores, 576 GiB RAM, 11.5 TiB raw vSAN per node), with instant switching to all official SKUs across AVS (AV36, AV36P, AV48, AV52, AV64), Google Cloud GCVE (ve1-standard-72, ve2-standard-128), and AWS VMC (i3en.metal, i4i.metal, m7i.metal-24xl).
> - **Management Infrastructure Auto-Detection**: Workloads mapped to management port groups or subnets (`VLAN 100`, `Management`, `vCenter`, `ESXi-Mgmt`, `Infrastructure-Net`) are automatically classified with an amber badge and defaulted to **`Out of Scope`** so local appliances do not distort target cloud cluster node counts.
> - **External Storage Recommendation Engine**: Workloads with provisioned capacity $\ge 2\text{ TiB}$, high-capacity datastores, or archive roles are automatically recommended for decoupled cloud storage (**Azure NetApp Files ANF**, **Amazon FSx ONTAP**, or **Google Cloud NetApp Volumes GCNV**), with granular inline overrides per VM row.
> - **Strict Base-2 Arithmetic**: Parse all RVTools values with strict binary arithmetic:
>   - $\text{RAM (GiB)} = \text{MiB} / 1024$
>   - $\text{Storage (TiB)} = \text{MiB} / (1024 \times 1024)$
> - **Cross-Tool State Transfer**: Full synchronization between `/tools/rvtools-analyzer`, `/tools/sizing`, `/tools/dr-planner`, and `/tools/design-generator`.

***

## 1. Overview & Core Concept

### Module 1: RVTools Ingestion, Health Analysis & Wave Planner (`/tools/rvtools-analyzer`)
- **Accurate Ingestion & Cross-Sheet Joins**:
  - Joins `vInfo` and `vNetwork` sheets on composite keys (`VM Name` + `MAC Address` / `NIC`) to retrieve real numerical VLAN IDs, eliminating blank or corrupt placeholder values.
  - Normalizes raw VMware Tools status strings into human-readable badges: `Healthy (Running)`, `Outdated (Update Prior to Cutover)`, `Missing / Stopped (Critical Migration Risk)`, and `Linux Open-VM-Tools (Verified)`.
  - Analyzes Thin vs. Thick provisioned disks and models post-migration vSAN/NFS capacity growth.
  - Flags active snapshots $>24\text{ hours}$ or $>20\text{ GB}$ with high-priority red warning badges (`"Commit Snapshots Before Migration"`).
- **Scope Management**:
  - Adds a scope selector (`In Scope`, `Out of Scope`, `To Be Decided`) per workload.
  - Dynamically recalculates total vCPU, RAM, storage, and required cloud node counts based strictly on `In Scope` workloads.
- **Hyperscaler External Storage Recommendation & Decoupled Savings**:
  - Auto-recommends External NFS (ANF, FSx ONTAP, GCNV) for workloads $\ge 2\text{ TiB}$.
  - Allows inline user overrides (`Local vSAN` vs. `External NFS`).
  - Displays real-time node count reductions and run-rate savings gained by offloading capacity.
- **Network Extension (Stretched L2) Decision Matrix & Customer Environments**:
  - Discovers unique Port Groups and VLANs from `vNetwork`.
  - Adds an `Extend Network via HCX NE?` toggle (`Yes` / `No`) per VLAN, automatically sizing HCX NE appliance fleets (1 NE pair per 8 extended VLANs).
  - Classifies workloads into customer environments (`Dev`, `Staging`, `Pre-Prod`, `Prod`, `DR`, `UAT`, `QA`) with inline overrides.
- **Interactive 4-Wave Sequence Planner**:
  - Sequenced into Wave 0 (Shared Services/Infra), Wave 1 (Dev/Staging), Wave 2 (Prod Web/App), and Wave 3 (Mission-Critical Databases).
  - Features selectable WAN bandwidth slider (100 Mbps, 200 Mbps, 500 Mbps, 1 Gbps, 2 Gbps, 5 Gbps, 10 Gbps) projecting delta sync durations and cutover windows.

### Module 2: Disaster Recovery RPO/RTO & Replication Calculator (`/tools/dr-planner`)
- **Multi-Engine Comparison**: Switch between **VMware SRM + vSphere Replication** (5m–24h), **HPE Zerto CDP** (5s–15m), **JetStream DR for Cloud Object Storage** (Blob/GCS object replication with zero idle compute), and **Veeam Recovery Orchestrator**.
- **Deployment Strategy Cost Sizing**: Real-time TCO modeling across **Hot Standby**, **Pilot Light** (3-node minimum, auto-expanding), and **Cold Storage / On-Demand DR**, showing up to 85% run-rate savings.
- **CDP Journal Retention & Stretched L2 RTO Impact**:
  - Models journal storage overhead across 1, 3, 7, and 14-day retention periods.
  - Evaluates failover networking: **NSX-T Stretched L2** (deducts 12 minutes from RTO) vs. **Routed Tier-1** (orchestrated IP re-addressing).

### Module 3: Multi-Cloud Node Sizing Estimator (`/tools/sizing`)
- Comprehensive node selection across all official SKUs for AVS, GCVE, and VMC.
- Live decoupled storage sizing against ANF, FSx ONTAP, and GCNV.

### Module 4: Cross-Tool Handoff & Multi-Format Reporting
- **Unified State Pass-Through**: Dedicated handoff buttons save complete assessment state to `localStorage` and hydrate the 4K Architecture Diagram Generator (`/tools/design-generator`).
- **Multi-Tab Excel Workbook (`.xlsx`)**: Generates 4 dedicated sheets (`Executive Summary`, `Workload Assessment`, `Wave Schedule`, `Stretched VLANs`).
- **Executive PDF Dossier**: Print-ready styled HTML view triggering browser PDF export.
- **Google Drive Workspace Sync**: 1-click shortcut to shared folder (`1sFG8NLUcajo8DuCs7jq9ChYK-rksx7Io`).

***

## 2. User Experience & Visual Design

### Key User Flows
1. **Workload Ingestion & Scoping**:
   - Ingests `RVTools.xlsx` (or loads sample dataset) → management infrastructure VMs (`CORP-DC-AD01`, `MON-SPLUNK`) are auto-flagged in amber and set to `Out of Scope` → user adjusts scope or overrides individual VMs → summary cards update in real time based only on `In Scope` workloads.
2. **Cloud Node SKU Sizing & Storage Offload**:
   - Selects target cloud (e.g. *Azure VMware Solution*) and SKU (*AV36P*) → reviews required node count → inspects auto-recommended storage tiers (e.g., *Oracle RAC* recommended for *External NFS - ANF*) → views live node reduction and monthly savings.
3. **Stretched L2 & Wave Sequencing**:
   - Reviews discovered VLANs → toggles HCX NE extension on key port groups → inspects required HCX NE pairs → navigates to Wave Planner tab → adjusts WAN slider (e.g. to 5 Gbps) to project delta sync transfer hours.
4. **Handoff to 4K Blueprint Generator**:
   - Clicks `"Send Assessment Data to 4K Blueprint Generator"` → navigates to `/tools/design-generator` with pre-filled metadata, node count, SKU, VLAN mapping, and storage configuration.

### Visual Styling & Tabular Discipline
- Strictly enforces `font-mono tabular-nums` for all IP addresses, VLAN IDs, node counts, storage capacities, and monetary values.
- Clean unboxed metadata with `·` separators; no pill badge clutter.
- Responsive layout designed for a baseline 1440px desktop presence.

***

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Scoped Math vs. Raw Total Math**:
  - *Chosen Approach*: Only workloads marked `In Scope` contribute to the compute, memory, and storage dimensions used in cloud node sizing calculations.
  - *Why*: Eliminates local management appliances, retired VMs, and out-of-scope legacy systems from inflating expensive hyperscaler cluster sizing.
- **Decision 2: Base-2 Binary Units (GiB / TiB)**:
  - *Chosen Approach*: Enforce strict 1024 multipliers (`MiB / 1024` for GiB, `MiB / 1048576` for TiB) across all formulas.
  - *Why*: Avoids the standard 7–10% capacity under-sizing error caused by mixing decimal (1000) and binary (1024) storage math.
- **Decision 3: Composite Key Joins for VLAN Discovery**:
  - *Chosen Approach*: Correlate `vInfo` with `vNetwork` on VM name and NIC name/MAC address, with regex fallback extracting numerical VLAN IDs from port group strings.
  - *Why*: RVTools exports frequently separate network configurations into `vNetwork`, leaving `vInfo` without VLAN numbers.

***

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RVTools Analyzer Page                           │
│  - Multi-sheet join: vInfo + vNetwork (VM Name + MAC/NIC)             │
│  - Strict Base-2 math: GiB = MiB/1024, TiB = MiB/(1024*1024)           │
│  - Granular Scoping: In Scope / Out of Scope / TBD                     │
│  - Management detection: VLAN 100 / ESXi-Mgmt auto-excluded            │
│  - Cloud SKU Selector: AVS (AV36P), GCVE (ve1), VMC (i4i)              │
│  - Storage Engine: >=2 TiB auto-recommended to External NFS            │
│  - Stretched L2: Port Group table + HCX NE pair sizing                 │
│  - 4-Wave Planner: Wave 0-3 with WAN throughput slider (100M-10G)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                       (Cross-Tool State Bridge)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Design Generator Page (4K Engine)                   │
│  - Hydrated from RVTools: Customer, In-Scope VMs, SKUs, VLANs, BOM     │
│  - Dual-Mode Vector Viewport (SVG + 3840x2160 Canvas Export)           │
│  - 4-Tab Excel Export (.xlsx) & Executive PDF Dossier                  │
│  - 1-Click Google Drive Sync (1sFG8NLUcajo8DuCs7jq9ChYK...)            │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Implementation Steps

1. **`src/data/sampleRvToolsData.ts`**:
   - Update `ParsedVMRecord` interface:
     - `scope`: `'In Scope'` | `'Out of Scope'` | `'To Be Decided'`
     - `isManagementInfra`: boolean
     - `targetStorageTier`: `'Local vSAN'` | `'External NFS'`
     - `environment`: `'Dev'` | `'Staging'` | `'Pre-Prod'` | `'Prod'` | `'DR'` | `'UAT'` | `'QA'`
     - `vlanId`: number
     - `diskSizeGiB`: number
     - `storageTiB`: number
   - Update sample records with realistic Base-2 values, management auto-detection, and scope flags.
   - Update `exportMultiTabRvToolsAssessment` to output exact Base-2 metrics, scoping choices, and storage tiers.

2. **`src/pages/tools/RVToolsAnalyzerPage.tsx`**:
   - Implement composite key cross-sheet parser (`vInfo` + `vNetwork` + `vDisk` + `vSnapshot` + `vTools`).
   - Implement Management Network auto-detection (`VLAN 100`, `mgmt`, `vcenter`, `esxi`) auto-setting scope to `Out of Scope` with amber badge.
   - Implement Target Cloud Platform & Node SKU Selector (AVS AV36/AV36P/AV48/AV52/AV64, GCVE ve1/ve2, VMC i3en/i4i/m7i) with live recalculation.
   - Implement External NFS Storage Recommendation ($\ge 2\text{ TiB}$) with user override dropdown per row.
   - Implement Stretched L2 Decision Matrix with `Extend Network via HCX NE?` toggle and HCX NE pair sizing (1 pair per 8 extended VLANs).
   - Implement 4-Wave Migration Planner with WAN bandwidth slider (100 Mbps to 10 Gbps).
   - Add `"Send Assessment Data to 4K Blueprint Generator"` state pass-through bridge.

3. **`src/pages/tools/DRPlannerPage.tsx`**:
   - Multi-engine selector (SRM, Zerto, JetStream, Veeam) with dynamic RPO boundaries.
   - Deployment strategies (Hot Standby, Pilot Light, Cold Storage) with monthly and annual TCO savings.
   - CDP journal retention overhead and failover networking (NSX-T Stretched L2 saving 12 min RTO).

4. **`src/pages/tools/NodeSizingToolPage.tsx`**:
   - Support explicit node selection across all hyperscalers (AVS, VMC, GCVE).
   - Base-2 calculations for decoupled storage offload.

5. **`src/pages/tools/DesignGeneratorPage.tsx`**:
   - Ensure complete state hydration from RVTools Analyzer and DR Planner.
   - Maintain 4K Canvas export, multi-tab Excel, and Google Drive cloud syncing.

6. **Verification**:
   - Run `compile_applet` and `lint_applet` (`tsc --noEmit`) to verify zero TypeScript errors.
