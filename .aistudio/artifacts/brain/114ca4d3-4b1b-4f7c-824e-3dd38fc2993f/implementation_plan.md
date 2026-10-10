# Multi-Page Enterprise Architecture Platform & Interactive Engineering Workbench

Refactor the Zaboraa Technologies application from a single-page layout into a scalable multi-page enterprise platform powered by React Router (`react-router-dom`), featuring a 4-tool Interactive Engineering Workbench, dynamic platform deep-dives, consolidated knowledge resources, and full integration with the user's dedicated Google Drive folder for data and asset storage.

***

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural directions below incorporate the confirmed choices and user-provided Google Drive integration:
> - **Google Drive Dedicated Folder Integration**:
>   - **Drive Folder**: `https://drive.google.com/drive/folders/1sFG8NLUcajo8DuCs7jq9ChYK-rksx7Io?usp=sharing` (Folder ID: `1sFG8NLUcajo8DuCs7jq9ChYK-rksx7Io`).
>   - **Cloud Media & Asset Pipeline**: Configured centralized media mapping in `src/data/mediaAssets.ts` connecting images, diagrams, videos, and PDF deliverables to this Google Drive folder.
>   - **Drive Explorer & Upload Integration**: Embedded Google Drive folder viewer & quick-access asset bridge inside the Admin Customizer and Workbench so architects can view and organize cloud files.
>   - **Local Fallback Assurance**: Built-in fallback to local assets (`/assets/images/*`) ensuring zero broken image frames even if network latency or Google Drive preview permissions fluctuate.
> - **RVTools Migration Engine**: Full client-side `.xlsx` spreadsheet ingestion with instant one-click demo data loading ("Load Sample Enterprise Cluster") and downloadable sample template (`rvtools-sample-enterprise.xlsx`).
> - **Navigation & Micro-interactions**: Smooth page transitions using Framer Motion (`motion/react`) with subtle fade/slide reveals, plus React Router (`NavLink`/`Link`) organized into dropdown navigation menus.

***

## 1. Overview & Core Concept

- **What It Does**: Transforms the existing enterprise VMware cloud architecture showcase into an authoritative, multi-page platform with an integrated engineering toolkit and cloud storage backend:
  - **Executive Overview (`/`)**: High-impact landing page highlighting hyperscaler architecture (AVS, GCVE, VMC on AWS), key proof points, and discipline navigation.
  - **Dynamic Discipline Routes (`/disciplines/:id`)**: Standalone, dedicated views generated dynamically from `siteConfig.platformShowcases` (Azure AVS, Google Cloud GCVE, AWS VMC & DR, VMware NSX-T, HCX, SRM, Aria Operations for Networks) featuring architecture specs, role matrices, deliverables, and interactive deep dives.
  - **Interactive Engineering Workbench (`/tools`)**: A 4-tool suite:
    1. `/tools/sizing`: Multi-Cloud Node & External Storage Sizing Estimator (ANF / FSx ONTAP decoupled storage vs. pure vSAN node sprawl).
    2. `/tools/rvtools-analyzer`: In-browser RVTools Excel parser calculating workload migration readiness scores and mapping VMs to HCX Bulk vs. RAV (Replication-Assisted vMotion).
    3. `/tools/dr-planner`: Disaster Recovery RPO/RTO & Replication Calculator modeling daily change rate, WAN bandwidth requirements, and SRM protection group sizing.
    4. `/tools/design-generator`: Automated Hybrid Blueprint Generator accepting RVTools import or manual sizing inputs to generate bill of materials (BOM), visual architecture topology cards, export to PDF, and quick-save to the dedicated Google Drive folder.
  - **Dedicated Systems Pages**: 
    - `/blueprints`: Interactive Multi-Layer Topology Viewer with full-screen and IaC inspection.
    - `/roadmap`: 6-Phase Hyperscaler Migration Roadmap.
    - `/resources`: Consolidated tabbed Knowledge Hub for KB Runbooks, Tutorials, and Video Masterclasses.
    - `/case-studies`: Client Dossiers & Migration Metrics.
    - `/about`: Founder & Principal Architect Desk.
- **Target Persona**: Enterprise Cloud Architects, Infrastructure Directors, VPs of Infrastructure, and Migration Engineers evaluating hyperscaler VMware migrations (Azure, AWS, GCP).
- **Key Value**: Provides enterprise decision-makers and engineers with self-service assessment tools, architectural blueprints, and centralized Google Drive asset management.

***

## 2. User Experience & Visual Design

### Key User Flows
1. **Executive Discovery Flow**:
   - Lands on `/` → explores platform highlights → clicks a discipline card (e.g., Azure AVS) → navigates to `/disciplines/avs-azure` → reviews topology, storage tiering (ANF integration), and component specifications → triggers "Book Technical Briefing".
