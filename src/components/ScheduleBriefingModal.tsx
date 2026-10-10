import React, { useState } from 'react';
import { useCustomization } from '../context/CustomizationContext';
import { X, Calendar, Phone, Mail, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export const ScheduleBriefingModal: React.FC = () => {
  const { siteConfig, isBriefingModalOpen, setIsBriefingModalOpen } = useCustomization();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [cloudFocus, setCloudFocus] = useState('Azure AVS');
  const [vmScale, setVmScale] = useState('500 - 1,500 VMs');
  const [urgency, setUrgency] = useState('Within 60 Days');
  const [notes, setNotes] = useState('');

  if (!isBriefingModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setIsBriefingModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 lg:p-10 flex items-center justify-center animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Schedule Executive Architecture Briefing</h3>
              <p className="text-xs text-slate-400">Direct 45-minute advisory session with Wasim Sayyed</p>
            </div>
          </div>
          <button
            onClick={() => setIsBriefingModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-white">Architecture Briefing Requested</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Thank you, {name}. Principal Architect Wasim Sayyed will personally review your infrastructure profile and respond within 2 business hours.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1 text-left max-w-sm mx-auto">
              <div>Focus: <span className="text-cyan-400 font-semibold">{cloudFocus}</span></div>
              <div>Scale: <span className="text-white">{vmScale}</span></div>
              <div>Priority: <span className="text-emerald-400">{urgency}</span></div>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <a
                href={`tel:${siteConfig.founder.phone.replace(/\s+/g, '')}`}
                className="py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Directly Now ({siteConfig.founder.phone})</span>
              </a>
              <button
                onClick={handleReset}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Henderson"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Work Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="david@enterprise.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Enterprise Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Global Financial Group"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Direct Phone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Primary Focus</label>
                <select
                  value={cloudFocus}
                  onChange={e => setCloudFocus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Azure AVS">Azure AVS</option>
                  <option value="AWS VMC">AWS VMC</option>
                  <option value="Google Cloud GCVE">Google Cloud GCVE</option>
                  <option value="NSX-T Zero-Trust">NSX-T Zero-Trust</option>
                  <option value="VMware VCF 5.x">VMware VCF 5.x</option>
                  <option value="Multi-Cloud Evacuation">Multi-Cloud Evacuation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Workload Scale</label>
                <select
                  value={vmScale}
                  onChange={e => setVmScale(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Under 250 VMs">Under 250 VMs</option>
                  <option value="250 - 500 VMs">250 - 500 VMs</option>
                  <option value="500 - 1,500 VMs">500 - 1,500 VMs</option>
                  <option value="1,500+ VMs">1,500+ VMs (Multi-Petabyte)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Timeline</label>
                <select
                  value={urgency}
                  onChange={e => setUrgency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Urgent (< 30 Days)">Urgent (&lt; 30 Days)</option>
                  <option value="Within 60 Days">Within 60 Days</option>
                  <option value="Next 3 - 6 Months">Next 3 - 6 Months</option>
                  <option value="Strategic Planning">Strategic Planning</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Project Scope & Key Constraints</label>
              <textarea
                rows={3}
                placeholder="Mention datacenter lease expiries, storage capacity requirements, or compliance frameworks..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>NDA & Enterprise Confidentiality Guaranteed</span>
              </span>
              <span>Fast-track response (&lt; 2 hrs)</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 text-xs"
            >
              <span>Confirm Architecture Briefing Request</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
