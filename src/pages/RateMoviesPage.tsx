import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  Rating,
  Button,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  MovieFilter,
} from '@mui/icons-material';
import { itemsApi, ratingsApi, getUserId } from '../services/dataService';
import type { Movie, Rating as RatingType } from '../types';

const RateMoviesPage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [unratedMovies, setUnratedMovies] = useState<Movie[]>([]);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [currentRating, setCurrentRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalMovies, setTotalMovies] = useState(0);
  const [ratedCount, setRatedCount] = useState(0);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all movies
      const allItems = await itemsApi.getAll();
      const movieItems = allItems.filter(item => item.type === 'movie') as Movie[];
      setMovies(movieItems);
      setTotalMovies(movieItems.length);

      // Load current user's ratings
      const currentUserId = getUserId();
      const allRatings = await ratingsApi.getAll();
      const userRatings = allRatings.filter(r => r.userId === currentUserId);

      // Filter out movies the user has already rated
      const ratedMovieIds = new Set(userRatings.map(r => r.itemId));
      const unrated = movieItems.filter(movie => !ratedMovieIds.has(movie.id));

      setUnratedMovies(unrated);
      setRatedCount(userRatings.length);

      if (unrated.length > 0) {
        setCurrentMovie(unrated[0]);
      }
    } catch (err) {
      console.error('Failed to load movies:', err);
      setError('Failed to load movies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!currentMovie || currentRating === 0) return;

    try {
      setSubmitting(true);
      setError(null);

      await ratingsApi.upsert(currentMovie.id, currentRating);

      // Move to next movie
      const remaining = unratedMovies.slice(1);
      setUnratedMovies(remaining);
      setRatedCount(prev => prev + 1);
      setCurrentRating(0);

      if (remaining.length > 0) {
        setCurrentMovie(remaining[0]);
      } else {
        setCurrentMovie(null);
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (!currentMovie) return;

    // Move current movie to end of queue
    const remaining = [...unratedMovies.slice(1), currentMovie];
    setUnratedMovies(remaining);
    setCurrentMovie(remaining[0] || null);
    setCurrentRating(0);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  if (error && !currentMovie) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadMovies}>
          Try Again
        </Button>
      </Container>
    );
  }

  if (!currentMovie && unratedMovies.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, minHeight: 'calc(100vh - 64px)' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 120, color: 'success.main', mb: 3 }} />
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
            All Done!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            You've rated all {totalMovies} movies in the database!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Your ratings help improve personalized recommendations for everyone.
          </Typography>
          <Button
            variant="contained"
            size="large"
            href="/"
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              color: 'white',
              px: 4,
              py: 1.5,
            }}
          >
            Explore Recommendations
          </Button>
        </Box>
      </Container>
    );
  }

  const progress = totalMovies > 0 ? (ratedCount / totalMovies) * 100 : 0;

  return (
    <Container maxWidth="md" sx={{ py: 4, minHeight: 'calc(100vh - 64px)' }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MovieFilter sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Rate Movies
            </Typography>
          </Box>
          <Chip
            label={`${ratedCount} / ${totalMovies}`}
            color="primary"
            sx={{ fontWeight: 600 }}
          />
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Rate movies to improve your personalized recommendations
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ flex: 1, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 50, textAlign: 'right' }}>
            {Math.round(progress)}%
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {currentMovie && (
        <Card
          sx={{
            maxWidth: 800,
            mx: 'auto',
            boxShadow: 6,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {currentMovie.imageUrl && (
            <CardMedia
              component="img"
              height="400"
              image={currentMovie.imageUrl}
              alt={currentMovie.title}
              sx={{ objectFit: 'cover' }}
            />
          )}
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              {currentMovie.title}
            </Typography>

            {(currentMovie.year || currentMovie.director || currentMovie.duration) && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                {currentMovie.year && (
                  <Chip label={currentMovie.year} variant="outlined" size="small" />
                )}
                {currentMovie.director && (
                  <Chip label={`Dir: ${currentMovie.director}`} variant="outlined" size="small" />
                )}
                {currentMovie.duration && (
                  <Chip label={`${currentMovie.duration} min`} variant="outlined" size="small" />
                )}
              </Box>
            )}

            {currentMovie.genres && currentMovie.genres.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {currentMovie.genres.map(genre => (
                  <Chip
                    key={genre}
                    label={genre}
                    size="small"
                    sx={{
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      color: 'white',
                    }}
                  />
                ))}
              </Box>
            )}

            {currentMovie.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                {currentMovie.description}
              </Typography>
            )}

            {currentMovie.moods && currentMovie.moods.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Moods:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {currentMovie.moods.map(mood => (
                    <Chip key={mood} label={mood} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            <Box
              sx={{
                mt: 4,
                pt: 3,
                borderTop: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                How would you rate this movie?
              </Typography>
              <Rating
                value={currentRating}
                onChange={(_, newValue) => setCurrentRating(newValue || 0)}
                size="large"
                sx={{
                  fontSize: '3rem',
                  mb: 3,
                  '& .MuiRating-iconFilled': {
                    color: '#FFD93D',
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={handleSkip}
                  disabled={submitting}
                  sx={{ minWidth: 120 }}
                >
                  Skip
                </Button>
                <Button
                  variant="contained"
                  onClick={handleRatingSubmit}
                  disabled={currentRating === 0 || submitting}
                  sx={{
                    minWidth: 120,
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    '&:disabled': {
                      background: 'rgba(0, 0, 0, 0.12)',
                    },
                  }}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Submit Rating'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {unratedMovies.length > 1 && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {unratedMovies.length - 1} more {unratedMovies.length - 1 === 1 ? 'movie' : 'movies'} to rate
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default RateMoviesPage;
