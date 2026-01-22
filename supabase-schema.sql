-- Supabase Database Schema for Recommendation System
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Items table (movies, books, etc.)
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  metadata JSONB, -- Stores type-specific data (genres, moods, director, year, etc.)
  average_rating DECIMAL(3,2) DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL, -- Can be anonymous ID or user session ID
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id) -- One rating per user per item
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  system_id VARCHAR(100),
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table (for collaborative filtering)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id VARCHAR(255) PRIMARY KEY,
  favorite_genres TEXT[],
  favorite_moods TEXT[],
  preferences JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_ratings_item_id ON ratings(item_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Function to update average rating
CREATE OR REPLACE FUNCTION update_item_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE items
  SET
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM ratings
      WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
    ),
    ratings_count = (
      SELECT COUNT(*)
      FROM ratings
      WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.item_id, OLD.item_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update item ratings
DROP TRIGGER IF EXISTS update_item_rating_trigger ON ratings;
CREATE TRIGGER update_item_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_item_rating();

-- Enable Row Level Security (RLS)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon role (required for RLS policies to work)
GRANT SELECT, INSERT ON items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ratings TO anon;
GRANT INSERT ON feedback TO anon;
GRANT SELECT, INSERT, UPDATE ON user_preferences TO anon;

-- Create policies for public read access
CREATE POLICY "Items are viewable by everyone" ON items
  FOR SELECT USING (true);

CREATE POLICY "Ratings are viewable by everyone" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own ratings" ON ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own ratings" ON ratings
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own ratings" ON ratings
  FOR DELETE USING (true);

CREATE POLICY "Feedback is insertable by everyone" ON feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "User preferences are viewable by everyone" ON user_preferences
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (true);

-- Insert sample movie data
INSERT INTO items (type, title, description, image_url, metadata) VALUES
  ('movie', 'The Shawshank Redemption', 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
   '{"director": "Frank Darabont", "year": 1994, "duration": 142, "genres": ["Drama"], "moods": ["uplifting", "hopeful"], "tags": ["prison", "friendship", "redemption"]}'),

  ('movie', 'The Dark Knight', 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.', 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400',
   '{"director": "Christopher Nolan", "year": 2008, "duration": 152, "genres": ["Action", "Crime", "Drama"], "moods": ["dark", "tense", "intense"], "tags": ["superhero", "batman", "villain"]}'),

  ('movie', 'Inception', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
   '{"director": "Christopher Nolan", "year": 2010, "duration": 148, "genres": ["Action", "Sci-Fi", "Thriller"], "moods": ["mind-bending", "complex", "intense"], "tags": ["dreams", "heist", "psychology"]}'),

  ('movie', 'Forrest Gump', 'The presidencies of Kennedy and Johnson, the Vietnam War, and other historical events unfold from the perspective of an Alabama man.', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400',
   '{"director": "Robert Zemeckis", "year": 1994, "duration": 142, "genres": ["Drama", "Romance"], "moods": ["heartwarming", "nostalgic", "emotional"], "tags": ["life story", "history", "love"]}'),

  ('movie', 'Pulp Fiction', 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400',
   '{"director": "Quentin Tarantino", "year": 1994, "duration": 154, "genres": ["Crime", "Drama"], "moods": ["dark", "quirky", "violent"], "tags": ["crime", "nonlinear", "dialogue"]}'),

  ('movie', 'The Matrix', 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
   '{"director": "The Wachowskis", "year": 1999, "duration": 136, "genres": ["Action", "Sci-Fi"], "moods": ["mind-bending", "intense", "philosophical"], "tags": ["simulation", "reality", "action"]}'),

  ('movie', 'Interstellar', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.', 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400',
   '{"director": "Christopher Nolan", "year": 2014, "duration": 169, "genres": ["Adventure", "Drama", "Sci-Fi"], "moods": ["epic", "emotional", "thought-provoking"], "tags": ["space", "time", "family"]}'),

  ('movie', 'Amélie', 'Amélie is an innocent and naive girl in Paris with her own sense of justice. She decides to help those around her and, along the way, discovers love.', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
   '{"director": "Jean-Pierre Jeunet", "year": 2001, "duration": 122, "genres": ["Comedy", "Romance"], "moods": ["whimsical", "uplifting", "romantic"], "tags": ["french", "quirky", "love"]}'),

  ('movie', 'Parasite', 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400',
   '{"director": "Bong Joon-ho", "year": 2019, "duration": 132, "genres": ["Drama", "Thriller"], "moods": ["dark", "tense", "satirical"], "tags": ["class", "korean", "social commentary"]}'),

  ('movie', 'The Grand Budapest Hotel', 'A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400',
   '{"director": "Wes Anderson", "year": 2014, "duration": 99, "genres": ["Adventure", "Comedy", "Crime"], "moods": ["whimsical", "quirky", "colorful"], "tags": ["visual", "comedy", "style"]}');
