import React, { useState, useEffect } from 'react';
import { X, Check, Flame, Pizza, Coffee, HeartPulse, ShieldAlert, Sparkles, Award } from 'lucide-react';
import { JobRole } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface JobStationModalProps {
  isOpen: boolean;
  stationType:
    | 'job_pizza'
    | 'job_hospital'
    | 'job_cafe'
    | 'job_police'
    | 'job_chinese'
    | 'job_indian'
    | 'job_lax_pizza'
    | 'lax_mansion'
    | 'all';
  currentRole: JobRole;
  onSetRole: (role: JobRole) => void;
  onClose: () => void;
  onReward: (amount: number, reason: string) => void;
}

export const JobStationModal: React.FC<JobStationModalProps> = ({
  isOpen,
  stationType,
  currentRole,
  onSetRole,
  onClose,
  onReward,
}) => {
  // Tabs within workstations
  const [activeTab, setActiveTab] = useState<
    'chef' | 'cashier' | 'barista' | 'doctor' | 'police' | 'chinese' | 'indian' | 'gelato' | 'mansion'
  >(
    stationType === 'job_hospital'
      ? 'doctor'
      : stationType === 'job_cafe'
      ? 'barista'
      : stationType === 'job_police'
      ? 'police'
      : stationType === 'job_chinese'
      ? 'chinese'
      : stationType === 'job_indian'
      ? 'indian'
      : stationType === 'job_lax_pizza'
      ? 'gelato'
      : stationType === 'lax_mansion'
      ? 'mansion'
      : 'chef'
  );

  // Pizza Chef State
  const [doughState, setDoughState] = useState<'raw' | 'kneaded' | 'sauced' | 'cheesed' | 'topped' | 'baking' | 'ready'>('raw');
  const [bakeProgress, setBakeProgress] = useState(0);
  const [selectedTopping, setSelectedTopping] = useState<'pepperoni' | 'paneer' | 'olives'>('pepperoni');

  // Cashier State
  const [customerOrder, setCustomerOrder] = useState<{ item: string; price: number; icon: string } | null>(null);

  // Barista State
  const [coffeeStep, setCoffeeStep] = useState<number>(0);

  // Doctor State
  const [patientHealth, setPatientHealth] = useState(45);

  // Chinese Wok State
  const [wokStep, setWokStep] = useState<number>(0);

  // Indian Tandoor State
  const [tandoorStep, setTandoorStep] = useState<number>(0);

  // LAX Gelato State
  const [selectedGelato, setSelectedGelato] = useState<string[]>([]);

  // Mega Mansion Butler State
  const [mansionStep, setMansionStep] = useState<number>(0);

  // Update tab if stationType changes
  useEffect(() => {
    if (stationType === 'job_hospital') setActiveTab('doctor');
    else if (stationType === 'job_cafe') setActiveTab('barista');
    else if (stationType === 'job_police') setActiveTab('police');
    else if (stationType === 'job_chinese') setActiveTab('chinese');
    else if (stationType === 'job_indian') setActiveTab('indian');
    else if (stationType === 'job_lax_pizza') setActiveTab('gelato');
    else if (stationType === 'lax_mansion') setActiveTab('mansion');
    else if (stationType === 'job_pizza') setActiveTab('chef');
  }, [stationType]);

  // Cashier initial order
  useEffect(() => {
    if (activeTab === 'cashier' && !customerOrder) {
      generateCashierOrder();
    }
  }, [activeTab]);

  const generateCashierOrder = () => {
    const orders = [
      { item: 'Spicy Paneer Tikka Pizza & Lemon Soda', price: 2800, icon: '🍕' },
      { item: 'Double Mozzarella Crust & Garlic Sticks', price: 3200, icon: '🧀' },
      { item: 'Astro Deluxe Pepperoni Special', price: 3500, icon: '🍕' },
      { item: 'Choco Lava Cake & Mango Blast', price: 2400, icon: '🍰' },
    ];
    setCustomerOrder(orders[Math.floor(Math.random() * orders.length)]);
  };

  if (!isOpen) return null;

  // PIZZA CHEF ACTIONS
  const handleKnead = () => {
    soundManager.playFootstep();
    setDoughState('kneaded');
  };

  const handleSauce = () => {
    soundManager.playFootstep();
    setDoughState('sauced');
  };

  const handleCheese = () => {
    soundManager.playFootstep();
    setDoughState('cheesed');
  };

  const handleAddTopping = () => {
    soundManager.playFootstep();
    setDoughState('topped');
  };

  const handleStartBake = () => {
    soundManager.playFootstep();
    setDoughState('baking');
    setBakeProgress(0);

    const interval = setInterval(() => {
      setBakeProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDoughState('ready');
          soundManager.playOvenDing();
          return 100;
        }
        return prev + 25;
      });
    }, 450);
  };

  const handleServePizza = () => {
    soundManager.playCash();
    const earnings = 3500;
    onReward(earnings, 'Pizza Chef Work Reward');
    setDoughState('raw');
    setBakeProgress(0);
  };

  // CASHIER ACTIONS
  const handleCompleteOrder = () => {
    if (!customerOrder) return;
    soundManager.playCash();
    onReward(customerOrder.price, `Cashier: Served ${customerOrder.item}`);
    generateCashierOrder();
  };

  // BARISTA ACTIONS
  const handleBaristaNext = () => {
    soundManager.playFootstep();
    if (coffeeStep < 3) {
      setCoffeeStep(coffeeStep + 1);
    } else {
      soundManager.playCash();
      onReward(3000, 'Barista Craft Beverage Reward');
      setCoffeeStep(0);
    }
  };

  // DOCTOR ACTIONS
  const handleHealStep = (amount: number) => {
    soundManager.playCheer();
    const nextH = Math.min(100, patientHealth + amount);
    setPatientHealth(nextH);
    if (nextH >= 100) {
      setTimeout(() => {
        soundManager.playCash();
        onReward(4500, 'Doctor: Patient Healed & Discharged');
        setPatientHealth(45);
      }, 500);
    }
  };

  // POLICE ACTIONS
  const handlePatrolAlert = () => {
    soundManager.playSiren();
    setTimeout(() => {
      soundManager.playCash();
      onReward(4000, 'Police Dispatch: City Sector Secured');
    }, 1200);
  };

  // CHINESE WOK ACTIONS
  const handleChineseWokNext = () => {
    soundManager.playFootstep();
    if (wokStep < 4) {
      setWokStep(wokStep + 1);
    } else {
      soundManager.playCash();
      onReward(4500, 'Chinese Wok Chef: Golden Dragon Hakka Feast');
      setWokStep(0);
    }
  };

  // INDIAN TANDOOR ACTIONS
  const handleIndianTandoorNext = () => {
    soundManager.playFootstep();
    if (tandoorStep < 4) {
      setTandoorStep(tandoorStep + 1);
    } else {
      soundManager.playCash();
      onReward(4800, 'Indian Tandoor Chef: Royal Maharaja Thali');
      setTandoorStep(0);
    }
  };

  // LAX PIZZA CAFE & GELATO ACTIONS
  const handleGelatoToggle = (flavor: string) => {
    soundManager.playFootstep();
    setSelectedGelato((prev) =>
      prev.includes(flavor) ? prev.filter((f) => f !== flavor) : [...prev, flavor]
    );
  };

  const handleGelatoServe = () => {
    soundManager.playCash();
    onReward(4200, 'LAX Pizza Cafe: Artisanal Pizza & Gelato Combo');
    setSelectedGelato([]);
  };

  // MEGA MANSION BUTLER ACTIONS
  const handleMansionNext = () => {
    soundManager.playCheer();
    if (mansionStep < 3) {
      setMansionStep(mansionStep + 1);
    } else {
      soundManager.playCash();
      onReward(5000, 'Royal Grand Mansion: VIP Estate Host Reward');
      setMansionStep(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Astro Work Station</h2>
              <p className="text-xs text-slate-400">
                Current Role: <span className="text-amber-400 font-semibold">{currentRole}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Job Station Tabs */}
        <div className="flex bg-slate-800/50 p-2 gap-2 border-b border-slate-700/60 overflow-x-auto text-xs">
          <button
            onClick={() => {
              setActiveTab('chef');
              onSetRole('Pizza Chef');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'chef' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Pizza className="w-4 h-4" /> Pizza Chef
          </button>
          <button
            onClick={() => {
              setActiveTab('cashier');
              onSetRole('Pizza Chef');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'cashier' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🍕 Pizza Cashier
          </button>
          <button
            onClick={() => {
              setActiveTab('barista');
              onSetRole('Cafe Barista');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'barista' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coffee className="w-4 h-4" /> Barista
          </button>
          <button
            onClick={() => {
              setActiveTab('doctor');
              onSetRole('Doctor');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'doctor' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HeartPulse className="w-4 h-4" /> Doctor
          </button>
          <button
            onClick={() => {
              setActiveTab('police');
              onSetRole('Police Officer');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'police' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Police
          </button>
          <button
            onClick={() => {
              setActiveTab('chinese');
              onSetRole('Chinese Wok Chef');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'chinese' ? 'bg-red-700 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🥢 Chinese Wok
          </button>
          <button
            onClick={() => {
              setActiveTab('indian');
              onSetRole('Indian Tandoor Chef');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'indian' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🍛 Indian Tandoor
          </button>
          <button
            onClick={() => {
              setActiveTab('gelato');
              onSetRole('LAX Pizza Chef');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'gelato' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🍨 LAX Pizza & Gelato
          </button>
          <button
            onClick={() => {
              setActiveTab('mansion');
              onSetRole('Mega Mansion Butler');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'mansion' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🏰 Mega Mansion
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* 1. PIZZA CHEF MINIGAME */}
          {activeTab === 'chef' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                <div>
                  <h3 className="font-bold text-white text-sm">Stone Fire Pizza Oven</h3>
                  <p className="text-xs text-slate-400">Roll dough, add toppings, bake & serve!</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Earn: Rs. 3,500
                </span>
              </div>

              {/* Pizza Board Visual */}
              <div className="relative w-48 h-48 mx-auto rounded-full bg-amber-950/40 border-4 border-amber-900/60 flex items-center justify-center shadow-inner overflow-hidden">
                {doughState === 'raw' && (
                  <div className="w-24 h-24 rounded-full bg-amber-200 border-2 border-amber-300 shadow-md flex items-center justify-center text-xs font-bold text-amber-900">
                    Dough Ball
                  </div>
                )}
                {doughState === 'kneaded' && (
                  <div className="w-38 h-38 rounded-full bg-amber-100 border-2 border-amber-200 shadow-sm flex items-center justify-center text-xs font-bold text-amber-800">
                    Rolled Crust
                  </div>
                )}
                {doughState === 'sauced' && (
                  <div className="w-38 h-38 rounded-full bg-red-600 border-4 border-amber-200 shadow-sm flex items-center justify-center text-xs font-bold text-white">
                    Tomato Marinara
                  </div>
                )}
                {doughState === 'cheesed' && (
                  <div className="w-38 h-38 rounded-full bg-yellow-300 border-4 border-amber-200 shadow-sm flex items-center justify-center text-xs font-bold text-amber-900">
                    Melted Mozzarella
                  </div>
                )}
                {doughState === 'topped' && (
                  <div className="w-38 h-38 rounded-full bg-yellow-300 border-4 border-amber-200 shadow-sm flex items-center justify-center relative">
                    <span className="text-xs font-bold text-amber-900">Topped Pizza</span>
                    <span className="absolute top-4 left-6 text-xl">
                      {selectedTopping === 'pepperoni' ? '🍕' : selectedTopping === 'paneer' ? '🧀' : '🫒'}
                    </span>
                    <span className="absolute bottom-5 right-6 text-xl">
                      {selectedTopping === 'pepperoni' ? '🍕' : selectedTopping === 'paneer' ? '🧀' : '🫒'}
                    </span>
                    <span className="absolute top-6 right-7 text-xl">
                      {selectedTopping === 'pepperoni' ? '🍕' : selectedTopping === 'paneer' ? '🧀' : '🫒'}
                    </span>
                  </div>
                )}
                {doughState === 'baking' && (
                  <div className="w-38 h-38 rounded-full bg-linear-to-tr from-orange-600 to-amber-500 border-4 border-amber-300 flex flex-col items-center justify-center text-white">
                    <Flame className="w-8 h-8 text-yellow-300 animate-pulse" />
                    <span className="text-xs font-bold mt-1">Baking {bakeProgress}%</span>
                  </div>
                )}
                {doughState === 'ready' && (
                  <div className="w-38 h-38 rounded-full bg-linear-to-tr from-amber-500 to-yellow-400 border-4 border-amber-600 flex flex-col items-center justify-center text-amber-950 font-bold shadow-lg">
                    <span className="text-2xl">🍕</span>
                    <span className="text-xs">Crispy & Golden!</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {doughState === 'raw' && (
                  <button
                    onClick={handleKnead}
                    className="col-span-2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95"
                  >
                    1. Knead & Roll Crust
                  </button>
                )}
                {doughState === 'kneaded' && (
                  <button
                    onClick={handleSauce}
                    className="col-span-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95"
                  >
                    2. Spread Tomato Sauce
                  </button>
                )}
                {doughState === 'sauced' && (
                  <button
                    onClick={handleCheese}
                    className="col-span-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95"
                  >
                    3. Sprinkle Mozzarella
                  </button>
                )}
                {doughState === 'cheesed' && (
                  <div className="col-span-2 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTopping('pepperoni')}
                        className={`flex-1 py-1.5 rounded-lg border font-semibold ${
                          selectedTopping === 'pepperoni'
                            ? 'bg-red-700 border-red-400 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        Pepperoni
                      </button>
                      <button
                        onClick={() => setSelectedTopping('paneer')}
                        className={`flex-1 py-1.5 rounded-lg border font-semibold ${
                          selectedTopping === 'paneer'
                            ? 'bg-amber-700 border-amber-400 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        Paneer Tikka
                      </button>
                      <button
                        onClick={() => setSelectedTopping('olives')}
                        className={`flex-1 py-1.5 rounded-lg border font-semibold ${
                          selectedTopping === 'olives'
                            ? 'bg-emerald-700 border-emerald-400 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        Olives
                      </button>
                    </div>
                    <button
                      onClick={handleAddTopping}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95"
                    >
                      4. Add Selected Topping
                    </button>
                  </div>
                )}
                {doughState === 'topped' && (
                  <button
                    onClick={handleStartBake}
                    className="col-span-2 bg-linear-to-r from-red-600 to-amber-600 hover:opacity-95 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    <Flame className="w-5 h-5" /> 5. Put in Stone Oven
                  </button>
                )}
                {doughState === 'baking' && (
                  <div className="col-span-2 text-center py-2 text-amber-400 font-bold">
                    Oven is blazing hot... Please wait!
                  </div>
                )}
                {doughState === 'ready' && (
                  <button
                    onClick={handleServePizza}
                    className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    <Sparkles className="w-5 h-5" /> Box Up & Collect Rs. 3,500!
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. CASHIER MINIGAME */}
          {activeTab === 'cashier' && customerOrder && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">
                    {customerOrder.icon}
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold">Customer Order</span>
                    <h4 className="font-bold text-base text-white">{customerOrder.item}</h4>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Due</span>
                  <span className="text-emerald-400 font-bold text-base">
                    Rs. {customerOrder.price.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCompleteOrder}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Check className="w-5 h-5" /> Ring Cash Register & Take Payment (+Rs.{' '}
                {customerOrder.price})
              </button>
            </div>
          )}

          {/* 3. BARISTA */}
          {activeTab === 'barista' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-center">
                <div className="text-4xl mb-2">☕</div>
                <h4 className="font-bold text-base">Astro Espresso Barista Machine</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Step {coffeeStep + 1} of 4:{' '}
                  {coffeeStep === 0
                    ? 'Grind roasted arabica beans'
                    : coffeeStep === 1
                    ? 'Tamp and pull double espresso shot'
                    : coffeeStep === 2
                    ? 'Steam fresh creamy milk'
                    : 'Pour silky latte art!'}
                </p>
              </div>

              <button
                onClick={handleBaristaNext}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                {coffeeStep < 3 ? 'Perform Next Step' : 'Serve Coffee & Collect Rs. 3,000!'}
              </button>
            </div>
          )}

          {/* 4. DOCTOR */}
          {activeTab === 'doctor' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-400">Patient Health Gauge</span>
                  <span className="text-xs font-bold text-cyan-400">{patientHealth}%</span>
                </div>
                <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-300"
                    style={{ width: `${patientHealth}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleHealStep(20)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl shadow-md"
                >
                  🩹 Apply Healing Dressing (+20%)
                </button>
                <button
                  onClick={() => handleHealStep(35)}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl shadow-md"
                >
                  💉 Vitamin Booster Shot (+35%)
                </button>
              </div>
            </div>
          )}

          {/* 5. POLICE */}
          {activeTab === 'police' && (
            <div className="space-y-4 text-center">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <div className="text-4xl mb-2">🚨</div>
                <h4 className="font-bold text-base">Astro Police City Radar</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Scan traffic cameras and dispatch security patrol units to keep the city safe.
                </p>
              </div>

              <button
                onClick={handlePatrolAlert}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <ShieldAlert className="w-5 h-5" /> Sound Siren & Broadcast Safe City (+Rs. 4,000)
              </button>
            </div>
          )}

          {/* 6. CHINESE WOK CHEF (GOLDEN DRAGON DYNASTY) */}
          {activeTab === 'chinese' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-red-700/50 text-center">
                <div className="text-4xl mb-2">🥢</div>
                <h4 className="font-bold text-base text-red-400">Golden Dragon Wok Station (Astro LAX)</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Step {wokStep + 1} of 5:{' '}
                  {wokStep === 0
                    ? 'Ignite high-heat dragon wok flame 🔥'
                    : wokStep === 1
                    ? 'Sizzle minced ginger, garlic & fragrant scallions 🧄'
                    : wokStep === 2
                    ? 'Toss egg noodles, crunchy bok choy & steamed dim sum 🥟'
                    : wokStep === 3
                    ? 'Drizzle savory soy glaze & toasted sesame oil 🥢'
                    : 'Garnish with toasted sesame & platter Hakka noodles! ✨'}
                </p>
              </div>

              <button
                onClick={handleChineseWokNext}
                className="w-full bg-linear-to-r from-red-600 to-amber-600 hover:opacity-95 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Flame className="w-5 h-5" />
                {wokStep < 4 ? 'Wok Toss Next Step' : 'Platter Golden Dragon Feast & Collect Rs. 4,500!'}
              </button>
            </div>
          )}

          {/* 7. INDIAN TANDOOR CHEF (TAJ FLAVORS ROYAL PALACE) */}
          {activeTab === 'indian' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-amber-700/50 text-center">
                <div className="text-4xl mb-2">🍛</div>
                <h4 className="font-bold text-base text-amber-400">Taj Flavors Royal Tandoor Station (Astro LAX)</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Step {tandoorStep + 1} of 5:{' '}
                  {tandoorStep === 0
                    ? 'Knead soft, buttery garlic naan dough 🫓'
                    : tandoorStep === 1
                    ? 'Slap naan onto blazing 450° clay tandoor oven wall 🔥'
                    : tandoorStep === 2
                    ? 'Simmer rich Butter Paneer Masala in brass handi 🥘'
                    : tandoorStep === 3
                    ? 'Sprinkle fragrant saffron, cardamom & fresh kasuri methi 🌿'
                    : 'Arrange royal thali with basmati biryani, naan & gulab jamun! 👑'}
                </p>
              </div>

              <button
                onClick={handleIndianTandoorNext}
                className="w-full bg-linear-to-r from-amber-600 to-orange-600 hover:opacity-95 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Sparkles className="w-5 h-5" />
                {tandoorStep < 4 ? 'Cook Next Step in Clay Oven' : 'Serve Royal Maharaja Thali & Collect Rs. 4,800!'}
              </button>
            </div>
          )}

          {/* 8. LAX PIZZA CAFE & GELATO */}
          {activeTab === 'gelato' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-teal-700/50 text-center">
                <div className="text-4xl mb-2">🍨</div>
                <h4 className="font-bold text-base text-teal-400">Astro LAX Coastal Pizza & Gelato Emporium</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Crispy thin-crust Italian pizza paired with handmade coastal gelato! Select gelato scoops for the order:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { name: 'Pistachio Crunch', color: 'bg-emerald-600/30 border-emerald-500' },
                  { name: 'Wild Strawberry', color: 'bg-pink-600/30 border-pink-500' },
                  { name: 'Alfonso Mango', color: 'bg-amber-600/30 border-amber-500' },
                  { name: 'Belgian Stracciatella', color: 'bg-cyan-600/30 border-cyan-500' },
                ].map((flavor) => (
                  <button
                    key={flavor.name}
                    onClick={() => handleGelatoToggle(flavor.name)}
                    className={`p-3 rounded-xl border font-bold flex items-center justify-between transition-colors ${
                      selectedGelato.includes(flavor.name)
                        ? `${flavor.color} border-white text-white shadow-md ring-2 ring-teal-400`
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{flavor.name}</span>
                    <span>{selectedGelato.includes(flavor.name) ? '✓' : '+'}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleGelatoServe}
                className="w-full bg-linear-to-r from-teal-600 to-emerald-600 hover:opacity-95 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Check className="w-5 h-5" /> Serve Pizza & Gelato Artisanal Combo (+Rs. 4,200)
              </button>
            </div>
          )}

          {/* 9. MEGA MANSION HOST & BUTLER */}
          {activeTab === 'mansion' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-purple-700/50 text-center">
                <div className="text-4xl mb-2">🏰</div>
                <h4 className="font-bold text-base text-purple-400">Astro LAX Royal Grand Mansion Butler</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Task {mansionStep + 1} of 4:{' '}
                  {mansionStep === 0
                    ? 'Calibrate heated infinity swimming pool & ocean view fountains 🏊'
                    : mansionStep === 1
                    ? 'Activate rooftop helipad beacon lights for arriving celebrities 🚁'
                    : mansionStep === 2
                    ? 'Prepare 24K gold sparkling passionfruit mocktails on the terrace 🍸'
                    : 'Open the golden gates and welcome VIP guests to the estate! 🌟'}
                </p>
              </div>

              <button
                onClick={handleMansionNext}
                className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Award className="w-5 h-5" />
                {mansionStep < 3 ? 'Complete Butler Task' : 'Collect VIP Estate Manager Bonus (+Rs. 5,000)!'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
