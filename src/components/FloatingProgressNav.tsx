import React, { useState, useEffect } from 'react';
import { useCustomization } from '../context/CustomizationContext';
import {
  Compass,
  ChevronDown,
  ChevronUp,
  Layers,
  Server,
  Network,
  BookOpen,
  Film,
  Award,
  CheckCircle2,
  FileCode2,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface SectionItem {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
}

export const FloatingProgressNav: React.FC = () => {
  const { theme } = useCustomization();
  const [activeSectionId, setActiveSectionId] = useState<string>('hero');
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const sections: SectionItem[] = [
    { id: 'hero', name: 'Executive Overview', category: 'Foundation', icon: <Server className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'topology-viewer', name: 'Multi-Layer Topology', category: 'Interactive Map', icon: <Layers className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'migration-roadmap', name: 'Migration Strategy Roadmap', category: 'Hyperscaler', icon: <Compass className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'platforms-container', name: 'Dedicated Platforms', category: 'Architecture', icon: <Server className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'aria-operations-networks', name: 'Aria Network & DFW Microseg', category: 'Zero Trust', icon: <Network className="w-3.5 h-3.5 text-indigo-400" /> },
    { id: 'featured-video', name: 'Architecture Masterclass', category: 'Briefing', icon: <Film className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'knowledge-base', name: 'Production KB Runbooks', category: 'Troubleshooting', icon: <HelpCircle className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'tutorials', name: 'Engineering Runbooks', category: 'Whitepapers', icon: <BookOpen className="w-3.5 h-3.5 text-teal-400" /> },
    { id: 'video-hub', name: 'Video Hub & Deep Dives', category: 'Masterclasses', icon: <Film className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'case-studies', name: 'Enterprise Case Studies', category: 'Proven Results', icon: <Award className="w-3.5 h-3.5 text-amber-400" /> }
  ];

  useEffect(() => {
    const handleScroll = () => {
      // Calculate overall scroll percentage
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = Math.min(100, Math.max(0, Math.round((window.scrollY / totalHeight) * 100)));
        setScrollProgress(currentProgress);
      }

      // Detect active section
      const scrollPosition = window.scrollY + 200;
      let current = sections[0].id;

      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            current = section.id;
          }
        }
      }
      setActiveSectionId(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];
  const activeIndex = sections.findIndex(s => s.id === activeSectionId);

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const topOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const goToNextSection = () => {
    if (activeIndex < sections.length - 1) {
      scrollToSection(sections[activeIndex + 1].id);
    }
  };

  const goToPrevSection = () => {
    if (activeIndex > 0) {
      scrollToSection(sections[activeIndex - 1].id);
    }
  };

  return (
    <>
      {/* Floating Header Pill - Centered at Top of Viewport */}
      <aside 
        aria-label="Page navigation progress"
        className="fixed top-3.5 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 max-w-[94vw] sm:max-w-xl w-full"
      >
        <div 
          className={`relative rounded-full shadow-2xl backdrop-blur-md border transition-all duration-200 ${
            theme === 'dark'
              ? 'bg-slate-900/90 border-slate-700/80 text-slate-100 shadow-slate-950/60'
              : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-400/30'
          }`}
        >
          {/* Subtle Progress Bar Underline */}
          <div className="absolute top-0 left-4 right-4 h-0.5 rounded-full overflow-hidden bg-slate-800/40">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400 transition-all duration-150 ease-out"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between px-3.5 py-1.5 gap-2 sm:gap-3 text-xs">
            {/* Left: Indicator & Breadcrumb Path */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 group text-left cursor-pointer hover:opacity-90 transition-opacity truncate"
              title="Click to jump to any architecture section"
            >
              <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 shrink-0">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>

              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold hidden md:inline">
                  {activeSection.category}
                </span>
                <span className="text-slate-500 hidden md:inline">/</span>
                <span className="font-semibold text-xs truncate max-w-[140px] sm:max-w-[220px]">
                  {activeSection.name}
                </span>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-cyan-400' : 'group-hover:text-slate-200'}`} />
            </button>

            {/* Right: Progress % & Next/Prev Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono text-[11px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/50">
                {scrollProgress}%
              </span>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={goToPrevSection}
                  disabled={activeIndex === 0}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 transition-colors"
                  title="Previous Section"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={goToNextSection}
                  disabled={activeIndex === sections.length - 1}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 transition-colors"
                  title="Next Section"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dropdown Navigation Menu */}
        {isMenuOpen && (
          <div 
            className={`mt-2 rounded-2xl p-3 border shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 ${
              theme === 'dark'
                ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/80'
                : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-400/40'
            }`}
          >
            <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Enterprise Architecture Index
              </span>
              <span className="text-[10px] font-mono text-cyan-400">
                {sections.length} Sections
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[60vh] overflow-y-auto scrollbar-thin">
              {sections.map((sec, idx) => {
                const isActive = sec.id === activeSectionId;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-semibold shadow-sm'
                        : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">
                        {`0${idx + 1}`}
                      </span>
                      <span className="shrink-0">{sec.icon}</span>
                      <span className="truncate">{sec.name}</span>
                    </div>

                    {isActive && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Backdrop to close menu when clicked outside */}
      {isMenuOpen && (
        <div 
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
        />
      )}
    </>
  );
};
