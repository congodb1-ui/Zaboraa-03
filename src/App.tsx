import React from 'react';
import { CustomizationProvider, useCustomization } from './context/CustomizationContext';
import { FloatingProgressNav } from './components/FloatingProgressNav';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MultiLayerTopologyViewer } from './components/MultiLayerTopologyViewer';
import { MigrationStrategyRoadmap } from './components/MigrationStrategyRoadmap';
import { DedicatedPlatformsShowcase } from './components/DedicatedPlatformsShowcase';
import { AriaNetworkDeepDiveSection } from './components/AriaNetworkDeepDiveSection';
import { FeaturedVideoSection } from './components/FeaturedVideoSection';
import { KnowledgeBaseSection } from './components/KnowledgeBaseSection';
import { TutorialsAndArticles } from './components/TutorialsAndArticles';
import { VideoHub } from './components/VideoHub';
import { CaseStudiesSection } from './components/CaseStudiesSection';
import { CustomizerDrawer } from './components/CustomizerDrawer';
import { PhotoEditorModal } from './components/PhotoEditorModal';
import { PlatformEditorModal } from './components/PlatformEditorModal';
import { ScheduleBriefingModal } from './components/ScheduleBriefingModal';
import { SearchCommandModal } from './components/SearchCommandModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { WatermarkSettingsModal } from './components/WatermarkSettingsModal';
import { Footer } from './components/Footer';
import { Sliders, Calendar, Sun, Moon, ShieldCheck, Unlock, LogOut, Eye, EyeOff } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    siteConfig,
    theme,
    toggleTheme,
    isAdmin,
    setIsAdmin,
    setIsCustomizerOpen,
    setIsAdminLoginModalOpen,
    setIsWatermarkModalOpen,
    setIsBriefingModalOpen,
    updateEnableHotspots
  } = useCustomization();

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      } theme-root flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200`}
    >
      {/* Admin Mode Top Status Bar (Only visible when Admin is logged in) */}
      {isAdmin && (
        <div className="sticky top-0 z-50 bg-emerald-950/95 border-b border-emerald-500/40 px-4 py-2 text-xs font-mono text-emerald-200 flex items-center justify-between backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wide">ADMIN MODE: Wasim Sayyed</span>
            <span className="hidden md:inline text-emerald-300/80">· Full Editing Rights & Diagram Control Active</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateEnableHotspots(!siteConfig.enableHotspots)}
              className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                siteConfig.enableHotspots
                  ? 'bg-emerald-900/90 hover:bg-emerald-800 border-emerald-500 text-emerald-100'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title="Globally toggle diagram interactive hotspots across entire site"
            >
              {siteConfig.enableHotspots ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hotspots: ON</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hotspots: OFF</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsWatermarkModalOpen(true)}
              className="px-2.5 py-1 rounded bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-600/70 text-emerald-100 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Watermarks</span>
            </button>
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="px-2.5 py-1 rounded bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-600/70 text-emerald-100 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Site</span>
            </button>
            <button
              onClick={() => {
                setIsAdmin(false);
                try {
                  localStorage.removeItem('zaboraa_admin_session');
                } catch {}
              }}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-emerald-700/70 text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              title="Switch to public client view"
            >
              <LogOut className="w-3 h-3 text-rose-400" />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Progress Indicator & Breadcrumb Navigation */}
      <FloatingProgressNav />

      <Navbar />

      <main className="flex-1">
        <Hero />
        <MultiLayerTopologyViewer />
        <MigrationStrategyRoadmap />
        <DedicatedPlatformsShowcase />
        <AriaNetworkDeepDiveSection />
        <FeaturedVideoSection />
        <KnowledgeBaseSection />
        <TutorialsAndArticles />
        <VideoHub />
        <CaseStudiesSection />
      </main>

      <Footer />

      {/* Floating Action Controls */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 shadow-2xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
          title={theme === 'dark' ? 'Switch to High-Contrast Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Admin-Only Floating Customizer Control (Hidden from regular visitors) */}
        {isAdmin && (
          <>
            <button
              onClick={() => setIsWatermarkModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/50 text-cyan-300 text-xs font-semibold shadow-2xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
              title="Watermark customization"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Watermark</span>
            </button>

            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 text-xs font-semibold shadow-2xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
              title="Open Site Customizer (Admin Full Control)"
            >
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Customize Site</span>
            </button>
          </>
        )}

        <button
          onClick={() => setIsBriefingModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold shadow-2xl transition-all hover:scale-105 cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Call</span>
        </button>
      </div>

      {/* Modals & Drawers */}
      <CustomizerDrawer />
      <PhotoEditorModal />
      <PlatformEditorModal />
      <ScheduleBriefingModal />
      <SearchCommandModal />
      <AdminLoginModal />
      <WatermarkSettingsModal />
    </div>
  );
};

export default function App() {
  return (
    <CustomizationProvider>
      <MainLayout />
    </CustomizationProvider>
  );
}
