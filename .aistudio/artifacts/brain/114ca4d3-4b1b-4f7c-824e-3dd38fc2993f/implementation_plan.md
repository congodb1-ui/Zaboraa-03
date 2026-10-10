# Enterprise Cloud Migration Workbench & Automated 3D Isometric Architecture Engine

Implement and refine the full data ingestion, Base-2 mathematical modeling, infrastructure scoping rules, multi-engine disaster recovery forecasting, and automated 3D isometric blueprint generation across all five core modules of the Zaboraa Technologies engineering workbench.

***

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural plan integrates the confirmed user decisions:
> - **Visual Blueprint Aesthetic**: Dark enterprise blueprint palette (`#020617` / `#0F172A`) with high-contrast glowing cyan, teal, and violet neon network paths, server racks, and hyper-detailed isometric hardware annotations.
> - **AI Blueprint Generation & Resilience**: Full integration of `@google/genai` (Imagen 3: `imagen-3.0-generate-002` / `gemini-3.1-flash-lite-image`) executing via secure server-side endpoint `/api/generate-blueprint`. In offline environments or if `GEMINI_API_KEY` is not present, the system seamlessly transitions to bundled high-res 3D isometric blueprints so the user experience is never blocked.
> - **Snapshot Remediation Workflow**: High-priority risk banner with an expandable action checklist detailing step-by-step vCenter snapshot commitment procedures, locking prevention protocols, and HCX pre-flight checks.
> - **Base-2 Mathematical Discipline**: Strict binary formulas ($\text{RAM GiB} = \text{MiB}/1024$, $\text{Storage TiB} = \text{MiB}/1048576$) applied across all sizing and migration wave formulas.
> - **Scope & Management Network Isolation**: Auto-flags management port groups (`VLAN 100`, `Management`, `vCenter`, `ESXi-Mgmt`) to `Out of Scope` by default to prevent cluster over-provisioning, with inline row-level overrides.
> - **Decoupled External Storage**: Auto-recommends External NFS (`Azure NetApp Files ANF`, `Amazon FSx ONTAP`, `Google Cloud NetApp Volumes GCNV`) for workloads $\ge 2\text{ TiB}$, displaying real-time node count reductions and monthly run-rate savings.

***

## 1. Overview & Core Concept

The Zaboraa Technologies Engineering Workbench provides enterprise infrastructure architects with a zero-friction toolset for assessing on-premises VMware estates, sizing target hyperscaler nodes, calculating disaster recovery business continuity plans, and generating presentation-grade 3D isometric architecture diagrams.

### Module Breakdown
1. **Module 1: RVTools Ingestion, Health Analysis & Wave Planner (`/tools/rvtools-analyzer`)**:
   - Client-side multi-tab spreadsheet parsing (`vInfo`, `vNetwork`, `vSnapshot`, `vDisk`, `vTools`).
   - Composite key joins (`VM Name` + `MAC Address`/`NIC`) for precise numerical VLAN IDs.
   - Normalized VMware Tools health states and high-priority snapshot warning matrix with expandable remediation checklist.
   - Granular VM scoping (`In Scope`, `Out of Scope`, `To Be Decided`) dynamically controlling all cluster math.
   - Target Cloud Platform & Node SKU selector across Azure VMware Solution (AVS), AWS (VMC), and Google Cloud (GCVE).
   - Hyperscaler decoupled storage recommendation engine ($\ge 2\text{ TiB}$ offload to ANF / FSx ONTAP / GCNV).
   - Stretched L2 decision matrix with HCX Network Extension (NE) appliance fleet sizing (1 pair per 8 extended VLANs).
   - Interactive 4-Wave sequence planner with selectable WAN bandwidth slider (100 Mbps to 10 Gbps).

2. **Module 2: Disaster Recovery RPO/RTO & Replication Calculator (`/tools/dr-planner`)**:
   - Multi-engine selector: VMware SRM + vSphere Replication (baseline), HPE Zerto CDP, JetStream DR for Cloud Object Storage, and Veeam Recovery Orchestrator.
   - Target deployment strategies: Hot Standby, Pilot Light (3-node minimum), and Cold Storage / On-Demand DR.
   - Live TCO comparison showing up to 85% run-rate savings.
   - CDP journal storage overhead modeling (1, 3, 7, 14 days) and NSX-T Stretched L2 failover speedup (saving 12 min RTO).

