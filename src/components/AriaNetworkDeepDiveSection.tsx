import React, { useState } from 'react';
import { useCustomization } from '../context/CustomizationContext';
import {
  Network,
  Shield,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Maximize2,
  X,
  FileCode,
  Copy,
  Check,
  Server,
  Zap,
  Filter,
  RefreshCw,
  Eye,
  Sliders,
  Calendar
} from 'lucide-react';

interface SimulatedAppFlow {
  id: string;
  name: string;
  description: string;
  vmCount: number;
  unmappedPortsDetected: number;
  flows: {
    source: string;
    destination: string;
    protocol: string;
    port: string;
    appId: string;
    flowType: 'East-West' | 'North-South';
    throughput: string;
    latencyRtt: string;
  }[];
  discoveredTiers: {
    name: string;
    type: 'Web' | 'App' | 'Database' | 'Shared Services';
    vms: string[];
    riskFactor: 'Low' | 'Medium' | 'High';
  }[];
  recommendedDfwRules: {
    id: string;
    name: string;
    sourceGroup: string;
    destinationGroup: string;
    serviceAppId: string;
    action: 'ALLOW' | 'DROP';
    stage: 'Audit' | 'Enforce';
  }[];
  migrationWave: {
    waveNumber: number;
    cutoverWindow: string;
    estimatedSyncTime: string;
    bandwidthRequirement: string;
    recommendedMethod: string;
  };
}

