import React, { useState } from 'react';
import { X, Home, Lock, Unlock, Users, Sparkles, Paintbrush } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface HouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  onHostHouseParty: () => void;
}

export const HouseModal: React.FC<HouseModalProps> = ({
  isOpen,
  onClose,
  playerName,
  onHostHouseParty,
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [houseTheme, setHouseTheme] = useState('Modern Ivory');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-200">
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Home className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Luxury Astro Estate #1</h2>
              <p className="text-xs text-slate-400">Claimed by {playerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Security Locks */}
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between">
            <div>
              <p className="font-bold text-white text-sm">Front Gate & Door Lock</p>
              <p className="text-slate-400 text-[11px]">
                {isLocked ? 'Locked (Only you can enter)' : 'Unlocked (Open to all visitors)'}
              </p>
            </div>
            <button
              onClick={() => {
                soundManager.playPhoneChime();
                setIsLocked(!isLocked);
              }}
              className={`p-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
                isLocked ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              {isLocked ? 'Locked' : 'Open'}
            </button>
          </div>

          {/* Exterior Theme */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
              <Paintbrush className="w-4 h-4 text-amber-400" /> Exterior Wall Paint
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Modern Ivory', 'Royal Indigo', 'Emerald Villa', 'Sunset Coral'].map((th) => (
                <button
                  key={th}
                  onClick={() => {
                    soundManager.playFootstep();
                    setHouseTheme(th);
                  }}
                  className={`py-2 px-3 rounded-xl border font-semibold text-center transition-colors ${
                    houseTheme === th
                      ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {th}
                </button>
              ))}
            </div>
          </div>

          {/* Social Host Party */}
          <button
            onClick={() => {
              onHostHouseParty();
              onClose();
            }}
            className="w-full bg-linear-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4" /> Host Estate Housewarming Party!
          </button>
        </div>
      </div>
    </div>
  );
};
