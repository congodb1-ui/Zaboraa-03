import React from 'react';
import { useCustomization } from '../context/CustomizationContext';
import { ShieldCheck, Phone, Mail, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const { siteConfig, setIsBriefingModalOpen, setIsCustomizerOpen, setIsAdminLoginModalOpen } = useCustomization();
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
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs">
                Z
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                {siteConfig.brand}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              {siteConfig.brandTagline}. Architecting high-consequence hybrid cloud evacuations and sovereign VMware environments across Azure AVS, AWS VMC, and Google Cloud GCVE.
            </p>
            <div className="pt-1 flex items-center gap-3 text-slate-400">
              <div className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-semibold">NDA Protected Engagement</span>
              </div>
            </div>
          </div>

          {/* Col 2: Dedicated Cloud Platforms */}
          <div className="space-y-3">
            <div className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Dedicated Architectures
            </div>
            <ul className="space-y-2">
              <li>
                <a href="#topology-viewer" className="hover:text-cyan-400 transition-colors font-semibold text-cyan-300">
                  ⚡ Multi-Layer Topology Viewer
                </a>
              </li>
              <li>
                <a href="#section-avs" className="hover:text-cyan-400 transition-colors">
                  Azure VMware Solution (AVS)
                </a>
              </li>
              <li>
                <a href="#section-gcve" className="hover:text-blue-400 transition-colors">
                  Google Cloud VMware Engine (GCVE)
                </a>
              </li>
              <li>
                <a href="#section-vmc-dr" className="hover:text-amber-400 transition-colors">
                  VMC on AWS Migration & DR
                </a>
              </li>
              <li>
                <a href="#section-nsx" className="hover:text-emerald-400 transition-colors">
                  NSX-T Network & Zero-Trust DFW
                </a>
              </li>
              <li>
                <a href="#section-hcx" className="hover:text-teal-400 transition-colors font-medium text-teal-300">
                  VMware HCX Workload Mobility & MON
                </a>
              </li>
              <li>
                <a href="#section-srm" className="hover:text-rose-400 transition-colors font-medium text-rose-300">
                  VMware Site Recovery Manager (SRM)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources & Blueprints */}
          <div className="space-y-3">
            <div className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Knowledge Hub
            </div>
            <ul className="space-y-2">
              <li>
                <a href="#featured-video" className="hover:text-cyan-400 transition-colors">
                  Featured Masterclass Video
                </a>
              </li>
              <li>
                <a href="#tutorials" className="hover:text-cyan-400 transition-colors">
                  Software Tutorials & Guides
                </a>
              </li>
              <li>
                <a href="#videos" className="hover:text-cyan-400 transition-colors">
                  Video Masterclasses Archive
                </a>
              </li>
              <li>
                <a href="#case-studies" className="hover:text-cyan-400 transition-colors">
                  Enterprise Case Studies
                </a>
              </li>
              <li>
                <button
                  onClick={() => setIsCustomizerOpen(true)}
                  className="text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Customizer Studio
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Executive Contact */}
          <div className="space-y-3">
            <div className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Direct Architect Desk
            </div>
            <div className="space-y-2 text-slate-300">
              <div className="font-semibold text-white">{founder.name}</div>
              <div className="text-slate-400">{founder.role}</div>
              <div className="pt-1">
                <a
                  href={`tel:${founder.phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-1.5 text-cyan-400 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{founder.phone}</span>
                </a>
              </div>
              <div>
                <a
                  href={`mailto:${founder.email}`}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>{founder.email}</span>
                </a>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setIsBriefingModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-md text-xs font-semibold"
                >
                  Schedule Advisory Call
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <div>
            © {new Date().getFullYear()} {siteConfig.brand}. All rights reserved. VMware, NSX, vSphere, and HCX are registered trademarks of Broadcom.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAdminLoginModalOpen(true)}
              className="text-slate-500 hover:text-cyan-400 transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Architect Administrator Access Portal"
            >
              <span>Architect Portal</span>
            </button>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
