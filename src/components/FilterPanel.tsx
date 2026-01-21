import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Slider,
  Button,
  Divider,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { FilterAlt, Clear } from '@mui/icons-material';
import type { Movie, RecommendationFilter } from '../types';
import { recommendationEngine } from '../services/recommendationEngine';

interface FilterPanelProps {
  movies: Movie[];
  onFilterChange: (filter: RecommendationFilter) => void;
  systemType?: string;
}

const FilterPanel = ({ movies, onFilterChange, systemType }: FilterPanelProps) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [yearRange, setYearRange] = useState<number[]>([1990, 2024]);

  const allGenres = recommendationEngine.getAllGenres(movies);
  const allMoods = recommendationEngine.getAllMoods(movies);

  const minYear = Math.min(...movies.map(m => m.year || 2024));
  const maxYear = Math.max(...movies.map(m => m.year || 2024));

  useEffect(() => {
    applyFilters();
  }, [selectedGenres, selectedMoods, minRating, yearRange]);

  const applyFilters = () => {
    const filter: RecommendationFilter = {};

    if (selectedGenres.length > 0) {
      filter.genres = selectedGenres;
    }

    if (selectedMoods.length > 0) {
      filter.moods = selectedMoods;
    }

    if (minRating > 0) {
      filter.minRating = minRating;
    }

    if (yearRange[0] !== minYear || yearRange[1] !== maxYear) {
      filter.yearRange = {
        min: yearRange[0],
        max: yearRange[1],
      };
    }

    onFilterChange(filter);
  };

  const handleGenreChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedGenres(typeof value === 'string' ? value.split(',') : value);
  };

  const handleMoodChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedMoods(typeof value === 'string' ? value.split(',') : value);
  };

  const handleClearFilters = () => {
    setSelectedGenres([]);
    setSelectedMoods([]);
    setMinRating(0);
    setYearRange([minYear, maxYear]);
  };

  const hasActiveFilters =
    selectedGenres.length > 0 ||
    selectedMoods.length > 0 ||
    minRating > 0 ||
    yearRange[0] !== minYear ||
    yearRange[1] !== maxYear;

  return (
    <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FilterAlt sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Filters
        </Typography>
        {hasActiveFilters && (
          <Button
            size="small"
            startIcon={<Clear />}
            onClick={handleClearFilters}
          >
            Clear
          </Button>
        )}
      </Box>

      {(systemType === 'by-genre' || systemType === 'for-you') && (
        <>
          <FormControl fullWidth sx={{ mb: 3 }}>
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
            >
              {allGenres.map((genre) => (
                <MenuItem key={genre} value={genre}>
                  {genre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {(systemType === 'by-mood' || systemType === 'for-you') && (
        <>
          <FormControl fullWidth sx={{ mb: 3 }}>
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
            >
              {allMoods.map((mood) => (
                <MenuItem key={mood} value={mood}>
                  {mood}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Divider sx={{ my: 2 }} />
        </>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
          Minimum Rating: {minRating > 0 ? minRating.toFixed(1) : 'Any'}
        </Typography>
        <Slider
          value={minRating}
          onChange={(_, value) => setMinRating(value as number)}
          min={0}
          max={5}
          step={0.5}
          marks
          valueLabelDisplay="auto"
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
          Year Range: {yearRange[0]} - {yearRange[1]}
        </Typography>
        <Slider
          value={yearRange}
          onChange={(_, value) => setYearRange(value as number[])}
          min={minYear}
          max={maxYear}
          valueLabelDisplay="auto"
        />
      </Box>
    </Paper>
  );
};

export default FilterPanel;