3. **Module 3: Multi-Cloud Node & Storage Sizing Estimator (`/tools/sizing`)**:
   - Complete SKU catalog for AVS (`AV36`, `AV36P`, `AV48`, `AV52`, `AV64`), GCVE (`ve1-standard-72`, `ve2-standard-128`), and VMC (`i3en.metal`, `i4i.metal`, `m7i.metal-24xl`).
   - Live decoupled external storage modeling and monthly run-rate savings calculations.

4. **Module 4: Cross-Tool Handoff & Multi-Format Reporting**:
   - Synchronized state transfer bridge passing parsed VMs, scopes, SKUs, and network topologies into `/tools/design-generator`.
   - 4-tab Excel workbook generation (`.xlsx`), executive PDF print-ready HTML dossier, and 1-click Google Drive sync (`1sFG8NLUcajo8DuCs7jq9ChYK-rksx7Io`).

5. **Module 5: Automated 3D Isometric Blueprint Generator (`/tools/design-generator`)**:
   - "Review & Confirm Architecture Inputs" pre-flight review screen before generation.
   - Structured prompt construction engine (`buildIsometricDiagramPrompt`) incorporating verified infrastructure parameters.
   - `@google/genai` Imagen 3 integration (`imagen-3.0-generate-002`) with loading telemetry, 4K modal viewport, PNG download, and bundled high-res fallbacks.

***

## 2. User Experience & Visual Design

### Design System & Layout Rules
- **Color Scheme**: Deep dark slate canvas (`#020617` / `#090D16`), cool gray panels (`#0F172A`), with vibrant accent lines in cyan (`#06B6D4`), teal (`#14B8A6`), indigo (`#6366F1`), and emerald (`#10B981`).
- **Tabular Figures & Metrics**: Strictly enforces `font-mono tabular-nums` across all numeric columns, memory capacities, VLAN IDs, and financial forecasts.
- **Micro-Interactions**: Clean unboxed metrics with subtle dividers; smooth status pills; animated loading progress with reassuring generation milestones.

### Key User Flows

```
[RVTools Spreadsheet Ingestion] 
       │ (Multi-sheet join: vInfo + vNetwork + vSnapshot)
       ▼
[Scoped Infrastructure Review]
       │ • Management auto-set to Out of Scope
       │ • Workloads >= 2 TiB recommended for External NFS
       │ • Snapshot risk matrix with expandable action checklist
       ▼
[Cloud Sizing & Wave Sequencing]
       │ • SKU selection: AVS AV36P, GCVE, VMC
       │ • Stretched L2 toggle + HCX NE fleet sizing
       │ • WAN slider (100M-10G) calculating delta sync hours
       ▼
[Cross-Tool Handoff] ──► [DR Calculator (/tools/dr-planner)]
       │
       ▼
[3D Isometric Blueprint Generator (/tools/design-generator)]
       │ • Review & Confirm Architecture Inputs
       │ • Structured Imagen 3 prompt generation
       │ • AI image rendering + 4K interactive vector SVG view
       │ • PNG download, 4-tab Excel export, Google Drive sync
```

***

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side Gemini API Proxy with Resilient Client Fallbacks**:
  - *Chosen Approach*: Route Imagen 3 image generation requests through a server-side endpoint (`/api/generate-blueprint`) using `process.env.GEMINI_API_KEY`. If the key is unavailable or the API call experiences rate limiting, gracefully supply a bundled high-fidelity 3D isometric architecture render.
  - *Why*: Ensures zero API key exposure to client bundles while guaranteeing the architect's workflow is never interrupted.
- **Decision 2: Expandable Pre-Migration Snapshot Checklist**:
  - *Chosen Approach*: Instead of only showing red warning badges, provide an expandable risk remediation drawer detailing the root causes of snapshot stun, commit commands, and verification steps.
  - *Why*: Gives enterprise migration engineers actionable remediation steps directly during customer architecture reviews.
- **Decision 3: Real-Time Sizing Recalculation on Scoped Workloads**:
  - *Chosen Approach*: Exclude `Out of Scope` and `To Be Decided` VMs from cluster host sizing formulas, compute overcommits, and storage offloading metrics.
  - *Why*: Prevents legacy non-migrating systems or on-prem management appliances from skewing multi-million dollar cloud budgets.

