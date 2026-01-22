import type { Movie, Rating, Recommendation, RecommendationFilter, UserPreferences } from '../types';

// Calculate cosine similarity between two vectors
const cosineSimilarity = (vec1: number[], vec2: number[]): number => {
  if (vec1.length !== vec2.length) return 0;

  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
};

// Content-based filtering
class ContentBasedFilter {
  // Create feature vector for a movie
  private createFeatureVector(movie: Movie, allGenres: string[], allMoods: string[], allTags: string[]): number[] {
    const vector: number[] = [];

    // Genre features
    allGenres.forEach(genre => {
      vector.push(movie.genres.includes(genre) ? 1 : 0);
    });

    // Mood features
    allMoods.forEach(mood => {
      vector.push(movie.moods.includes(mood) ? 1 : 0);
    });

    // Tag features
    allTags.forEach(tag => {
      vector.push(movie.tags.includes(tag) ? 1 : 0);
    });

    // Normalize year (0-1 range, assuming movies from 1900-2030)
    if (movie.year) {
      vector.push((movie.year - 1900) / 130);
    } else {
      vector.push(0.5);
    }

    // Rating feature
    if (movie.averageRating) {
      vector.push(movie.averageRating / 5);
    } else {
      vector.push(0.5);
    }

    return vector;
  }

  // Get all unique genres, moods, and tags
  private extractFeatures(items: Movie[]): { genres: string[], moods: string[], tags: string[] } {
    const genres = new Set<string>();
    const moods = new Set<string>();
    const tags = new Set<string>();

    items.forEach(movie => {
      movie.genres.forEach(g => genres.add(g));
      movie.moods.forEach(m => moods.add(m));
      movie.tags.forEach(t => tags.add(t));
    });

    return {
      genres: Array.from(genres).sort(),
      moods: Array.from(moods).sort(),
      tags: Array.from(tags).sort(),
    };
  }

