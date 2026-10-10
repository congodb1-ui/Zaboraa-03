import React, { useState } from 'react';
import { useCustomization } from '../context/CustomizationContext';
import { Search, Sliders, Calendar, Menu, X, Sun, Moon, Sparkles, Lock, Unlock, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    siteConfig,
    theme,
    toggleTheme,
    isAdmin,
    setIsAdminLoginModalOpen,
    setIsWatermarkModalOpen,
    setIsCustomizerOpen,
    setIsBriefingModalOpen,
    setIsSearchOpen
  } = useCustomization();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark (Single text element in display style) */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-sm shadow-cyan-500/20 text-sm tracking-tight">
            Z
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
            {siteConfig.brand}
          </span>
        </a>

        {/* Zone 2: Navigation Links (Clean text links with hover underline / transitions) */}
        <nav className="hidden xl:flex items-center gap-4 text-xs font-semibold text-slate-300">
          <a href="#topology-viewer" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <span className="text-cyan-400">⚡</span>
            <span>Topology</span>
          </a>
          <a href="#migration-roadmap" className="hover:text-cyan-400 text-cyan-300 font-bold transition-colors flex items-center gap-1">
            <span className="text-cyan-400">🗺️</span>
            <span>Roadmap</span>
          </a>
          <a href="#section-avs" className="hover:text-cyan-400 transition-colors">
            AVS
          </a>
          <a href="#section-gcve" className="hover:text-blue-400 transition-colors">
            GCVE
          </a>
          <a href="#section-vmc-dr" className="hover:text-amber-400 transition-colors">
            VMC on AWS
          </a>
          <a href="#section-nsx" className="hover:text-emerald-400 transition-colors">
            NSX-T
          </a>
          <a href="#section-hcx" className="hover:text-teal-400 transition-colors font-bold text-teal-300">
            HCX
          </a>
          <a href="#section-srm" className="hover:text-rose-400 transition-colors font-bold text-rose-300">
            SRM
          </a>
          <a href="#aria-operations-networks" className="hover:text-indigo-400 transition-colors font-bold text-indigo-300">
            Aria Network
          </a>
          <a href="#knowledge-base" className="hover:text-emerald-400 transition-colors font-bold text-emerald-300">
            KB Runbooks
          </a>
          <a href="#featured-video" className="hover:text-cyan-400 transition-colors">
            Videos
          </a>
          <a href="#tutorials" className="hover:text-cyan-400 transition-colors">
            Tutorials
          </a>
          <a href="#case-studies" className="hover:text-cyan-400 transition-colors">
            Case Studies
          </a>
        </nav>

        {/* Zone 3: Primary Actions & Theme Switcher & Customizer */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Global Theme Toggle: Dark vs High-Contrast Light */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
            title={theme === 'dark' ? 'Switch to High-Contrast Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme mode"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline text-[11px]">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline text-[11px]">Dark Mode</span>
              </>
            )}
          </button>

          {/* Quick Search Button (Ctrl+K) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
            title="Search tutorials, diagrams & videos (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
              ⌘K
            </kbd>
          </button>

          {/* Admin Controls (Visible Only to Admin) */}
          {isAdmin ? (
            <>
              <button
                onClick={() => setIsWatermarkModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800 rounded-md transition-all whitespace-nowrap"
                title="Configure and upload watermarks"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Watermark</span>
              </button>

              <button
                onClick={() => setIsCustomizerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 rounded-md transition-all whitespace-nowrap"
                title="Open Site Customizer to edit content, add diagrams & tutorials"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Customize</span>
              </button>

              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 rounded-md transition-all whitespace-nowrap"
                title="Admin session active - click to manage or exit"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsAdminLoginModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md transition-colors"
              title="Architect Admin Login"
              aria-label="Architect Admin Login"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Primary CTA: Schedule Briefing */}
          <button
            onClick={() => setIsBriefingModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Call</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 text-slate-400 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation panel */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-slate-800 bg-slate-950/95 px-4 pt-3 pb-5 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-300">
            <a
              href="#topology-viewer"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-cyan-400 font-semibold flex items-center gap-1.5"
            >
              <span>⚡ Multi-Layer Topology Viewer</span>
            </a>
            <a
              href="#migration-roadmap"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-cyan-300 font-bold flex items-center gap-1.5"
            >
              <span>🗺️ Migration Strategy Roadmap (Azure/AWS/GCP)</span>
            </a>
            <a
              href="#section-avs"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-cyan-400"
            >
              Azure VMware Solution (AVS)
            </a>
            <a
              href="#section-gcve"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-blue-400"
            >
              Google Cloud VMware Engine (GCVE)
            </a>
            <a
              href="#section-vmc-dr"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-amber-400"
            >
              VMC on AWS Migration & DR
            </a>
            <a
              href="#section-nsx"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-emerald-400"
            >
              NSX Network Security & DFW
            </a>
            <a
              href="#section-hcx"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-teal-300 font-semibold"
            >
              VMware HCX Mobility & MON
            </a>
            <a
              href="#section-srm"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-rose-300 font-semibold"
            >
              VMware Site Recovery Manager (SRM)
            </a>
            <a
              href="#aria-operations-networks"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-indigo-300 font-semibold"
            >
              VMware Aria Operations for Networks
            </a>
            <a
              href="#knowledge-base"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-emerald-300 font-semibold"
            >
              Enterprise Knowledge Base (KB)
            </a>
            <a
              href="#featured-video"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-cyan-400"
            >
              Featured Masterclass Video
            </a>
            <a
              href="#tutorials"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-cyan-400"
            >
              Tutorials & Guides
            </a>
            <a
              href="#videos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-cyan-400"
            >
              Video Masterclass Archive
            </a>
            <a
              href="#case-studies"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-cyan-400"
            >
              Enterprise Case Studies
            </a>
          </nav>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 py-1.5 text-xs text-slate-300"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
              <span>Toggle {theme === 'dark' ? 'High-Contrast Light Mode' : 'Dark Mode'}</span>
            </button>
            <button
              onClick={() => {
                setIsBriefingModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="px-3 py-1.5 bg-white text-slate-950 font-bold rounded text-xs"
            >
              Schedule Briefing
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
