import { useState, useEffect, useMemo, useRef } from 'react';
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
  const isFirstRender = useRef(true);
  const isYearRangeUserModified = useRef(false);
  const prevMinYear = useRef<number | null>(null);
  const prevMaxYear = useRef<number | null>(null);

  // Calculate min/max year from movies
  const { minYear, maxYear } = useMemo(() => {
    if (movies.length === 0) {
      return { minYear: 1990, maxYear: 2024 };
    }
    return {
      minYear: Math.min(...movies.map(m => m.year || 2024)),
      maxYear: Math.max(...movies.map(m => m.year || 2024)),
    };
  }, [movies]);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [yearRange, setYearRange] = useState<number[]>([minYear, maxYear]);

  const allGenres = recommendationEngine.getAllGenres(movies);
  const allMoods = recommendationEngine.getAllMoods(movies);

  // Initialize year range when movies change (but don't trigger filter change)
  useEffect(() => {
    // Only auto-update if user hasn't manually modified the year range
    if (!isYearRangeUserModified.current) {
      setYearRange([minYear, maxYear]);
    }
    // Track previous values to detect data initialization vs user changes
    prevMinYear.current = minYear;
    prevMaxYear.current = maxYear;
  }, [minYear, maxYear]);

  // Check if user has explicitly changed year range from defaults
  const handleYearRangeChange = (_: Event, value: number | number[]) => {
    const newValue = value as number[];
    isYearRangeUserModified.current = true;
    setYearRange(newValue);
  };

  // Memoize filter object to avoid unnecessary re-renders
  // Only include yearRange if user has explicitly modified it
  const currentFilter = useMemo(() => {
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

    // Only include year range if user has explicitly modified it
    if (isYearRangeUserModified.current && (yearRange[0] !== minYear || yearRange[1] !== maxYear)) {
      filter.yearRange = {
        min: yearRange[0],
        max: yearRange[1],
      };
    }

    return filter;
  }, [selectedGenres, selectedMoods, minRating, yearRange, minYear, maxYear]);

  // Only trigger filter change when user explicitly changes filters (skip initial data loading)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only call onFilterChange if there's an actual user-initiated filter change
    // (not just data initialization)
    const hasActiveFilter = selectedGenres.length > 0 ||
                           selectedMoods.length > 0 ||
                           minRating > 0 ||
                           isYearRangeUserModified.current;

    if (hasActiveFilter || Object.keys(currentFilter).length > 0) {
      onFilterChange(currentFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilter]);

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
    isYearRangeUserModified.current = false;
  };

  const hasActiveFilters =
    selectedGenres.length > 0 ||
    selectedMoods.length > 0 ||
    minRating > 0 ||
    (isYearRangeUserModified.current && (yearRange[0] !== minYear || yearRange[1] !== maxYear));

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
          onChange={handleYearRangeChange}
          min={minYear}
          max={maxYear}
          valueLabelDisplay="auto"
        />
      </Box>
    </Paper>
  );
};

export default FilterPanel;
