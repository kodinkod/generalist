import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import type { Movie, Recommendation, RecommendationFilter } from '../types';
import { itemsApi, ratingsApi, preferencesApi } from '../services/dataService';
import { recommendationEngine } from '../services/recommendationEngine';
import MovieCard from '../components/MovieCard';
import FilterPanel from '../components/FilterPanel';
import RecommendationChart from '../components/RecommendationChart';

const RecommendationsPage = () => {
  const { systemId } = useParams<{ systemId: string }>();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const systemConfig = {
    trending: { name: 'Trending Now', description: 'Most popular movies rated recently' },
    'top-rated': { name: 'Top Rated', description: 'Highest rated movies of all time' },
    'by-mood': { name: 'Find by Mood', description: 'Discover movies by mood' },
    'by-genre': { name: 'Browse by Genre', description: 'Explore movies by genre' },
    'for-you': { name: 'For You', description: 'Personalized recommendations' },
  }[systemId || 'trending'] || { name: 'Recommendations', description: '' };

  const loadRecommendations = async (filter?: RecommendationFilter) => {
    try {
      setLoading(true);
      setError(null);

      const items = await itemsApi.getAll();
      const movies = items.filter((item): item is Movie => item.type === 'movie');
      setAllMovies(movies);

      const ratings = await ratingsApi.getAll();
      const userPrefs = await preferencesApi.get();

      let recs: Recommendation[] = [];

      switch (systemId) {
        case 'trending':
          recs = recommendationEngine.getTrending(movies, ratings, 15);
          if (recs.length === 0) {
            // If no trending, show top rated
            recs = movies
              .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
              .slice(0, 15)
              .map(item => ({
                item,
                score: item.averageRating || 0,
                reasons: ['Highly rated'],
              }));
          }
          break;

        case 'top-rated':
          recs = movies
            .filter(m => m.averageRating && m.averageRating >= 4.0)
            .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
            .slice(0, 15)
            .map(item => ({
              item,
              score: item.averageRating || 0,
              reasons: [`Rating: ${item.averageRating?.toFixed(1)}`],
            }));
          break;

        case 'by-mood':
        case 'by-genre':
        case 'for-you':
          recs = recommendationEngine.getRecommendations(
            movies,
            ratings,
            userPrefs,
            filter,
            15
          );
          break;

        default:
          recs = recommendationEngine.getRecommendations(movies, ratings, userPrefs, undefined, 15);
      }

      setRecommendations(recs);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [systemId]);

  const handleFilterChange = (filter: RecommendationFilter) => {
    loadRecommendations(filter);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, minHeight: 'calc(100vh - 64px)' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          {systemConfig.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {systemConfig.description}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Recommendations" />
          <Tab label="Analytics" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          {(systemId === 'by-mood' || systemId === 'by-genre' || systemId === 'for-you') && (
            <Grid size={{ xs: 12, md: 3 }}>
              <FilterPanel
                movies={allMovies}
                onFilterChange={handleFilterChange}
                systemType={systemId}
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, md: (systemId === 'by-mood' || systemId === 'by-genre' || systemId === 'for-you') ? 9 : 12 }}>
            {recommendations.length === 0 ? (
              <Alert severity="info">
                No recommendations found. Try adjusting your filters or rate some movies to get personalized suggestions.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {recommendations.map((rec) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={rec.item.id}>
                    <MovieCard movie={rec.item} recommendation={rec} onRatingChange={loadRecommendations} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Box>
          <RecommendationChart movies={allMovies} recommendations={recommendations} />
        </Box>
      )}
    </Container>
  );
};

export default RecommendationsPage;
