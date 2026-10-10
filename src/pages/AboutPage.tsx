import React from 'react';
import { Link } from 'react-router-dom';
import { useCustomization } from '../context/CustomizationContext';
import {
  Calendar,
  ShieldCheck,
  Award,
  Mail,
  MapPin,
  CheckCircle2,
  Sliders,
  ExternalLink,
  FolderGit2
} from 'lucide-react';
import { resolveMediaUrl, GOOGLE_DRIVE_CONFIG } from '../data/mediaAssets';

export const AboutPage: React.FC = () => {
  const { siteConfig, setIsBriefingModalOpen, isAdmin, setIsPhotoEditorOpen } = useCustomization();
  const founder = siteConfig.founder;

  const resolvedPortrait = resolveMediaUrl(
    founder.portraitImage,
    '/assets/images/wasim_sayyed_executive_1791473154875.jpg'
  );

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-cyan-300">About Principal Architect</span>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Portrait & Credentials (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl group">
            <img
              src={resolvedPortrait}
              alt={founder.name}
              referrerPolicy="no-referrer"
              className="w-full h-auto object-cover max-h-[500px]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/images/wasim_sayyed_executive_1791473154875.jpg';
              }}
            />
            {isAdmin && (
              <button
                onClick={() => setIsPhotoEditorOpen(true)}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>[Edit Portrait]</span>
              </button>
            )}
            <div className="p-6 bg-slate-950/90 border-t border-slate-800 space-y-3">
              <div>
                <h2 className="text-xl font-bold text-white">{founder.name}</h2>
                <div className="text-xs font-mono text-cyan-300 mt-0.5">{founder.role}</div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>{founder.location}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>{founder.email}</span>
              </div>
            </div>
          </div>

          {/* Certifications Box */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Validated Certifications & Credentials</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {founder.certifications.map((cert, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Narrative Bio & Advisory Services (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-xs font-mono text-cyan-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PRINCIPAL ARCHITECTURAL DESK</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Enterprise Cloud Architecture & Advisory
            </h1>
            <p className="text-base text-slate-300 leading-relaxed pt-2">
              {founder.bio}
            </p>
          </div>

          {/* Core Advisory Pillars */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider text-slate-400">
              Advisory Specializations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Hyperscaler Procurement & Sizing',
                  desc: 'Prevent cluster over-provisioning through decoupled external NFS storage architectures (ANF / FSx ONTAP).'
                },
                {
                  title: 'HCX Zero-Downtime Migration',
                  desc: 'Production wave sequencing, Network Extension L2 broadcast domain stretching, and MON traffic routing.'
                },
                {
                  title: 'NSX-T Microsegmentation',
                  desc: 'Zero-trust distributed firewall rule discovery via Aria Operations for Networks before hyperscaler cutover.'
                },
                {
                  title: 'Disaster Recovery Validation',
                  desc: 'SRM non-disruptive failover testing, recovery time objective (RTO) sequencing, and WAN delta modeling.'
                }
              ].map((pil, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{pil.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {pil.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Google Drive Workspace Card */}
          <div className="p-6 rounded-xl bg-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/40 shrink-0">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Cloud Architecture Workspace</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Access downloadable blueprints, client dossiers, and architecture templates stored in our shared Google Drive repository.
                </p>
              </div>
            </div>
            <a
              href={GOOGLE_DRIVE_CONFIG.folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shrink-0"
            >
              <span>Drive Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Book Briefing CTA */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsBriefingModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm transition-all shadow-xl hover:scale-105 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Strategic Architecture Briefing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
