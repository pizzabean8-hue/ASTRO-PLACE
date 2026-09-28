import React, { useState } from 'react';
import { X, PartyPopper, Sparkles, Music, Flame, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../audio/soundManager';

interface PartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchParty: (theme: string) => void;
  onLaunchFireworks: () => void;
}

export const PartyModal: React.FC<PartyModalProps> = ({
  isOpen,
  onClose,
  onLaunchParty,
  onLaunchFireworks,
}) => {
  const [selectedTheme, setSelectedTheme] = useState('Neon Disco Pool Bash');

  if (!isOpen) return null;

  const handleStartParty = () => {
    // Fire festive confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    soundManager.playCheer();
    soundManager.playFirework();
    onLaunchParty(selectedTheme);
    onClose();
  };

  const themes = [
    { id: 'Neon Disco Pool Bash', name: 'Neon Disco Pool Bash', icon: '🪩', desc: 'Flashing strobe lights & EDM bass' },
    { id: 'Astro Pizza Fiesta', name: 'Astro Pizza Fiesta', icon: '🍕', desc: 'Free wood-fired slices & drinks' },
    { id: 'Sunset Beach Club Chill', name: 'Sunset Beach Club Chill', icon: '🌅', desc: 'Lo-fi beats by the pool deck' },
    { id: 'VIP Penthouse Gala', name: 'VIP Penthouse Gala', icon: '👑', desc: 'Red carpet luxury celebration' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
              <PartyPopper className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Astro Party Central</h2>
              <p className="text-xs text-slate-400">Host city-wide social celebrations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold">Select Party Theme</label>
            {themes.map((th) => (
              <button
                key={th.id}
                onClick={() => {
                  soundManager.playFootstep();
                  setSelectedTheme(th.id);
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  selectedTheme === th.id
                    ? 'bg-pink-600/30 border-pink-400 text-white shadow-md'
                    : 'bg-slate-800 border-slate-750 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <span className="text-2xl">{th.icon}</span>
                <div>
                  <h4 className="font-bold text-sm text-white">{th.name}</h4>
                  <p className="text-[11px] text-slate-400">{th.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Fireworks Button */}
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700 flex items-center justify-between">
            <div>
              <p className="font-bold text-white">Sky Fireworks</p>
              <p className="text-slate-400 text-[11px]">Launch sparkling fireworks into the sky</p>
            </div>
            <button
              onClick={() => {
                onLaunchFireworks();
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.7 },
                });
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow-md transition-transform active:scale-95"
            >
              <Flame className="w-3.5 h-3.5" /> Launch
            </button>
          </div>

          {/* Main Action */}
          <button
            onClick={handleStartParty}
            className="w-full bg-linear-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-black py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition-transform active:scale-95"
          >
            <Sparkles className="w-5 h-5" /> Broadcast Party to Astro Place!
          </button>
        </div>
      </div>
    </div>
  );
};
