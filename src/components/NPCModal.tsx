import React from 'react';
import { X, MessageSquare, Award, ArrowRight } from 'lucide-react';
import { CityNPC } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface NPCModalProps {
  npc: CityNPC | null;
  onClose: () => void;
  onAction: (actionType: string) => void;
}

export const NPCModal: React.FC<NPCModalProps> = ({ npc, onClose, onAction }) => {
  if (!npc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md border border-white/20"
              style={{ backgroundColor: npc.shirtColor }}
            >
              👤
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{npc.name}</h2>
              <span className="text-xs text-amber-400 font-medium">{npc.role}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialogue Box */}
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 text-slate-200 leading-relaxed text-sm shadow-inner">
            "{npc.dialogue[0]}"
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                soundManager.playPhoneChime();
                onAction('lore');
                onClose();
              }}
              className="w-full bg-slate-800 hover:bg-slate-750 p-3 rounded-xl border border-slate-750 flex items-center justify-between font-semibold text-slate-200 transition-colors"
            >
              <span>Tell me more about what you do in Astro Place</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => {
                soundManager.playCash();
                onAction('reward');
                onClose();
              }}
              className="w-full bg-emerald-600/30 hover:bg-emerald-600/40 p-3 rounded-xl border border-emerald-500/40 flex items-center justify-between font-bold text-emerald-300 transition-colors"
            >
              <span>Friendly Chat & Exchange Greetings (+Rs. 1,000)</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
