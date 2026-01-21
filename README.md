# Movie Recommender - Universal Recommendation System

A modern, minimalist React application for movie recommendations using a hybrid AI algorithm (collaborative + content-based filtering).

## Features

- **Multiple Recommendation Systems**
  - Trending Now - Most popular movies
  - Top Rated - Highest rated movies
  - Find by Mood - Discover movies by mood/feeling
  - Browse by Genre - Filter by genres
  - Personalized For You - AI-powered recommendations based on your ratings

- **Hybrid Recommendation Algorithm**
  - Collaborative Filtering: Recommendations based on similar users
  - Content-Based Filtering: Recommendations based on movie characteristics
  - Combined approach for better results

- **Interactive Features**
  - Rate movies (1-5 stars)
  - Filter by genres, moods, year, rating
  - View analytics and charts
  - Add new movies
  - Submit feedback

- **Data Storage**
  - Supabase (PostgreSQL) - Cloud database
  - LocalStorage fallback - Works without backend

- **Minimalist Design**
  - Material-UI components
  - Clean, modern interface
  - Responsive design

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Material-UI (MUI)
- **Charts**: Recharts
- **Database**: Supabase (optional, falls back to LocalStorage)
- **Router**: React Router v6

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd generalist
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up Supabase:
   - Create a free account at [https://supabase.com](https://supabase.com)
   - Create a new project
   - Go to Settings > API and copy your project URL and anon key
   - Copy `.env.example` to `.env` and add your credentials:
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   - Run the SQL schema from `supabase-schema.sql` in the Supabase SQL Editor

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Usage

### Without Supabase

The app works perfectly fine without Supabase using LocalStorage:
- Sample movie data is loaded automatically
- All ratings and feedback are stored locally in your browser
- Data persists across sessions

### With Supabase

When Supabase is configured:
- All data is stored in the cloud
- Data is shared across devices
- Sample data is loaded from the database
- Real-time updates (if enabled)

## Project Structure

```
src/
├── components/         # React components
│   ├── FeedbackButton.tsx
│   ├── FilterPanel.tsx
│   ├── MovieCard.tsx
│   ├── Navigation.tsx
│   └── RecommendationChart.tsx
├── pages/             # Page components
│   ├── HomePage.tsx
│   ├── RecommendationsPage.tsx
│   └── AddMoviePage.tsx
├── services/          # Business logic
│   ├── dataService.ts
│   ├── recommendationEngine.ts
│   └── supabase.ts
├── types/             # TypeScript types
│   └── index.ts
├── data/              # Sample data
│   └── sampleMovies.ts
├── App.tsx            # Main app component
└── main.tsx           # Entry point
```

## Recommendation Algorithm

The hybrid recommendation engine combines two approaches:

### 1. Collaborative Filtering
- Finds users with similar rating patterns
- Recommends movies that similar users liked
- Works better with more user ratings

### 2. Content-Based Filtering
- Analyzes movie characteristics (genres, moods, tags, director, year)
- Finds movies similar to ones you liked
- Works even with few ratings

### 3. Hybrid Approach
- Combines both methods for better results
- Weights recommendations based on confidence
- Provides explanations for each recommendation

## Adding New Content Types

The system is designed to be extensible. To add new content types (books, music, etc.):

1. Add new type to `src/types/index.ts`:
```typescript
export interface Book extends BaseItem {
  type: 'book';
  author?: string;
  // ... other fields
}

export type Item = Movie | Book;
```

2. Update `dataService.ts` to handle the new type
3. Create specific components for the new type
4. Update recommendation engine if needed

## Customization

### Themes

Edit the theme in `src/App.tsx`:
```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#667eea' },
    // ... customize colors
  },
});
```

### Sample Data

Edit or add movies in `src/data/sampleMovies.ts`

### Recommendation Algorithm

Customize weights and parameters in `src/services/recommendationEngine.ts`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Contributing

Feel free to submit issues and pull requests!

## License

MIT

## Future Enhancements

- User authentication
- Social features (share recommendations, follow users)
- Movie trailers and additional metadata
- Export recommendations
- Dark mode
- Mobile app
- More content types (TV shows, books, music)
- Machine learning improvements
- A/B testing for algorithms

## Support

For issues and questions, please use the feedback button in the app or open an issue on GitHub.
