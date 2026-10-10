import React, { useState } from 'react';
import { useCustomization } from '../context/CustomizationContext';
import {
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Type,
  X,
  CheckCircle2,
  Sliders,
  Eye,
  Trash2,
  Sparkles
} from 'lucide-react';

export const WatermarkSettingsModal: React.FC = () => {
  const {
    siteConfig,
    isWatermarkModalOpen,
    setIsWatermarkModalOpen,
    updateWatermarkConfig
  } = useCustomization();

  const currentWatermark = siteConfig.watermark || {
    enabled: true,
    type: 'text',
    text: 'ZABORAA TECHNOLOGIES · HYBRID CLOUD BLUEPRINT',
    position: 'bottom-right',
    opacity: 0.35
  };

  const [enabled, setEnabled] = useState(currentWatermark.enabled);
  const [type, setType] = useState<'text' | 'image'>(currentWatermark.type);
  const [text, setText] = useState(currentWatermark.text);
  const [imageUrl, setImageUrl] = useState(currentWatermark.imageUrl || '');
  const [position, setPosition] = useState(currentWatermark.position);
  const [opacity, setOpacity] = useState(currentWatermark.opacity);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isWatermarkModalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
          setType('image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateWatermarkConfig({
      enabled,
      type,
      text,
      imageUrl,
      position,
      opacity
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsWatermarkModalOpen(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Architecture Diagram Watermark
              </h3>
              <p className="text-[11px] text-slate-400">
                Brand protection & intellectual property overlay for all diagrams
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsWatermarkModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Toggle */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Display Watermark Across Images</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${enabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>
                {enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              When disabled, all blueprints and architecture images display without watermark.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              enabled ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                enabled ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {enabled && (
          <div className="space-y-4">
            {/* Watermark Type Selector */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setType('text')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  type === 'text'
                    ? 'bg-slate-800 border-cyan-400 text-white font-bold shadow-sm'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Type className="w-4 h-4 text-cyan-400" />
                <span>Text Watermark</span>
              </button>

              <button
                type="button"
                onClick={() => setType('image')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  type === 'image'
                    ? 'bg-slate-800 border-cyan-400 text-white font-bold shadow-sm'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Upload Logo / Stamp</span>
              </button>
            </div>

            {/* Type Specific Fields */}
            {type === 'text' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300 font-semibold">
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. ZABORAA TECHNOLOGIES · CONFIDENTIAL"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center justify-between">
                  <span>Watermark Image Asset</span>
                  <span className="text-[10px] text-slate-500 font-normal">PNG with transparency recommended</span>
                </label>

                {imageUrl ? (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg bg-slate-900 border border-slate-700 p-1 flex items-center justify-center overflow-hidden">
                        <img src={imageUrl} alt="Watermark preview" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-white">Custom Watermark Image</div>
                        <div className="text-[10px] text-emerald-400 font-mono">Ready to apply</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-950/50 rounded-lg transition-colors"
                      title="Remove custom watermark image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-400/80 bg-slate-950/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group">
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    <span className="text-xs text-slate-300 font-medium">
                      Click to upload your watermark logo/image (PNG / SVG / JPG)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {/* Position and Opacity Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300 font-semibold">
                  Placement Position
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="bottom-right">Bottom Right (Standard)</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                  <option value="center">Center Stamp</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-300 font-semibold">
                  <span>Opacity</span>
                  <span className="text-cyan-400">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Live Interactive Preview */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Live Preview on Blueprint:</span>
              <div className="relative aspect-video max-h-36 w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                <div className="text-[10px] font-mono text-slate-600">Sample Architecture Blueprint Canvas</div>
                <div
                  className={`absolute pointer-events-none ${
                    position === 'top-left' ? 'top-2 left-2' :
                    position === 'top-right' ? 'top-2 right-2' :
                    position === 'bottom-left' ? 'bottom-2 left-2' :
                    position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                    'bottom-2 right-2'
                  }`}
                  style={{ opacity }}
                >
                  {type === 'image' && imageUrl ? (
                    <img src={imageUrl} alt="watermark" className="max-h-6 w-auto object-contain" />
                  ) : (
                    <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-cyan-300 uppercase">
                      {text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setIsWatermarkModalOpen(false)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-slate-950" /> : <Sparkles className="w-4 h-4" />}
            <span>{savedSuccess ? 'Watermark Applied!' : 'Save Watermark'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
