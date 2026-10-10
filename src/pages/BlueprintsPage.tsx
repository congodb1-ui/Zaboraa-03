import React from 'react';
import { MultiLayerTopologyViewer } from '../components/MultiLayerTopologyViewer';
import { Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BlueprintsPage: React.FC = () => {
  return (
    <div className="py-8 space-y-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-cyan-300">Interactive Blueprints & Topology Mapper</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Multi-Layer Topology Viewer & IaC Blueprint Inspector
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Inspect interactive node connections, network routes, decoupled storage datastores, and production Terraform/Bicep automation templates.
            </p>
          </div>
          <Link
            to="/tools/design-generator"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shrink-0"
          >
            <span>Generate Custom BOM</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <MultiLayerTopologyViewer />
    </div>
  );
};
