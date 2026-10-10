import React, { useState } from 'react';
import { useCustomization } from '../context/CustomizationContext';
import { KnowledgeBaseArticle, KBSolutionStep } from '../types/siteData';
import {
  HelpCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  Terminal,
  Shield,
  Layers,
  Server,
  Cloud,
  Repeat,
  Activity,
  Network,
  Share2,
  Calendar,
  ExternalLink
} from 'lucide-react';

export const KnowledgeBaseSection: React.FC = () => {
  const { siteConfig, setIsBriefingModalOpen } = useCustomization();
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [componentFilter, setComponentFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [copiedFullRunbook, setCopiedFullRunbook] = useState<boolean>(false);

  const kbArticles = siteConfig.knowledgeBase || [];

  const components = [
    'All',
    'Azure VMware Solution',
    'Google Cloud VMware Engine',
    'VMware Cloud on AWS',
    'VMware NSX-T',
    'VMware HCX',
    'VMware Site Recovery Manager',
    'VMware Aria Operations for Networks'
  ];

  const filteredArticles = kbArticles.filter(item => {
    const matchesComponent = componentFilter === 'All' || item.component === componentFilter;
    const matchesSeverity = severityFilter === 'All' || item.severity === severityFilter;
    const matchesSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rootCause.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.symptoms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesComponent && matchesSeverity && matchesSearch;
  });

  const handleCopySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleCopyFullRunbook = (article: KnowledgeBaseArticle) => {
    const fullText = `[${article.id}] ${article.title}
Component: ${article.component} | Category: ${article.serviceCategory}
Severity: ${article.severity} | Verified in Production: ${article.verifiedInProduction ? 'YES' : 'NO'}

SYMPTOMS:
${article.symptoms.map(s => `- ${s}`).join('\n')}

ROOT CAUSE:
${article.rootCause}

RESOLUTION STEPS:
${article.resolutionSteps.map(step => `
Step ${step.stepNumber}: ${step.title}
${step.description}
${step.commandSnippet ? `\nCode (${step.commandSnippet.environment || step.commandSnippet.language}):\n${step.commandSnippet.code}\n` : ''}
${step.architectNote ? `Architect Note: ${step.architectNote}\n` : ''}
`).join('\n')}

VERIFICATION:
${article.verificationCheck}
`;
    navigator.clipboard.writeText(fullText);
    setCopiedFullRunbook(true);
    setTimeout(() => setCopiedFullRunbook(false), 2500);
  };

  const getComponentBadgeColor = (component: string) => {
    switch (component) {
      case 'Azure VMware Solution':
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-950/50';
      case 'Google Cloud VMware Engine':
        return 'text-blue-400 border-blue-500/30 bg-blue-950/50';
      case 'VMware Cloud on AWS':
        return 'text-amber-400 border-amber-500/30 bg-amber-950/50';
      case 'VMware NSX-T':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/50';
      case 'VMware HCX':
        return 'text-teal-400 border-teal-500/30 bg-teal-950/50';
      case 'VMware Site Recovery Manager':
        return 'text-rose-400 border-rose-500/30 bg-rose-950/50';
      case 'VMware Aria Operations for Networks':
        return 'text-indigo-400 border-indigo-500/30 bg-indigo-950/50';
      default:
        return 'text-slate-400 border-slate-700 bg-slate-900';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Operational':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <section 
      id="knowledge-base" 
      className="py-20 sm:py-28 bg-slate-950 border-b border-slate-800 scroll-mt-16 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="font-mono text-emerald-400 font-bold tracking-wider">
                FIELD-PROVEN KNOWLEDGE BASE
              </span>
              <span className="text-slate-600">·</span>
              <span className="px-2.5 py-0.5 rounded-full border border-emerald-500/30 text-emerald-300 bg-emerald-950/60 font-mono text-[11px]">
                Production Runbooks
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 font-medium">All Cloud Platforms & VMware Components</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Enterprise Knowledge Base & Engineering Runbooks
            </h2>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              In-depth troubleshooting procedures, exact CLI remediation commands, and root-cause post-mortems crafted from real-world enterprise deployments across AVS, GCVE, VMC on AWS, NSX-T DFW, HCX, SRM, and Aria Networks.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0 self-start md:self-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{kbArticles.length} Verified Production Runbooks</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
          {/* Top Row: Component Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {components.map(comp => (
              <button
                key={comp}
                type="button"
                onClick={() => setComponentFilter(comp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  componentFilter === comp
                    ? 'bg-slate-800 border-cyan-400 text-cyan-300 font-semibold shadow-sm'
                    : 'bg-slate-950/70 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {comp}
              </button>
            ))}
          </div>

          {/* Bottom Row: Search & Severity Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search error codes, symptoms, CLI commands..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
              <span className="text-slate-500 text-[11px] font-mono">Severity:</span>
              {['All', 'Critical', 'High', 'Operational'].map(sev => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    severityFilter === sev
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KB Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredArticles.map(article => (
            <article
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="cursor-pointer group flex flex-col justify-between rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-6 transition-all hover:shadow-2xl hover:shadow-cyan-950/20"
            >
              <div className="space-y-3.5">
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-400 font-bold">
                      {article.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg border font-mono text-[10px] ${getSeverityBadgeColor(article.severity)}`}>
                      {article.severity}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-lg border font-mono text-[10px] ${getComponentBadgeColor(article.component)}`}>
                    {article.component}
                  </span>
                </div>

                {/* Article Title */}
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                  {article.title}
                </h3>

                {/* Root Cause Teaser */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  <strong className="text-slate-300">Root Cause:</strong> {article.rootCause}
                </p>

                {/* Symptoms Preview Bullets */}
                <div className="space-y-1 pt-1">
                  <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold">
                    Key Observed Symptoms:
                  </div>
                  {article.symptoms.slice(0, 2).map((symptom, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-1.5 text-xs text-slate-300">
                      <span className="text-rose-400 font-bold">✕</span>
                      <span className="truncate">{symptom}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Bottom: Steps count & Open Action */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{article.resolutionSteps.length} Step Procedure</span>
                </div>

                <div className="text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>View Runbook</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400 text-xs space-y-2">
            <p>No Knowledge Base runbooks match your search filter.</p>
            <button
              onClick={() => { setComponentFilter('All'); setSeverityFilter('All'); setSearchTerm(''); }}
              className="text-cyan-400 hover:underline font-semibold"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Reader Modal / Full Resolution Runbook Drawer */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-xl p-4 sm:p-6 lg:p-12 flex justify-center animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-8 my-auto">
            {/* Top Close Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-cyan-400 font-bold">
                  {selectedArticle.id}
                </span>
                <span className={`px-2 py-0.5 rounded-lg border font-mono text-[10px] ${getSeverityBadgeColor(selectedArticle.severity)}`}>
                  {selectedArticle.severity}
                </span>
                <span className={`px-2 py-0.5 rounded-lg border font-mono text-[10px] ${getComponentBadgeColor(selectedArticle.component)}`}>
                  {selectedArticle.component}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 font-mono text-[11px]">{selectedArticle.lastUpdated}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyFullRunbook(selectedArticle)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  title="Copy complete runbook to clipboard"
                >
                  {copiedFullRunbook ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Runbook Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Runbook</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                  title="Close Runbook"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Article Header & Verified Badge */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified in Production Deployments</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
                {selectedArticle.title}
              </h2>

              <div className="text-xs text-slate-400 space-y-1">
                <div><strong className="text-slate-300">Service Category:</strong> {selectedArticle.serviceCategory}</div>
                <div><strong className="text-slate-300">Impact Scope:</strong> {selectedArticle.impactScope}</div>
              </div>
            </div>

            {/* Symptoms Box */}
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-2">
              <div className="text-xs font-mono uppercase text-rose-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Observed Symptoms & Error Signatures</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {selectedArticle.symptoms.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Root Cause Post-Mortem */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Technical Root Cause</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedArticle.rootCause}
              </p>
            </div>

            {/* Resolution Steps Runbook */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span>Step-by-Step Resolution Runbook</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {selectedArticle.resolutionSteps.length} Steps
                </span>
              </div>

              <div className="space-y-6">
                {selectedArticle.resolutionSteps.map(step => (
                  <div 
                    key={step.stepNumber} 
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold shrink-0">
                        {step.stepNumber}
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        {step.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pl-8">
                      {step.description}
                    </p>

                    {/* Code Snippet Box */}
                    {step.commandSnippet && (
                      <div className="ml-8 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden text-xs">
                        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                          <span className="text-cyan-400 font-medium">
                            {step.commandSnippet.environment || step.commandSnippet.language}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopySnippet(step.commandSnippet!.code, `step-${step.stepNumber}`)}
                            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedSnippetId === `step-${step.stepNumber}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3.5 font-mono text-[11px] text-cyan-200 overflow-x-auto leading-relaxed scrollbar-thin">
                          <code>{step.commandSnippet.code}</code>
                        </pre>
                      </div>
                    )}

                    {/* Architect Field Note */}
                    {step.architectNote && (
                      <div className="ml-8 p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-300 flex items-start gap-2">
                        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-400" />
                        <div>
                          <strong>Principal Architect Note:</strong> {step.architectNote}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Check */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="text-xs font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Production Verification & Validation Check</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {selectedArticle.verificationCheck}
              </p>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedArticle.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800">
                    #{t}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => { setSelectedArticle(null); setIsBriefingModalOpen(true); }}
                className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-all"
              >
                Schedule Technical Review with Architect
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
