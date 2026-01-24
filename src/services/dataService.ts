import { supabase, isSupabaseConfigured, disableSupabase } from './supabase';
import type { Item, Movie, Rating, Feedback, UserPreferences } from '../types';
import { sampleMovies } from '../data/sampleMovies';

// Helper function to check if error is a network/CORS error
const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  const message = error.message || error.toString();
  return message.includes('CORS') ||
         message.includes('Load failed') ||
         message.includes('NetworkError') ||
         message.includes('Failed to fetch') ||
         error.code === 'PGRST301'; // Supabase JWT error
};

// Helper function to log detailed error information
const logDatabaseError = (operation: string, error: any) => {
  console.group(`❌ Database Error - ${operation}`);
  console.error('Message:', error.message || error.toString());
  if (error.code) console.error('Code:', error.code);
  if (error.hint) console.error('Hint:', error.hint);
  if (error.details) console.error('Details:', error.details);

  if (isNetworkError(error)) {
    console.warn('🔄 Network/CORS error detected - switching to localStorage fallback');
    console.log('💡 Run testDatabaseConnection() in console for diagnostics');
  }
  console.groupEnd();
};

// LocalStorage keys
const STORAGE_KEYS = {
  ITEMS: 'rec_system_items',
  RATINGS: 'rec_system_ratings',
  FEEDBACK: 'rec_system_feedback',
  PREFERENCES: 'rec_system_preferences',
  USER_ID: 'rec_system_user_id',
};

// Generate or get user ID
export const getUserId = (): string => {
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }
  return userId;
};

// Initialize sample data if needed
const initializeSampleData = () => {
  const items = localStorage.getItem(STORAGE_KEYS.ITEMS);
  if (!items) {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(sampleMovies));
  }
};

// Items API
export const itemsApi = {
  // Get all items
  async getAll(): Promise<Item[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          if (isNetworkError(error)) {
            logDatabaseError('items.getAll()', error);
            disableSupabase();
            // Retry with localStorage
            return this.getAll();
          }
          throw error;
        }

        return data.map((item: any) => ({
          ...item,
          ...item.metadata,
          type: item.type as 'movie',
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        }));
      } catch (error) {
        if (isNetworkError(error)) {
          logDatabaseError('items.getAll() [catch]', error);
          disableSupabase();
          // Retry with localStorage
          return this.getAll();
        }
        throw error;
      }
    } else {
      initializeSampleData();
      const items = localStorage.getItem(STORAGE_KEYS.ITEMS);
      return items ? JSON.parse(items) : [];
    }
  },

  // Get item by ID
  async getById(id: string): Promise<Item | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      return data ? {
        ...data,
        ...data.metadata,
        type: data.type as 'movie',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } : null;
    } else {
      const items = await this.getAll();
      return items.find(item => item.id === id) || null;
    }
  },

  // Add new item
  async add(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('items')
        .insert([{
          type: item.type,
          title: item.title,
          description: item.description,
          image_url: item.imageUrl,
          metadata: {
            ...(item as Movie).director && { director: (item as Movie).director },
            ...(item as Movie).year && { year: (item as Movie).year },
            ...(item as Movie).duration && { duration: (item as Movie).duration },
            genres: (item as Movie).genres || [],
            moods: (item as Movie).moods || [],
            tags: (item as Movie).tags || [],
          },
        }])
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to insert item');

      return {
        ...data,
        ...data.metadata,
        type: data.type as 'movie',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } else {
      const items = await this.getAll();
      const newItem: Item = {
        ...item,
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Item;
      items.push(newItem);
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      return newItem;
    }
  },
};

