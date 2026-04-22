import React from 'react';
import { 
    Briefcase, BookOpen, HeartPulse, Home, ChevronUp, Minus, ChevronDown, Tag, KanbanSquare, Code, BrainCircuit, Star, Zap, Brush,
    Activity, Anchor, Archive, Award, BadgeCheck, Bell, Bike, Bolt, Bomb, Bookmark, Building, Calculator, Calendar, Camera, CheckCircle,
    Clipboard, Clock, Cloud, Coffee, Compass, Database, Diamond, Dumbbell, Feather, FileText, Filter, Flag, Flame, Folder, Gamepad,
    Gift, Globe, GraduationCap, Hammer, Headphones, Image, Key, Laptop, Layers, Leaf, Lightbulb, Link, List, Lock, Map, Medal,
    Megaphone, MessageCircle, Mic, Moon, MousePointer, Music, Package, Palette, PenTool, Phone, PieChart, Pin, Plane, Plug, Pocket,
    Puzzle, Rocket, Save, Scale, Scissors, Send, Server, Settings, Share2, Shield, ShoppingBag, Smartphone, Speaker, Sun, Target,
    Terminal, ThumbsUp, ToggleLeft, Train, Trash, TrendingUp, Trophy, Truck, Umbrella, Unplug, Video, Wallet, Watch, Wrench
} from 'lucide-react';
import type { Category, Theme, TimerSettings } from './types';

export const ICONS: Record<string, React.ReactNode> = {
  Activity: <Activity className="w-4 h-4" />,
  Anchor: <Anchor className="w-4 h-4" />,
  Archive: <Archive className="w-4 h-4" />,
  Award: <Award className="w-4 h-4" />,
  BadgeCheck: <BadgeCheck className="w-4 h-4" />,
  Bell: <Bell className="w-4 h-4" />,
  Bike: <Bike className="w-4 h-4" />,
  Bolt: <Bolt className="w-4 h-4" />,
  Bomb: <Bomb className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  Bookmark: <Bookmark className="w-4 h-4" />,
  BrainCircuit: <BrainCircuit className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  Brush: <Brush className="w-4 h-4" />,
  Building: <Building className="w-4 h-4" />,
  Calculator: <Calculator className="w-4 h-4" />,
  Calendar: <Calendar className="w-4 h-4" />,
  Camera: <Camera className="w-4 h-4" />,
  CheckCircle: <CheckCircle className="w-4 h-4" />,
  Clipboard: <Clipboard className="w-4 h-4" />,
  Clock: <Clock className="w-4 h-4" />,
  Cloud: <Cloud className="w-4 h-4" />,
  Code: <Code className="w-4 h-4" />,
  Coffee: <Coffee className="w-4 h-4" />,
  Compass: <Compass className="w-4 h-4" />,
  Database: <Database className="w-4 h-4" />,
  Diamond: <Diamond className="w-4 h-4" />,
  Dumbbell: <Dumbbell className="w-4 h-4" />,
  Feather: <Feather className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  Filter: <Filter className="w-4 h-4" />,
  Flag: <Flag className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  Folder: <Folder className="w-4 h-4" />,
  Gamepad: <Gamepad className="w-4 h-4" />,
  Gift: <Gift className="w-4 h-4" />,
  Globe: <Globe className="w-4 h-4" />,
  GraduationCap: <GraduationCap className="w-4 h-4" />,
  Hammer: <Hammer className="w-4 h-4" />,
  Headphones: <Headphones className="w-4 h-4" />,
  HeartPulse: <HeartPulse className="w-4 h-4" />,
  Home: <Home className="w-4 h-4" />,
  Image: <Image className="w-4 h-4" />,
  KanbanSquare: <KanbanSquare className="w-4 h-4" />,
  Key: <Key className="w-4 h-4" />,
  Laptop: <Laptop className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  Leaf: <Leaf className="w-4 h-4" />,
  Lightbulb: <Lightbulb className="w-4 h-4" />,
  Link: <Link className="w-4 h-4" />,
  List: <List className="w-4 h-4" />,
  Lock: <Lock className="w-4 h-4" />,
  Map: <Map className="w-4 h-4" />,
  Medal: <Medal className="w-4 h-4" />,
  Megaphone: <Megaphone className="w-4 h-4" />,
  MessageCircle: <MessageCircle className="w-4 h-4" />,
  Mic: <Mic className="w-4 h-4" />,
  Moon: <Moon className="w-4 h-4" />,
  MousePointer: <MousePointer className="w-4 h-4" />,
  Music: <Music className="w-4 h-4" />,
  Package: <Package className="w-4 h-4" />,
  Palette: <Palette className="w-4 h-4" />,
  PenTool: <PenTool className="w-4 h-4" />,
  Phone: <Phone className="w-4 h-4" />,
  PieChart: <PieChart className="w-4 h-4" />,
  Pin: <Pin className="w-4 h-4" />,
  Plane: <Plane className="w-4 h-4" />,
  Plug: <Plug className="w-4 h-4" />,
  Pocket: <Pocket className="w-4 h-4" />,
  Puzzle: <Puzzle className="w-4 h-4" />,
  Rocket: <Rocket className="w-4 h-4" />,
  Save: <Save className="w-4 h-4" />,
  Scale: <Scale className="w-4 h-4" />,
  Scissors: <Scissors className="w-4 h-4" />,
  Send: <Send className="w-4 h-4" />,
  Server: <Server className="w-4 h-4" />,
  Settings: <Settings className="w-4 h-4" />,
  Share2: <Share2 className="w-4 h-4" />,
  Shield: <Shield className="w-4 h-4" />,
  ShoppingBag: <ShoppingBag className="w-4 h-4" />,
  Smartphone: <Smartphone className="w-4 h-4" />,
  Speaker: <Speaker className="w-4 h-4" />,
  Star: <Star className="w-4 h-4" />,
  Sun: <Sun className="w-4 h-4" />,
  Tag: <Tag className="w-4 h-4" />,
  Target: <Target className="w-4 h-4" />,
  Terminal: <Terminal className="w-4 h-4" />,
  ThumbsUp: <ThumbsUp className="w-4 h-4" />,
  ToggleLeft: <ToggleLeft className="w-4 h-4" />,
  Train: <Train className="w-4 h-4" />,
  Trash: <Trash className="w-4 h-4" />,
  TrendingUp: <TrendingUp className="w-4 h-4" />,
  Trophy: <Trophy className="w-4 h-4" />,
  Truck: <Truck className="w-4 h-4" />,
  Umbrella: <Umbrella className="w-4 h-4" />,
  Unplug: <Unplug className="w-4 h-4" />,
  Video: <Video className="w-4 h-4" />,
  Wallet: <Wallet className="w-4 h-4" />,
  Watch: <Watch className="w-4 h-4" />,
  Wrench: <Wrench className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Work', color: '#3B82F6', icon: 'Briefcase', isDefault: true },
  { id: 'cat-2', name: 'Coding', color: '#22C55E', icon: 'Code', isDefault: true },
  { id: 'cat-3', name: 'Learning', color: '#EAB308', icon: 'BookOpen', isDefault: true },
  { id: 'cat-4', name: 'Project', color: '#8B5CF6', icon: 'KanbanSquare', isDefault: true },
  { id: 'cat-5', name: 'Personal', color: '#EF4444', icon: 'Home', isDefault: true },
];