2. **Migration Readiness & Sizing Flow**:
   - Navigates to `/tools` → chooses RVTools Analyzer (`/tools/rvtools-analyzer`) → clicks "Load Sample Enterprise Cluster" (or drops an `RVTools.xlsx` export) → views real-time parsed summary: total vCPUs, RAM GB, provisioned storage, OS distribution, and Migration Readiness Score → inspects HCX recommendation engine (Bulk vs. RAV) → clicks "Send to Design Generator" to produce architectural BOM.
3. **Disaster Recovery Modeling Flow**:
   - Navigates to `/tools/dr-planner` → enters protected VM count, aggregate data footprint (TB), daily change rate %, target RPO (hours/minutes), and available WAN link (Mbps) → reviews calculated transfer windows, required steady-state replication bandwidth, and SRM test bubble configuration.
4. **Google Drive Asset & Export Flow**:
   - Generates blueprint BOM in Design Generator → downloads report or clicks "Open Cloud Drive Folder" to view stored deliverables directly in the user's shared Google Drive workspace.

### Visual Identity & Theme
- **Color Palette & Discipline**:
  - Dominant Neutral: Dark Slate canvas (`#020617` / `#090d16` in dark mode, crisp `#f8fafc` in high-contrast light mode).
  - Structural Surfaces: Hairline bordered containers (`#1e293b` / `#cbd5e1`), subtle depth without nested card sandwiches.
  - Primary Accent: Precision Cyan (`#06b6d4` / `#22d3ee`) for interactive controls and active routes, Emerald (`#10b981`) for admin mode and readiness indicators.
- **Top Bar Contract**:
  - **Zone 1 (Wordmark)**: Single clean text mark "Zaboraa Technologies" in Plus Jakarta Sans.
  - **Zone 2 (Nav Links & Dropdowns)**:
    - *Disciplines ▾* (Dropdown dynamically populating platforms: AVS, GCVE, VMC on AWS, NSX, HCX, SRM, Aria).
    - *Tools ▾* (Dropdown for Node Sizing, RVTools Analyzer, DR Planner, Design Generator).
    - *Blueprints* (`/blueprints`).
    - *Roadmap* (`/roadmap`).
    - *Knowledge Hub ▾* (KB Runbooks, Tutorials, Video Masterclasses).
    - *Case Studies* (`/case-studies`).
    - *About* (`/about`).
  - **Zone 3 (Primary Action)**: "Book Briefing" action button opening the scheduling modal.
- **Typography & Numerical Discipline**:
  - Headings: Plus Jakarta Sans with `text-wrap: balance`.
  - Body: Plus Jakarta Sans (15px–16px, 1.6 line height).
  - Data, Tables & Calculations: JetBrains Mono with tabular figures (`tabular-nums font-mono`).

***

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Google Drive Integration via Shared Folder ID `1sFG8NLUcajo8DuCs7jq9ChYK-rksx7Io`**:
  - *Chosen Approach*: Centralize Google Drive configuration with the folder ID, providing direct link generators, embedded folder browsing drawer, and direct file preview links with local static image fallback.
  - *Why*: Bridges the website code and your cloud storage without risking broken assets if Google Drive streaming links have cross-origin restrictions.
- **Decision 2: React Router Dynamic Architecture vs. Static Routing**:
  - *Chosen Approach*: Implement `react-router-dom` with dynamic route matching (`/disciplines/:id`) paired with static routes for tools and content hubs.
  - *Why*: Allows unlimited future disciplines to be added to `siteConfig.platformShowcases` without editing route files, while maintaining clean bookmarkable URLs for search engines and direct client sharing.
- **Decision 3: Client-Side Excel Parsing via `xlsx`**:
  - *Chosen Approach*: Execute all RVTools file parsing directly in the browser using the already-installed `xlsx` package with zero server latency or data privacy risk.
  - *Why*: Enterprise infrastructure data never leaves the client's browser, eliminating security review hurdles and ensuring instant analysis.
- **Decision 4: State Preservation Across Routes**:
  - *Chosen Approach*: Keep `CustomizationProvider` at the top of the component tree wrapping `<BrowserRouter>`, preserving user preferences, theme toggles, admin customizations, and hotspot states when navigating between pages.