// Ratings API
export const ratingsApi = {
  // Get all ratings
  async getAll(): Promise<Rating[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('ratings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          if (isNetworkError(error)) {
            logDatabaseError('ratings.getAll()', error);
            disableSupabase();
            return this.getAll();
          }
          throw error;
        }

        return data.map((rating: any) => ({
          id: rating.id,
          userId: rating.user_id,
          itemId: rating.item_id,
          rating: rating.rating,
          comment: rating.comment,
          createdAt: new Date(rating.created_at),
        }));
      } catch (error) {
        if (isNetworkError(error)) {
          logDatabaseError('ratings.getAll() [catch]', error);
          disableSupabase();
          return this.getAll();
        }
        throw error;
      }
    } else {
      const ratings = localStorage.getItem(STORAGE_KEYS.RATINGS);
      return ratings ? JSON.parse(ratings) : [];
    }
  },

  // Get ratings for specific item
  async getByItemId(itemId: string): Promise<Rating[]> {
    const ratings = await this.getAll();
    return ratings.filter(r => r.itemId === itemId);
  },

  // Get user's rating for item
  async getUserRating(itemId: string): Promise<Rating | null> {
    const userId = getUserId();
    const ratings = await this.getAll();
    return ratings.find(r => r.itemId === itemId && r.userId === userId) || null;
  },

  // Add or update rating
  async upsert(itemId: string, rating: number, comment?: string): Promise<Rating> {
    const userId = getUserId();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('ratings')
        .upsert([{
          user_id: userId,
          item_id: itemId,
          rating,
          comment,
        }], {
          onConflict: 'user_id,item_id'
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to upsert rating');

      return {
        id: data.id,
        userId: data.user_id,
        itemId: data.item_id,
        rating: data.rating,
        comment: data.comment,
        createdAt: new Date(data.created_at),
      };
    } else {
      const ratings = await this.getAll();
      const existingIndex = ratings.findIndex(r => r.itemId === itemId && r.userId === userId);

      const newRating: Rating = {
        id: existingIndex >= 0 ? ratings[existingIndex].id : `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        itemId,
        rating,
        comment,
        createdAt: existingIndex >= 0 ? ratings[existingIndex].createdAt : new Date(),
      };

      if (existingIndex >= 0) {
        ratings[existingIndex] = newRating;
      } else {
        ratings.push(newRating);
      }

      localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));

      // Update item average rating
      const items = await itemsApi.getAll();
      const item = items.find(i => i.id === itemId);
      if (item) {
        const itemRatings = ratings.filter(r => r.itemId === itemId);
        item.averageRating = itemRatings.reduce((sum, r) => sum + r.rating, 0) / itemRatings.length;
        item.ratingsCount = itemRatings.length;
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      }

      return newRating;
    }
  },
};

// Feedback API
export const feedbackApi = {
  // Submit feedback
  async submit(feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
    const userId = getUserId();

    if (isSupabaseConfigured()) {
      // Note: We don't use .select() after insert because the anon role
      // doesn't have SELECT permission on the feedback table (by design for privacy)
      const { error } = await supabase
        .from('feedback')
        .insert([{
          user_id: userId,
          item_id: feedback.itemId,
          system_id: feedback.systemId,
          type: feedback.type,
          message: feedback.message,
        }]);

      if (error) {
        // Detect RLS policy violation error
        if (error.code === '42501' || error.message?.includes('row-level security policy')) {
          console.error('❌ Feedback RLS Policy Error');
          console.error('📝 Your Supabase database needs to be updated with the latest RLS policies.');
          console.error('');
          console.error('🔧 To fix this:');
          console.error('  1. Open your Supabase project dashboard');
          console.error('  2. Go to SQL Editor');
          console.error('  3. Run the SQL script from: fix-feedback-rls.sql');
          console.error('  4. Alternatively, run the full schema: supabase-schema.sql');
          console.error('');
          console.error('💡 This error occurs when the database permissions are not in sync with the code.');

          throw new Error('Database permissions not configured. Please run fix-feedback-rls.sql in your Supabase SQL Editor. See console for details.');
        }
        throw error;
      }

      // Return a constructed feedback object since we can't select after insert
      return {
        id: `feedback_${Date.now()}`,
        userId,
        itemId: feedback.itemId,
        systemId: feedback.systemId,
        type: feedback.type,
        message: feedback.message,
        createdAt: new Date(),
      };
    } else {
      const feedbacks = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
      const allFeedback: Feedback[] = feedbacks ? JSON.parse(feedbacks) : [];

      const newFeedback: Feedback = {
        ...feedback,
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date(),
      };

      allFeedback.push(newFeedback);
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(allFeedback));

      return newFeedback;
    }
  },

  // Get all feedback
  async getAll(): Promise<Feedback[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((fb: any) => ({
        id: fb.id,
        userId: fb.user_id,
        itemId: fb.item_id,
        systemId: fb.system_id,
        type: fb.type,
        message: fb.message,
        createdAt: new Date(fb.created_at),
      }));
    } else {
      const feedbacks = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
      return feedbacks ? JSON.parse(feedbacks) : [];
    }
  },
};

// User Preferences API
export const preferencesApi = {
  // Get user preferences (without ratings - caller should fetch ratings separately)
  async get(ratings?: Rating[]): Promise<UserPreferences | null> {
    const userId = getUserId();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          if (isNetworkError(error)) {
            logDatabaseError('preferences.get()', error);
            disableSupabase();
            return this.get(ratings);
          }
          throw error;
        }

        // Fetch ratings only if not provided and data exists
        const userRatings = ratings || (data ? await ratingsApi.getAll() : []);

        return data ? {
          userId: data.user_id,
          favoriteGenres: data.favorite_genres || [],
          favoriteMoods: data.favorite_moods || [],
          ratings: userRatings,
        } : null;
      } catch (error) {
        if (isNetworkError(error)) {
          logDatabaseError('preferences.get() [catch]', error);
          disableSupabase();
          return this.get(ratings);
        }
        throw error;
      }
    } else {
      const prefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      const preferences = prefs ? JSON.parse(prefs) : null;

      if (preferences && preferences.userId === userId) {
        // Fetch ratings only if not provided
        const userRatings = ratings || await ratingsApi.getAll();

        return {
          ...preferences,
          ratings: userRatings,
        };
      }

      return null;
    }
  },

  // Update user preferences
  async update(preferences: Partial<UserPreferences>, ratings?: Rating[]): Promise<UserPreferences> {
    const userId = getUserId();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert([{
          user_id: userId,
          favorite_genres: preferences.favoriteGenres || [],
          favorite_moods: preferences.favoriteMoods || [],
        }], {
          onConflict: 'user_id'
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to upsert preferences');

      // Fetch ratings only if not provided
      const userRatings = ratings || await ratingsApi.getAll();

      return {
        userId: data.user_id,
        favoriteGenres: data.favorite_genres || [],
        favoriteMoods: data.favorite_moods || [],
        ratings: userRatings,
      };
    } else {
      const current = await this.get(ratings);
      // Fetch ratings only if not provided
      const userRatings = ratings || await ratingsApi.getAll();

      const updated: UserPreferences = {
        userId,
        favoriteGenres: preferences.favoriteGenres || current?.favoriteGenres || [],
        favoriteMoods: preferences.favoriteMoods || current?.favoriteMoods || [],
        ratings: userRatings,
      };

      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
      return updated;
    }
  },
};
