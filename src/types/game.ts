export interface InteractiveZone {
  id: string;
  name: string;
  type:
    | 'job_pizza'
    | 'job_hospital'
    | 'job_cafe'
    | 'job_police'
    | 'job_chinese'
    | 'job_indian'
    | 'job_lax_pizza'
    | 'lax_mansion'
    | 'dealer'
    | 'boutique'
    | 'villa_party'
    | 'player_home'
    | 'npc'
    | 'vehicle';
  position: any;
  radius: number;
  data?: any;
}

export interface PlayerProfile {
  name: string;
  astroNumber: string;
  money: number;
  country: string;
  region: string;
  job: JobRole;
  bio: string;
  joinedDate: string;
  reputation: number;
}

export type JobRole =
  | 'Citizen'
  | 'Pizza Chef'
  | 'Pizza Delivery'
  | 'Cafe Barista'
  | 'Doctor'
  | 'Police Officer'
  | 'Party DJ'
  | 'Chinese Wok Chef'
  | 'Indian Tandoor Chef'
  | 'LAX Pizza Chef'
  | 'Mega Mansion Butler';

export interface CharacterCustomization {
  skinColor: string;
  shirtColor: string;
  pantsColor: string;
  hairStyle: 'messy' | 'spiky' | 'curly' | 'cap' | 'beanie';
  hairColor: string;
  hat: 'none' | 'chef' | 'police' | 'party_crown' | 'cap' | 'sunglasses';
  accessory: 'none' | 'backpack' | 'guitar' | 'wings';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'food' | 'tool' | 'toy' | 'drink';
  icon: string;
  price: number;
  description: string;
  quantity: number;
}

export interface ClothingItem {
  id: string;
  name: string;
  type: 'shirt' | 'pants' | 'hat' | 'accessory';
  value: string;
  icon: string;
  description: string;
  isEquipped?: boolean;
}

export interface JobInfo {
  role: JobRole;
  title: string;
  employer: string;
  salary: string;
  icon: string;
  description: string;
  perks: string[];
  location: string;
  x: number;
  z: number;
}

export interface FriendContact {
  id: string;
  name: string;
  astroNumber: string;
  status: string;
  isOnline: boolean;
  avatarColor: string;
  lastMessage?: string;
}

export interface VehicleData {
  id: string;
  name: string;
  speed: number;
  color: string;
  type: 'sports' | 'van' | 'police' | 'scooter' | 'cruiser';
  price: number;
  owned: boolean;
}

export interface CityNPC {
  id: string;
  name: string;
  role: string;
  dialogue: string[];
  position: [number, number, number];
  skinColor: string;
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  hat?: string;
  targetPizza?: string;
  currentSpeech?: string;
  speechTimer?: number;
}

export interface ActiveParty {
  active: boolean;
  hostName: string;
  location: string;
  theme: string;
  musicPlaying: boolean;
  durationLeft: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isNpc?: boolean;
  time: string;
}

export interface DeliveryMission {
  active: boolean;
  targetNpcName: string;
  targetLocationName: string;
  targetPosition: [number, number, number];
  pizzaName: string;
  reward: number;
  timeLeft: number;
}
