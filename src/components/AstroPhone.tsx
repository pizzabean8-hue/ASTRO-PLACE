import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  MessageSquare,
  Briefcase,
  Package,
  User,
  Car,
  PartyPopper,
  Music,
  CreditCard,
  X,
  Send,
  Play,
  Pause,
  RefreshCw,
  Navigation,
  Check,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Search,
  Radio,
  Flame,
  Key,
  Shield,
  Coffee,
  HeartPulse,
  Award,
  Layers,
  Shirt,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  PlayerProfile,
  VehicleData,
  JobRole,
  DeliveryMission,
  CharacterCustomization,
  InventoryItem,
  ClothingItem,
  FriendContact,
  JobInfo,
} from '../types/game';
import { soundManager } from '../audio/soundManager';

interface AstroPhoneProps {
  isOpen: boolean;
  onClose: () => void;
  initialApp?: string | null;
  profile: PlayerProfile;
  onUpdateProfile: (newProfile: PlayerProfile) => void;
  customization: CharacterCustomization;
  onUpdateCustomization: (customization: CharacterCustomization) => void;
  inventory: InventoryItem[];
  onUseItem: (itemId: string) => void;
  onSpawnCar: (vehicleId: string) => void;
  onTeleport: (x: number, z: number, name: string) => void;
  onStartDelivery: (mission: DeliveryMission) => void;
  onHostParty: (theme: string) => void;
  onOpenJobsStation: (stationType: any) => void;
  onSetRole: (role: JobRole) => void;
  activeDelivery: DeliveryMission | null;
  vehicles: VehicleData[];
  onAddMoney: (amount: number, reason: string) => void;
  getPlayerPos: () => { x: number; z: number; heading: number };
  getNPCPositions: () => { name: string; x: number; z: number; role: string }[];
}

