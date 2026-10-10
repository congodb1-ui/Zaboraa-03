import React, { useState } from 'react';
import { useCustomization } from '../context/CustomizationContext';
import { CloudProvider, ArchitectureDiagram, TopologyNode, TopologyLink } from '../types/siteData';
import {
  Server,
  Cloud,
  Layers,
  Shield,
  Database,
  Network,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Maximize2,
  Minimize2,
  ExternalLink,
  Code2,
  Info,
  X,
  Radio,
  Sliders,
  Sparkles,
  Zap
} from 'lucide-react';

type LayerFilter = 'all' | 'On-Premises' | 'Hybrid Connectivity' | 'Cloud SDDC Core' | 'Storage Tier' | 'PaaS & Peering';

export const MultiLayerTopologyViewer: React.FC = () => {
  const { siteConfig, setSelectedDiagram } = useCustomization();
  const [activeProvider, setActiveProvider] = useState<CloudProvider>('Azure AVS');
  const [activeLayerFilter, setActiveLayerFilter] = useState<LayerFilter>('all');
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [viewTab, setViewTab] = useState<'topology' | 'iac' | 'bestPractices'>('topology');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  React.useEffect(() => {
    if (!isFullScreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullScreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Match corresponding architecture diagram from siteConfig
  const currentDiagram = siteConfig.diagrams?.find(d => d.provider === activeProvider) || siteConfig.diagrams?.[0];

  const providers: { id: CloudProvider; label: string; icon: React.ReactNode; accent: string }[] = [
    { id: 'Azure AVS', label: 'Azure AVS', icon: <Server className="w-4 h-4 text-cyan-400" />, accent: 'cyan' },
    { id: 'AWS VMC', label: 'AWS VMC', icon: <Layers className="w-4 h-4 text-amber-400" />, accent: 'amber' },
    { id: 'Google Cloud GCVE', label: 'Google Cloud GCVE', icon: <Cloud className="w-4 h-4 text-blue-400" />, accent: 'blue' },
    { id: 'NSX-T SDN', label: 'NSX-T SDN', icon: <Shield className="w-4 h-4 text-emerald-400" />, accent: 'emerald' }
  ];

  const layers: { id: LayerFilter; label: string; tier: string; color: string }[] = [
    { id: 'all', label: 'All 5 Tiers', tier: 'Full Stack', color: 'slate' },
    { id: 'On-Premises', label: 'On-Premises DC', tier: 'Layer 1', color: 'purple' },
    { id: 'Hybrid Connectivity', label: 'Hybrid Connectivity', tier: 'Layer 2', color: 'cyan' },
    { id: 'Cloud SDDC Core', label: 'SDDC Core', tier: 'Layer 3', color: 'blue' },
    { id: 'Storage Tier', label: 'Storage Tier', tier: 'Layer 4', color: 'amber' },
    { id: 'PaaS & Peering', label: 'PaaS & Peering', tier: 'Layer 5', color: 'emerald' }
  ];

  const getNodeIcon = (type?: string) => {
    switch (type) {
      case 'datacenter':
        return <Server className="w-4 h-4 text-purple-400" />;
      case 'router':
        return <Network className="w-4 h-4 text-cyan-400" />;
      case 'server':
        return <Cpu className="w-4 h-4 text-blue-400" />;
      case 'storage':
        return <Database className="w-4 h-4 text-amber-400" />;
      case 'cloud':
        return <Cloud className="w-4 h-4 text-emerald-400" />;
      case 'shield':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      default:
        return <Zap className="w-4 h-4 text-cyan-400" />;
    }
  };

  const filteredNodes = (currentDiagram?.nodes || []).filter(node => {
    if (activeLayerFilter === 'all') return true;
    return node.layer === activeLayerFilter;
  });

  return (
    <section id="topology-viewer" className="py-20 bg-slate-950 border-t border-slate-800/80 scroll-mt-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 font-mono tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>INTERACTIVE TOPOLOGY MAPPER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Multi-Layer Topology Viewer
            </h2>
            <p className="text-sm text-slate-300">
              Interactive structural blueprints mapping On-Premises, Hybrid Connectivity, Cloud SDDC Core, Storage Tier, and Native PaaS Peering.
            </p>
          </div>

          {/* Provider Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            {providers.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setActiveProvider(p.id);
                  setSelectedNode(null);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeProvider === p.id
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{p.icon}</span>
                <span className="whitespace-nowrap">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* View Controls: Layer Selector & Tab Mode Switcher */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Layer Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider mr-1 shrink-0">Filter Layer:</span>
            {layers.map(layer => {
              const isActive = activeLayerFilter === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayerFilter(layer.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span className="font-mono text-[10px] text-slate-500">{layer.tier}</span>
                  <span>{layer.label}</span>
                </button>
              );
            })}
          </div>

          {/* View Tab Switcher */}
          <div className="flex items-center gap-1 self-start lg:self-auto bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setViewTab('topology')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewTab === 'topology' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Interactive Map
            </button>
            <button
              onClick={() => setViewTab('iac')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                viewTab === 'iac' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>IaC Snippet</span>
            </button>
            <button
              onClick={() => setViewTab('bestPractices')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                viewTab === 'bestPractices' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Best Practices</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {viewTab === 'topology' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Visual Multi-Layer Architecture Map (8 cols) */}
            <div className="lg:col-span-8 bg-slate-900/40 rounded-2xl border border-slate-800 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{currentDiagram?.title}</span>
                  </h3>
                  <p className="text-xs text-slate-400">{currentDiagram?.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded">
                    {currentDiagram?.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFullScreen(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    title="View Topology in distraction-free full screen"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Full Screen</span>
                  </button>
                </div>
              </div>

              {/* Tiered Layer Lanes Container */}
              <div className="space-y-4">
                {['On-Premises', 'Hybrid Connectivity', 'Cloud SDDC Core', 'Storage Tier', 'PaaS & Peering'].map(
                  (layerName, idx) => {
                    if (activeLayerFilter !== 'all' && activeLayerFilter !== layerName) return null;

                    const layerNodes = (currentDiagram?.nodes || []).filter(n => n.layer === layerName);
                    if (layerNodes.length === 0) return null;

                    return (
                      <div key={layerName} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-400">
                              L{idx + 1}
                            </span>
                            <span className="font-semibold text-slate-300">{layerName}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {layerNodes.length} {layerNodes.length === 1 ? 'Component' : 'Components'}
                          </span>
                        </div>

                        {/* Node Grid inside this Layer */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {layerNodes.map(node => {
                            const isSelected = selectedNode?.id === node.id;
                            return (
                              <div
                                key={node.id}
                                onClick={() => setSelectedNode(node)}
                                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-slate-900 border-cyan-400 shadow-md shadow-cyan-500/10'
                                    : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                                      {getNodeIcon(node.iconType)}
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-white leading-tight">{node.name}</h4>
                                      <span className="text-[10px] font-mono text-slate-400">{node.ipRange || 'Auto Assigned'}</span>
                                    </div>
                                  </div>

                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                                      node.status === 'Active'
                                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                                        : node.status === 'Redundant'
                                        ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800'
                                        : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                                    }`}
                                  >
                                    {node.status}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                                  {node.description}
                                </p>

                                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                                  <span className="truncate max-w-[200px]">{node.specs}</span>
                                  <span className="text-cyan-400 font-semibold shrink-0">Inspect →</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Interconnect Links Overview */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Active Inter-Layer Peering & Transit Flows
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {(currentDiagram?.links || []).map((link, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-1.5 truncate text-slate-300">
                        <span className="text-cyan-400">⚡</span>
                        <span className="truncate">{link.label}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">{link.speed}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Inspection Detail Drawer / Column (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              {selectedNode ? (
                <div className="bg-slate-900/80 rounded-2xl border border-cyan-500/40 p-5 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                        {getNodeIcon(selectedNode.iconType)}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">
                          {selectedNode.layer}
                        </span>
                        <h4 className="text-sm font-bold text-white">{selectedNode.name}</h4>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-slate-500 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Hardware & Compute Specs:</span>
                      <p className="font-mono text-slate-200 mt-0.5">{selectedNode.specs}</p>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Network Addressing & Subnet:</span>
                      <p className="font-mono text-cyan-300 mt-0.5">{selectedNode.ipRange || 'Dynamic DHCP / Overlay'}</p>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">High Availability Status:</span>
                      <span className="inline-block mt-0.5 font-semibold text-emerald-400">
                        {selectedNode.status} (Automatic Failover)
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-500 block text-[11px] mb-1">Architectural Function:</span>
                      <p className="text-slate-300 leading-relaxed">{selectedNode.description}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href="#platforms-container"
                      className="w-full py-2 px-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Explore Platform Blueprint</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-cyan-400">
                    <Info className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Interactive Node Inspector</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click any node in the topology map to review detailed IP assignments, high-availability parameters, hardware specifications, and interconnect paths.
                  </p>
                </div>
              )}

              {/* Quick Summary Card */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5 space-y-3 text-xs">
                <h4 className="font-bold text-white">Tier Breakdown</h4>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Active Provider:</span>
                    <span className="font-semibold text-cyan-300">{activeProvider}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Total Nodes:</span>
                    <span className="font-mono text-white">{currentDiagram?.nodes.length || 0}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Peering Links:</span>
                    <span className="font-mono text-white">{currentDiagram?.links.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* IaC Blueprint View */}
        {viewTab === 'iac' && currentDiagram?.iacSnippet && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">{currentDiagram.iacSnippet.title}</span>
              </div>
              <span className="text-xs font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-cyan-300">
                {currentDiagram.iacSnippet.language}
              </span>
            </div>
            <pre className="p-6 text-xs font-mono text-cyan-100 overflow-x-auto leading-relaxed bg-slate-950/80">
              <code>{currentDiagram.iacSnippet.code}</code>
            </pre>
          </div>
        )}

        {/* Best Practices View */}
        {viewTab === 'bestPractices' && currentDiagram?.bestPractices && (
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Architectural Best Practices for {activeProvider}</span>
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentDiagram.bestPractices.map((bp, i) => (
                <li key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center justify-center text-xs font-mono shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-slate-300 leading-relaxed">{bp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Distraction-Free Full Screen Mode Window */}
      {isFullScreen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl flex flex-col p-4 sm:p-6 overflow-hidden text-white animate-in fade-in duration-200"
        >
          {/* Full Screen Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-800/70">
                  FULL SCREEN TOPOLOGY MAPPER
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  · {activeProvider} · {currentDiagram?.category}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {currentDiagram?.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Exit Full Screen</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">Esc</span>
              </button>
            </div>
          </div>

          {/* Full Screen Scrollable Content */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-4">
                {['On-Premises', 'Hybrid Connectivity', 'Cloud SDDC Core', 'Storage Tier', 'PaaS & Peering'].map(
                  (layerName, idx) => {
                    const layerNodes = (currentDiagram?.nodes || []).filter(n => n.layer === layerName);
                    if (layerNodes.length === 0) return null;

                    return (
                      <div key={layerName} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-400">
                              L{idx + 1}
                            </span>
                            <span className="font-semibold text-slate-200">{layerName}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {layerNodes.length} Components
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {layerNodes.map(node => {
                            const isSelected = selectedNode?.id === node.id;
                            return (
                              <div
                                key={node.id}
                                onClick={() => setSelectedNode(node)}
                                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-cyan-950/70 border-cyan-400 ring-2 ring-cyan-500/30'
                                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400">
                                    {getNodeIcon(node.iconType)}
                                  </div>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                                    {node.status}
                                  </span>
                                </div>
                                <div className="font-bold text-white text-xs leading-snug">{node.name}</div>
                                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{node.specs}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Node Inspector in Full Screen */}
              <div className="lg:col-span-4 sticky top-0">
                {selectedNode ? (
                  <div className="bg-slate-900/90 rounded-2xl border border-cyan-500/60 p-5 space-y-4 shadow-2xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                          {selectedNode.layer}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1.5">{selectedNode.name}</h4>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Hardware & Capacity Specs:</span>
                        <p className="font-mono text-white mt-0.5">{selectedNode.specs}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Network Addressing:</span>
                        <p className="font-mono text-cyan-300 mt-0.5">{selectedNode.ipRange || 'Dynamic DHCP / Overlay'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">High Availability Status:</span>
                        <p className="font-semibold text-emerald-400 mt-0.5">{selectedNode.status} (Automatic Failover)</p>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-slate-400 block text-[11px] mb-1">Architectural Function:</span>
                        <p className="text-slate-300 leading-relaxed">{selectedNode.description}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-cyan-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Click Any Component</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Select any node in the topology above to inspect hardware specs, routing, and high-availability configuration.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
