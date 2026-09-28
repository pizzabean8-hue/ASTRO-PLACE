import React from 'react';
import { X, Car, Gauge, Check, Key } from 'lucide-react';
import { VehicleData } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: VehicleData[];
  playerMoney: number;
  onSpawnVehicle: (vehicleId: string) => void;
  onBuyVehicle: (vehicle: VehicleData) => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  playerMoney,
  onSpawnVehicle,
  onBuyVehicle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <Car className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Astro Motors Showroom & Garage</h2>
              <p className="text-xs text-slate-400">Drive fast and cruise through Astro Place</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vehicle List */}
        <div className="p-5 overflow-y-auto space-y-3 text-xs">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 flex items-center justify-between gap-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border border-white/20"
                  style={{ backgroundColor: v.color }}
                >
                  🚗
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{v.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-amber-400" />
                      {v.speed} km/h
                    </span>
                    <span className="capitalize text-slate-400">· {v.type}</span>
                  </div>
                </div>
              </div>

              <div>
                {v.owned ? (
                  <button
                    onClick={() => {
                      soundManager.playHorn();
                      onSpawnVehicle(v.id);
                      onClose();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                  >
                    <Key className="w-3.5 h-3.5" /> Drive Now
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (playerMoney >= v.price) {
                        soundManager.playCash();
                        onBuyVehicle(v);
                      }
                    }}
                    disabled={playerMoney < v.price}
                    className={`font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md ${
                      playerMoney >= v.price
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 transition-transform active:scale-95'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Buy: Rs. {v.price.toLocaleString()}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