export const PRIORITY_CONFIG: Record<'low' | 'medium' | 'high', { label: string; borderColor: string; bgColor: string; icon: React.ReactNode }> = {
    low: {
        label: 'Low',
        borderColor: 'border-l-green-500',
        bgColor: 'bg-green-500/5 hover:bg-green-500/10',
        icon: <ChevronDown className="w-4 h-4 text-green-500 flex-shrink-0" />
    },
    medium: {
        label: 'Medium',
        borderColor: 'border-l-yellow-500',
        bgColor: 'bg-yellow-500/5 hover:bg-yellow-500/10',
        icon: <Minus className="w-4 h-4 text-yellow-500 flex-shrink-0" />
    },
    high: {
        label: 'High',
        borderColor: 'border-l-red-500',
        bgColor: 'bg-red-500/5 hover:bg-red-500/10',
        icon: <ChevronUp className="w-4 h-4 text-red-500 flex-shrink-0" />
    }
};

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG).map(([value, { label, icon }]) => ({
  value,
  label,
  icon,
}));


export const MOCK_FRIENDS = [
  { id: '1', name: 'Alex R.', avatar: 'https://picsum.photos/seed/alex/100/100', hours: 25.5, avgSessionMinutes: 45, topCategory: 'Coding', streak: 5 },
  { id: '3', name: 'Samantha G.', avatar: 'https://picsum.photos/seed/sam/100/100', hours: 19.8, avgSessionMinutes: 25, topCategory: 'Project', streak: 8 },
  { id: '4', name: 'Leo F.', avatar: 'https://picsum.photos/seed/leo/100/100', hours: 15.2, avgSessionMinutes: 50, topCategory: 'Learning', streak: 2 },
];

