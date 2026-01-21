import { useState, useEffect } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Rating,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ThumbUp,
} from '@mui/icons-material';
import type { Movie, Recommendation } from '../types';
import { ratingsApi } from '../services/dataService';

interface MovieCardProps {
  movie: Movie;
  recommendation?: Recommendation;
  onRatingChange?: () => void;
}

const MovieCard = ({ movie, recommendation, onRatingChange }: MovieCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRating, setIsRating] = useState(false);

  useEffect(() => {
    loadUserRating();
  }, [movie.id]);

  const loadUserRating = async () => {
    try {
      const rating = await ratingsApi.getUserRating(movie.id);
      setUserRating(rating ? rating.rating : null);
    } catch (err) {
      console.error('Error loading user rating:', err);
    }
  };

  const handleRatingChange = async (_event: React.SyntheticEvent, value: number | null) => {
    if (value === null) return;

    setIsRating(true);
    try {
      await ratingsApi.upsert(movie.id, value);
      setUserRating(value);
      if (onRatingChange) {
        onRatingChange();
      }
    } catch (err) {
      console.error('Error saving rating:', err);
    } finally {
      setIsRating(false);
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardMedia
        component="img"
        height="300"
        image={movie.imageUrl || 'https://images.unsplash.com/photo-1574267432644-f2f47c5ceb88?w=400'}
        alt={movie.title}
        sx={{ objectFit: 'cover' }}
      />

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {movie.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {movie.year}
          </Typography>
          {movie.director && (
            <>
              <Typography variant="body2" color="text.secondary">•</Typography>
              <Typography variant="body2" color="text.secondary">
                {movie.director}
              </Typography>
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Rating
            value={movie.averageRating || 0}
            precision={0.1}
            size="small"
            readOnly
          />
          <Typography variant="body2" color="text.secondary">
            {movie.averageRating ? movie.averageRating.toFixed(1) : 'N/A'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {movie.genres.slice(0, 2).map((genre) => (
            <Chip key={genre} label={genre} size="small" />
          ))}
        </Box>

        {recommendation && recommendation.reasons.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Tooltip title={recommendation.reasons.join(' • ')}>
              <Chip
                icon={<ThumbUp />}
                label="Recommended"
                size="small"
                color="primary"
                variant="outlined"
              />
            </Tooltip>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Your rating:
            </Typography>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
          <Rating
            value={userRating}
            onChange={handleRatingChange}
            disabled={isRating}
            size="medium"
          />
        </Box>
      </CardActions>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            {movie.description}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Moods:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {movie.moods.map((mood) => (
                <Chip key={mood} label={mood} size="small" color="secondary" variant="outlined" />
              ))}
            </Box>
          </Box>

          {movie.duration && (
            <Typography variant="body2" color="text.secondary">
              Duration: {movie.duration} min
            </Typography>
          )}

          {recommendation && recommendation.reasons.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Why recommended:
              </Typography>
              {recommendation.reasons.map((reason, index) => (
                <Typography key={index} variant="body2" color="text.secondary">
                  • {reason}
                </Typography>
              ))}
            </Box>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default MovieCard;