***

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Zaboraa Technologies Workbench                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌───────────────────────┐             ┌────────────────────────────┐  │
│  │  RVTools Analyzer     │             │  DR Planner Tool           │  │
│  │  (/tools/rvtools-...) │             │  (/tools/dr-planner)       │  │
│  │  - Strict Base-2 math │             │  - SRM / Zerto / JetStream │  │
│  │  - Scope management   │             │  - TCO run-rate savings    │  │
│  │  - Decoupled NFS rec  │             │  - CDP journal overhead    │  │
│  │  - 4-Wave sequencer   │             │  - Stretched L2 RTO speed  │  │
│  └───────────┬───────────┘             └─────────────┬──────────────┘  │
│              │                                       │                 │
│              └───────────────────┬───────────────────┘                 │
│                                  │ (localStorage state pass-through)   │
│                                  ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  3D Isometric Blueprint Generator (/tools/design-generator)      │  │
│  │  - Review & Confirm Architecture Summary Inputs                  │  │
│  │  - Structured prompt engine: buildIsometricDiagramPrompt()       │  │
│  │  - Dual-mode viewport: Interactive SVG + 4K Canvas Export        │  │
│  │  - Imagen 3 generation modal with PNG download & Drive sync      │  │
│  └───────────────────────────────┬──────────────────────────────────┘  │
│                                  │                                     │
│                                  ▼ (POST /api/generate-blueprint)      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Node.js API Route / Vite Server Middleware                      │  │
│  │  - @google/genai SDK (GoogleGenAI with GEMINI_API_KEY)           │  │
│  │  - imagen-3.0-generate-002 / gemini-3.1-flash-lite-image         │  │
│  │  - Base64 image payload response & fallback handler              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Implementation Steps

1. **Vite Server API Middleware (`vite.config.ts` & `@google/genai`)**:
   - Add a server middleware endpoint `POST /api/generate-blueprint` that reads `process.env.GEMINI_API_KEY` or `process.env.REACT_APP_GEMINI_API_KEY`.
   - Initialize `GoogleGenAI` with `httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }`.
   - Call `ai.models.generateImages()` or `ai.models.generateContent()` with image prompt and return `{ imageBase64, prompt }`.
   - If no key is set or generation fails, provide a rich fallback response with high-resolution 3D isometric imagery.

2. **RVTools Ingestion & Health Analysis (`/tools/rvtools-analyzer`)**:
   - Add an expandable "Snapshot Remediation & Pre-Flight Risk Checklist" modal/drawer explaining snapshot consolidation, commit locking risks, and HCX pre-flight checks.
   - Refine the Target Cloud & SKU selector bar to explicitly feature cloud ecosystems and node SKU dropdowns.
   - Ensure the Decoupled Storage Engine dynamically computes node reductions and run-rate savings based strictly on in-scope VMs with `External NFS`.
   - Verify the Stretched L2 decision matrix with `Extend Network via HCX NE?` toggle sizing 1 NE pair per 8 extended VLANs.

3. **Disaster Recovery RPO/RTO Calculator (`/tools/dr-planner`)**:
   - Refine the multi-engine comparison (SRM, Zerto CDP, JetStream DR, Veeam) with dynamic RPO boundaries.
   - Verify TCO calculations for Hot Standby vs. Pilot Light vs. Cold Storage.
   - Confirm CDP journal retention sizing (1, 3, 7, 14 days) and NSX-T Stretched L2 RTO speedup (-12 mins).

4. **Multi-Cloud Node & Storage Sizing Estimator (`/tools/sizing`)**:
   - Verify the full SKU catalog (AVS AV36/AV36P/AV48/AV52/AV64, GCVE ve1/ve2, VMC i4i/i3en/m7i).
   - Ensure decoupled storage calculations and state export to Blueprint Generator.

5. **Automated 3D Isometric Blueprint Generator (`/tools/design-generator`)**:
   - Add the "Review & Confirm Architecture Inputs" screen allowing architects to inspect and customize customer name, nodes, SKUs, storage tiers, and firewalls before rendering.
   - Implement `buildIsometricDiagramPrompt()` formatting verified parameters into a structured 3D isometric diagram prompt.
   - Connect the AI generation modal with loading states, rendered image preview, 1-click PNG download, and Google Drive cloud folder link.
   - Maintain the existing interactive SVG topology and 3840×2160 (4K) Canvas export alongside the AI generated isometric view.

6. **Verification & Testing**:
   - Run `lint_applet` (`tsc --noEmit`) and `compile_applet` to ensure zero compilation or type errors.