export const AstroPhone: React.FC<AstroPhoneProps> = ({
  isOpen,
  onClose,
  initialApp = null,
  profile,
  onUpdateProfile,
  customization,
  onUpdateCustomization,
  inventory,
  onUseItem,
  onSpawnCar,
  onTeleport,
  onStartDelivery,
  onHostParty,
  onOpenJobsStation,
  onSetRole,
  activeDelivery,
  vehicles,
  onAddMoney,
  getPlayerPos,
  getNPCPositions,
}) => {
  const [activeApp, setActiveApp] = useState<string | null>(initialApp);

  // When initialApp prop changes, open that app
  useEffect(() => {
    if (initialApp) {
      setActiveApp(initialApp);
    }
  }, [initialApp]);

  // COMMS APP STATE
  const [commsTab, setCommsTab] = useState<'contacts' | 'nearby'>('contacts');
  const [activeContactId, setActiveContactId] = useState<string>('c_marco');
  const [inputMessage, setInputMessage] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [addNumberInput, setAddNumberInput] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);

  const [contacts, setContacts] = useState<FriendContact[]>([
    {
      id: 'c_marco',
      name: 'Chef Marco',
      astroNumber: '777-11-2233',
      status: 'Baking fresh pies at Astro Bakery',
      isOnline: true,
      avatarColor: '#d32f2f',
      lastMessage: 'The pizza oven is blazing! Drop by anytime.',
    },
    {
      id: 'c_raj',
      name: 'Officer Raj',
      astroNumber: '911-00-1122',
      status: 'Patrolling Central Plaza',
      isOnline: true,
      avatarColor: '#1565c0',
      lastMessage: 'City sector is peaceful today.',
    },
    {
      id: 'c_dj',
      name: 'DJ Astro',
      astroNumber: '888-55-9900',
      status: 'Prepping sound system at Villa',
      isOnline: true,
      avatarColor: '#e91e63',
      lastMessage: 'Villa party is going to be epic tonight!',
    },
    {
      id: 'c_ananya',
      name: 'Dr. Ananya',
      astroNumber: '108-22-3344',
      status: 'In surgery / clinic',
      isOnline: true,
      avatarColor: '#00838f',
      lastMessage: 'Stay hydrated during city activities!',
    },
    {
      id: 'c_sneha',
      name: 'Sneha',
      astroNumber: '444-88-1234',
      status: 'Designing outfits at Boutique',
      isOnline: true,
      avatarColor: '#ab47bc',
      lastMessage: 'New jacket styles just arrived!',
    },
    {
      id: 'c_rohan',
      name: 'Rohan',
      astroNumber: '777-99-8899',
      status: 'Cruising the Neon Apex GT',
      isOnline: true,
      avatarColor: '#ff9800',
      lastMessage: 'Meet you by the central fountain!',
    },
    {
      id: 'c_chen',
      name: 'Master Chen',
      astroNumber: '888-22-3344',
      status: 'Tossing wok noodles in Astro LAX',
      isOnline: true,
      avatarColor: '#b71c1c',
      lastMessage: 'Sizzling Dragon Hakka Noodles ready at Golden Dragon!',
    },
    {
      id: 'c_vikram',
      name: 'Chef Vikram',
      astroNumber: '777-44-5566',
      status: 'Baking garlic naan at Taj Flavors Palace',
      isOnline: true,
      avatarColor: '#ff8f00',
      lastMessage: 'Clay tandoor is blazing hot for lunch service!',
    },
    {
      id: 'c_bella',
      name: 'Bella',
      astroNumber: '333-88-9911',
      status: 'Scooping Pistachio Gelato by the beach',
      isOnline: true,
      avatarColor: '#00bcd4',
      lastMessage: 'Come try our fresh Margherita slice & gelato!',
    },
    {
      id: 'c_sterling',
      name: 'Lord Sterling',
      astroNumber: '999-00-1122',
      status: 'Lounging at the Royal Mega Mansion',
      isOnline: true,
      avatarColor: '#5e35b1',
      lastMessage: 'The rooftop helipad lights are magnificent tonight.',
    },
  ]);

  const [directMessages, setDirectMessages] = useState<{ [contactId: string]: { sender: string; text: string; time: string; isMe?: boolean }[] }>({
    c_marco: [
      { sender: 'Chef Marco', text: 'Hey! Fresh pizzas are baking at Astro Bakery.', time: '11:30 AM' },
      { sender: 'Chef Marco', text: 'Need any hot delivery gigs or want to bake a pie?', time: '11:32 AM' },
    ],
    c_raj: [
      { sender: 'Officer Raj', text: 'Good day! Drive carefully near the school & plaza.', time: '10:15 AM' },
    ],
    c_dj: [
      { sender: 'DJ Astro', text: 'Yo! Villa pool is heated, EDM tracklist is ready!', time: '12:00 PM' },
    ],
    c_ananya: [
      { sender: 'Dr. Ananya', text: 'Health clinic is fully stocked if you need medical care.', time: '09:45 AM' },
    ],
    c_sneha: [
      { sender: 'Sneha', text: 'Check out the new neon cyber wings in your Inventory clothing!', time: '10:00 AM' },
    ],
    c_rohan: [
      { sender: 'Rohan', text: 'Race you to the dealership!', time: '11:45 AM' },
    ],
    c_chen: [
      { sender: 'Master Chen', text: 'Welcome to Golden Dragon Dynasty across the bridge in Astro LAX!', time: '10:45 AM' },
    ],
    c_vikram: [
      { sender: 'Chef Vikram', text: 'Namaste! Taj Flavors Royal Indian Palace is open for dining and kitchen shifts!', time: '11:00 AM' },
    ],
    c_bella: [
      { sender: 'Bella', text: 'Fresh gelato just churned! Pistachio and Alfonso Mango are today specials.', time: '11:15 AM' },
    ],
    c_sterling: [
      { sender: 'Lord Sterling', text: 'Greetings! Stop by my Royal Mega Mansion for an evening terrace view.', time: '11:30 AM' },
    ],
  });

  const [nearbyFeed, setNearbyFeed] = useState<{ id: string; sender: string; text: string; time: string; distance: string }[]>([
    { id: '1', sender: 'Officer Raj', text: 'Radar active on Main Avenue.', time: '1 min ago', distance: '15m away' },
    { id: '2', sender: 'Chef Marco', text: 'Paneer Tikka slice ready for pickup!', time: '3 mins ago', distance: '38m away' },
    { id: '3', sender: 'DJ Astro', text: 'Party lights tested at the Villa pool deck.', time: '5 mins ago', distance: '85m away' },
  ]);

  // MAP APP STATE
  const [mapZoom, setMapZoom] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [mapCategory, setMapCategory] = useState<'all' | 'jobs' | 'fun' | 'shops'>('all');

  // INVENTORY APP STATE
  const [inventoryTab, setInventoryTab] = useState<'items' | 'clothing'>('items');
  const [clothingCategory, setClothingCategory] = useState<'shirts' | 'pants' | 'hats' | 'accessories'>('shirts');

  // MUSIC & AUDIO
  const [isPlayingMusic, setIsPlayingMusic] = useState(soundManager.isMusicActive());
  const [currentTrack, setCurrentTrack] = useState(soundManager.getCurrentTrack());

  // Real-time Player & NPC positions for map
  const [livePlayerPos, setLivePlayerPos] = useState({ x: 0, z: 0, heading: 0 });
  const [liveNPCs, setLiveNPCs] = useState<{ name: string; x: number; z: number; role: string }[]>([]);

  useEffect(() => {
    if (isOpen && activeApp === 'map') {
      const interval = setInterval(() => {
        setLivePlayerPos(getPlayerPos());
        setLiveNPCs(getNPCPositions());
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeApp, getPlayerPos, getNPCPositions]);

  if (!isOpen) return null;

  // City Map Locations
  const mapLocations = [
    { id: 'plaza', name: 'Central Plaza Fountain', x: 0, z: 0, icon: '⛲', category: 'fun', desc: 'Heart of Astro Place with water fountain & benches' },
    { id: 'pizza', name: 'Astro Pizza & Bakery', x: -38, z: -25, icon: '🍕', category: 'jobs', desc: 'Stone fire pizza ovens, bakery counter, delivery hub' },
    { id: 'hospital', name: 'Astro City Hospital', x: 38, z: -25, icon: '🏥', category: 'jobs', desc: 'Medical clinic, patient scanner, ambulance bay' },
    { id: 'cafe', name: 'Astro Cafe & Market', x: -38, z: 25, icon: '☕', category: 'jobs', desc: 'Fresh coffee brews, snacks, barista workstation' },
    { id: 'police', name: 'Astro Police Dept', x: 38, z: 25, icon: '👮', category: 'jobs', desc: 'Security radar dispatch & patrol cruisers' },
    { id: 'villa', name: 'Astro Party Villa & Beach', x: 0, z: 75, icon: '🎉', category: 'fun', desc: 'Mansion with swimming pool, DJ decks, dance floor' },
    { id: 'dealer', name: 'Astro Motors Dealership', x: 55, z: 0, icon: '🏎️', category: 'shops', desc: 'Supercars, cruisers, and vehicle showroom' },
    { id: 'boutique', name: 'Astro Fashion Boutique', x: -55, z: 0, icon: '👗', category: 'shops', desc: 'Trendy clothing, accessories, and wardrobe styling' },
    { id: 'estate', name: 'Luxury Astro Estate', x: 0, z: -75, icon: '🏡', category: 'fun', desc: 'Player private house with security lock & yard' },
    { id: 'bridge', name: 'Astro LAX Grand Suspension Bridge', x: 125, z: 0, icon: '🌉', category: 'fun', desc: '32-meter twin tower suspension bridge crossing the scenic river into Astro LAX' },
    { id: 'chinese', name: 'Golden Dragon Chinese Dynasty', x: 235, z: -45, icon: '🥢', category: 'jobs', desc: 'Pagoda roofs, fiery wok counters & dim sum feasts in Astro LAX' },
    { id: 'indian', name: 'Taj Flavors Royal Indian Palace', x: 235, z: 45, icon: '🍛', category: 'jobs', desc: 'Ivory palace, golden onion domes & blazing clay tandoor oven in Astro LAX' },
    { id: 'lax_pizza', name: 'Astro LAX Pizza Cafe & Gelato', x: 205, z: -85, icon: '🍨', category: 'jobs', desc: 'Coastal wood-fired pizza cafe with Italian handmade gelato bar in Astro LAX' },
    { id: 'mega_mansion', name: 'Astro LAX Royal Grand Mansion', x: 285, z: 0, icon: '🏰', category: 'fun', desc: 'Billionaire 3-story mansion with rooftop helipad & infinity swimming pool in Astro LAX' },
  ];

  // Available Jobs List for Job Hub
  const availableJobs: JobInfo[] = [
    {
      role: 'Pizza Chef',
      title: 'Master Pizza Chef',
      employer: 'Astro Pizza & Bakery',
      salary: 'Rs. 3,500 / order',
      icon: '🍕',
      description: 'Hand-toss dough, add fresh toppings, bake in stone fire oven, and box gourmet pizzas.',
      perks: ['Free Chef Hat & Apron', 'Earn cash bonus per order', 'Workstation minigame'],
      location: 'Astro Pizza & Bakery',
      x: -38,
      z: -25,
    },
    {
      role: 'Chinese Wok Chef',
      title: 'Golden Dragon Wok Master',
      employer: 'Golden Dragon Chinese Dynasty',
      salary: 'Rs. 4,500 / order',
      icon: '🥢',
      description: 'Stir-fry sizzling Hakka noodles and steam dim sum dumplings over roaring dragon flames in Astro LAX.',
      perks: ['Master Wok Chef uniform', 'Blazing wok minigame', 'High food service rewards'],
      location: 'Golden Dragon Dynasty (Astro LAX)',
      x: 235,
      z: -45,
    },
    {
      role: 'Indian Tandoor Chef',
      title: 'Royal Tandoor Maestro',
      employer: 'Taj Flavors Royal Palace',
      salary: 'Rs. 4,800 / thali',
      icon: '🍛',
      description: 'Bake fresh garlic naan in 450° clay tandoor ovens and simmer royal Butter Paneer handis in Astro LAX.',
      perks: ['Royal Saffron Chef attire', 'Clay oven interactive workstation', 'Prestige tips'],
      location: 'Taj Flavors Royal Palace (Astro LAX)',
      x: 235,
      z: 45,
    },
    {
      role: 'LAX Pizza Chef',
      title: 'Coastal Pizza & Gelato Artisan',
      employer: 'Astro LAX Pizza Cafe',
      salary: 'Rs. 4,200 / combo',
      icon: '🍨',
      description: 'Craft wood-fired Margherita pizzas and scoop delicious artisanal Italian gelato by the ocean in Astro LAX.',
      perks: ['Coastal cafe uniform', 'Gelato counter access', 'Oceanview terrace perks'],
      location: 'Astro LAX Pizza Cafe (Astro LAX)',
      x: 205,
      z: -85,
    },
    {
      role: 'Mega Mansion Butler',
      title: 'VIP Estate Host & Butler',
      employer: 'Astro LAX Royal Mansion',
      salary: 'Rs. 5,000 / shift',
      icon: '🏰',
      description: 'Manage the billionaire estate, calibrate the infinity pool, and light the rooftop helipad in Astro LAX.',
      perks: ['VIP Helipad & Mansion access', 'Celebrity connections', 'Billionaire estate bonus'],
      location: 'Royal Grand Mansion (Astro LAX)',
      x: 285,
      z: 0,
    },
    {
      role: 'Pizza Delivery',
      title: 'Express Delivery Driver',
      employer: 'Astro Pizza & Bakery',
      salary: 'Rs. 4,200 / delivery',
      icon: '🛵',
      description: 'Hop on the yellow pizza scooter and deliver piping hot pizzas to citizens across the city.',
      perks: ['Free Delivery Scooter access', 'Generous tips from customers', 'GPS route tracking'],
      location: 'Astro Pizza & Bakery',
      x: -38,
      z: -25,
    },
    {
      role: 'Cafe Barista',
      title: 'Artisan Cafe Barista',
      employer: 'Astro Cafe & Market',
      salary: 'Rs. 3,000 / shift',
      icon: '☕',
      description: 'Grind roasted beans, steam milk, and pour exquisite latte art for thirsty visitors.',
      perks: ['Free gourmet snacks & coffee', 'Fun interactive barista machine', 'Fast payouts'],
      location: 'Astro Cafe & Market',
      x: -38,
      z: 25,
    },
    {
      role: 'Doctor',
      title: 'Chief Medical Doctor',
      employer: 'Astro City Hospital',
      salary: 'Rs. 4,500 / patient',
      icon: '🏥',
      description: 'Diagnose patients, apply bandages, administer vitamin shots, and restore city health.',
      perks: ['Doctor Lab Coat uniform', 'High prestige & reputation points', 'Hospital clinic access'],
      location: 'Astro City Hospital',
      x: 38,
      z: -25,
    },
    {
      role: 'Police Officer',
      title: 'City Patrol Officer',
      employer: 'Astro Police Dept',
      salary: 'Rs. 4,000 / shift',
      icon: '👮',
      description: 'Monitor traffic radar, sound security sirens, and keep Astro Place safe and orderly.',
      perks: ['Police Cruiser access & siren', 'Official badge & uniform', 'City broadcast alert tool'],
      location: 'Astro Police Dept',
      x: 38,
      z: 25,
    },
    {
      role: 'Party DJ',
      title: 'Resident Party DJ',
      employer: 'Astro Party Villa',
      salary: 'Rs. 5,000 / event',
      icon: '🪩',
      description: 'Drop high-energy synth & EDM beats, control the disco lights, and host epic pool parties.',
      perks: ['VIP Villa & pool access', 'Party crown headgear', 'Fireworks launcher access'],
      location: 'Astro Party Villa',
      x: 0,
      z: 75,
    },
    {
      role: 'Citizen',
      title: 'Astro Place Citizen',
      employer: 'Astro Municipality',
      salary: 'Rs. 2,000 daily stipend',
      icon: '🏙️',
      description: 'Explore the city freely, drive sports cars, hang out at parks, and enjoy the social life.',
      perks: ['Unlimited city freedom', 'Daily citizen allowance', 'No work required'],
      location: 'Central Plaza',
      x: 0,
      z: 0,
    },
  ];

  // Clothing Options for Inventory Wardrobe
  const clothingOptions: ClothingItem[] = [
    // Shirts
    { id: 'c_blue', name: 'Royal Blue Streetwear', type: 'shirt', value: '#1e88e5', icon: '👕', description: 'Classic comfortable casual style' },
    { id: 'c_red', name: 'Crimson Chef Jacket', type: 'shirt', value: '#e53935', icon: '🧑‍🍳', description: 'Bright red culinary chef uniform' },
    { id: 'c_police', name: 'Police Enforcer Shirt', type: 'shirt', value: '#1565c0', icon: '👮', description: 'Official municipal police uniform' },
    { id: 'c_doctor', name: 'Doctor Clinical Coat', type: 'shirt', value: '#f5f5f5', icon: '🥼', description: 'Pristine white clinical hospital coat' },
    { id: 'c_party', name: 'Neon VIP Party Hoodie', type: 'shirt', value: '#ec407a', icon: '🪩', description: 'Glow-in-the-dark hot pink party attire' },
    { id: 'c_black', name: 'Midnight Charcoal Jacket', type: 'shirt', value: '#212121', icon: '🧥', description: 'Sleek dark urban attire' },

    // Pants
    { id: 'p_dark', name: 'Charcoal Cargo Pants', type: 'pants', value: '#212121', icon: '👖', description: 'Durable multi-pocket cargo pants' },
    { id: 'p_denim', name: 'Classic Blue Denim', type: 'pants', value: '#1565c0', icon: '👖', description: 'Timeless sturdy blue jeans' },
    { id: 'p_white', name: 'Snow White Slacks', type: 'pants', value: '#ffffff', icon: '👖', description: 'Clean modern dress slacks' },
    { id: 'p_khaki', name: 'Warm Khaki Chinos', type: 'pants', value: '#bcaaa4', icon: '👖', description: 'Relaxed casual chinos' },

    // Hats
    { id: 'h_none', name: 'No Hat', type: 'hat', value: 'none', icon: '👤', description: 'Show your natural hairstyle' },
    { id: 'h_cap', name: 'Red Baseball Cap', type: 'hat', value: 'cap', icon: '🧢', description: 'Sporty baseball snapback' },
    { id: 'h_chef', name: 'Baker Chef Toque', type: 'hat', value: 'chef', icon: '👨‍🍳', description: 'Tall white master chef hat' },
    { id: 'h_police', name: 'Police Patrol Cap', type: 'hat', value: 'police', icon: '👮', description: 'Authorized law enforcement cap' },
    { id: 'h_crown', name: 'Golden Party Crown', type: 'hat', value: 'party_crown', icon: '👑', description: 'Shining gold party monarch crown' },

    // Accessories
    { id: 'a_none', name: 'No Accessory', type: 'accessory', value: 'none', icon: '🚫', description: 'Remove back accessory' },
    { id: 'a_bag', name: 'Explorer Backpack', type: 'accessory', value: 'backpack', icon: '🎒', description: 'Heavy-duty city traveler pack' },
    { id: 'a_wings', name: 'Neon Cyber Wings', type: 'accessory', value: 'wings', icon: '🪽', description: 'Holographic glowing cyan wings' },
  ];

  // COMMS HANDLERS
  const handleSendDirectMessage = () => {
    if (!inputMessage.trim() || !activeContactId) return;
    soundManager.playPhoneChime();

    const activeContact = contacts.find((c) => c.id === activeContactId);
    const newMsg = {
      sender: profile.name,
      text: inputMessage.trim(),
      time: 'Just now',
      isMe: true,
    };

    setDirectMessages((prev) => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), newMsg],
    }));

    setInputMessage('');

    // Dynamic intelligent NPC response
    setTimeout(() => {
      soundManager.playPhoneChime();
      let replyText = 'Sounds great! See you soon in Astro Place!';
      if (activeContactId === 'c_marco') {
        replyText = 'Got your order! Extra cheese on the house for you!';
      } else if (activeContactId === 'c_raj') {
        replyText = 'Understood! Keeping an eye on that sector.';
      } else if (activeContactId === 'c_dj') {
        replyText = 'Bass boosted track coming up! Jump in the pool!';
      } else if (activeContactId === 'c_sneha') {
        replyText = 'You rock that outfit! Drop by the boutique anytime.';
      } else if (activeContactId === 'c_rohan') {
        replyText = 'Meet me near the central fountain!';
      }

      const replyMsg = {
        sender: activeContact ? activeContact.name : 'Citizen',
        text: replyText,
        time: 'Just now',
        isMe: false,
      };

      setDirectMessages((prev) => ({
        ...prev,
        [activeContactId]: [...(prev[activeContactId] || []), replyMsg],
      }));
    }, 1200);
  };

  const handleAddFriendByNumber = () => {
    if (!addNumberInput.trim()) return;
    soundManager.playCash();
    const newFriend: FriendContact = {
      id: `c_${Date.now()}`,
      name: `Player #${addNumberInput.slice(-4)}`,
      astroNumber: addNumberInput.trim(),
      status: 'Online in Astro Place',
      isOnline: true,
      avatarColor: '#4caf50',
      lastMessage: 'Added as friend via Astro Comms!',
    };
    setContacts((prev) => [newFriend, ...prev]);
    setActiveContactId(newFriend.id);
    setDirectMessages((prev) => ({
      ...prev,
      [newFriend.id]: [
        { sender: 'System', text: `Connected with ${newFriend.name} (${newFriend.astroNumber})`, time: 'Just now' },
      ],
    }));
    setAddNumberInput('');
    setShowAddContact(false);
  };

  // JOB SWITCH HANDLER
  const handleApplyJob = (job: JobInfo) => {
    soundManager.playCash();
    onSetRole(job.role);
    onAddMoney(1500, `Hired as ${job.title} sign-on bonus`);
  };

  // CLOTHING EQUIP HANDLER
  const handleEquipClothing = (item: ClothingItem) => {
    soundManager.playFootstep();
    if (item.type === 'shirt') {
      onUpdateCustomization({ ...customization, shirtColor: item.value });
    } else if (item.type === 'pants') {
      onUpdateCustomization({ ...customization, pantsColor: item.value });
    } else if (item.type === 'hat') {
      onUpdateCustomization({ ...customization, hat: item.value as any });
    } else if (item.type === 'accessory') {
      onUpdateCustomization({ ...customization, accessory: item.value as any });
    }
  };

  // ITEM USE HANDLER
  const handleUseItemInternal = (item: InventoryItem) => {
    soundManager.playCash();
    onUseItem(item.id);

    if (item.id === 'item_confetti') {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      soundManager.playCheer();
    } else if (item.id === 'item_sparkler') {
      soundManager.playFirework();
    } else if (item.id === 'item_key') {
      soundManager.playHorn();
    }
  };

  const handleRegenerateAstroNumber = () => {
    soundManager.playPhoneChime();
    const part1 = Math.floor(100 + Math.random() * 900);
    const part2 = Math.floor(10 + Math.random() * 90);
    const part3 = Math.floor(1000 + Math.random() * 9000);
    const newNum = `${part1}-${part2}-${part3}`;
    onUpdateProfile({ ...profile, astroNumber: newNum });
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.astroNumber.includes(contactSearch)
  );

  const activeContact = contacts.find((c) => c.id === activeContactId) || contacts[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/65 backdrop-blur-xs select-none">
      {/* Smartphone Hardware Outer Shell */}
      <div className="relative w-86 sm:w-94 h-[min(630px,95vh)] max-h-[95vh] bg-slate-900 rounded-[44px] sm:rounded-[48px] p-2.5 sm:p-3 shadow-2xl border-4 border-slate-700 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute top-3.5 sm:top-4.5 left-1/2 -translate-x-1/2 w-28 h-5 sm:h-5.5 bg-black rounded-full z-30 flex items-center justify-center shadow-md">
          <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-indigo-950 rounded-full ml-3 border border-indigo-800/80 flex items-center justify-center">
            <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
          </div>
        </div>

        {/* OLED Screen Content */}
        <div className="relative w-full h-full bg-linear-to-b from-slate-950 via-indigo-950/70 to-slate-950 rounded-[34px] sm:rounded-[38px] overflow-hidden flex flex-col text-white pt-5 sm:pt-6 pb-2 px-3">
          {/* Status Bar */}
          <div className="flex items-center justify-between px-3 text-xs text-slate-300 font-semibold mb-2 z-20">
            <span className="font-mono text-[11px]">12:45 PM</span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-0.5 text-emerald-400 font-bold">
                <Radio className="w-3 h-3 animate-pulse" /> 5G
              </span>
              <span>100% 🔋</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* HOME SCREEN (APP GRID) */}
          {/* ========================================================= */}
          {activeApp === null ? (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-0.5">
              {/* Home Widget: Astro Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-sm mt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">
                      Astro City Pass
                    </span>
                    <h2 className="text-sm font-bold text-white truncate">{profile.name}</h2>
                  </div>
                  <span className="text-[11px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                    {profile.astroNumber}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs pt-1.5 border-t border-white/10">
                  <span className="text-slate-300 text-[11px] flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-amber-400" /> {profile.job}
                  </span>
                  <span className="text-emerald-400 font-bold text-xs">
                    Rs. {profile.money.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 4 PRIMARY APPS REQUESTED BY USER */}
              <div className="my-auto py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1 mb-2">
                  Featured Apps
                </div>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {/* 1. ASTRO MAP */}
                  <button
                    onClick={() => {
                      soundManager.playPhoneChime();
                      setActiveApp('map');
                    }}
                    className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-emerald-400/30">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-100 text-center leading-tight">
                      Astro Map
                    </span>
                  </button>

                  {/* 2. COMMS */}
                  <button
                    onClick={() => {
                      soundManager.playPhoneChime();
                      setActiveApp('comms');
                    }}
                    className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-cyan-400/30">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-100 text-center leading-tight">
                      Comms
                    </span>
                  </button>

                  {/* 3. JOB HUB */}
                  <button
                    onClick={() => {
                      soundManager.playPhoneChime();
                      setActiveApp('jobs');
                    }}
                    className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-linear-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-amber-400/30">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-100 text-center leading-tight">
                      Job Hub
                    </span>
                  </button>

                  {/* 4. INVENTORY */}
                  <button
                    onClick={() => {
                      soundManager.playPhoneChime();
                      setActiveApp('inventory');
                    }}
                    className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-linear-to-br from-purple-500 to-indigo-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-purple-400/30">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-100 text-center leading-tight">
                      Inventory
                    </span>
                  </button>
                </div>

                {/* SECONDARY UTILITY APPS */}
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1 mb-2">
                  City Utilities
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {/* Astro ID */}
                  <button
                    onClick={() => {
                      soundManager.playPhoneChime();
                      setActiveApp('profile');
                    }}
                    className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-300">Astro ID</span>
                  </button>

                  {/* Garage */}
                  <button
                    onClick={() => {
                      soundManager.playPhoneChime();
                      setActiveApp('garage');
                    }}
                    className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-red-500 to-rose-700 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Car className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-300">Garage</span>
                  </button>

                  {/* Party */}
                  <button
                    onClick={() => {
                      soundManager.playPhoneChime();
                      setActiveApp('party');
                    }}
                    className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-pink-500 to-fuchsia-700 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <PartyPopper className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-300">Party</span>
                  </button>

                  {/* Astro Beats */}
                  <button
                    onClick={() => {
                      soundManager.playPhoneChime();
                      setActiveApp('music');
                    }}
                    className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-violet-500 to-purple-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Music className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-300">Beats</span>
                  </button>
                </div>
              </div>

              {/* Bottom Quick Status */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between text-xs text-slate-300 border border-white/10 mt-auto">
                <span className="text-[11px]">🇮🇳 {profile.region}</span>
                <span className="text-[11px] text-amber-300 font-mono font-bold">
                  Rep: {profile.reputation} pts
                </span>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* SUB-APP VIEWS */
            /* ========================================================= */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Universal Top Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <button
                  onClick={() => {
                    soundManager.playPhoneChime();
                    setActiveApp(null);
                  }}
                  className="text-xs text-blue-400 font-bold flex items-center gap-1 hover:text-blue-300 active:scale-95"
                >
                  ‹ Back
                </button>
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  {activeApp === 'map'
                    ? 'Astro Map'
                    : activeApp === 'comms'
                    ? 'Comms Network'
                    : activeApp === 'jobs'
                    ? 'Job Hub'
                    : activeApp === 'inventory'
                    ? 'Inventory & Outfits'
                    : activeApp === 'profile'
                    ? 'Astro ID'
                    : activeApp === 'garage'
                    ? 'Vehicle Garage'
                    : activeApp === 'party'
                    ? 'Party Central'
                    : 'Astro Beats'}
                </span>
                <div className="w-8"></div>
              </div>

              {/* --------------------------------------------------------- */}
              {/* 1. APP: ASTRO MAP (With city locations & player markers) */}
              {/* --------------------------------------------------------- */}
              {activeApp === 'map' && (
                <div className="flex-1 flex flex-col overflow-hidden text-xs">
                  {/* Map Category Filters */}
                  <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                    {(['all', 'jobs', 'fun', 'shops'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          soundManager.playFootstep();
                          setMapCategory(cat);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors ${
                          mapCategory === cat
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* 2D Interactive Digital Radar Dual-City Map */}
                  <div className="relative w-full h-64 bg-slate-950 rounded-2xl border-2 border-emerald-500/40 overflow-hidden shadow-inner flex items-center justify-center select-none">
                    {/* Grid lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:20px_20px] opacity-40"></div>

                    {/* Zone Labels */}
                    <div className="absolute top-2 left-3 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md text-[9px] font-black text-emerald-300 tracking-wider">
                      ASTRO PLACE
                    </div>
                    <div className="absolute top-2 right-12 bg-indigo-950/80 border border-indigo-500/40 px-2 py-0.5 rounded-md text-[9px] font-black text-cyan-300 tracking-wider">
                      ASTRO LAX
                    </div>

                    {/* Blue River Channel */}
                    <div
                      style={{ left: '44%', width: '13%' }}
                      className="absolute inset-y-0 bg-blue-900/40 border-x border-blue-500/30 flex items-center justify-center"
                    >
                      <span className="text-[8px] font-mono text-blue-400 rotate-90 tracking-widest opacity-60">
                        RIVER
                      </span>
                    </div>

                    {/* Grand Suspension Bridge Road Span */}
                    <div
                      style={{ left: '38%', width: '25%', top: '48%' }}
                      className="absolute h-4 bg-red-900/80 border-y-2 border-red-500 flex items-center justify-center z-5 shadow-lg"
                    >
                      <span className="text-[7px] font-black text-amber-300 tracking-tighter">
                        BRIDGE
                      </span>
                    </div>

                    {/* Astro Place Roads */}
                    <div
                      style={{ left: '6%', width: '38%', top: '48%' }}
                      className="absolute h-3 bg-slate-800/80"
                    ></div>
                    <div
                      style={{ left: '22%', width: '3%', top: '0', bottom: '0' }}
                      className="absolute bg-slate-800/80"
                    ></div>

                    {/* Central Plaza Ring */}
                    <div
                      style={{ left: '23.5%', top: '50%' }}
                      className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-500/50 bg-teal-950/40 flex items-center justify-center"
                    >
                      <span className="text-[8px]">⛲</span>
                    </div>

                    {/* Astro LAX Roads */}
                    <div
                      style={{ left: '57%', width: '37%', top: '48%' }}
                      className="absolute h-3 bg-slate-800/80"
                    ></div>
                    <div
                      style={{ left: '74%', width: '3%', top: '0', bottom: '0' }}
                      className="absolute bg-slate-800/80"
                    ></div>

                    {/* Location Markers across Astro Place & Astro LAX */}
                    {mapLocations
                      .filter((l) => mapCategory === 'all' || l.category === mapCategory)
                      .map((loc) => {
                        const normX = Math.max(0, Math.min(1, (loc.x + 85) / 390));
                        const normZ = Math.max(0, Math.min(1, (loc.z + 105) / 210));
                        const left = 8 + normX * 84;
                        const top = 10 + normZ * 80;

                        return (
                          <button
                            key={loc.id}
                            onClick={() => {
                              soundManager.playPhoneChime();
                              setSelectedLocation(loc);
                            }}
                            style={{ left: `${left}%`, top: `${top}%` }}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-125 z-10 ${
                              selectedLocation?.id === loc.id
                                ? 'bg-amber-400 text-black ring-2 ring-white scale-125'
                                : 'bg-slate-800 text-white border border-white/40'
                            }`}
                            title={loc.name}
                          >
                            <span className="text-xs">{loc.icon}</span>
                          </button>
                        );
                      })}

                    {/* LIVE NPC MARKERS */}
                    {liveNPCs.map((npc, idx) => {
                      const normX = Math.max(0, Math.min(1, (npc.x + 85) / 390));
                      const normZ = Math.max(0, Math.min(1, (npc.z + 105) / 210));
                      const left = 8 + normX * 84;
                      const top = 10 + normZ * 80;
                      return (
                        <div
                          key={idx}
                          style={{ left: `${left}%`, top: `${top}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-black shadow-sm z-10"
                          title={`${npc.name} (${npc.role})`}
                        ></div>
                      );
                    })}

                    {/* LIVE PLAYER MARKER */}
                    {(() => {
                      const normX = Math.max(0, Math.min(1, (livePlayerPos.x + 85) / 390));
                      const normZ = Math.max(0, Math.min(1, (livePlayerPos.z + 105) / 210));
                      const pLeft = 8 + normX * 84;
                      const pTop = 10 + normZ * 80;
                      return (
                        <div
                          style={{ left: `${pLeft}%`, top: `${pTop}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none"
                        >
                          <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                          </div>
                          <span className="text-[8px] bg-black/80 text-emerald-300 font-bold px-1 rounded-sm mt-0.5 whitespace-nowrap">
                            YOU
                          </span>
                        </div>
                      );
                    })()}

                    {/* Compass North Indicator */}
                    <div className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded-md text-[9px] font-mono text-emerald-400 border border-emerald-500/30">
                      N ↑
                    </div>
                  </div>

                  {/* Selected Location Card & Fast Travel */}
                  <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1">
                    {selectedLocation ? (
                      <div className="bg-white/10 rounded-2xl p-3 border border-white/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{selectedLocation.icon}</span>
                            <div>
                              <h4 className="font-bold text-white text-xs">{selectedLocation.name}</h4>
                              <p className="text-[10px] text-slate-300">{selectedLocation.desc}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-white/10">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Coords: [{selectedLocation.x}, {selectedLocation.z}]
                          </span>
                          <button
                            onClick={() => {
                              soundManager.playPhoneChime();
                              onTeleport(selectedLocation.x, selectedLocation.z, selectedLocation.name);
                              onClose();
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 shadow-md transition-transform active:scale-95"
                          >
                            <Navigation className="w-3 h-3" /> Fast Travel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400 text-[11px]">
                        Tap any marker on the map to view district details & fast travel!
                      </div>
                    )}

                    {/* Quick Location List */}
                    <div className="space-y-1">
                      {mapLocations.slice(0, 4).map((loc) => (
                        <div
                          key={loc.id}
                          onClick={() => {
                            soundManager.playFootstep();
                            setSelectedLocation(loc);
                          }}
                          className="bg-white/5 hover:bg-white/10 p-2 rounded-xl flex items-center justify-between cursor-pointer border border-white/5"
                        >
                          <div className="flex items-center gap-2">
                            <span>{loc.icon}</span>
                            <span className="text-xs text-white font-medium">{loc.name}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --------------------------------------------------------- */}
              {/* 2. APP: COMMS (Messaging friends & nearby players)       */}
              {/* --------------------------------------------------------- */}
              {activeApp === 'comms' && (
                <div className="flex-1 flex flex-col overflow-hidden text-xs">
                  {/* Comms Tabs: Direct Friends vs Nearby Frequency */}
                  <div className="flex bg-white/10 p-1 rounded-xl mb-2 gap-1">
                    <button
                      onClick={() => {
                        soundManager.playFootstep();
                        setCommsTab('contacts');
                      }}
                      className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                        commsTab === 'contacts' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-300'
                      }`}
                    >
                      Friends & Contacts ({contacts.length})
                    </button>
                    <button
                      onClick={() => {
                        soundManager.playFootstep();
                        setCommsTab('nearby');
                      }}
                      className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                        commsTab === 'nearby' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300'
                      }`}
                    >
                      Nearby Radio
                    </button>
                  </div>

                  {commsTab === 'contacts' ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Search & Add Friend */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="relative flex-1">
                          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search contacts..."
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            className="w-full bg-white/10 rounded-lg pl-7 pr-2 py-1 text-[11px] text-white border border-white/15 focus:outline-hidden"
                          />
                        </div>
                        <button
                          onClick={() => setShowAddContact(!showAddContact)}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-2 py-1 rounded-lg text-[10px]"
                        >
                          + Add
                        </button>
                      </div>

                      {/* Add by Astro Number Modal Drawer */}
                      {showAddContact && (
                        <div className="bg-slate-900 border border-cyan-500/40 p-2.5 rounded-xl mb-2 space-y-2">
                          <span className="text-[10px] text-cyan-300 font-bold">Add Friend by Astro Number</span>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="e.g. 777-99-8899"
                              value={addNumberInput}
                              onChange={(e) => setAddNumberInput(e.target.value)}
                              className="flex-1 bg-white/10 rounded-lg px-2 py-1 text-xs text-white border border-white/20"
                            />
                            <button
                              onClick={handleAddFriendByNumber}
                              className="bg-emerald-600 px-3 py-1 rounded-lg text-xs font-bold"
                            >
                              Connect
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Contact Horizontal Scroller */}
                      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 border-b border-white/10">
                        {filteredContacts.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              soundManager.playFootstep();
                              setActiveContactId(c.id);
                            }}
                            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-transform ${
                              activeContactId === c.id ? 'scale-105' : 'opacity-70 hover:opacity-100'
                            }`}
                          >
                            <div
                              className="relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md border-2"
                              style={{
                                backgroundColor: c.avatarColor,
                                borderColor: activeContactId === c.id ? '#00e5ff' : 'transparent',
                              }}
                            >
                              {c.name[0]}
                              {c.isOnline && (
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950"></div>
                              )}
                            </div>
                            <span className="text-[9px] font-bold text-slate-200 truncate w-14 text-center">
                              {c.name.split(' ')[0]}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Active Conversation Messages */}
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-1">
                        <div className="text-center text-[10px] text-slate-400 py-1">
                          Chatting with <span className="text-cyan-300 font-bold">{activeContact.name}</span> ({activeContact.astroNumber})
                        </div>

                        {(directMessages[activeContactId] || []).map((msg, idx) => (
                          <div
                            key={idx}
                            className={`max-w-[85%] rounded-2xl p-2.5 text-[11px] leading-snug ${
                              msg.isMe
                                ? 'bg-cyan-600 text-white ml-auto rounded-tr-xs'
                                : 'bg-white/15 text-slate-100 mr-auto rounded-tl-xs'
                            }`}
                          >
                            {!msg.isMe && (
                              <p className="font-bold text-[10px] text-cyan-300 mb-0.5">{msg.sender}</p>
                            )}
                            <p>{msg.text}</p>
                            <span className="text-[9px] opacity-70 block text-right mt-0.5">{msg.time}</span>
                          </div>
                        ))}
                      </div>

                      {/* Quick Roleplay Response Chips */}
                      <div className="flex gap-1 overflow-x-auto py-1.5 border-t border-white/10">
                        {['Meet at Plaza ⛲', 'Order pizza 🍕', 'Need help 🚨', 'Party time 🎉'].map((chip) => (
                          <button
                            key={chip}
                            onClick={() => {
                              setInputMessage(chip);
                            }}
                            className="bg-white/10 hover:bg-white/20 text-slate-300 px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>

                      {/* Message Input Bar */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          placeholder={`Message ${activeContact.name}...`}
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendDirectMessage()}
                          className="flex-1 bg-white/10 rounded-full px-3 py-1.5 text-xs text-white border border-white/20 focus:outline-hidden"
                        />
                        <button
                          onClick={handleSendDirectMessage}
                          className="w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center text-white"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Nearby Radio Feed */
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="bg-blue-950/40 border border-blue-500/30 p-2.5 rounded-xl mb-2 flex items-center gap-2">
                        <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span className="text-[10px] text-slate-300">
                          Broadcasting on Astro City Local Frequency (Channel #01)
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {nearbyFeed.map((item) => (
                          <div key={item.id} className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              <span className="font-bold text-cyan-300">{item.sender}</span>
                              <span className="text-slate-400">{item.distance}</span>
                            </div>
                            <p className="text-[11px] text-slate-200">{item.text}</p>
                            <span className="text-[9px] text-slate-400 mt-1 block">{item.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --------------------------------------------------------- */}
              {/* 3. APP: JOB HUB (Listing available jobs & career careers) */}
              {/* --------------------------------------------------------- */}
              {activeApp === 'jobs' && (
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                  {/* Current Active Career Card */}
                  <div className="bg-linear-to-r from-amber-600/30 to-orange-600/30 border border-amber-400/40 rounded-2xl p-3">
                    <span className="text-[9px] uppercase font-bold text-amber-300 tracking-wider">
                      Current Career
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <h3 className="font-black text-sm text-white">{profile.job}</h3>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        Clocked In
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Working shifts earns instant cash and increases your citizen reputation.
                    </p>
                  </div>

                  {/* List of Available Jobs */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-1">
                      Available Openings in Astro Place
                    </span>

                    {availableJobs.map((job) => {
                      const isCurrent = profile.job === job.role;

                      return (
                        <div
                          key={job.role}
                          className={`p-3 rounded-2xl border transition-all ${
                            isCurrent
                              ? 'bg-amber-600/20 border-amber-400 shadow-sm'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl">{job.icon}</span>
                              <div>
                                <h4 className="font-bold text-white text-xs">{job.title}</h4>
                                <span className="text-[10px] text-slate-400">{job.employer}</span>
                              </div>
                            </div>
                            <span className="text-emerald-400 font-bold text-xs">{job.salary}</span>
                          </div>

                          <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                            {job.description}
                          </p>

                          {/* Perks */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {job.perks.map((perk, pIdx) => (
                              <span
                                key={pIdx}
                                className="bg-white/10 text-slate-200 text-[9px] px-2 py-0.5 rounded-full"
                              >
                                ✓ {perk}
                              </span>
                            ))}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-3 flex gap-2 pt-2 border-t border-white/10">
                            {isCurrent ? (
                              <button
                                onClick={() => {
                                  onOpenJobsStation(
                                    job.role === 'Pizza Chef'
                                      ? 'job_pizza'
                                      : job.role === 'Cafe Barista'
                                      ? 'job_cafe'
                                      : job.role === 'Doctor'
                                      ? 'job_hospital'
                                      : 'job_police'
                                  );
                                  onClose();
                                }}
                                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md"
                              >
                                <Briefcase className="w-3.5 h-3.5" /> Start Work Shift
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApplyJob(job)}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-transform active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5" /> Apply & Clock In
                              </button>
                            )}

                            <button
                              onClick={() => {
                                soundManager.playPhoneChime();
                                onTeleport(job.x, job.z, job.location);
                                onClose();
                              }}
                              className="px-3 bg-white/10 hover:bg-white/20 text-slate-200 font-semibold py-1.5 rounded-xl text-[11px] flex items-center gap-1"
                              title="GPS to workplace"
                            >
                              <Navigation className="w-3 h-3" /> Map
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --------------------------------------------------------- */}
              {/* 4. APP: INVENTORY (For items and clothing)                */}
              {/* --------------------------------------------------------- */}
              {activeApp === 'inventory' && (
                <div className="flex-1 flex flex-col overflow-hidden text-xs">
                  {/* Top Switcher: Items vs Clothing */}
                  <div className="flex bg-white/10 p-1 rounded-xl mb-2 gap-1">
                    <button
                      onClick={() => {
                        soundManager.playFootstep();
                        setInventoryTab('items');
                      }}
                      className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                        inventoryTab === 'items' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-300'
                      }`}
                    >
                      Items & Tools ({inventory.length})
                    </button>
                    <button
                      onClick={() => {
                        soundManager.playFootstep();
                        setInventoryTab('clothing');
                      }}
                      className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                        inventoryTab === 'clothing' ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-300'
                      }`}
                    >
                      Clothing & Outfits
                    </button>
                  </div>

                  {inventoryTab === 'items' ? (
                    /* Items & Consumables View */
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {inventory.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white/10 rounded-2xl p-3 border border-white/10 flex items-center justify-between gap-3 hover:border-white/20"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-white text-xs">{item.name}</h4>
                                <span className="text-[10px] text-amber-300 font-mono">
                                  x{item.quantity}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-300 mt-0.5">{item.description}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleUseItemInternal(item)}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md transition-transform active:scale-95"
                          >
                            Use
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Clothing & Wardrobe View */
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Clothing Subcategories */}
                      <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                        {(['shirts', 'pants', 'hats', 'accessories'] as const).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              soundManager.playFootstep();
                              setClothingCategory(cat);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors ${
                              clothingCategory === cat
                                ? 'bg-pink-600 text-white shadow-sm'
                                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Clothing List */}
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {clothingOptions
                          .filter((c) => {
                            if (clothingCategory === 'shirts') return c.type === 'shirt';
                            if (clothingCategory === 'pants') return c.type === 'pants';
                            if (clothingCategory === 'hats') return c.type === 'hat';
                            return c.type === 'accessory';
                          })
                          .map((cloth) => {
                            const isEquipped =
                              (cloth.type === 'shirt' && customization.shirtColor === cloth.value) ||
                              (cloth.type === 'pants' && customization.pantsColor === cloth.value) ||
                              (cloth.type === 'hat' && customization.hat === cloth.value) ||
                              (cloth.type === 'accessory' && customization.accessory === cloth.value);

                            return (
                              <div
                                key={cloth.id}
                                className={`p-2.5 rounded-2xl border flex items-center justify-between transition-colors ${
                                  isEquipped
                                    ? 'bg-pink-600/25 border-pink-400'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="text-xl">{cloth.icon}</span>
                                  <div>
                                    <h4 className="font-bold text-white text-xs">{cloth.name}</h4>
                                    <p className="text-[10px] text-slate-400">{cloth.description}</p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleEquipClothing(cloth)}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-transform active:scale-95 ${
                                    isEquipped
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                  }`}
                                >
                                  {isEquipped ? 'Equipped' : 'Equip'}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --------------------------------------------------------- */}
              {/* UTILITY SUB-APPS: PROFILE, GARAGE, PARTY, MUSIC          */}
              {/* --------------------------------------------------------- */}
              {activeApp === 'profile' && (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center">
                    <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-400 to-indigo-600 mx-auto flex items-center justify-center text-2xl shadow-inner mb-2">
                      🇮🇳
                    </div>
                    <h3 className="text-sm font-bold text-white">{profile.name}</h3>
                    <p className="text-slate-300 text-[11px]">{profile.job}</p>
                    <div className="mt-2 inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-full font-mono font-bold text-xs">
                      <span>{profile.astroNumber}</span>
                      <button
                        onClick={handleRegenerateAstroNumber}
                        title="Generate New Astro Number"
                        className="p-1 hover:text-white"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 space-y-2 border border-white/10">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Country</span>
                      <span className="font-semibold text-white">{profile.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Region</span>
                      <span className="font-semibold text-white">{profile.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reputation</span>
                      <span className="font-semibold text-amber-400">⭐ {profile.reputation} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Wallet</span>
                      <span className="font-bold text-emerald-400">Rs. {profile.money.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })}
                      className="w-full bg-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white border border-white/20 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {activeApp === 'garage' && (
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                  <p className="text-[11px] text-slate-300">
                    Spawn any vehicle right next to your character instantly:
                  </p>
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="bg-white/10 rounded-xl p-2.5 border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm"
                          style={{ backgroundColor: v.color }}
                        >
                          🚗
                        </div>
                        <div>
                          <p className="font-bold text-white">{v.name}</p>
                          <p className="text-[10px] text-slate-300">Top Speed: {v.speed} km/h</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          soundManager.playHorn();
                          onSpawnCar(v.id);
                          onClose();
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                      >
                        Spawn
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeApp === 'party' && (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  <div className="bg-pink-500/20 border border-pink-500/30 rounded-xl p-3">
                    <h4 className="font-bold text-pink-300 text-sm">Host an Astro Party!</h4>
                    <p className="text-slate-300 text-[11px] mt-1">
                      Broadcasts a party announcement, turns on Villa lights, and launches fireworks.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onHostParty('Neon Disco Pool Bash');
                      onClose();
                    }}
                    className="w-full bg-linear-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <PartyPopper className="w-4 h-4" /> Start Party at Villa!
                  </button>
                </div>
              )}

              {activeApp === 'music' && (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  <div className="bg-violet-900/40 border border-violet-500/40 rounded-2xl p-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-pink-500 to-indigo-500 mx-auto flex items-center justify-center text-3xl shadow-lg mb-2">
                      🎵
                    </div>
                    <h3 className="font-bold text-white text-sm">{currentTrack}</h3>
                    <p className="text-violet-300 text-[10px]">Astro Radio Beats</p>
                  </div>

                  <div className="space-y-2">
                    {['Astro City Vibes', 'Party Blast', 'Sunset Chill'].map((track) => (
                      <div
                        key={track}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          currentTrack === track && isPlayingMusic
                            ? 'bg-violet-600/30 border-violet-400'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className="font-medium text-white">{track}</span>
                        <button
                          onClick={() => {
                            if (isPlayingMusic && currentTrack === track) {
                              soundManager.stopMusic();
                              setIsPlayingMusic(false);
                            } else {
                              soundManager.startMusic(track);
                              setCurrentTrack(track);
                              setIsPlayingMusic(true);
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white"
                        >
                          {currentTrack === track && isPlayingMusic ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phone Bottom Home Bar */}
          <div className="pt-2 flex justify-center z-20">
            <button
              onClick={() => {
                soundManager.playPhoneChime();
                if (activeApp !== null) {
                  setActiveApp(null);
                } else {
                  onClose();
                }
              }}
              className="w-24 h-1.5 bg-slate-400 hover:bg-white rounded-full transition-colors active:scale-95"
              title="Home Button / Close"
            ></button>
          </div>
        </div>

        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 text-white border-2 border-slate-600 hover:bg-red-600 flex items-center justify-center shadow-lg active:scale-90"
          title="Close Phone"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
