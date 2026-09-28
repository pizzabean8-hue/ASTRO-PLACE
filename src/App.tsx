import React, { useEffect, useRef, useState } from 'react';
import { CityScene } from './game3d/CityScene';
import {
  PlayerProfile,
  CharacterCustomization,
  VehicleData,
  JobRole,
  CityNPC,
  DeliveryMission,
  ActiveParty,
  ChatMessage,
  InteractiveZone,
  InventoryItem,
} from './types/game';
import { soundManager } from './audio/soundManager';
import { HUD } from './components/HUD';
import { AstroPhone } from './components/AstroPhone';
import { JobStationModal } from './components/JobStationModal';
import { CharacterCustomizer } from './components/CharacterCustomizer';
import { GarageModal } from './components/GarageModal';
import { HouseModal } from './components/HouseModal';
import { NPCModal } from './components/NPCModal';
import { PartyModal } from './components/PartyModal';

const STORAGE_KEY = 'astro_place_save_v1';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const citySceneRef = useRef<CityScene | null>(null);

  // Player Profile State (Default per requirements)
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_profile`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      name: 'Astro Place Gamer',
      astroNumber: '777-99-8899',
      money: 99999,
      country: 'India 🇮🇳',
      region: 'West Bengal',
      job: 'Citizen',
      bio: 'Living my best life in Astro Place!',
      joinedDate: 'September 2026',
      reputation: 150,
    };
  });

  // Character Customization
  const [customization, setCustomization] = useState<CharacterCustomization>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customization`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      skinColor: '#ffd1a4',
      shirtColor: '#1e88e5',
      pantsColor: '#212121',
      hairStyle: 'spiky',
      hairColor: '#3e2723',
      hat: 'cap',
      accessory: 'backpack',
    };
  });

  // Vehicles
  const [vehicles, setVehicles] = useState<VehicleData[]>([
    {
      id: 'v_sports',
      name: 'Neon Apex GT',
      speed: 48,
      color: '#ff1744',
      type: 'sports',
      price: 25000,
      owned: true,
    },
    {
      id: 'v_scooter',
      name: 'Astro Pizza Scooter',
      speed: 36,
      color: '#ffc107',
      type: 'scooter',
      price: 8000,
      owned: true,
    },
    {
      id: 'v_cruiser',
      name: 'Astro City Cruiser',
      speed: 40,
      color: '#00e5ff',
      type: 'cruiser',
      price: 15000,
      owned: true,
    },
    {
      id: 'v_police',
      name: 'Police Enforcer Cruiser',
      speed: 45,
      color: '#1565c0',
      type: 'police',
      price: 32000,
      owned: true,
    },
    {
      id: 'v_suv',
      name: 'Astro Cyber SUV',
      speed: 42,
      color: '#9c27b0',
      type: 'van',
      price: 45000,
      owned: false,
    },
  ]);

  // Active Vehicle in scene
  const [activeVehicle, setActiveVehicle] = useState<VehicleData | null>(null);

  // Modals & UI states
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneInitialApp, setPhoneInitialApp] = useState<string | null>(null);

  // Player Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_inventory`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'item_pizza',
        name: 'Wood-Fired Pizza Slice',
        category: 'food',
        icon: '🍕',
        price: 250,
        description: 'Fresh mozzarella & crispy crust. Restores energy.',
        quantity: 3,
      },
      {
        id: 'item_coffee',
        name: 'Iced Caramel Macchiato',
        category: 'drink',
        icon: '☕',
        price: 320,
        description: 'Rich espresso with caramel drizzle.',
        quantity: 2,
      },
      {
        id: 'item_confetti',
        name: 'Astro Confetti Cannon',
        category: 'toy',
        icon: '🎉',
        price: 500,
        description: 'Fires colorful celebratory party bursts!',
        quantity: 5,
      },
      {
        id: 'item_sparkler',
        name: 'Fireworks Sparkler Wand',
        category: 'toy',
        icon: '✨',
        price: 800,
        description: 'Launches sparkling fireworks into the night sky.',
        quantity: 4,
      },
      {
        id: 'item_key',
        name: 'Remote Vehicle Key',
        category: 'tool',
        icon: '🔑',
        price: 1200,
        description: 'Beeps car horn remotely and locks doors.',
        quantity: 1,
      },
      {
        id: 'item_medkit',
        name: 'Emergency Medical Kit',
        category: 'tool',
        icon: '🩹',
        price: 1500,
        description: 'Sterile bandages and health antiseptic spray.',
        quantity: 2,
      },
    ];
  });

  const [jobsOpen, setJobsOpen] = useState(false);
  const [jobStationType, setJobStationType] = useState<
    | 'job_pizza'
    | 'job_hospital'
    | 'job_cafe'
    | 'job_police'
    | 'job_chinese'
    | 'job_indian'
    | 'job_lax_pizza'
    | 'lax_mansion'
    | 'all'
  >('all');
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [garageOpen, setGarageOpen] = useState(false);
  const [houseOpen, setHouseOpen] = useState(false);
  const [partyOpen, setPartyOpen] = useState(false);
  const [activeNPC, setActiveNPC] = useState<CityNPC | null>(null);

  // Proximity Zone
  const [nearestZone, setNearestZone] = useState<InteractiveZone | null>(null);

  // Landscape Orientation State & Detection
  const [isPortrait, setIsPortrait] = useState(() => {
    return typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false;
  });
  const [dismissPortraitWarning, setDismissPortraitWarning] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleRequestLandscape = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape');
      }
    } catch (err) {
      // Ignored if browser prevents or doesn't support lock
    }
  };

  // Missions & Events
  const [activeDelivery, setActiveDelivery] = useState<DeliveryMission | null>(null);
  const [activeParty, setActiveParty] = useState<ActiveParty>({
    active: false,
    hostName: '',
    location: '',
    theme: '',
    musicPlaying: false,
    durationLeft: 0,
  });

  // Chat Log
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'System',
      text: 'Welcome to Astro Place! Explore the city, get jobs, drive cars, and have fun!',
      time: '12:00',
    },
    {
      id: '2',
      sender: 'Chef Marco',
      text: 'Fresh hot pizzas coming right out of the oven at Astro Bakery!',
      isNpc: true,
      time: '12:01',
    },
    {
      id: '3',
      sender: 'DJ Astro',
      text: 'Pool party tonight at the Astro Villa! Everyone is invited!',
      isNpc: true,
      time: '12:02',
    },
  ]);

  // Persist Profile & Customization & Inventory
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_profile`, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_customization`, JSON.stringify(customization));
  }, [customization]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_inventory`, JSON.stringify(inventory));
  }, [inventory]);

  // Global Keyboard Shortcuts for Phone & Apps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in chat or input
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (key === 'p') {
        soundManager.playPhoneChime();
        setPhoneInitialApp(null);
        setPhoneOpen((prev) => !prev);
      } else if (key === 'm') {
        soundManager.playPhoneChime();
        setPhoneInitialApp('map');
        setPhoneOpen(true);
      } else if (key === 'c') {
        soundManager.playPhoneChime();
        setPhoneInitialApp('comms');
        setPhoneOpen(true);
      } else if (key === 'j') {
        soundManager.playPhoneChime();
        setPhoneInitialApp('jobs');
        setPhoneOpen(true);
      } else if (key === 'i') {
        soundManager.playPhoneChime();
        setPhoneInitialApp('inventory');
        setPhoneOpen(true);
      } else if (key === 'escape') {
        setPhoneOpen(false);
        setJobsOpen(false);
        setCustomizerOpen(false);
        setGarageOpen(false);
        setHouseOpen(false);
        setPartyOpen(false);
        setActiveNPC(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize 3D City Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const cityScene = new CityScene(containerRef.current);
    citySceneRef.current = cityScene;

    // Apply player customization
    cityScene.applyCustomization(customization);

    // Callbacks
    cityScene.onNearestZoneChange = (zone) => {
      setNearestZone(zone);
    };

    cityScene.onNPCInteract = (npc) => {
      soundManager.playPhoneChime();
      setActiveNPC(npc);
    };

    cityScene.onEnterVehicle = (veh) => {
      setActiveVehicle(veh);
    };

    // Auto-start ambient music gently
    const timer = setTimeout(() => {
      soundManager.startMusic('Astro City Vibes');
    }, 1000);

    return () => {
      clearTimeout(timer);
      cityScene.dispose();
      citySceneRef.current = null;
    };
  }, []);

  // Update 3D avatar when customization changes
  const handleUpdateCustomization = (newCust: CharacterCustomization) => {
    setCustomization(newCust);
    if (citySceneRef.current) {
      citySceneRef.current.applyCustomization(newCust);
    }
  };

  // Money & Rewards
  const handleAddMoney = (amount: number, reason: string) => {
    setProfile((prev) => ({
      ...prev,
      money: prev.money + amount,
      reputation: prev.reputation + Math.floor(amount / 500),
    }));

    setChatMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: 'Bank',
        text: `+Rs. ${amount.toLocaleString()} earned (${reason})`,
        time: 'Just now',
      },
    ]);
  };

  // Interaction key/button handler
  const handleInteract = () => {
    if (!nearestZone) return;

    if (nearestZone.type === 'job_pizza') {
      soundManager.playPhoneChime();
      setJobStationType('job_pizza');
      setJobsOpen(true);
    } else if (nearestZone.type === 'job_hospital') {
      soundManager.playPhoneChime();
      setJobStationType('job_hospital');
      setJobsOpen(true);
    } else if (nearestZone.type === 'job_cafe') {
      soundManager.playPhoneChime();
      setJobStationType('job_cafe');
      setJobsOpen(true);
    } else if (nearestZone.type === 'job_police') {
      soundManager.playPhoneChime();
      setJobStationType('job_police');
      setJobsOpen(true);
    } else if (nearestZone.type === 'job_chinese') {
      soundManager.playPhoneChime();
      setJobStationType('job_chinese');
      setJobsOpen(true);
    } else if (nearestZone.type === 'job_indian') {
      soundManager.playPhoneChime();
      setJobStationType('job_indian');
      setJobsOpen(true);
    } else if (nearestZone.type === 'job_lax_pizza') {
      soundManager.playPhoneChime();
      setJobStationType('job_lax_pizza');
      setJobsOpen(true);
    } else if (nearestZone.type === 'lax_mansion') {
      soundManager.playPhoneChime();
      setJobStationType('lax_mansion');
      setJobsOpen(true);
    } else if (nearestZone.type === 'boutique') {
      soundManager.playPhoneChime();
      setCustomizerOpen(true);
    } else if (nearestZone.type === 'dealer') {
      soundManager.playPhoneChime();
      setGarageOpen(true);
    } else if (nearestZone.type === 'villa_party') {
      soundManager.playPhoneChime();
      setPartyOpen(true);
    } else if (nearestZone.type === 'player_home') {
      soundManager.playPhoneChime();
      setHouseOpen(true);
    } else if (nearestZone.type === 'npc' && nearestZone.data) {
      soundManager.playPhoneChime();
      setActiveNPC(nearestZone.data);
    } else if (nearestZone.type === 'vehicle' && nearestZone.data) {
      if (citySceneRef.current) {
        citySceneRef.current.enterVehicle(nearestZone.data);
      }
    }
  };

  // Vehicles
  const handleSpawnCar = (vehId: string) => {
    const v = vehicles.find((item) => item.id === vehId);
    if (!v || !citySceneRef.current) return;

    // Spawn 3 units in front of player
    const pos = citySceneRef.current.playerPos.clone();
    pos.x += 4;
    citySceneRef.current.spawnVehicleInWorld(v, pos, 0);
    citySceneRef.current.enterVehicle(v);
  };

  const handleExitVehicle = () => {
    if (citySceneRef.current) {
      citySceneRef.current.exitCurrentVehicle();
      setActiveVehicle(null);
    }
  };

  const handleHorn = () => {
    soundManager.playHorn();
  };

  // Teleportation
  const handleTeleport = (x: number, z: number, locName: string) => {
    if (citySceneRef.current) {
      citySceneRef.current.teleportTo(x, z);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'GPS',
          text: `Traveled to ${locName}`,
          time: 'Just now',
        },
      ]);
    }
  };

  // Delivery Missions
  const handleStartDelivery = (mission: DeliveryMission) => {
    setActiveDelivery(mission);
    setChatMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: 'Bakery Dispatch',
        text: `New order: Deliver ${mission.pizzaName} to ${mission.targetNpcName} at ${mission.targetLocationName}`,
        time: 'Just now',
      },
    ]);
  };

  // Party Hosting
  const handleHostParty = (theme: string) => {
    setActiveParty({
      active: true,
      hostName: profile.name,
      location: 'Astro Party Villa',
      theme,
      musicPlaying: true,
      durationLeft: 300,
    });

    if (citySceneRef.current) {
      citySceneRef.current.launchFireworks();
    }

    soundManager.startMusic('Party Blast');

    setChatMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: '🎉 CITY ALERT',
        text: `${profile.name} is hosting the "${theme}" party at Astro Villa! Come dance and celebrate!`,
        time: 'Just now',
      },
    ]);
  };

  // Chat message sending
  const handleSendMessage = (text: string) => {
    soundManager.playPhoneChime();
    setChatMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: profile.name,
        text,
        time: 'Just now',
      },
    ]);

    // Roleplay NPC response
    setTimeout(() => {
      const npcSenders = ['Chef Marco', 'Officer Raj', 'Dr. Ananya', 'DJ Astro', 'Rohan', 'Sneha'];
      const randomSender = npcSenders[Math.floor(Math.random() * npcSenders.length)];
      const replies = [
        'Hey there! Love the positive vibes in Astro Place today!',
        'Meet you by the central fountain in five minutes!',
        'Awesome, let us grab some fresh pizza later!',
        'That sounds fantastic!',
      ];
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: randomSender,
          text: replies[Math.floor(Math.random() * replies.length)],
          isNpc: true,
          time: 'Just now',
        },
      ]);
    }, 1500);
  };

  // Emotes
  const handleEmote = (emote: 'dance' | 'wave' | 'cheer') => {
    if (!citySceneRef.current) return;
    if (emote === 'dance') {
      soundManager.playCheer();
      citySceneRef.current.setDance(!citySceneRef.current.isDancing);
    } else if (emote === 'wave') {
      soundManager.playFootstep();
      citySceneRef.current.triggerWave();
    } else if (emote === 'cheer') {
      soundManager.playCheer();
      citySceneRef.current.launchFireworks();
    }
  };

  // Jump
  const handleJump = () => {
    if (!citySceneRef.current || citySceneRef.current.activeVehicle) return;
    if (citySceneRef.current.isGrounded) {
      citySceneRef.current.playerVelocity.y = 9;
      citySceneRef.current.isGrounded = false;
      soundManager.playJump();
    }
  };

  // Inventory Item Usage
  const handleUseItem = (itemId: string) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId && item.quantity > 0) {
          if (item.category === 'food' || item.category === 'drink') {
            soundManager.playCheer();
            setChatMessages((msgs) => [
              ...msgs,
              {
                id: Math.random().toString(),
                sender: 'Inventory',
                text: `Consumed ${item.name}! Energy and stamina fully boosted!`,
                time: 'Just now',
              },
            ]);
            return { ...item, quantity: Math.max(1, item.quantity - 1) };
          } else {
            setChatMessages((msgs) => [
              ...msgs,
              {
                id: Math.random().toString(),
                sender: 'Inventory',
                text: `Used ${item.name}!`,
                time: 'Just now',
              },
            ]);
          }
        }
        return item;
      })
    );
  };

  // Map Position Getters
  const getPlayerPos = () => {
    if (citySceneRef.current) {
      return {
        x: Math.round(citySceneRef.current.playerPos.x * 10) / 10,
        z: Math.round(citySceneRef.current.playerPos.z * 10) / 10,
        heading: citySceneRef.current.playerHeading || 0,
      };
    }
    return { x: 0, z: 0, heading: 0 };
  };

  const getNPCPositions = () => {
    if (citySceneRef.current) {
      return citySceneRef.current.npcs.map((n) => ({
        name: n.data.name,
        x: n.group.position.x,
        z: n.group.position.z,
        role: n.data.role,
      }));
    }
    return [];
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* Main Game HUD */}
      <HUD
        profile={profile}
        activeVehicle={activeVehicle}
        nearestZone={nearestZone}
        activeDelivery={activeDelivery}
        activeParty={activeParty}
        chatMessages={chatMessages}
        onSendMessage={handleSendMessage}
        onOpenPhone={() => {
          soundManager.playPhoneChime();
          setPhoneInitialApp(null);
          setPhoneOpen((prev) => !prev);
        }}
        onOpenPhoneApp={(appName: string) => {
          soundManager.playPhoneChime();
          setPhoneInitialApp(appName);
          setPhoneOpen(true);
        }}
        onOpenJobs={() => {
          soundManager.playPhoneChime();
          setJobStationType('all');
          setJobsOpen(true);
        }}
        onOpenGarage={() => {
          soundManager.playPhoneChime();
          setGarageOpen(true);
        }}
        onOpenCustomizer={() => {
          soundManager.playPhoneChime();
          setCustomizerOpen(true);
        }}
        onOpenHouse={() => {
          soundManager.playPhoneChime();
          setHouseOpen(true);
        }}
        onHostParty={() => {
          soundManager.playPhoneChime();
          setPartyOpen(true);
        }}
        onInteract={handleInteract}
        onExitVehicle={handleExitVehicle}
        onHorn={handleHorn}
        onEmote={handleEmote}
        onJump={handleJump}
        onMoveVirtual={(x: number, z: number) => {
          if (citySceneRef.current) {
            citySceneRef.current.virtualMove.x = x;
            citySceneRef.current.virtualMove.z = z;
          }
        }}
      />

      {/* Interactive In-Game Smartphone with Astro Map, Comms, Job Hub, and Inventory */}
      <AstroPhone
        isOpen={phoneOpen}
        onClose={() => setPhoneOpen(false)}
        initialApp={phoneInitialApp}
        profile={profile}
        onUpdateProfile={setProfile}
        customization={customization}
        onUpdateCustomization={handleUpdateCustomization}
        inventory={inventory}
        onUseItem={handleUseItem}
        onSpawnCar={handleSpawnCar}
        onTeleport={handleTeleport}
        onStartDelivery={handleStartDelivery}
        onHostParty={handleHostParty}
        onOpenJobsStation={(stationType) => {
          setJobStationType(stationType);
          setJobsOpen(true);
        }}
        onSetRole={(role: JobRole) => {
          setProfile((prev) => ({ ...prev, job: role }));
        }}
        activeDelivery={activeDelivery}
        vehicles={vehicles}
        onAddMoney={handleAddMoney}
        getPlayerPos={getPlayerPos}
        getNPCPositions={getNPCPositions}
      />

      {/* Job Station Minigame Modal */}
      <JobStationModal
        isOpen={jobsOpen}
        stationType={jobStationType}
        currentRole={profile.job}
        onSetRole={(role: JobRole) => {
          setProfile((prev) => ({ ...prev, job: role }));
        }}
        onClose={() => setJobsOpen(false)}
        onReward={handleAddMoney}
      />

      {/* Avatar Customizer */}
      <CharacterCustomizer
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        customization={customization}
        onChange={handleUpdateCustomization}
      />

      {/* Dealership / Garage Modal */}
      <GarageModal
        isOpen={garageOpen}
        onClose={() => setGarageOpen(false)}
        vehicles={vehicles}
        playerMoney={profile.money}
        onSpawnVehicle={handleSpawnCar}
        onBuyVehicle={(v) => {
          setProfile((prev) => ({ ...prev, money: prev.money - v.price }));
          setVehicles((prev) =>
            prev.map((item) => (item.id === v.id ? { ...item, owned: true } : item))
          );
          handleSpawnCar(v.id);
        }}
      />

      {/* Luxury Estate House Modal */}
      <HouseModal
        isOpen={houseOpen}
        onClose={() => setHouseOpen(false)}
        playerName={profile.name}
        onHostHouseParty={() => {
          handleHostParty('Luxury Estate Housewarming Gala');
        }}
      />

      {/* NPC Dialogue Modal */}
      <NPCModal
        npc={activeNPC}
        onClose={() => setActiveNPC(null)}
        onAction={(actionType) => {
          if (actionType === 'reward') {
            handleAddMoney(1000, `Chatted with ${activeNPC?.name}`);
          }
        }}
      />

      {/* Party Central Modal */}
      <PartyModal
        isOpen={partyOpen}
        onClose={() => setPartyOpen(false)}
        onLaunchParty={handleHostParty}
        onLaunchFireworks={() => {
          if (citySceneRef.current) {
            citySceneRef.current.launchFireworks();
          }
        }}
      />

      {/* Landscape Orientation Recommendation Overlay */}
      {isPortrait && !dismissPortraitWarning && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in duration-300 select-none">
          <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
            {/* Animated rotating phone icon */}
            <div className="w-16 h-28 border-4 border-emerald-400 rounded-2xl flex items-center justify-center animate-[pulse_2s_infinite] shadow-xl shadow-emerald-500/20">
              <div className="w-8 h-1 bg-emerald-400 rounded-full mb-auto mt-2"></div>
              <div className="w-2.5 h-2.5 rounded-full border border-emerald-400 mt-auto mb-2"></div>
            </div>
            <div className="absolute text-3xl animate-bounce">
              🔄
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-300 via-pink-400 to-indigo-300 mb-2">
            Rotate to Landscape
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-sm leading-relaxed mb-6">
            Astro Place is crafted for an immersive 3D widescreen landscape experience. Please turn your device sideways!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              onClick={handleRequestLandscape}
              className="w-full bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-3 px-6 rounded-2xl shadow-xl transition-transform active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>Rotate / Fullscreen</span>
            </button>
            <button
              onClick={() => setDismissPortraitWarning(true)}
              className="w-full bg-white/10 hover:bg-white/15 text-slate-400 hover:text-white py-2.5 px-4 rounded-xl text-xs transition-colors"
            >
              Continue in Portrait
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
