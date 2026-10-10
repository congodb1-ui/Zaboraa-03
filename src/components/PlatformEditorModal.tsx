import React, { useState, useEffect, useRef } from 'react';
import { useCustomization } from '../context/CustomizationContext';
import { PlatformShowcase } from '../types/siteData';
import {
  X,
  Upload,
  Image as ImageIcon,
  Film,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  Plus,
  Trash2
} from 'lucide-react';

export const PlatformEditorModal: React.FC = () => {
  const { siteConfig, activeEditPlatformId, setActiveEditPlatformId, updatePlatformShowcase } = useCustomization();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPlatform = siteConfig.platformShowcases?.find(p => p.id === activeEditPlatformId);

  const [title, setTitle] = useState('');
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [techTags, setTechTags] = useState<string[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentPlatform) {
      setTitle(currentPlatform.title);
      setBadge(currentPlatform.badge);
      setDescription(currentPlatform.description);
      setMediaType(currentPlatform.mediaType || 'image');
      setImageUrl(currentPlatform.imageUrl);
      setVideoUrl(currentPlatform.videoUrl || '');
      setVideoDuration(currentPlatform.videoDuration || '');
      setDeliverables([...currentPlatform.keyDeliverables]);
      setTechTags([...currentPlatform.techTags]);
    }
  }, [currentPlatform, activeEditPlatformId]);

  if (!activeEditPlatformId || !currentPlatform) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformShowcase(currentPlatform.id, {
      title,
      badge,
      description,
      mediaType,
      imageUrl,
      videoUrl,
      videoDuration,
      keyDeliverables: deliverables.filter(d => d.trim().length > 0),
      techTags: techTags.filter(t => t.trim().length > 0)
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveEditPlatformId(null);
    }, 700);
  };

  const handleAddDeliverable = () => {
    setDeliverables(prev => [...prev, 'New architecture deliverable']);
  };

  const handleUpdateDeliverable = (index: number, val: string) => {
    setDeliverables(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleDeleteDeliverable = (index: number) => {
    setDeliverables(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 lg:p-10 flex items-center justify-center animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Edit Section: {currentPlatform.platform}
              </h3>
              <p className="text-xs text-slate-400">Modify title, description, architecture image, or embedded video</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveEditPlatformId(null)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5 text-xs">
          {/* Title & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-slate-300 font-medium">Section Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Badge Tag</label>
              <input
                type="text"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Architectural Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Media Controls: Image or Video */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Visual Media Asset</span>
              <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                    mediaType === 'image'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Show Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                    mediaType === 'video'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Show Video</span>
                </button>
              </div>
            </div>

            {mediaType === 'image' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                    <img
                      src={imageUrl}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-slate-400">Architecture Image Path or URL</label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="/assets/images/... or https://..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-3 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 rounded-lg text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upload Image Created for This Section</span>
                  </button>
                </div>

                {/* Preset Architecture Diagrams */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-slate-400 text-[11px] font-semibold block">Or Select Built-In High-Res Diagram</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { name: 'Azure AVS', url: '/assets/images/avs_architecture_showcase_1791541766807.jpg' },
                      { name: 'GCVE Engine', url: '/assets/images/gcve_architecture_showcase_1791541780539.jpg' },
                      { name: 'VMC on AWS DR', url: '/assets/images/vmc_aws_migration_dr_showcase_1791541789539.jpg' },
                      { name: 'NSX Microseg', url: '/assets/images/nsx_microsegmentation_showcase_1791541799407.jpg' },
                      { name: 'VMware HCX', url: '/assets/images/hcx_architecture_showcase_1791544913309.jpg' },
                      { name: 'VMware SRM', url: '/assets/images/srm_architecture_showcase_1791544923913.jpg' }
                    ].map(preset => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`p-1.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                          imageUrl === preset.url
                            ? 'bg-slate-800 border-cyan-400 text-white font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="w-6 h-6 rounded overflow-hidden bg-slate-900 shrink-0">
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-400">Embed Video URL (YouTube / Vimeo / MP4)</label>
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube-nocookie.com/embed/..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Video Duration</label>
                    <input
                      type="text"
                      value={videoDuration}
                      onChange={e => setVideoDuration(e.target.value)}
                      placeholder="e.g. 24:18"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Quick Video Embed Preview */}
                {videoUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black border border-slate-800">
                    <iframe
                      src={videoUrl}
                      title="Preview video"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Key Deliverables */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">Key Engineering Deliverables</label>
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 text-[11px]"
              >
                <Plus className="w-3 h-3" />
                <span>Add Bullet</span>
              </button>
            </div>
            <div className="space-y-2">
              {deliverables.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={e => handleUpdateDeliverable(idx, e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteDeliverable(idx)}
                    className="p-2 text-slate-500 hover:text-rose-400"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Technology Tags */}
          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Tech Tags (Comma-Separated)</label>
            <input
              type="text"
              value={techTags.join(', ')}
              onChange={e => setTechTags(e.target.value.split(',').map(s => s.trim()))}
              placeholder="Tag1, Tag2, Tag3"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-[11px]"
            />
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveEditPlatformId(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Apply & Save Section</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
