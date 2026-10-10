import React from 'react';
import { Link } from 'react-router-dom';
import { useCustomization } from '../context/CustomizationContext';
import { Hero } from '../components/Hero';
import { CaseStudiesSection } from '../components/CaseStudiesSection';
import {
  Layers,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  FileSpreadsheet,
  Activity,
  Calendar,
  Sparkles
} from 'lucide-react';
import { resolveMediaUrl } from '../data/mediaAssets';

export const HomePage: React.FC = () => {
  const { siteConfig, setIsBriefingModalOpen } = useCustomization();

  return (
    <div className="space-y-16">
      {/* 1. Hero Executive Overview */}
      <Hero />

      {/* 2. Interactive Engineering Workbench Teaser Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>SELF-SERVICE ARCHITECTURAL SUITE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Interactive Cloud Engineering Workbench
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Run production-grade calculations before initiating hyperscaler procurement. Size nodes with external decoupled storage (ANF / FSx), parse real RVTools spreadsheets, calculate DR replication WAN bandwidth, and generate validated hybrid blueprints.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Node Sizing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>RVTools Parser</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-400" />
                  <span>DR RPO/RTO</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>BOM Generator</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                to="/tools"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm transition-all shadow-lg hover:scale-[1.02]"
              >
                <span>Launch Engineering Workbench</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/blueprints"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
              >
                <span>Explore Topology Mapper</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Dynamic Disciplines & Platform Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-2">
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Hyperscaler & Software-Defined Platforms
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Architectural Disciplines & Validated Blueprints
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Production architectures engineered across Microsoft Azure, Amazon Web Services, Google Cloud, and VMware software-defined infrastructure.
            </p>
          </div>
          <Link
            to="/blueprints"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>View All Topology Blueprints</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dynamic Cards Grid from siteConfig.platformShowcases */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(siteConfig.platformShowcases || []).map(platform => {
            const resolvedImg = resolveMediaUrl(platform.imageUrl);
            return (
              <div
                key={platform.id}
                className="flex flex-col justify-between rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 group overflow-hidden shadow-lg"
              >
                {/* Image Header with Scrim */}
                <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={resolvedImg}
                    alt={platform.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/hero_cloud_datacenter_1791450064361.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-cyan-300 backdrop-blur-md">
                      {platform.badge}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-slate-400">
                      {platform.platform}
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {platform.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {platform.description}
                    </p>
                  </div>

                  {/* Tech Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {platform.techTags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono text-slate-400 bg-slate-950/80 border border-slate-800/80 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {platform.techTags.length > 3 && (
                      <span className="text-[10px] font-mono text-slate-500 px-1 py-0.5">
                        +{platform.techTags.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Navigation CTA */}
                  <div className="pt-4 border-t border-slate-800/80">
                    <Link
                      to={`/disciplines/${platform.id}`}
                      className="inline-flex items-center justify-between w-full text-xs font-semibold text-cyan-400 group-hover:text-cyan-300"
                    >
                      <span>Explore Architecture & Specs</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Verified Case Studies & Enterprise Track Record */}
      <CaseStudiesSection />

      {/* 5. Executive Advisory CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Plan Your Cloud Architecture with Lead Principal Architect Wasim Sayyed
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Direct executive briefing covering VMware license optimization, decoupled storage economics, HCX zero-downtime cutover windows, and hyperscaler networking.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsBriefingModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm transition-all shadow-xl hover:scale-105 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Architecture Briefing</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
