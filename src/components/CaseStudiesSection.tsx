import React from 'react';
import { useCustomization } from '../context/CustomizationContext';
import { Shield, CheckCircle2, ArrowRight } from 'lucide-react';

export const CaseStudiesSection: React.FC = () => {
  const { siteConfig, setIsBriefingModalOpen } = useCustomization();

  return (
    <section id="case-studies" className="py-20 bg-slate-950 border-b border-slate-800 scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            Verified Enterprise Track Record
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            When The Stakes Are Highest, Architecture Has To Hold.
          </h2>
          <p className="text-sm text-slate-400">
            Real enterprise case studies featuring zero unplanned downtime cutovers, sovereign multi-cloud deployments, and multi-petabyte database migrations under strict banking and healthcare regulatory compliance.
          </p>
        </div>

        {/* 3 Case Study Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {siteConfig.caseStudies.map(study => (
            <div
              key={study.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 space-y-6 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-4">
                {/* Sector Kicker */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span className="text-cyan-400 font-mono">{study.sector}</span>
                  <span className="text-emerald-400 font-mono">VERIFIED</span>
                </div>

                <h3 className="text-lg font-bold text-white leading-snug">
                  {study.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {study.summary}
                </p>

                {/* Concrete Quantitative Metrics */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Workload Scale</div>
                    <div className="text-sm font-bold font-mono text-white mt-0.5">{study.metrics.vms}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Downtime</div>
                    <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">{study.metrics.downtime}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Impact</div>
                    <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">{study.metrics.costReduction}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Delivery Window</div>
                    <div className="text-sm font-bold font-mono text-slate-300 mt-0.5">{study.metrics.timeline}</div>
                  </div>
                </div>

                {/* Architectural Key Solutions */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Engineering Solution
                  </div>
                  <ul className="space-y-2">
                    {study.architectureSolution.map((sol, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <span>{sol}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => setIsBriefingModalOpen(true)}
                  className="w-full py-2 px-3 text-xs font-semibold text-cyan-300 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Request Full Architecture Dossier</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