export const AriaNetworkDeepDiveSection: React.FC = () => {
  const { theme, setIsBriefingModalOpen } = useCustomization();
  const [selectedAppKey, setSelectedAppKey] = useState<string>('banking');
  const [activeTab, setActiveTab] = useState<'simulator' | 'comparison' | 'methodology' | 'diagrams'>('simulator');
  const [fullscreenDiagram, setFullscreenDiagram] = useState<{ url: string; title: string; subtitle: string } | null>(null);
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);

  const simulatedApps: Record<string, SimulatedAppFlow> = {
    banking: {
      id: 'banking',
      name: 'Tier-1 Core Banking & SWIFT Payment Gateway',
      description: 'Critical OLTP financial application consisting of internet-facing web frontends, clustered payment processing app servers, and Oracle RAC active-passive database instances.',
      vmCount: 42,
      unmappedPortsDetected: 4,
      flows: [
        { source: '10.200.1.10 (Ext-LB)', destination: '10.200.1.25 (Web-01)', protocol: 'TCP', port: '443', appId: 'HTTPS / TLS 1.3', flowType: 'North-South', throughput: '2.4 Gbps', latencyRtt: '0.8 ms' },
        { source: '10.200.1.25 (Web-01)', destination: '10.200.2.14 (App-Core-01)', protocol: 'TCP', port: '8443', appId: 'REST API / mTLS', flowType: 'East-West', throughput: '1.8 Gbps', latencyRtt: '0.4 ms' },
        { source: '10.200.2.14 (App-Core-01)', destination: '10.200.3.50 (DB-Oracle-01)', protocol: 'TCP', port: '1521', appId: 'Oracle TNS Listener', flowType: 'East-West', throughput: '4.2 Gbps', latencyRtt: '0.3 ms' },
        { source: '10.200.2.14 (App-Core-01)', destination: '10.200.4.10 (AD-DNS-01)', protocol: 'UDP/TCP', port: '53 / 88', appId: 'Kerberos / Active Directory', flowType: 'East-West', throughput: '45 Mbps', latencyRtt: '0.2 ms' },
        { source: '10.200.3.50 (DB-Oracle-01)', destination: '10.200.4.88 (NTP-Clock)', protocol: 'UDP', port: '123', appId: 'NTP Time Sync', flowType: 'East-West', throughput: '2 Mbps', latencyRtt: '0.1 ms' }
      ],
      discoveredTiers: [
        { name: 'Tier-Web-Banking', type: 'Web', vms: ['BANK-WEB-01', 'BANK-WEB-02', 'BANK-WEB-03'], riskFactor: 'Low' },
        { name: 'Tier-App-Core-Payment', type: 'App', vms: ['PAY-APP-01', 'PAY-APP-02', 'PAY-MQ-01'], riskFactor: 'Medium' },
        { name: 'Tier-DB-OracleRAC', type: 'Database', vms: ['ORA-RAC-01', 'ORA-RAC-02'], riskFactor: 'High' },
        { name: 'Tier-Shared-Services', type: 'Shared Services', vms: ['CORP-DC-01', 'CORP-DNS-01', 'CORP-NTP-01'], riskFactor: 'Low' }
      ],
      recommendedDfwRules: [
        { id: 'rule-bank-1', name: 'ALLOW_Ingress_HTTPS_To_Web', sourceGroup: 'Grp_External_Ingress_LB', destinationGroup: 'Grp_Tier_Web_Banking', serviceAppId: 'HTTPS (443)', action: 'ALLOW', stage: 'Enforce' },
        { id: 'rule-bank-2', name: 'ALLOW_Web_To_App_REST_mTLS', sourceGroup: 'Grp_Tier_Web_Banking', destinationGroup: 'Grp_Tier_App_Core_Payment', serviceAppId: 'TCP 8443 / REST', action: 'ALLOW', stage: 'Enforce' },
        { id: 'rule-bank-3', name: 'ALLOW_App_To_Oracle_TNS', sourceGroup: 'Grp_Tier_App_Core_Payment', destinationGroup: 'Grp_Tier_DB_OracleRAC', serviceAppId: 'Oracle-TNS (1521)', action: 'ALLOW', stage: 'Enforce' },
        { id: 'rule-bank-4', name: 'ALLOW_App_To_ActiveDirectory', sourceGroup: 'Grp_Tier_App_Core_Payment', destinationGroup: 'Grp_Tier_Shared_Services', serviceAppId: 'Kerberos, DNS, LDAP', action: 'ALLOW', stage: 'Enforce' },
        { id: 'rule-bank-5', name: 'DENY_Unauthorized_Inter_Tier', sourceGroup: 'Grp_Tier_Web_Banking', destinationGroup: 'Grp_Tier_DB_OracleRAC', serviceAppId: 'ANY (Direct DB Bypass)', action: 'DROP', stage: 'Enforce' }
      ],
      migrationWave: {
        waveNumber: 3,
        cutoverWindow: 'Saturday 01:00 - 03:00 UTC (120 Mins)',
        estimatedSyncTime: '48 Mins via HCX RAV',
        bandwidthRequirement: '6.8 Gbps burst during initial sync',
        recommendedMethod: 'VMware HCX Replication-Assisted vMotion (RAV)'
      }
    },
    sap: {
      id: 'sap',
      name: 'SAP S/4HANA ERP & Central Finance Matrix',
      description: 'Distributed ERP landscape with Fiori presentation frontend, ABAP application servers, and in-memory SAP HANA multi-node clusters.',
      vmCount: 68,
      unmappedPortsDetected: 7,
      flows: [
        { source: '10.110.1.10 (User Subnets)', destination: '10.110.2.10 (SAP-WebDisp)', protocol: 'TCP', port: '44300', appId: 'SAP Fiori / HTTPS', flowType: 'North-South', throughput: '1.2 Gbps', latencyRtt: '1.2 ms' },
        { source: '10.110.2.10 (SAP-WebDisp)', destination: '10.110.3.20 (SAP-PAS-ABAP)', protocol: 'TCP', port: '3200 / 3300', appId: 'SAP Dispatcher / Gateway', flowType: 'East-West', throughput: '2.9 Gbps', latencyRtt: '0.4 ms' },
        { source: '10.110.3.20 (SAP-PAS-ABAP)', destination: '10.110.4.15 (HANA-Master)', protocol: 'TCP', port: '30015 / 30017', appId: 'SAP HANA SQL / Trex', flowType: 'East-West', throughput: '7.8 Gbps', latencyRtt: '0.2 ms' },
        { source: '10.110.4.15 (HANA-Master)', destination: '10.110.4.16 (HANA-Worker)', protocol: 'TCP', port: '40000-40010', appId: 'HANA Node Interconnect', flowType: 'East-West', throughput: '14.2 Gbps', latencyRtt: '0.1 ms' }
      ],
      discoveredTiers: [
        { name: 'Tier-SAP-WebDispatcher', type: 'Web', vms: ['SAP-WD-01', 'SAP-WD-02'], riskFactor: 'Low' },
        { name: 'Tier-SAP-ABAP-App', type: 'App', vms: ['SAP-PAS-01', 'SAP-AAS-01', 'SAP-AAS-02'], riskFactor: 'Medium' },
        { name: 'Tier-SAP-HANA-Database', type: 'Database', vms: ['HANA-DB-01', 'HANA-DB-02', 'HANA-DB-STANDBY'], riskFactor: 'High' }
      ],
      recommendedDfwRules: [
        { id: 'rule-sap-1', name: 'ALLOW_Fiori_To_WebDisp', sourceGroup: 'Grp_Corporate_Users', destinationGroup: 'Grp_SAP_WebDispatcher', serviceAppId: 'SAP Fiori (44300)', action: 'ALLOW', stage: 'Enforce' },
        { id: 'rule-sap-2', name: 'ALLOW_WebDisp_To_PAS', sourceGroup: 'Grp_SAP_WebDispatcher', destinationGroup: 'Grp_SAP_ABAP_App', serviceAppId: 'SAP Gateway (3200-3300)', action: 'ALLOW', stage: 'Enforce' },
        { id: 'rule-sap-3', name: 'ALLOW_App_To_HANA_SQL', sourceGroup: 'Grp_SAP_ABAP_App', destinationGroup: 'Grp_SAP_HANA_Database', serviceAppId: 'HANA SQL (30015)', action: 'ALLOW', stage: 'Enforce' },
        { id: 'rule-sap-4', name: 'DENY_Direct_Client_To_HANA', sourceGroup: 'Grp_Corporate_Users', destinationGroup: 'Grp_SAP_HANA_Database', serviceAppId: 'ANY (Direct DB Ingress)', action: 'DROP', stage: 'Enforce' }
      ],
      migrationWave: {
        waveNumber: 4,
        cutoverWindow: 'Sunday 02:00 - 05:00 UTC (180 Mins)',
        estimatedSyncTime: '85 Mins via HCX Cold/Bulk Sync',
        bandwidthRequirement: '12 Gbps during in-memory database sync',
        recommendedMethod: 'VMware HCX Bulk Migration with Scheduled Switchover'
      }
    },
    healthcare: {
      id: 'healthcare',
      name: 'Epic EHR Hospital Clinical Systems',
      description: 'Mission-critical hospital electronic health records platform serving surgical suites, bedside telemetry monitors, and pharmacy automated dispensing cabinets.',
      vmCount: 54,
      unmappedPortsDetected: 3,
      flows: [
        { source: '10.180.10.0/24 (Bedside Devices)', destination: '10.180.20.15 (EHR-Telemetry)', protocol: 'TCP/UDP', port: '8080 / 2575', appId: 'HL7 Medical Protocol', flowType: 'North-South', throughput: '450 Mbps', latencyRtt: '1.5 ms' },
        { source: '10.180.20.15 (EHR-Telemetry)', destination: '10.180.30.22 (EHR-Cache-App)', protocol: 'TCP', port: '1972', appId: 'InterSystems Caché DB', flowType: 'East-West', throughput: '3.6 Gbps', latencyRtt: '0.4 ms' },
        { source: '10.180.30.22 (EHR-Cache-App)', destination: '10.180.40.10 (PACS-Imaging-Repo)', protocol: 'TCP', port: '104 / 4242', appId: 'DICOM Medical Imaging', flowType: 'East-West', throughput: '8.4 Gbps', latencyRtt: '0.6 ms' }
      ],
      discoveredTiers: [
        { name: 'Tier-EHR-Telemetry-Ingress', type: 'Web', vms: ['HL7-INGRESS-01', 'HL7-INGRESS-02'], riskFactor: 'High' },
        { name: 'Tier-EHR-Clinical-App', type: 'App', vms: ['EPIC-APP-01', 'EPIC-APP-02', 'EPIC-APP-03'], riskFactor: 'High' },
        { name: 'Tier-PACS-Imaging', type: 'Database', vms: ['PACS-DICOM-01', 'PACS-STORAGE-01'], riskFactor: 'Medium' }
      ],
      recommendedDfwRules: [
        { id: 'rule-ehr-1', name: 'ALLOW_Medical_HL7_Ingress', sourceGroup: 'Grp_Clinical_VLAN_Devices', destinationGroup: 'Grp_EHR_Telemetry_Ingress', serviceAppId: 'HL7 (2575, 8080)', action: 'ALLOW', stage: 'Enforce' },
        { id: 'rule-ehr-2', name: 'ALLOW_Telemetry_To_CacheDB', sourceGroup: 'Grp_EHR_Telemetry_Ingress', destinationGroup: 'Grp_EHR_Clinical_App', serviceAppId: 'Caché Interface (1972)', action: 'ALLOW', stage: 'Enforce' },
        { id: 'rule-ehr-3', name: 'ALLOW_EHR_To_PACS_DICOM', sourceGroup: 'Grp_EHR_Clinical_App', destinationGroup: 'Grp_PACS_Imaging', serviceAppId: 'DICOM (104, 4242)', action: 'ALLOW', stage: 'Enforce' },
        { id: 'rule-ehr-4', name: 'DENY_Non_Clinical_Subnets', sourceGroup: 'Grp_Guest_WiFi_Subnet', destinationGroup: 'Grp_EHR_Clinical_App', serviceAppId: 'ANY', action: 'DROP', stage: 'Enforce' }
      ],
      migrationWave: {
        waveNumber: 2,
        cutoverWindow: 'Sunday 03:00 - 04:30 UTC (90 Mins)',
        estimatedSyncTime: '35 Mins via HCX RAV',
        bandwidthRequirement: '4.5 Gbps baseline bandwidth',
        recommendedMethod: 'VMware HCX Replication-Assisted vMotion (RAV)'
      }
    }
  };

  const currentApp = simulatedApps[selectedAppKey] || simulatedApps.banking;

  const handleCopyRule = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedRuleId(id);
    setTimeout(() => setCopiedRuleId(null), 2000);
  };

  const diagramsList = [
    {
      id: 'diag-flow-discovery',
      title: 'Flow-Based Discovery & IPFIX Ingestion Telemetry Fabric',
      subtitle: 'Capturing wire-rate packets across vSphere Distributed Switches (VDS), Arista/Cisco physical switches, and cloud interconnects.',
      url: '/assets/images/aria_flow_discovery_analytics_1791552004516.jpg',
      badge: 'Flow Telemetry'
    },
    {
      id: 'diag-dfw-migration',
      title: 'NSX DFW Microsegmentation Modeling & Non-NSX Migration Wave Planner',
      subtitle: 'Translating observed flows into NSX Distributed Firewall rules and scheduling zero-downtime migration waves.',
      url: '/assets/images/aria_dfw_microseg_migration_planner_1791552031328.jpg',
      badge: 'DFW Zero-Trust'
    },
    {
      id: 'diag-overview',
      title: 'Aria Operations for Networks End-to-End Enterprise Architecture',
      subtitle: 'Comprehensive view of discovery, dependency mapping, migration planning, and distributed firewall policy enforcement.',
      url: '/assets/images/aria_network_microseg_showcase_1791551934452.jpg',
      badge: 'Full Architecture'
    }
  ];

  return (
    <section 
      id="aria-operations-networks" 
      className="py-20 sm:py-28 bg-slate-950 border-b border-slate-800 scroll-mt-20 relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-950/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="font-mono text-indigo-400 font-bold tracking-wider">
                DEEP-DIVE ARCHITECTURAL ENGINE
              </span>
              <span className="text-slate-600">·</span>
              <span className="px-2.5 py-0.5 rounded-full border border-indigo-500/30 text-indigo-300 bg-indigo-950/60 font-mono text-[11px]">
                Zero-Trust Pre-Migration
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 font-medium">VMware Aria Operations for Networks</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Aria Operations for Networks: Flow Discovery & NSX DFW Microsegmentation
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Eliminate the fatal blind spots of migrating from legacy non-NSX flat VLANs to NSX Distributed Firewall (DFW). We leverage continuous IPFIX flow collection, machine-learning tier clustering, and automated policy modeling to achieve 100% zero-downtime cutovers without breaking undocumented production dependencies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start lg:self-auto">
            <button
              onClick={() => setIsBriefingModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-950/50 transition-all hover:scale-105"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule DFW Assessment</span>
            </button>
          </div>
        </div>

        {/* Four Core Architectural Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">1. Flow-Based Discovery</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Streams continuous IPFIX and sFlow telemetry from vSphere Distributed Switches (VDS) and physical spine-leaf fabrics, baselining all East-West and North-South conversations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/40 transition-all space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">2. Application Clustering</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Machine-learning algorithms analyze TCP socket affinity, naming schemas, and communication density to automatically assemble unorganized VMs into strict multi-tier applications.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/40 transition-all space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">3. Migration Wave Planner</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates cross-tier bandwidth and latency tolerance to sequence workloads into safe migration batches, preventing split-application WAN bottlenecks during HCX evacuation.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-purple-500/40 transition-all space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">4. NSX DFW Rule Modeling</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Converts 30+ days of empirical flow evidence directly into least-privilege Layer 4 / Layer 7 App-ID firewall policies, validated in audit mode prior to cutover.
            </p>
          </div>
        </div>

        {/* Interactive Feature Tabs */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold ${
                activeTab === 'simulator'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Interactive Flow & DFW Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold ${
                activeTab === 'comparison'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Non-NSX vs NSX DFW Architecture</span>
            </button>

            <button
              onClick={() => setActiveTab('methodology')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold ${
                activeTab === 'methodology'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>5-Phase Zero-Downtime Migration Runbook</span>
            </button>

            <button
              onClick={() => setActiveTab('diagrams')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold ${
                activeTab === 'diagrams'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Architecture Blueprints ({diagramsList.length})</span>
            </button>
          </div>

          {/* TAB 1: INTERACTIVE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              {/* App Switcher Pills */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-slate-400 font-semibold">
                    Select Production Workload Profile:
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {Object.values(simulatedApps).map(app => (
                    <button
                      key={app.id}
                      onClick={() => setSelectedAppKey(app.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                        selectedAppKey === app.id
                          ? 'bg-indigo-950 border-indigo-400 text-indigo-300 font-bold shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/20'
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span>{app.name.split(' ')[0]}</span>
                      <span className="ml-1.5 text-[10px] font-mono text-slate-500">
                        ({app.vmCount} VMs)
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* App Meta Overview Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/30 via-slate-900/80 to-slate-900/50 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{currentApp.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Discovered by Aria
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    {currentApp.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Total Workloads</div>
                    <div className="font-bold text-cyan-400">{currentApp.vmCount} Virtual Machines</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Hidden Ports Found</div>
                    <div className="font-bold text-amber-400">{currentApp.unmappedPortsDetected} Unmapped Flows</div>
                  </div>
                </div>
              </div>

              {/* 3-Column Detailed Flow, Tiering, and DFW Rules Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Col 1: Real-Time Flow Telemetry Stream (4 Cols) */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 px-1">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      IPFIX Wire-Rate Flow Stream
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 animate-pulse">● Live 50k flows/s</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 max-h-[460px] overflow-y-auto scrollbar-thin">
                    {currentApp.flows.map((f, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-cyan-300 font-bold">{f.appId}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${f.flowType === 'East-West' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-blue-950 text-blue-300 border border-blue-800'}`}>
                            {f.flowType}
                          </span>
                        </div>

                        <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                          <div className="truncate text-slate-300">Src: {f.source}</div>
                          <div className="truncate text-slate-300">Dst: {f.destination}</div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                          <span>Port: <strong className="text-slate-200">{f.protocol}/{f.port}</strong></span>
                          <span>RTT: <strong className="text-emerald-400">{f.latencyRtt}</strong></span>
                          <span>Throughput: <strong className="text-cyan-400">{f.throughput}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Col 2: Discovered Application Tiers (3 Cols) */}
                <div className="lg:col-span-3 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 px-1">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      Discovered Tiers (ML)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {currentApp.discoveredTiers.length} Tiers
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 max-h-[460px] overflow-y-auto scrollbar-thin">
                    {currentApp.discoveredTiers.map((tier, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{tier.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {tier.type}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400">Member Workloads ({tier.vms.length}):</div>
                          <div className="flex flex-wrap gap-1">
                            {tier.vms.map(vm => (
                              <span key={vm} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                                {vm}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                          <span className="text-slate-400">Migration Coupling:</span>
                          <span className={`font-mono font-bold ${tier.riskFactor === 'High' ? 'text-rose-400' : tier.riskFactor === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {tier.riskFactor} Sensitivity
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Migration Wave Plan Card */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-2">
                      <div className="text-[10px] font-mono text-indigo-400 uppercase font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>Recommended Wave #{currentApp.migrationWave.waveNumber}</span>
                      </div>
                      <div className="text-[11px] text-white font-semibold">
                        {currentApp.migrationWave.recommendedMethod}
                      </div>
                      <div className="text-[10px] text-slate-300 space-y-0.5 font-mono">
                        <div>Window: {currentApp.migrationWave.cutoverWindow}</div>
                        <div>Estimated Duration: {currentApp.migrationWave.estimatedSyncTime}</div>
                        <div>Bandwidth Sizing: {currentApp.migrationWave.bandwidthRequirement}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Col 3: Recommended NSX DFW Microsegmentation Rules (5 Cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 px-1">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      Generated NSX DFW Microsegmentation Rules
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">Zero-Trust Modeled</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 max-h-[460px] overflow-y-auto scrollbar-thin">
                    {currentApp.recommendedDfwRules.map(rule => (
                      <div key={rule.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">{rule.name}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${rule.action === 'ALLOW' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                            {rule.action}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                          <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                            <span className="text-slate-500 block">Source Group:</span>
                            <span className="text-cyan-300 truncate block">{rule.sourceGroup}</span>
                          </div>
                          <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                            <span className="text-slate-500 block">Destination Group:</span>
                            <span className="text-indigo-300 truncate block">{rule.destinationGroup}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                          <span className="font-mono text-slate-400">
                            Service / App-ID: <strong className="text-slate-200">{rule.serviceAppId}</strong>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopyRule(JSON.stringify(rule, null, 2), rule.id)}
                            className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 font-mono text-[9px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                            title="Copy Rule Definition JSON"
                          >
                            {copiedRuleId === rule.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy JSON</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NON-NSX VS NSX DFW ARCHITECTURE COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Legacy Flat Non-NSX VLAN Environment */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-rose-900/40 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-xs font-mono uppercase text-rose-400 font-bold tracking-wider">
                      Legacy Architecture
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    Unsegmented Non-NSX Flat VLAN Network
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Workloads communicate without in-kernel inspection. Perimeter firewalls only see traffic entering and exiting the datacenter, leaving lateral East-West communications completely blind.
                  </p>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-start gap-2 text-xs text-slate-300">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span><strong>Ransomware Lateral Blast Radius:</strong> If one web VM is breached, attacker moves unrestricted to all database and application servers on the same subnet.</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-300">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span><strong>The Blind Cutover Dilemma:</strong> Security teams cannot safely implement microsegmentation rules without risking production outages due to unknown dependencies.</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-300">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span><strong>Hairpinned Routing Bottlenecks:</strong> All inter-VLAN inspection forces packets through physical firewall appliances, creating severe CPU bottlenecks.</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/50 text-[11px] text-rose-300 font-mono">
                  Risk Level: Critical Exposure to Lateral Movement
                </div>
              </div>

              {/* Target NSX DFW Microsegmented Architecture */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-indigo-500/40 space-y-4 flex flex-col justify-between shadow-xl shadow-indigo-950/20">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono uppercase text-indigo-400 font-bold tracking-wider">
                      Target Zero-Trust Architecture
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    Aria-Modeled NSX Distributed Firewall (DFW)
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Firewall enforcement occurs directly at the virtual machine vNIC in the ESXi hypervisor kernel. Zero-trust policies ensure only verified, authenticated ports communicate.
                  </p>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>In-Kernel Distributed Inspection:</strong> Wire-rate filtering at the hypervisor boundary with zero hairpinned physical switch hops.</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Layer 7 App-ID Identification:</strong> Blocks port spoofing and rogue tunnels (e.g. SSH over port 443) by inspecting protocol packet payloads.</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Pre-Validated Rule Confidence:</strong> Every single firewall rule is backed by 30+ days of collected Aria flow evidence before enforcement mode is turned on.</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/50 text-[11px] text-indigo-300 font-mono">
                  Zero-Trust Posture: 100% In-Kernel Isolation Verified
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 5-PHASE METHODOLOGY */}
          {activeTab === 'methodology' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  The Zaboraa 5-Phase Zero-Downtime Microsegmentation Framework
                </h3>
                <p className="text-xs text-slate-400">
                  How we safely transition enterprise environments from legacy flat networks to NSX Distributed Firewall without disrupting live business traffic.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-mono text-cyan-400 text-xs font-bold">PHASE 01</div>
                  <h4 className="text-sm font-bold text-white">Flow Discovery</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Deploy VDS IPFIX flow exporters across all ESXi clusters. Collect 30 full days of telemetry capturing month-end accounting batch jobs and seasonal workloads.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-mono text-blue-400 text-xs font-bold">PHASE 02</div>
                  <h4 className="text-sm font-bold text-white">App Clustering</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Execute ML heuristic clustering in Aria Operations for Networks. Define application boundaries, isolate shared services, and identify rogue unmonitored ports.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-mono text-indigo-400 text-xs font-bold">PHASE 03</div>
                  <h4 className="text-sm font-bold text-white">Wave Scheduling</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Map cross-application bandwidth and latency tolerances. Assemble coherent HCX migration waves to prevent splitting coupled application tiers across slow WAN links.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-mono text-purple-400 text-xs font-bold">PHASE 04</div>
                  <h4 className="text-sm font-bold text-white">Audit Staging</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Export modeled DFW rules into NSX Policy Manager with action ALLOW and LOGGING ENABLED. Verify zero unintended drops in NSX Log Insight for 7 consecutive days.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-mono text-emerald-400 text-xs font-bold">PHASE 05</div>
                  <h4 className="text-sm font-bold text-white">DFW Lockdown</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Switch the catch-all audit rule to REJECT/DROP. Validate in-kernel microsegmentation with NSX Traceflow; full zero-trust microsegmentation achieved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ARCHITECTURE BLUEPRINTS */}
          {activeTab === 'diagrams' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {diagramsList.map(diag => (
                <div
                  key={diag.id}
                  onClick={() => setFullscreenDiagram({ url: diag.url, title: diag.title, subtitle: diag.subtitle })}
                  className="cursor-pointer group flex flex-col justify-between rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 p-4 transition-all hover:shadow-2xl hover:shadow-indigo-950/20"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                      <img
                        src={diag.url}
                        alt={diag.title}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.includes('/src/assets/images/')) {
                            target.src = target.src.replace('/src/assets/images/', '/assets/images/');
                          } else if (target.src.includes('/assets/images/')) {
                            target.src = target.src.replace('/assets/images/', '/src/assets/images/');
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900/90 text-indigo-300 border border-indigo-500/30">
                        {diag.badge}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {diag.title}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {diag.subtitle}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-medium">
                    <span>Inspect Blueprint</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Diagram Lightbox Modal */}
      {fullscreenDiagram && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-xl p-4 sm:p-6 lg:p-12 flex justify-center items-center animate-in fade-in duration-150">
          <div className="relative w-full max-w-6xl bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">{fullscreenDiagram.title}</h3>
                <p className="text-xs text-slate-400">{fullscreenDiagram.subtitle}</p>
              </div>
              <button
                onClick={() => setFullscreenDiagram(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={fullscreenDiagram.url}
                alt={fullscreenDiagram.title}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.includes('/src/assets/images/')) {
                    target.src = target.src.replace('/src/assets/images/', '/assets/images/');
                  } else if (target.src.includes('/assets/images/')) {
                    target.src = target.src.replace('/assets/images/', '/src/assets/images/');
                  }
                }}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
