// Base item type that can be extended for different content types
export interface BaseItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Movie specific type
export interface Movie extends BaseItem {
  type: 'movie';
  director?: string;
  year?: number;
  duration?: number; // in minutes
  genres: string[];
  moods: string[]; // e.g., "dark", "uplifting", "tense", "romantic"
  tags: string[];
  averageRating?: number;
  ratingsCount?: number;
}

// Generic item type for extensibility
export type Item = Movie; // Can add | Book | Music | etc.

// User rating/feedback
export interface Rating {
  id: string;
  userId: string;
  itemId: string;
  rating: number; // 1-5 stars
  comment?: string;
  createdAt: Date;
}

// Recommendation system configuration
export interface RecommendationSystemConfig {
  id: string;
  name: string;
  description: string;
  itemType: 'movie' | 'book' | 'music' | 'generic';
  algorithm: 'collaborative' | 'content-based' | 'hybrid';
  enabled: boolean;
}

// Recommendation result
export interface Recommendation {
  item: Item;
  score: number;
  reasons: string[]; // Why this was recommended
}

// Filter criteria for recommendations
export interface RecommendationFilter {
  genres?: string[];
  moods?: string[];
  tags?: string[];
  minRating?: number;
  yearRange?: {
    min?: number;
    max?: number;
  };
  similarToItemId?: string; // Get recommendations based on specific item
}

// User preferences for collaborative filtering
export interface UserPreferences {
  userId: string;
  favoriteGenres: string[];
  favoriteMoods: string[];
  ratings: Rating[];
}

// Chart data for visualization
export interface ChartData {
  name: string;
  value: number;
  items?: Item[];
}

// Feedback from users
export interface Feedback {
  id: string;
  userId: string;
  itemId?: string;
  systemId?: string;
  type: 'bug' | 'feature' | 'general' | 'rating';
  message: string;
  createdAt: Date;
}
