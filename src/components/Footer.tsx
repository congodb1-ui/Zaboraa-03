import React from 'react';
import { Link } from 'react-router-dom';
import { useCustomization } from '../context/CustomizationContext';
import { ShieldCheck, Phone, Mail, ArrowUp, FolderGit2, ExternalLink } from 'lucide-react';
import { GOOGLE_DRIVE_CONFIG } from '../data/mediaAssets';

export const Footer: React.FC = () => {
  const { siteConfig, setIsBriefingModalOpen, setIsCustomizerOpen, setIsAdminLoginModalOpen, isAdmin } = useCustomization();
  const { founder } = siteConfig;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs">
                Z
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                {siteConfig.brand}
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              {siteConfig.brandTagline}. Architecting high-consequence hybrid cloud evacuations and sovereign VMware environments across Azure AVS, AWS VMC, and Google Cloud GCVE.
            </p>
            <div className="pt-1 flex items-center gap-3 text-slate-400">
              <div className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-semibold">NDA Protected Engagement</span>
              </div>
            </div>

            {/* Google Drive Workspace Badge */}
            <div className="pt-2">
              <a
                href={GOOGLE_DRIVE_CONFIG.folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs hover:border-cyan-400 transition-colors"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Google Drive Cloud Workspace</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </div>
          </div>

          {/* Col 2: Engineering Workbench Tools */}
          <div className="space-y-3">
            <div className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Engineering Tools
            </div>
            <ul className="space-y-2">
              <li>
                <Link to="/tools" className="hover:text-cyan-400 transition-colors font-semibold text-cyan-300">
                  Workbench Overview
                </Link>
              </li>
              <li>
                <Link to="/tools/sizing" className="hover:text-cyan-400 transition-colors">
                  Node & Storage Sizing
                </Link>
              </li>
              <li>
                <Link to="/tools/rvtools-analyzer" className="hover:text-cyan-400 transition-colors">
                  RVTools Migration Readiness
                </Link>
              </li>
              <li>
                <Link to="/tools/dr-planner" className="hover:text-cyan-400 transition-colors">
                  DR RPO/RTO & WAN Sizing
                </Link>
              </li>
              <li>
                <Link to="/tools/design-generator" className="hover:text-cyan-400 transition-colors">
                  Hybrid Blueprint Generator
                </Link>
              </li>
              <li>
                <Link to="/blueprints" className="hover:text-cyan-400 transition-colors">
                  Interactive Blueprints
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Dedicated Platforms */}
          <div className="space-y-3">
            <div className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Architectural Disciplines
            </div>
            <ul className="space-y-2">
              {(siteConfig.platformShowcases || []).slice(0, 6).map(p => (
                <li key={p.id}>
                  <Link to={`/disciplines/${p.id}`} className="hover:text-cyan-400 transition-colors">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Principal Architect & Contact */}
          <div className="space-y-3">
            <div className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Principal Architect Desk
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-slate-200">{founder.name}</div>
              <div className="text-[11px] text-cyan-300">{founder.role}</div>
              <div className="text-[11px] text-slate-400">{founder.location}</div>
              <div className="pt-2 space-y-1.5">
                <a
                  href={`mailto:${founder.email}`}
                  className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors text-slate-300"
                >
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{founder.email}</span>
                </a>
                <a
                  href={`tel:${founder.phone}`}
                  className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors text-slate-300"
                >
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{founder.phone}</span>
                </a>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setIsBriefingModalOpen(true)}
                  className="px-3 py-1.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Schedule Technical Call
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} {siteConfig.brand}. All rights reserved. Enterprise VMware Cloud Architecture & Hyperscaler Migration Engineering.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link to="/resources" className="hover:text-white transition-colors">
              Knowledge Hub
            </Link>
            <Link to="/case-studies" className="hover:text-white transition-colors">
              Case Studies
            </Link>
            {isAdmin ? (
              <button
                onClick={() => setIsCustomizerOpen(true)}
                className="hover:text-emerald-400 transition-colors font-mono cursor-pointer"
              >
                [Admin Customizer]
              </button>
            ) : (
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="hover:text-slate-300 transition-colors text-slate-600 cursor-pointer"
              >
                Admin
              </button>
            )}
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer ml-2"
              title="Back to top"
            >
              <span>Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
