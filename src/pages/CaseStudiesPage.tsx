import React from 'react';
import { CaseStudiesSection } from '../components/CaseStudiesSection';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useCustomization } from '../context/CustomizationContext';

export const CaseStudiesPage: React.FC = () => {
  const { setIsBriefingModalOpen } = useCustomization();

  return (
    <div className="py-8 space-y-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-cyan-300">Case Studies & Verified Outcomes</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Enterprise Client Dossiers & Track Record
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Verified production migrations across healthcare, global fintech, manufacturing, and retail hyperscaler transformation programs.
            </p>
          </div>
          <button
            onClick={() => setIsBriefingModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Request Migration Case Dossier</span>
          </button>
        </div>
      </div>

      <CaseStudiesSection />
    </div>
  );
};
