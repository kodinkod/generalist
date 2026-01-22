import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Add, ArrowBack } from '@mui/icons-material';
import type { Movie } from '../types';
import { itemsApi } from '../services/dataService';

const AddMoviePage = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [director, setDirector] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [duration, setDuration] = useState<number>(120);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [tags, setTags] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const availableGenres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
    'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
  ];

  const availableMoods = [
    'uplifting', 'hopeful', 'dark', 'tense', 'intense', 'mind-bending',
    'complex', 'heartwarming', 'nostalgic', 'emotional', 'quirky', 'violent',
    'philosophical', 'epic', 'thought-provoking', 'whimsical', 'romantic',
    'satirical', 'colorful', 'magical', 'enchanting', 'intimate', 'reflective',
    'adrenaline', 'bittersweet'
  ];

  const handleGenreChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedGenres(typeof value === 'string' ? value.split(',') : value);
  };

  const handleMoodChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedMoods(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (selectedGenres.length === 0) {
      setError('Please select at least one genre');
      return;
    }

    if (selectedMoods.length === 0) {
      setError('Please select at least one mood');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newMovie: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'movie',
        title: title.trim(),
        description: description.trim() || undefined,
        director: director.trim() || undefined,
        year,
        duration,
        imageUrl: imageUrl.trim() || undefined,
        genres: selectedGenres,
        moods: selectedMoods,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        averageRating: 0,
        ratingsCount: 0,
      };

      await itemsApi.add(newMovie);

      setSuccess(true);

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error adding movie:', err);
      setError('Failed to add movie. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, minHeight: 'calc(100vh - 64px)' }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/')}
        sx={{ mb: 3 }}
      >
        Back to Home
      </Button>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Add New Movie
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Add a new movie to the recommendation system
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Movie added successfully! Redirecting...
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Title"
                fullWidth
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Director"
                fullWidth
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Year"
                type="number"
                fullWidth
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                disabled={isSubmitting}
                inputProps={{ min: 1900, max: 2030 }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Duration (min)"
                type="number"
                fullWidth
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                disabled={isSubmitting}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Image URL"
                fullWidth
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={isSubmitting}
                placeholder="https://example.com/image.jpg"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Genres</InputLabel>
                <Select
                  multiple
                  value={selectedGenres}
                  onChange={handleGenreChange}
                  input={<OutlinedInput label="Genres" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                  disabled={isSubmitting}
                >
                  {availableGenres.map((genre) => (
                    <MenuItem key={genre} value={genre}>
                      {genre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Moods</InputLabel>
                <Select
                  multiple
                  value={selectedMoods}
                  onChange={handleMoodChange}
                  input={<OutlinedInput label="Moods" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" color="secondary" />
                      ))}
                    </Box>
                  )}
                  disabled={isSubmitting}
                >
                  {availableMoods.map((mood) => (
                    <MenuItem key={mood} value={mood}>
                      {mood}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Tags (comma-separated)"
                fullWidth
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isSubmitting}
                placeholder="action, superhero, thriller"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<Add />}
                disabled={isSubmitting}
                fullWidth
              >
                {isSubmitting ? 'Adding Movie...' : 'Add Movie'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddMoviePage;
