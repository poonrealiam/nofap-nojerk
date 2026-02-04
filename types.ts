
export interface UserProfile {
  name: string;
  avatar: string;
  bio: string;
  streak: number;
  relapseCount: number;
  lastCheckIn: string | null;
  lastPostDate: string | null;
  commentsTodayCount: number;
  lastCommentReset: string | null;
  lastBodyScanDate: string | null;
  journeyStartDate: string | null;
  bodyScanHistory: BodyScanRecord[];
  checkInHistory: Record<string, 'check' | 'reset'>;
  language: 'en' | 'zh';
  // Physical Metrics
  weight: number; 
  height: number; 
  bodyImageUrl?: string;
  hasUsedFreeBodyAnalysis: boolean;
  bodyAnalysisReport?: string;
  isPremium: boolean;
  isFounder?: boolean;
  appleLinkedEmail?: string;
  googleLinkedEmail?: string;
  linkedEmail?: string;
  linkedPhone?: string;
  dailyAiUsage: {
    date: string;
    count: number;
  };
  nutritionGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  preferences: {
    stealthMode: boolean;
    showStreakOnPlaza: boolean;
    notificationsEnabled: boolean;
  };
  // Auth Metadata
  isLoggedIn: boolean;
  authIdentifier?: string;
  authMethod?: 'email' | 'phone';
}

export interface BodyScanRecord {
  id: string;
  timestamp: string;
  weight: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  analysis: string;
}

export interface FoodEntry {
  id: string;
  timestamp: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  imageUrl?: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  author: string;
  authorAvatar: string;
  authorIsFounder?: boolean;
  content: string;
  timestamp: string;
  likes: number;
  comments: PostComment[];
  imageUrl?: string;
  category?: 'grow' | 'help' | 'sports' | 'music' | 'meditation';
  streak?: number;
  season?: number;
}

export interface PostComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  FOOD = 'FOOD',
  TODO = 'TODO',
  PLAZA = 'PLAZA',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS',
  SUBSCRIPTION = 'SUBSCRIPTION',
  FIRST_AID = 'FIRST_AID'
}
