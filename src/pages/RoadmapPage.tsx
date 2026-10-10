import React from 'react';
import { MigrationStrategyRoadmap } from '../components/MigrationStrategyRoadmap';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const RoadmapPage: React.FC = () => {
  return (
    <div className="py-8 space-y-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-cyan-300">Hyperscaler Migration Roadmap</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              6-Phase Enterprise Hyperscaler Migration Roadmap
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              From RVTools workload discovery and HCX fleet provisioning through live L2 network extension, non-disruptive cutover, and post-migration optimization.
            </p>
          </div>
          <Link
            to="/tools/rvtools-analyzer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shrink-0"
          >
            <span>Assess Inventory in RVTools Tool</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <MigrationStrategyRoadmap />
    </div>
  );
};
