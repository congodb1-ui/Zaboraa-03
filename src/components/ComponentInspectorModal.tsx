import React, { useState } from 'react';
import { DiagramHotspot } from '../data/diagramHotspotsData';
import {
  X,
  Server,
  Network,
  Cpu,
  Database,
  Shield,
  Activity,
  Terminal,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Info,
  Radio,
  Layers,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface ComponentInspectorModalProps {
  hotspot: DiagramHotspot | null;
  onClose: () => void;
}

export const ComponentInspectorModal: React.FC<ComponentInspectorModalProps> = ({ hotspot, onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ports' | 'cli' | 'packetFlow'>('overview');

  if (!hotspot) return null;

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Appliance':
        return <Activity className="w-5 h-5 text-teal-400" />;
      case 'Network & Routing':
        return <Network className="w-5 h-5 text-cyan-400" />;
      case 'Compute & Cluster':
        return <Cpu className="w-5 h-5 text-blue-400" />;
      case 'Storage Fabric':
        return <Database className="w-5 h-5 text-amber-400" />;
      case 'Security & Firewall':
        return <Shield className="w-5 h-5 text-emerald-400" />;
      default:
        return <Layers className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 text-cyan-400 shadow-md">
              {getCategoryIcon(hotspot.category)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                  {hotspot.category}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  {hotspot.badge}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Production Ready
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {hotspot.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {hotspot.role}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors"
            title="Close inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Architecture Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('ports')}
            className={`px-3.5 py-2 rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ports'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Ports & Protocols ({hotspot.portsTable.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('packetFlow')}
            className={`px-3.5 py-2 rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'packetFlow'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Traffic Flow Simulation</span>
          </button>

          <button
            onClick={() => setActiveTab('cli')}
            className={`px-3.5 py-2 rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cli'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI Diagnostics ({hotspot.troubleshootingCli.length})</span>
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* TAB 1: OVERVIEW & SPECS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Detailed Description */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Component Role & Operational Scope</span>
                </h3>
                <p className="text-slate-200 leading-relaxed text-xs sm:text-sm">
                  {hotspot.fullDescription}
                </p>
              </div>

              {/* Grid of Key Technical Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-mono text-cyan-400 uppercase font-semibold">
                    Traffic Direction & Transport
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {hotspot.trafficDirection}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">
                    High Availability & Resilience
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {hotspot.highAvailability}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 sm:col-span-2">
                  <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold">
                    Sizing, Throughput & Boundary Limits
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {hotspot.sizingAndConstraints}
                  </p>
                </div>
              </div>

              {/* Live Signal Indicator */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Active Datapath Node</div>
                    <div className="text-[11px] text-slate-400">Telemetry heartbeat nominal; zero dropped packet threshold.</div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('packetFlow')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  View Packet Trace →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PORTS & PROTOCOLS */}
          {activeTab === 'ports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Enterprise firewall rules required for {hotspot.name}:</span>
                <span className="font-mono text-cyan-400">Zero-Trust Matrix</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-300 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Protocol</th>
                      <th className="py-2.5 px-3">Port</th>
                      <th className="py-2.5 px-3">Source</th>
                      <th className="py-2.5 px-3">Destination</th>
                      <th className="py-2.5 px-3">Service Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/50">
                    {hotspot.portsTable.map((port, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{port.protocol}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">{port.port}</td>
                        <td className="py-2.5 px-3 text-slate-300">{port.source}</td>
                        <td className="py-2.5 px-3 text-slate-300">{port.destination}</td>
                        <td className="py-2.5 px-3 text-slate-400">{port.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Architect Recommendation:</strong> Enforce stateful firewall policies across physical perimeter firewalls and NSX Distributed Firewall (DFW) to restrict these ports strictly between appliance management and vSphere vmknic IPs.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: PACKET FLOW SIMULATION */}
          {activeTab === 'packetFlow' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    Sequential Packet Flow Architecture
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                    End-to-End Hop
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {hotspot.packetFlowSummary}
                </p>
              </div>

              {/* Graphical Flow Representation */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Interactive Transit Pipeline</span>
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center w-full sm:w-auto">
                    <div className="text-cyan-400 font-bold">Source Node</div>
                    <div className="text-[10px] text-slate-400">On-Premises Hypervisor</div>
                  </div>

                  <div className="flex items-center gap-1 text-cyan-400">
                    <span className="h-0.5 w-6 bg-cyan-500/50 hidden sm:block" />
                    <Zap className="w-4 h-4 animate-bounce text-cyan-400" />
                    <span className="h-0.5 w-6 bg-cyan-500/50 hidden sm:block" />
                  </div>

                  <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500 text-center w-full sm:w-auto shadow-lg shadow-cyan-500/10">
                    <div className="text-white font-bold">{hotspot.name}</div>
                    <div className="text-[10px] text-cyan-300">{hotspot.badge}</div>
                  </div>

                  <div className="flex items-center gap-1 text-emerald-400">
                    <span className="h-0.5 w-6 bg-emerald-500/50 hidden sm:block" />
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                    <span className="h-0.5 w-6 bg-emerald-500/50 hidden sm:block" />
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center w-full sm:w-auto">
                    <div className="text-emerald-400 font-bold">Destination Core</div>
                    <div className="text-[10px] text-slate-400">Cloud SDDC Target</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLI TROUBLESHOOTING */}
          {activeTab === 'cli' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Execute these production verification and diagnostic commands directly within the appliance console or bastion CLI:
              </div>

              <div className="space-y-3">
                {hotspot.troubleshootingCli.map((item, idx) => (
                  <div key={idx} className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                    <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{item.context}</span>
                      </span>
                      <button
                        onClick={() => handleCopy(item.command)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                        title="Copy command"
                      >
                        {copiedCmd === item.command ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 font-mono text-xs text-cyan-300 bg-slate-950 select-all overflow-x-auto">
                      <code>{item.command}</code>
                    </div>

                    <div className="px-3 py-2 bg-slate-900/40 border-t border-slate-800/60 font-mono text-[11px] text-slate-400">
                      <span className="text-emerald-400 font-semibold mr-1.5">Expected Output:</span>
                      <span>{item.expectedOutput}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 hidden sm:block">
            <span>Selected Component: </span>
            <span className="text-white font-semibold">{hotspot.name}</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
