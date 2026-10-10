import React from 'react';
import { useCustomization } from '../context/CustomizationContext';
import { Phone, Calendar, ArrowRight, ShieldCheck, CheckCircle2, Award, Terminal, Camera, Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  const { siteConfig, setIsBriefingModalOpen, setIsPhotoEditorOpen, isAdmin } = useCustomization();
  const { hero, founder } = siteConfig;

  const photoStyle = founder.photoStyle || {
    zoom: 1.05,
    brightness: 102,
    contrast: 104,
    objectPosition: 'top',
    borderGlow: 'cyan'
  };

  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950 pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Background Graphic Layer */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        {hero.heroImage && (
          <img
            src={hero.heroImage}
            alt="Enterprise Datacenter Architecture"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.includes('/src/assets/images/')) {
                target.src = target.src.replace('/src/assets/images/', '/assets/images/');
              } else if (target.src.includes('/assets/images/')) {
                target.src = target.src.replace('/assets/images/', '/src/assets/images/');
              }
            }}
            className="w-full h-full object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Proposition and Main Calls */}
          <div className="lg:col-span-7 space-y-6">
            {/* Unboxed Metadata Kicker */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wider text-cyan-400">
              <span>{hero.eyebrow}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">NDA READY</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                &lt; 2 HRS RESPONSE
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]" style={{ textWrap: 'balance' }}>
              {hero.headline}
            </h1>

            {/* Subheadline Prose */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              {hero.subheadline}
            </p>

            {/* Interactive CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setIsBriefingModalOpen(true)}
                className="px-5 py-3 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Architecture Briefing</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={`tel:${founder.phone.replace(/\s+/g, '')}`}
                className="px-5 py-3 text-sm font-medium text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-cyan-400" />
                <span>Call Direct: {founder.phone}</span>
              </a>

              <a
                href="#topology-viewer"
                className="px-4 py-3 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                <span>⚡ Topology Viewer</span>
              </a>

              <a
                href="#platforms-container"
                className="px-4 py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Dedicated Architectures ↓
              </a>
            </div>

            {/* Social Proof Numbers - Adjacent to Proposition */}
            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {hero.stats.map((stat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-400 leading-snug">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Founder Authority Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 shadow-2xl backdrop-blur-md">
              {/* Subtle top indicator */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-300">
                    Lead Principal Architect
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  ACTIVE AVAILABILITY
                </div>
              </div>

              {/* Founder Header */}
              <div className="mt-5 flex items-start gap-4">
                <div className="relative group/avatar shrink-0">
                  <div
                    className={`relative w-24 h-24 rounded-xl overflow-hidden transition-all duration-200 border-2 ${
                      photoStyle.borderGlow === 'cyan'
                        ? 'border-cyan-400/90 shadow-xl shadow-cyan-500/25 ring-2 ring-cyan-500/20'
                        : photoStyle.borderGlow === 'emerald'
                        ? 'border-emerald-400/90 shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-500/20'
                        : photoStyle.borderGlow === 'subtle'
                        ? 'border-slate-600 shadow-lg'
                        : 'border-slate-800'
                    }`}
                  >
                    {founder.portraitImage ? (
                      <img
                        src={founder.portraitImage}
                        alt={founder.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.includes('/src/assets/images/')) {
                            target.src = target.src.replace('/src/assets/images/', '/assets/images/');
                          } else if (target.src.includes('/assets/images/')) {
                            target.src = target.src.replace('/assets/images/', '/src/assets/images/');
                          }
                        }}
                        style={{
                          transform: `scale(${photoStyle.zoom || 1.05})`,
                          filter: `brightness(${photoStyle.brightness || 102}%) contrast(${photoStyle.contrast || 104}%)`,
                          objectPosition: photoStyle.objectPosition || 'top'
                        }}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover/avatar:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xl font-bold bg-slate-800">
                        WS
                      </div>
                    )}

                    {/* Hover Overlay Button to Edit Photo (Visible to Admin Only) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsPhotoEditorOpen(true)}
                        className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-cyan-300 transition-opacity backdrop-blur-[2px] cursor-pointer"
                        title="Click to edit or upload new profile photo"
                      >
                        <Camera className="w-4 h-4 text-cyan-400" />
                        <span>Edit Photo</span>
                      </button>
                    )}
                  </div>

                  {/* Active Verified Indicator or Admin Edit Trigger */}
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setIsPhotoEditorOpen(true)}
                      className="absolute -bottom-2 -right-1 p-1 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 shadow-md transition-colors"
                      title="Change Profile Photo (Admin)"
                    >
                      <Camera className="w-3 h-3 text-cyan-400" />
                    </button>
                  ) : (
                    <div
                      className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border border-cyan-500/60 text-cyan-400 shadow-md"
                      title="Verified Principal VMware Architect"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white truncate">
                      {founder.name}
                    </h3>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsPhotoEditorOpen(true)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>Customize Pic</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-cyan-400 font-medium mt-0.5">
                    {founder.role}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {founder.location}
                  </p>
                </div>
              </div>

              {/* Founder Bio Brief */}
              <p className="mt-4 text-xs text-slate-300 leading-relaxed border-l-2 border-cyan-500/60 pl-3">
                "{founder.bio}"
              </p>

              {/* Certifications & Badges */}
              <div className="mt-5 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Verified Specializations
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {founder.certifications.map((cert, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded border border-slate-800/80"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Booking Strip */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Direct Consultation:</span>
                <a
                  href={`mailto:${founder.email}`}
                  className="text-cyan-400 hover:underline font-mono font-medium"
                >
                  {founder.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
