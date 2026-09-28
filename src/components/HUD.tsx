import React, { useState, useRef } from 'react';
import {
  Smartphone,
  Briefcase,
  Car,
  Sparkles,
  Home,
  PartyPopper,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  Navigation,
  Key,
  Compass,
  MapPin,
  Package,
  Maximize,
  Footprints,
} from 'lucide-react';
import { PlayerProfile, VehicleData, InteractiveZone, DeliveryMission, ActiveParty, ChatMessage } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface HUDProps {
  profile: PlayerProfile;
  activeVehicle: VehicleData | null;
  nearestZone: InteractiveZone | null;
  activeDelivery: DeliveryMission | null;
  activeParty: ActiveParty;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onOpenPhone: () => void;
  onOpenPhoneApp: (app: string) => void;
  onOpenJobs: () => void;
  onOpenGarage: () => void;
  onOpenCustomizer: () => void;
  onOpenHouse: () => void;
  onHostParty: () => void;
  onInteract: () => void;
  onExitVehicle: () => void;
  onHorn: () => void;
  onEmote: (emote: 'dance' | 'wave' | 'cheer') => void;
  onJump: () => void;
  onMoveVirtual: (x: number, z: number) => void;
}

export const HUD: React.FC<HUDProps> = ({
  profile,
  activeVehicle,
  nearestZone,
  activeDelivery,
  activeParty,
  chatMessages,
  onSendMessage,
  onOpenPhone,
  onOpenPhoneApp,
  onOpenJobs,
  onOpenGarage,
  onOpenCustomizer,
  onOpenHouse,
  onHostParty,
  onInteract,
  onExitVehicle,
  onHorn,
  onEmote,
  onJump,
  onMoveVirtual,
}) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [showEmotes, setShowEmotes] = useState(false);

  // Virtual Joystick & Move Controller State
  const [isAutoMoving, setIsAutoMoving] = useState(false);
  const [joystickActive, setJoystickActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [showJoystick, setShowJoystick] = useState(true);
  const joystickRef = useRef<HTMLDivElement>(null);
  const activeDirectionRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });

  const toggleSound = () => {
    const nextMuted = !isMuted;
    soundManager.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const handleToggleFullscreenLandscape = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape');
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  // Virtual Direction Button Handlers (Hold to move)
  const handleDirectionStart = (x: number, z: number) => {
    if (isAutoMoving) setIsAutoMoving(false);
    activeDirectionRef.current = { x, z };
    onMoveVirtual(x, z);
  };

  const handleDirectionEnd = () => {
    if (!isAutoMoving) {
      activeDirectionRef.current = { x: 0, z: 0 };
      onMoveVirtual(0, 0);
    }
  };

  // Toggle Auto Move Forward
  const handleToggleAutoMove = () => {
    const next = !isAutoMoving;
    setIsAutoMoving(next);
    if (next) {
      soundManager.playFootstep();
      activeDirectionRef.current = { x: 0, z: -1 };
      onMoveVirtual(0, -1);
    } else {
      activeDirectionRef.current = { x: 0, z: 0 };
      onMoveVirtual(0, 0);
    }
  };

  // Joystick Pointer Drag Handling
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isAutoMoving) setIsAutoMoving(false);
    setJoystickActive(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const maxRadius = rect.width / 2 - 16;
    const distance = Math.hypot(deltaX, deltaY);

    const clampedDist = Math.min(distance, maxRadius);
    const angle = Math.atan2(deltaY, deltaX);

    const clampedX = Math.cos(angle) * clampedDist;
    const clampedY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: clampedX, y: clampedY });

    if (distance > 6) {
      const normX = clampedX / maxRadius;
      const normY = clampedY / maxRadius;
      onMoveVirtual(normX, normY);
    } else {
      onMoveVirtual(0, 0);
    }
  };

  const handlePointerUp = () => {
    setJoystickActive(false);
    setKnobPos({ x: 0, y: 0 });
    if (!isAutoMoving) {
      onMoveVirtual(0, 0);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-3 select-none">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-3 pointer-events-auto">
        {/* Game Title & Server Status */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3.5 py-2 text-white shadow-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-amber-400 to-red-500 flex items-center justify-center font-black text-lg shadow-md">
            🚀
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wide text-transparent bg-clip-text bg-linear-to-r from-amber-300 via-pink-400 to-indigo-300">
                ASTRO PLACE
              </h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/30">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <span>🇮🇳 West Bengal</span>
              <span>·</span>
              <span className="font-mono text-amber-300 font-bold">{profile.astroNumber}</span>
            </p>
          </div>
        </div>

        {/* Floating Active Mission / Party Banner */}
        {activeDelivery && (
          <div className="hidden sm:flex bg-amber-500/90 text-slate-950 font-bold px-3 py-1.5 rounded-xl shadow-lg items-center gap-2 text-xs border border-amber-300 animate-pulse">
            <span>🍕 Deliver {activeDelivery.pizzaName} to {activeDelivery.targetNpcName}</span>
            <span className="bg-black/80 text-amber-300 px-2 py-0.5 rounded-md text-[11px]">
              +Rs. {activeDelivery.reward.toLocaleString()}
            </span>
          </div>
        )}

        {activeParty.active && (
          <div className="hidden sm:flex bg-pink-600/90 text-white font-bold px-3 py-1.5 rounded-xl shadow-lg items-center gap-2 text-xs border border-pink-400 animate-pulse">
            <span>🎉 PARTY ACTIVE: {activeParty.theme} at the Villa!</span>
          </div>
        )}

        {/* Right Stats & Controls */}
        <div className="flex items-center gap-2">
          {/* Wallet */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-2 text-white shadow-xl flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-xs">₹</span>
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Wallet</p>
              <p className="text-sm font-black text-emerald-400 leading-none">
                Rs. {profile.money.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Job Badge */}
          <div className="hidden md:flex bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-2 text-white shadow-xl items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">{profile.job}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="w-10 h-10 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white shadow-xl transition-transform active:scale-95"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Landscape / Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreenLandscape}
            className="w-10 h-10 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 flex items-center justify-center text-amber-300 hover:text-white shadow-xl transition-transform active:scale-95 hover:border-amber-400"
            title="Toggle Widescreen Landscape Mode"
          >
            <Maximize className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* CENTER PROXIMITY INTERACTIVE PROMPT */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-auto">
        {nearestZone && !activeVehicle && (
          <button
            onClick={onInteract}
            className="bg-linear-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-2xl border-2 border-white/40 flex items-center gap-2.5 transform hover:scale-105 active:scale-95 transition-all animate-bounce"
          >
            <span className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center font-mono text-xs">
              E
            </span>
            <span>{nearestZone.name}</span>
          </button>
        )}

        {/* In-Vehicle Driving HUD */}
        {activeVehicle && (
          <div className="bg-slate-900/90 backdrop-blur-md border-2 border-amber-500/60 rounded-3xl p-4 text-white shadow-2xl flex items-center gap-4 animate-in fade-in">
            <div className="text-center">
              <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Driving</span>
              <h3 className="font-bold text-sm text-white">{activeVehicle.name}</h3>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <button
              onClick={onHorn}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-md"
            >
              Honk [H]
            </button>
            <button
              onClick={onExitVehicle}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-md"
            >
              Exit [E]
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM AREA: CHAT & QUICK ACTION DOCK */}
      <div className="flex items-end justify-between gap-4 pointer-events-auto">
        {/* Left: Move Controls & In-game City Roleplay Chat */}
        <div className="w-72 sm:w-84 flex flex-col justify-end gap-2.5">
          {/* Virtual Move D-Pad & 360° Joystick */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Move Controller</span>
                {isAutoMoving && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                    Auto-Moving
                  </span>
                )}
              </span>
              <button
                onClick={() => setShowJoystick(!showJoystick)}
                className="text-[10px] text-slate-400 hover:text-white bg-slate-800/60 px-2 py-0.5 rounded-lg border border-slate-700"
              >
                {showJoystick ? 'Minimize' : 'Show Move Pad'}
              </button>
            </div>

            {showJoystick && (
              <div className="relative w-36 h-36 bg-slate-900/85 backdrop-blur-md rounded-full border-2 border-slate-700 shadow-2xl flex items-center justify-center select-none touch-none">
                {/* Up / Forward Button */}
                <button
                  onPointerDown={() => handleDirectionStart(0, -1)}
                  onPointerUp={handleDirectionEnd}
                  onPointerLeave={handleDirectionEnd}
                  className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-800/90 hover:bg-emerald-600 active:bg-emerald-500 text-white flex items-center justify-center text-xs shadow-md border border-slate-600 transition-colors"
                  title="Move Forward [W]"
                >
                  ▲
                </button>

                {/* Down / Backward Button */}
                <button
                  onPointerDown={() => handleDirectionStart(0, 1)}
                  onPointerUp={handleDirectionEnd}
                  onPointerLeave={handleDirectionEnd}
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-800/90 hover:bg-emerald-600 active:bg-emerald-500 text-white flex items-center justify-center text-xs shadow-md border border-slate-600 transition-colors"
                  title="Move Backward [S]"
                >
                  ▼
                </button>

                {/* Left Button */}
                <button
                  onPointerDown={() => handleDirectionStart(-1, 0)}
                  onPointerUp={handleDirectionEnd}
                  onPointerLeave={handleDirectionEnd}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-800/90 hover:bg-emerald-600 active:bg-emerald-500 text-white flex items-center justify-center text-xs shadow-md border border-slate-600 transition-colors"
                  title="Move Left [A]"
                >
                  ◀
                </button>

                {/* Right Button */}
                <button
                  onPointerDown={() => handleDirectionStart(1, 0)}
                  onPointerUp={handleDirectionEnd}
                  onPointerLeave={handleDirectionEnd}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-800/90 hover:bg-emerald-600 active:bg-emerald-500 text-white flex items-center justify-center text-xs shadow-md border border-slate-600 transition-colors"
                  title="Move Right [D]"
                >
                  ▶
                </button>

                {/* Draggable 360-Degree Analog Joystick Knob */}
                <div
                  ref={joystickRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{
                    transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                  }}
                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shadow-lg border-2 transition-transform duration-75 ${
                    joystickActive || isAutoMoving
                      ? 'bg-linear-to-tr from-emerald-500 to-teal-400 border-white text-slate-950 scale-105 ring-4 ring-emerald-500/40 font-black'
                      : 'bg-linear-to-tr from-slate-700 to-slate-600 border-slate-400 text-white'
                  }`}
                  title="Drag knob to walk in any direction"
                >
                  <span className="text-[10px] font-black tracking-wider leading-none">MOVE</span>
                  <span className="text-[8px] opacity-80 mt-0.5">DRAG</span>
                </div>
              </div>
            )}
          </div>

          {/* In-game City Chat */}
          {chatOpen ? (
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 text-white shadow-2xl flex flex-col h-48 animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/10 text-xs">
                <span className="font-bold text-slate-300">City Chat</span>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-slate-400 hover:text-white text-[11px]"
                >
                  Hide
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                {chatMessages.slice(-8).map((msg) => (
                  <div key={msg.id} className="leading-snug">
                    <span className="font-bold text-amber-400">{msg.sender}: </span>
                    <span className="text-slate-200">{msg.text}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="flex gap-1.5 pt-1.5 mt-1 border-t border-white/10">
                <input
                  type="text"
                  placeholder="Say something to the city..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-white/10 rounded-lg px-2 py-1 text-xs text-white border border-white/20 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 px-2.5 py-1 rounded-lg text-xs font-bold"
                >
                  Send
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setChatOpen(true)}
              className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 hover:bg-slate-800 text-white px-3 py-2 rounded-2xl text-xs font-bold shadow-lg flex items-center gap-2 self-start"
            >
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>City Chat</span>
            </button>
          )}
        </div>

        {/* Center: Quick Action Dock */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-3xl p-1.5 sm:p-2 shadow-2xl flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-[92vw]">
          {/* MOVE BUTTON [W] */}
          <button
            onPointerDown={() => handleDirectionStart(0, -1)}
            onPointerUp={handleDirectionEnd}
            onPointerLeave={handleDirectionEnd}
            onClick={handleToggleAutoMove}
            className={`flex flex-col items-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl text-white transition-all transform hover:-translate-y-1 active:scale-95 ${
              isAutoMoving
                ? 'bg-emerald-600/90 text-white shadow-lg ring-2 ring-emerald-400 animate-pulse'
                : 'hover:bg-white/15'
            }`}
            title="MOVE: Walk forward [W / Hold or Tap to Auto-Walk]"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${
              isAutoMoving ? 'bg-emerald-400 text-slate-950 font-black' : 'bg-linear-to-tr from-emerald-500 to-teal-600 text-white'
            }`}>
              <Footprints className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold mt-0.5">
              {isAutoMoving ? 'Stop' : 'Move [W]'}
            </span>
          </button>

          {/* Phone [P] */}
          <button
            onClick={onOpenPhone}
            className="flex flex-col items-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-white/15 text-white transition-all transform hover:-translate-y-1 active:scale-95"
            title="Open Smartphone [P]"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <span className="text-[9px] font-bold mt-0.5">Phone [P]</span>
          </button>

          {/* Astro Map [M] */}
          <button
            onClick={() => onOpenPhoneApp('map')}
            className="flex flex-col items-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-white/15 text-white transition-all transform hover:-translate-y-1 active:scale-95"
            title="Open Astro Map [M]"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-emerald-500 to-teal-700 flex items-center justify-center shadow-md">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="text-[9px] font-bold mt-0.5">Map [M]</span>
          </button>

          {/* Comms [C] */}
          <button
            onClick={() => onOpenPhoneApp('comms')}
            className="flex flex-col items-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-white/15 text-white transition-all transform hover:-translate-y-1 active:scale-95"
            title="Open Comms [C]"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-cyan-500 to-blue-700 flex items-center justify-center shadow-md">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-[9px] font-bold mt-0.5">Comms [C]</span>
          </button>

          {/* Job Hub [J] */}
          <button
            onClick={() => onOpenPhoneApp('jobs')}
            className="flex flex-col items-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-white/15 text-white transition-all transform hover:-translate-y-1 active:scale-95"
            title="Open Job Hub [J]"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-amber-500 to-orange-700 flex items-center justify-center shadow-md">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-[9px] font-bold mt-0.5">Jobs [J]</span>
          </button>

          {/* Inventory [I] */}
          <button
            onClick={() => onOpenPhoneApp('inventory')}
            className="flex flex-col items-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-white/15 text-white transition-all transform hover:-translate-y-1 active:scale-95"
            title="Open Inventory & Clothing [I]"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-purple-500 to-indigo-700 flex items-center justify-center shadow-md">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-[9px] font-bold mt-0.5">Items [I]</span>
          </button>

          {/* Garage */}
          <button
            onClick={onOpenGarage}
            className="hidden md:flex flex-col items-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-white/15 text-white transition-all transform hover:-translate-y-1 active:scale-95"
            title="Spawn Vehicle"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-red-500 to-orange-600 flex items-center justify-center shadow-md">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="text-[9px] font-bold mt-0.5">Garage</span>
          </button>

          {/* House */}
          <button
            onClick={onOpenHouse}
            className="hidden sm:flex flex-col items-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-white/15 text-white transition-all transform hover:-translate-y-1 active:scale-95"
            title="Manage Claimed House"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-[9px] font-bold mt-0.5">House</span>
          </button>

          {/* Host Party */}
          <button
            onClick={onHostParty}
            className="flex flex-col items-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-white/15 text-white transition-all transform hover:-translate-y-1 active:scale-95"
            title="Host Villa Party"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-md animate-pulse">
              <PartyPopper className="w-4 h-4 text-white" />
            </div>
            <span className="text-[9px] font-bold mt-0.5">Party</span>
          </button>

          {/* Emotes Dropup */}
          <div className="relative">
            <button
              onClick={() => setShowEmotes(!showEmotes)}
              className="flex flex-col items-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-white/15 text-white transition-all transform hover:-translate-y-1 active:scale-95"
              title="Social Roleplay Emotes"
            >
              <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                🕺
              </div>
              <span className="text-[9px] font-bold mt-0.5">Emotes</span>
            </button>

            {showEmotes && (
              <div className="absolute bottom-full mb-3 right-0 bg-slate-900/95 border border-slate-700 rounded-2xl p-2 shadow-2xl flex flex-col gap-1.5 w-32 animate-in zoom-in-95">
                <button
                  onClick={() => {
                    onEmote('dance');
                    setShowEmotes(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs font-semibold text-left flex items-center gap-1.5"
                >
                  <span>💃</span> Dance
                </button>
                <button
                  onClick={() => {
                    onEmote('wave');
                    setShowEmotes(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs font-semibold text-left flex items-center gap-1.5"
                >
                  <span>👋</span> Wave
                </button>
                <button
                  onClick={() => {
                    onEmote('cheer');
                    setShowEmotes(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs font-semibold text-left flex items-center gap-1.5"
                >
                  <span>🎉</span> Cheer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: On-screen Action buttons for mobile / touch */}
        <div className="flex flex-col gap-2.5 items-center">
          {/* Dedicated Prominent MOVE BUTTON */}
          <button
            onPointerDown={() => handleDirectionStart(0, -1)}
            onPointerUp={handleDirectionEnd}
            onPointerLeave={handleDirectionEnd}
            onClick={handleToggleAutoMove}
            className={`w-16 h-16 rounded-2xl backdrop-blur-md border text-white font-bold flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-all ${
              isAutoMoving
                ? 'bg-linear-to-tr from-emerald-500 to-teal-400 border-white ring-4 ring-emerald-500/50 text-slate-950 animate-pulse'
                : 'bg-slate-900/90 border-slate-700 hover:border-emerald-400 text-slate-100 hover:bg-slate-800'
            }`}
            title="MOVE: Hold to walk forward, or tap to toggle auto-walk [W]"
          >
            <span className="text-2xl">🏃</span>
            <span className="text-[10px] uppercase font-black tracking-wider leading-none mt-0.5">
              {isAutoMoving ? 'STOP' : 'MOVE'}
            </span>
          </button>

          {/* Jump Button */}
          <button
            onClick={onJump}
            className="w-14 h-14 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700 text-white font-bold flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform hover:border-blue-400"
            title="Jump [Space]"
          >
            <span className="text-lg">⬆️</span>
            <span className="text-[9px] uppercase font-bold leading-none mt-0.5">Jump</span>
          </button>
        </div>
      </div>

      {/* Floating Auto-Move Active Banner */}
      {isAutoMoving && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 pointer-events-auto bg-emerald-600/95 backdrop-blur-md text-white font-bold px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-emerald-300 animate-in fade-in slide-in-from-top-2 text-xs z-50">
          <span className="flex items-center gap-1.5 animate-pulse">
            <span>🏃</span>
            <span>AUTO-WALKING FORWARD</span>
          </span>
          <button
            onClick={handleToggleAutoMove}
            className="bg-black/50 hover:bg-black/70 text-emerald-300 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase border border-white/20 transition-colors"
          >
            STOP [W]
          </button>
        </div>
      )}
    </div>
  );
};
