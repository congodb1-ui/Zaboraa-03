import React, { useState } from 'react';
import { useCustomization } from '../context/CustomizationContext';
import { TutorialArticle } from '../types/siteData';
import {
  BookOpen,
  Search,
  Clock,
  Tag,
  Copy,
  Check,
  ArrowRight,
  Plus,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  X,
  FileText,
  User,
  Calendar
} from 'lucide-react';

export const TutorialsAndArticles: React.FC = () => {
  const { siteConfig, setIsCustomizerOpen, selectedTutorial, setSelectedTutorial } = useCustomization();
  const [filterType, setFilterType] = useState<'all' | 'tutorial' | 'article'>('all');
  const [providerFilter, setProviderFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const providers = ['All', 'Azure AVS', 'AWS VMC', 'Google Cloud GCVE', 'NSX-T SDN', 'Multi-Cloud'];

  const filteredItems = siteConfig.tutorials.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesProvider = providerFilter === 'All' || item.provider === providerFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesProvider && matchesSearch;
  });

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <section id="tutorials" className="py-20 bg-slate-950 border-b border-slate-800 scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Engineering Knowledge Base
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Software Tutorials & Architectural Runbooks
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Production playbooks, PowerCLI automation scripts, and step-by-step migration procedures written by our principal architect.
            </p>
          </div>

          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/80 rounded-lg transition-colors whitespace-nowrap self-start md:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish New Guide</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-2 bg-slate-900/80 rounded-xl border border-slate-800">
          {/* Content Type Filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Articles ({siteConfig.tutorials.length})
            </button>
            <button
              onClick={() => setFilterType('tutorial')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'tutorial'
                  ? 'bg-slate-800 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tutorials & Playbooks
            </button>
            <button
              onClick={() => setFilterType('article')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'article'
                  ? 'bg-slate-800 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Architectural Papers
            </button>
          </div>

          {/* Cloud Provider Filter & Search */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <select
              value={providerFilter}
              onChange={e => setProviderFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {providers.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <div className="relative min-w-[200px] flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search tutorials, scripts..."
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Tutorial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <article
              key={item.id}
              onClick={() => setSelectedTutorial(item)}
              className="cursor-pointer group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 p-6 transition-all hover:border-slate-700 hover:shadow-xl hover:shadow-cyan-950/20"
            >
              <div className="space-y-3">
                {/* Unboxed Metadata Line */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono uppercase text-cyan-400 font-medium">
                    {item.provider}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.readTime}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.difficulty}</span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                  {item.title}
                </h3>

                {/* Summary */}
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              {/* Card Footer: Tags & Action */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-[70%]">
                  <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{item.tags.join(', ')}</span>
                </div>
                <div className="text-cyan-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0">
                  <span>Read</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="p-8 text-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 text-xs">
            No tutorials found matching your search. Try resetting filters or publish a new guide using the button above.
          </div>
        )}
      </div>

      {/* Reader Modal / Deep-Dive View */}
      {selectedTutorial && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 lg:p-12 flex justify-center animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-8 my-auto">
            {/* Top Close Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono text-cyan-400 uppercase font-semibold">
                  {selectedTutorial.provider}
                </span>
                <span>/</span>
                <span>{selectedTutorial.category}</span>
                <span>/</span>
                <span>{selectedTutorial.readTime}</span>
              </div>
              <button
                onClick={() => setSelectedTutorial(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg transition-colors"
                title="Close Reader"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Article Header */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {selectedTutorial.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{selectedTutorial.author.name} ({selectedTutorial.author.title})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedTutorial.publishedDate}</span>
                </div>
              </div>
            </div>

            {/* Prerequisites Checklist */}
            {selectedTutorial.prerequisites && selectedTutorial.prerequisites.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Prerequisites & Quota Checklist
                </div>
                <ul className="space-y-1.5">
                  {selectedTutorial.prerequisites.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sections Flow */}
            <div className="space-y-8">
              {selectedTutorial.sections.map((section, idx) => (
                <div key={idx} className="space-y-3">
                  <h3 className="text-lg font-bold text-white">
                    {section.heading}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {section.content}
                  </p>

                  {/* Architecture Callout */}
                  {section.callout && (
                    <div
                      className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                        section.callout.type === 'warning'
                          ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                          : section.callout.type === 'architect-note'
                          ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-200'
                          : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                      }`}
                    >
                      {section.callout.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      ) : (
                        <Lightbulb className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                      )}
                      <div>{section.callout.text}</div>
                    </div>
                  )}

                  {/* Code Block with Copy Button */}
                  {section.codeBlock && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                      <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs bg-slate-900/50">
                        <span className="font-mono text-slate-400">
                          {section.codeBlock.description || section.codeBlock.language}
                        </span>
                        <button
                          onClick={() => handleCopy(section.codeBlock!.code, `code-${idx}`)}
                          className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          {copiedCodeId === `code-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedCodeId === `code-${idx}` ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                        <code>{section.codeBlock.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Found a typo or have an enterprise question? Contact {siteConfig.founder.email}
              </span>
              <button
                onClick={() => setSelectedTutorial(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-white rounded-lg hover:bg-slate-200 transition-colors"
              >
                Back to Knowledge Base
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