***

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          App.tsx (Root Router)                         │
│                    wrapped by CustomizationProvider                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                                                               ▼
┌──────────────────────────────┐              ┌───────────────────────────────────┐
│          Navbar.tsx          │              │             Footer.tsx            │
│  Dropdowns: Disciplines,     │              │  Site links, admin trigger,       │
│  Tools, Knowledge Hub        │              │  Google Drive Folder link         │
└──────────────┬───────────────┘              └───────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             <Routes> Viewport                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  /                     → HomePage.tsx (Hero, Platform Grid, Proof, CTA)     │
│  /disciplines/:id      → DisciplineDetailPage.tsx (Dynamic Architecture)   │
│  /tools                → WorkbenchHubPage.tsx (Engineering Suite Overview)  │
│  /tools/sizing         → NodeSizingToolPage.tsx (ANF/FSx Decoupled Storage) │
│  /tools/rvtools-analyzer → RVToolsAnalyzerPage.tsx (Spreadsheet Parser)     │
│  /tools/dr-planner     → DRPlannerPage.tsx (RPO/RTO & WAN Calculator)       │
│  /tools/design-generator → DesignGeneratorPage.tsx (Automated BOM & Specs) │
│  /blueprints           → BlueprintsPage.tsx (MultiLayerTopologyViewer)      │
│  /roadmap              → RoadmapPage.tsx (MigrationStrategyRoadmap)         │
│  /resources/*          → ResourcesPage.tsx (KB Runbooks, Guides, Videos)    │
│  /case-studies         → CaseStudiesPage.tsx (Client Dossiers & Outcomes)   │
│  /about                → AboutPage.tsx (Lead Architect Desk & Bio)          │
└─────────────────────────────────────────────────────────────────────────────┘
                               ▲
                               │
               ┌───────────────┴────────────────┐
               │    src/data/mediaAssets.ts     │
               │  Google Drive Folder Bridge    │
               │  (1sFG8NLUcajo8DuCs7jq9ChYK...) │
               │  + Local Bundled Fallbacks     │
               └────────────────────────────────┘
```

### Route-to-Component Mapping
1. `/` -> `HomePage.tsx`
2. `/disciplines/:id` -> `DisciplineDetailPage.tsx` (reads `useParams()`, finds matching item from `siteConfig.platformShowcases`, renders diagrams, specs, storage options, and deliverables)
3. `/tools` -> `WorkbenchHubPage.tsx`
4. `/tools/sizing` -> `NodeSizingToolPage.tsx`
5. `/tools/rvtools-analyzer` -> `RVToolsAnalyzerPage.tsx`
6. `/tools/dr-planner` -> `DRPlannerPage.tsx`
7. `/tools/design-generator` -> `DesignGeneratorPage.tsx`
8. `/blueprints` -> `BlueprintsPage.tsx` (embeds `MultiLayerTopologyViewer.tsx` with full-screen and IaC toggle)
9. `/roadmap` -> `RoadmapPage.tsx` (embeds `MigrationStrategyRoadmap.tsx`)
10. `/resources` (and `/resources/:tab`) -> `ResourcesPage.tsx` (tabbed interface for KB, Tutorials, and Videos with global search)
11. `/case-studies` -> `CaseStudiesPage.tsx` (embeds `CaseStudiesSection.tsx`)
12. `/about` -> `AboutPage.tsx` (founder profile, credentials, briefing trigger)

### Planned Implementation Steps
1. **Google Drive & Media Asset Bridge (`src/data/mediaAssets.ts`)**:
   - Store folder ID `1sFG8NLUcajo8DuCs7jq9ChYK-rksx7Io` and public URL.
   - Add helper functions to resolve direct Google Drive file IDs and fallback cleanly to local images.
2. **Engineering Tools Engines & Components (`src/pages/tools/*`)**:
   - Implement `NodeSizingToolPage.tsx` with live node reduction calculations (ANF / FSx ONTAP vs standard vSAN).
   - Implement `RVToolsAnalyzerPage.tsx` with `xlsx` parsing for `vInfo`, `vCPU`, `vMemory`, `vDisk`, Migration Readiness Score calculation, and HCX Bulk vs RAV classification.
   - Implement `DRPlannerPage.tsx` for vSphere replication WAN bandwidth and SRM storage sizing.
   - Implement `DesignGeneratorPage.tsx` combining sizing inputs into a structured BOM and export trigger with Google Drive save actions.
3. **Core View Pages (`src/pages/*`)**:
   - Build `HomePage.tsx`, `DisciplineDetailPage.tsx`, `BlueprintsPage.tsx`, `RoadmapPage.tsx`, `ResourcesPage.tsx`, `CaseStudiesPage.tsx`, and `AboutPage.tsx`.
4. **Navigation Refactoring (`src/components/Navbar.tsx`)**:
   - Convert scroll anchors to `NavLink` / `Link`.
   - Implement accessible desktop dropdown menus for Disciplines, Tools, and Resources.
   - Update mobile navigation drawer with complete route links.
5. **Route Integration & Global Shell (`src/App.tsx`)**:
   - Mount `<BrowserRouter>` with `<Routes>` and Framer Motion transitions (`AnimatePresence`).
   - Retain all admin customization drawers, theme toggles, and briefing modals globally.
6. **Verification**:
   - Run `compile_applet` and `lint_applet` to ensure zero compilation or routing issues.