export const THEMES: Theme[] = [
  {
    id: 'zenith',
    name: 'Zenith Default',
    colors: {
      '--color-dark-bg': '#0A0910',
      '--color-dark-card': 'rgba(16, 18, 27, 0.7)',
      '--color-accent-indigo': '#6366F1',
      '--color-accent-cyan': '#22D3EE',
      '--color-accent-glow': 'rgba(99, 102, 241, 0.5)',
      '--color-electric-blue': '#00BFFF',
      '--background-style': `
        radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.1) 0px, transparent 50%),
        radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 0.1) 0px, transparent 50%),
        radial-gradient(at 52% 99%, hsla(355, 98%, 76%, 0.1) 0px, transparent 50%),
        radial-gradient(at 10% 29%, hsla(256, 96%, 68%, 0.1) 0px, transparent 50%),
        radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 0.1) 0px, transparent 50%),
        radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 0.1) 0px, transparent 50%),
        radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 0.1) 0px, transparent 50%)
      `,
    },
  },
  {
    id: 'crimson',
    name: 'Crimson Void',
    colors: {
      '--color-dark-bg': '#100A0A',
      '--color-dark-card': 'rgba(27, 16, 16, 0.7)',
      '--color-accent-indigo': '#DC2626', // Red-600
      '--color-accent-cyan': '#F87171', // Red-400
      '--color-accent-glow': 'rgba(220, 38, 38, 0.5)',
      '--color-electric-blue': '#EF4444', // Red-500
      '--background-style': `
        radial-gradient(at 27% 37%, hsla(0, 70%, 61%, 0.1) 0px, transparent 50%),
        radial-gradient(at 97% 21%, hsla(340, 70%, 72%, 0.1) 0px, transparent 50%),
        radial-gradient(at 52% 99%, hsla(10, 70%, 76%, 0.1) 0px, transparent 50%)
      `,
    },
  },
  {
    id: 'evergreen',
    name: 'Evergreen',
    colors: {
      '--color-dark-bg': '#0A100A',
      '--color-dark-card': 'rgba(16, 27, 16, 0.7)',
      '--color-accent-indigo': '#10B981', // Emerald-500
      '--color-accent-cyan': '#34D399', // Emerald-400
      '--color-accent-glow': 'rgba(16, 185, 129, 0.5)',
      '--color-electric-blue': '#059669', // Emerald-600
      '--background-style': `
        radial-gradient(at 27% 37%, hsla(150, 70%, 61%, 0.1) 0px, transparent 50%),
        radial-gradient(at 97% 21%, hsla(130, 70%, 72%, 0.1) 0px, transparent 50%),
        radial-gradient(at 52% 99%, hsla(160, 70%, 76%, 0.1) 0px, transparent 50%)
      `,
    },
  },
   {
    id: 'solar',
    name: 'Solar Flare',
    colors: {
      '--color-dark-bg': '#100E0A',
      '--color-dark-card': 'rgba(27, 22, 16, 0.7)',
      '--color-accent-indigo': '#F59E0B', // Amber-500
      '--color-accent-cyan': '#FBBF24', // Amber-400
      '--color-accent-glow': 'rgba(245, 158, 11, 0.5)',
      '--color-electric-blue': '#D97706', // Amber-600
      '--background-style': `
        radial-gradient(at 27% 37%, hsla(40, 90%, 61%, 0.1) 0px, transparent 50%),
        radial-gradient(at 97% 21%, hsla(50, 90%, 72%, 0.1) 0px, transparent 50%),
        radial-gradient(at 52% 99%, hsla(35, 90%, 76%, 0.1) 0px, transparent 50%)
      `,
    },
  },
];

export const SOUND_OPTIONS = [
    { id: 'alarm_clock', name: 'Alarm Clock', url: 'https://bigsoundbank.com/UPLOAD/mp3/0202.mp3' },
    { id: 'digital_watch', name: 'Digital Watch', url: 'https://bigsoundbank.com/UPLOAD/mp3/0079.mp3' },
    { id: 'harp', name: 'Harp', url: 'https://bigsoundbank.com/UPLOAD/mp3/0182.mp3' },
    { id: 'zen_bell', name: 'Zen Bell', url: 'https://bigsoundbank.com/UPLOAD/mp3/0313.mp3' },
    { id: 'synth_wave', name: 'Synth Wave', url: 'https://bigsoundbank.com/UPLOAD/mp3/1828.mp3' }
];

export const INITIAL_TIMER_SETTINGS: TimerSettings = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  pomodorosPerLongBreak: 4,
  enableSound: true,
  soundUrl: SOUND_OPTIONS[0].url,
};