  // Get similar items based on content
  getSimilarItems(targetItem: Movie, allItems: Movie[], count: number = 10): Recommendation[] {
    const features = this.extractFeatures(allItems);
    const targetVector = this.createFeatureVector(targetItem, features.genres, features.moods, features.tags);

    const similarities = allItems
      .filter(item => item.id !== targetItem.id)
      .map(item => {
        const itemVector = this.createFeatureVector(item, features.genres, features.moods, features.tags);
        const similarity = cosineSimilarity(targetVector, itemVector);

        const reasons: string[] = [];

        // Find common genres
        const commonGenres = item.genres.filter(g => targetItem.genres.includes(g));
        if (commonGenres.length > 0) {
          reasons.push(`Similar genres: ${commonGenres.join(', ')}`);
        }

        // Find common moods
        const commonMoods = item.moods.filter(m => targetItem.moods.includes(m));
        if (commonMoods.length > 0) {
          reasons.push(`Similar mood: ${commonMoods.join(', ')}`);
        }

        // Director match
        if (item.director && targetItem.director && item.director === targetItem.director) {
          reasons.push(`Same director: ${item.director}`);
        }

        // Year proximity
        if (item.year && targetItem.year && Math.abs(item.year - targetItem.year) <= 5) {
          reasons.push(`Similar era (${item.year})`);
        }

        return {
          item,
          score: similarity,
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);

    return similarities;
  }

  // Get recommendations based on user preferences
  getRecommendationsByPreferences(
    userPrefs: UserPreferences,
    allItems: Movie[],
    count: number = 10
  ): Recommendation[] {
    const features = this.extractFeatures(allItems);

    // Create ideal user preference vector
    const idealVector: number[] = [];

    // Favorite genres (weighted higher)
    features.genres.forEach(genre => {
      idealVector.push(userPrefs.favoriteGenres.includes(genre) ? 2 : 0);
    });

    // Favorite moods (weighted higher)
    features.moods.forEach(mood => {
      idealVector.push(userPrefs.favoriteMoods.includes(mood) ? 2 : 0);
    });

    // Tags (neutral weight)
    features.tags.forEach(() => {
      idealVector.push(0.5);
    });

    // Year (prefer recent)
    idealVector.push(0.8);

    // Rating (prefer high ratings)
    idealVector.push(1);

    const recommendations = allItems
      .map(item => {
        const itemVector = this.createFeatureVector(item, features.genres, features.moods, features.tags);
        const similarity = cosineSimilarity(idealVector, itemVector);

        const reasons: string[] = [];

        // Check favorite genres
        const matchedGenres = item.genres.filter(g => userPrefs.favoriteGenres.includes(g));
        if (matchedGenres.length > 0) {
          reasons.push(`Matches your favorite genres: ${matchedGenres.join(', ')}`);
        }

        // Check favorite moods
        const matchedMoods = item.moods.filter(m => userPrefs.favoriteMoods.includes(m));
        if (matchedMoods.length > 0) {
          reasons.push(`Matches your preferred mood: ${matchedMoods.join(', ')}`);
        }

        // High rating
        if (item.averageRating && item.averageRating >= 4.5) {
          reasons.push(`Highly rated (${item.averageRating.toFixed(1)})`);
        }

        return {
          item,
          score: similarity,
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);

    return recommendations;
  }
}

// Collaborative filtering
class CollaborativeFilter {
  // Calculate user similarity based on ratings
  private calculateUserSimilarity(user1Ratings: Rating[], user2Ratings: Rating[]): number {
    // Find common items
    const user1Map = new Map(user1Ratings.map(r => [r.itemId, r.rating]));
    const user2Map = new Map(user2Ratings.map(r => [r.itemId, r.rating]));

    const commonItems = user1Ratings.filter(r => user2Map.has(r.itemId));

    if (commonItems.length === 0) return 0;

    const vec1 = commonItems.map(r => user1Map.get(r.itemId)!);
    const vec2 = commonItems.map(r => user2Map.get(r.itemId)!);

    return cosineSimilarity(vec1, vec2);
  }

  // Get recommendations based on similar users
  getCollaborativeRecommendations(
    currentUserRatings: Rating[],
    allRatings: Rating[],
    allItems: Movie[],
    count: number = 10
  ): Recommendation[] {
    if (currentUserRatings.length === 0) {
      return [];
    }

    // Group ratings by user
    const userRatingsMap = new Map<string, Rating[]>();
    allRatings.forEach(rating => {
      if (!userRatingsMap.has(rating.userId)) {
        userRatingsMap.set(rating.userId, []);
      }
      userRatingsMap.get(rating.userId)!.push(rating);
    });

    // Find similar users
    const currentUserId = currentUserRatings[0].userId;
    const similarUsers: Array<{ userId: string, similarity: number }> = [];

    userRatingsMap.forEach((ratings, userId) => {
      if (userId !== currentUserId) {
        const similarity = this.calculateUserSimilarity(currentUserRatings, ratings);
        if (similarity > 0) {
          similarUsers.push({ userId, similarity });
        }
      }
    });

    similarUsers.sort((a, b) => b.similarity - a.similarity);

    // Get items rated highly by similar users but not rated by current user
    const currentUserItemIds = new Set(currentUserRatings.map(r => r.itemId));
    const recommendations = new Map<string, { score: number, count: number, reasons: string[] }>();

    similarUsers.slice(0, 10).forEach(({ userId, similarity }) => {
      const userRatings = userRatingsMap.get(userId)!;

      userRatings.forEach(rating => {
        if (!currentUserItemIds.has(rating.itemId) && rating.rating >= 4) {
          if (!recommendations.has(rating.itemId)) {
            recommendations.set(rating.itemId, {
              score: 0,
              count: 0,
              reasons: [],
            });
          }

          const rec = recommendations.get(rating.itemId)!;
          rec.score += rating.rating * similarity;
          rec.count += 1;
          rec.reasons.push(`Recommended by similar users`);
        }
      });
    });

    // Convert to Recommendation objects
    const results: Recommendation[] = [];

    recommendations.forEach((data, itemId) => {
      const item = allItems.find(i => i.id === itemId);
      if (item) {
        results.push({
          item,
          score: data.score / data.count,
          reasons: [...new Set(data.reasons)], // Remove duplicates
        });
      }
    });

    return results.sort((a, b) => b.score - a.score).slice(0, count);
  }
}

// Hybrid recommendation engine
export class HybridRecommendationEngine {
  private contentFilter = new ContentBasedFilter();
  private collaborativeFilter = new CollaborativeFilter();

  // Get hybrid recommendations
  getRecommendations(
    allItems: Movie[],
    allRatings: Rating[],
    userPrefs: UserPreferences | null,
    filter?: RecommendationFilter,
    count: number = 10
  ): Recommendation[] {
    let filteredItems = [...allItems];

    // Apply filters
    if (filter) {
      if (filter.genres && filter.genres.length > 0) {
        filteredItems = filteredItems.filter(item =>
          item.genres.some(g => filter.genres!.includes(g))
        );
      }

      if (filter.moods && filter.moods.length > 0) {
        filteredItems = filteredItems.filter(item =>
          item.moods.some(m => filter.moods!.includes(m))
        );
      }

      if (filter.tags && filter.tags.length > 0) {
        filteredItems = filteredItems.filter(item =>
          item.tags.some(t => filter.tags!.includes(t))
        );
      }

      if (filter.minRating) {
        filteredItems = filteredItems.filter(item =>
          item.averageRating && item.averageRating >= filter.minRating!
        );
      }

      if (filter.yearRange) {
        filteredItems = filteredItems.filter(item => {
          if (!item.year) return false;
          if (filter.yearRange!.min && item.year < filter.yearRange!.min) return false;
          if (filter.yearRange!.max && item.year > filter.yearRange!.max) return false;
          return true;
        });
      }

      // Similar to specific item
      if (filter.similarToItemId) {
        const targetItem = allItems.find(i => i.id === filter.similarToItemId);
        if (targetItem) {
          return this.contentFilter.getSimilarItems(targetItem, filteredItems as Movie[], count);
        }
      }
    }

    // If no items after filtering, return empty
    if (filteredItems.length === 0) {
      return [];
    }

    // Hybrid approach: combine collaborative and content-based
    let recommendations: Recommendation[] = [];

    // 1. Get collaborative recommendations (if user has ratings)
    if (userPrefs && userPrefs.ratings.length > 0) {
      const collaborative = this.collaborativeFilter.getCollaborativeRecommendations(
        userPrefs.ratings,
        allRatings,
        filteredItems as Movie[],
        Math.ceil(count / 2)
      );
      recommendations.push(...collaborative);
    }

    // 2. Get content-based recommendations
    if (userPrefs && (userPrefs.favoriteGenres.length > 0 || userPrefs.favoriteMoods.length > 0)) {
      const contentBased = this.contentFilter.getRecommendationsByPreferences(
        userPrefs,
        filteredItems as Movie[],
        count
      );
      recommendations.push(...contentBased);
    }

    // 3. If we still don't have enough recommendations, add popular items
    if (recommendations.length < count) {
      const existingIds = new Set(recommendations.map(r => r.item.id));
      const popular = filteredItems
        .filter(item => !existingIds.has(item.id))
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, count - recommendations.length)
        .map(item => ({
          item,
          score: item.averageRating || 3.5,
          reasons: ['Popular choice', `Rating: ${item.averageRating?.toFixed(1) || 'N/A'}`],
        }));
      recommendations.push(...popular);
    }

    // Remove duplicates and sort by score
    const uniqueRecs = new Map<string, Recommendation>();
    recommendations.forEach(rec => {
      if (!uniqueRecs.has(rec.item.id)) {
        uniqueRecs.set(rec.item.id, rec);
      } else {
        // If duplicate, combine scores and reasons
        const existing = uniqueRecs.get(rec.item.id)!;
        existing.score = (existing.score + rec.score) / 2;
        existing.reasons.push(...rec.reasons);
        existing.reasons = [...new Set(existing.reasons)]; // Remove duplicates
      }
    });

    return Array.from(uniqueRecs.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  // Get trending items (weighted by recent ratings and total ratings)
  getTrending(allItems: Movie[], allRatings: Rating[], count: number = 10): Recommendation[] {
    // Calculate weighted score for each item based on recency and quantity
    const itemScores = new Map<string, { recentCount: number, totalCount: number, avgRating: number }>();

    allRatings.forEach(rating => {
      const daysSinceRating = (Date.now() - new Date(rating.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const isRecent = daysSinceRating <= 30;

      if (!itemScores.has(rating.itemId)) {
        itemScores.set(rating.itemId, { recentCount: 0, totalCount: 0, avgRating: 0 });
      }

      const scores = itemScores.get(rating.itemId)!;
      scores.totalCount += 1;
      if (isRecent) {
        scores.recentCount += 1;
      }
    });

    // Calculate weighted scores: recent ratings count more, but total ratings matter too
    const scoredItems = Array.from(itemScores.entries()).map(([itemId, scores]) => {
      const item = allItems.find(i => i.id === itemId);
      if (!item) return null;

      // Weight: 70% recent ratings, 30% total ratings
      const weightedScore = (scores.recentCount * 0.7) + (scores.totalCount * 0.3);

      const recentText = scores.recentCount > 0 ? `${scores.recentCount} recent ratings` : '';
      const totalText = `${scores.totalCount} total ratings`;
      const reasons = scores.recentCount > 0
        ? ['Trending now', recentText, totalText]
        : ['Popular', totalText];

      return {
        item,
        score: weightedScore,
        reasons,
      };
    }).filter(Boolean) as Recommendation[];

    return scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  // Get all unique genres from items
  getAllGenres(items: Movie[]): string[] {
    const genres = new Set<string>();
    items.forEach(item => item.genres.forEach(g => genres.add(g)));
    return Array.from(genres).sort();
  }

  // Get all unique moods from items
  getAllMoods(items: Movie[]): string[] {
    const moods = new Set<string>();
    items.forEach(item => item.moods.forEach(m => moods.add(m)));
    return Array.from(moods).sort();
  }

  // Get all unique tags from items
  getAllTags(items: Movie[]): string[] {
    const tags = new Set<string>();
    items.forEach(item => item.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }
}

// Export singleton instance
export const recommendationEngine = new HybridRecommendationEngine();
