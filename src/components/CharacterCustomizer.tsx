import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { CharacterCustomization } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface CharacterCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  customization: CharacterCustomization;
  onChange: (updated: CharacterCustomization) => void;
}

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({
  isOpen,
  onClose,
  customization,
  onChange,
}) => {
  if (!isOpen) return null;

  const skinColors = [
    { name: 'Peach', hex: '#ffd1a4' },
    { name: 'Warm Almond', hex: '#ffdbac' },
    { name: 'Honey Sand', hex: '#e0bb95' },
    { name: 'Golden Bronze', hex: '#c68642' },
    { name: 'Caramel', hex: '#8d5524' },
    { name: 'Deep Espresso', hex: '#3b2219' },
  ];

  const shirtColors = [
    { name: 'Royal Blue', hex: '#1e88e5' },
    { name: 'Crimson Red', hex: '#e53935' },
    { name: 'Emerald Green', hex: '#43a047' },
    { name: 'Sunshine Yellow', hex: '#fdd835' },
    { name: 'Neon Purple', hex: '#8e24aa' },
    { name: 'Jet Black', hex: '#212121' },
    { name: 'Pure White', hex: '#f5f5f5' },
    { name: 'Coral Pink', hex: '#ec407a' },
  ];

  const pantsColors = [
    { name: 'Dark Charcoal', hex: '#212121' },
    { name: 'Classic Denim', hex: '#1565c0' },
    { name: 'Khaki Beige', hex: '#bcaaa4' },
    { name: 'Snow White', hex: '#ffffff' },
    { name: 'Forest Green', hex: '#2e7d32' },
    { name: 'Crimson', hex: '#b71c1c' },
  ];

  const hairColors = [
    { name: 'Ebony', hex: '#1a1a1a' },
    { name: 'Dark Chestnut', hex: '#3e2723' },
    { name: 'Golden Blonde', hex: '#ffd54f' },
    { name: 'Auburn Red', hex: '#bf360c' },
    { name: 'Cyan Neon', hex: '#00e5ff' },
    { name: 'Hot Pink', hex: '#ff4081' },
  ];

  const hats: { id: CharacterCustomization['hat']; name: string; icon: string }[] = [
    { id: 'none', name: 'No Hat', icon: '👤' },
    { id: 'cap', name: 'Baseball Cap', icon: '🧢' },
    { id: 'chef', name: 'Pizza Chef Hat', icon: '👨‍🍳' },
    { id: 'police', name: 'Police Cap', icon: '👮' },
    { id: 'party_crown', name: 'Party Crown', icon: '👑' },
  ];

  const accessories: { id: CharacterCustomization['accessory']; name: string; icon: string }[] = [
    { id: 'none', name: 'No Accessory', icon: '🚫' },
    { id: 'backpack', name: 'Traveler Backpack', icon: '🎒' },
    { id: 'wings', name: 'Neon Cyber Wings', icon: '🪽' },
  ];

  const handleUpdate = (partial: Partial<CharacterCustomization>) => {
    soundManager.playFootstep();
    onChange({ ...customization, ...partial });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[88vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Astro Boutique & Wardrobe</h2>
              <p className="text-xs text-slate-400">Style your 3D avatar in real time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customization Options */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Skin Tone */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Skin Tone</label>
            <div className="flex gap-2 flex-wrap">
              {skinColors.map((sc) => (
                <button
                  key={sc.hex}
                  onClick={() => handleUpdate({ skinColor: sc.hex })}
                  style={{ backgroundColor: sc.hex }}
                  className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                    customization.skinColor === sc.hex ? 'border-white scale-110 shadow-md ring-2 ring-blue-400' : 'border-slate-700'
                  }`}
                  title={sc.name}
                >
                  {customization.skinColor === sc.hex && <Check className="w-4 h-4 text-black/70" />}
                </button>
              ))}
            </div>
          </div>

          {/* Hair Style & Color */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Hair Style</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(['spiky', 'curly', 'messy'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => handleUpdate({ hairStyle: style })}
                  className={`py-2 px-3 rounded-xl border font-bold capitalize transition-colors ${
                    customization.hairStyle === style
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            <label className="block text-slate-400 mb-1.5">Hair Color</label>
            <div className="flex gap-2 flex-wrap">
              {hairColors.map((hc) => (
                <button
                  key={hc.hex}
                  onClick={() => handleUpdate({ hairColor: hc.hex })}
                  style={{ backgroundColor: hc.hex }}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                    customization.hairColor === hc.hex ? 'border-white ring-2 ring-blue-400' : 'border-slate-700'
                  }`}
                  title={hc.name}
                >
                  {customization.hairColor === hc.hex && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Shirt Color */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Shirt / Jacket Color</label>
            <div className="flex gap-2 flex-wrap">
              {shirtColors.map((sc) => (
                <button
                  key={sc.hex}
                  onClick={() => handleUpdate({ shirtColor: sc.hex })}
                  style={{ backgroundColor: sc.hex }}
                  className={`w-9 h-9 rounded-xl border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                    customization.shirtColor === sc.hex ? 'border-white ring-2 ring-blue-400' : 'border-slate-700'
                  }`}
                  title={sc.name}
                >
                  {customization.shirtColor === sc.hex && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Pants Color */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Pants Color</label>
            <div className="flex gap-2 flex-wrap">
              {pantsColors.map((pc) => (
                <button
                  key={pc.hex}
                  onClick={() => handleUpdate({ pantsColor: pc.hex })}
                  style={{ backgroundColor: pc.hex }}
                  className={`w-9 h-9 rounded-xl border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                    customization.pantsColor === pc.hex ? 'border-white ring-2 ring-blue-400' : 'border-slate-700'
                  }`}
                  title={pc.name}
                >
                  {customization.pantsColor === pc.hex && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Hats */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Hats & Headgear</label>
            <div className="grid grid-cols-3 gap-2">
              {hats.map((h) => (
                <button
                  key={h.id}
                  onClick={() => handleUpdate({ hat: h.id })}
                  className={`p-2 rounded-xl border font-bold flex flex-col items-center gap-1 transition-colors ${
                    customization.hat === h.id
                      ? 'bg-pink-600 border-pink-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span className="text-xl">{h.icon}</span>
                  <span className="text-[11px] truncate w-full text-center">{h.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accessories */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Accessories</label>
            <div className="grid grid-cols-3 gap-2">
              {accessories.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleUpdate({ accessory: a.id })}
                  className={`p-2 rounded-xl border font-bold flex flex-col items-center gap-1 transition-colors ${
                    customization.accessory === a.id
                      ? 'bg-violet-600 border-violet-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span className="text-xl">{a.icon}</span>
                  <span className="text-[11px] truncate w-full text-center">{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex justify-end">
          <button
            onClick={() => {
              soundManager.playCash();
              onClose();
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg"
          >
            Save Outfit
          </button>
        </div>
      </div>
    </div>
  );
};
