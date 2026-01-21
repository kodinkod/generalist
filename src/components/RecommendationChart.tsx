import { useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Movie, Recommendation } from '../types';

interface RecommendationChartProps {
  movies: Movie[];
  recommendations: Recommendation[];
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#FFD93D', '#6BCB77', '#4D96FF', '#9D4EDD', '#FF9CEE',
];

const RecommendationChart = ({ recommendations }: RecommendationChartProps) => {
  // Genre distribution in recommendations
  const genreData = useMemo(() => {
    const genreCounts = new Map<string, number>();

    recommendations.forEach((rec) => {
      rec.item.genres.forEach((genre) => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
    });

    return Array.from(genreCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [recommendations]);

  // Mood distribution in recommendations
  const moodData = useMemo(() => {
    const moodCounts = new Map<string, number>();

    recommendations.forEach((rec) => {
      rec.item.moods.forEach((mood) => {
        moodCounts.set(mood, (moodCounts.get(mood) || 0) + 1);
      });
    });

    return Array.from(moodCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [recommendations]);

  // Rating distribution
  const ratingData = useMemo(() => {
    const ratingRanges = [
      { name: '4.5+', min: 4.5, max: 5, count: 0 },
      { name: '4.0-4.5', min: 4.0, max: 4.5, count: 0 },
      { name: '3.5-4.0', min: 3.5, max: 4.0, count: 0 },
      { name: '3.0-3.5', min: 3.0, max: 3.5, count: 0 },
      { name: '<3.0', min: 0, max: 3.0, count: 0 },
    ];

    recommendations.forEach((rec) => {
      const rating = rec.item.averageRating || 0;
      const range = ratingRanges.find((r) => rating >= r.min && rating < r.max);
      if (range) {
        range.count++;
      }
    });

    return ratingRanges.filter((r) => r.count > 0).map((r) => ({
      name: r.name,
      value: r.count,
    }));
  }, [recommendations]);

  // Year distribution
  const yearData = useMemo(() => {
    const yearCounts = new Map<string, number>();

    recommendations.forEach((rec) => {
      if (rec.item.year) {
        const decade = `${Math.floor(rec.item.year / 10) * 10}s`;
        yearCounts.set(decade, (yearCounts.get(decade) || 0) + 1);
      }
    });

    return Array.from(yearCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [recommendations]);

  // Top recommendations by score
  const topRecommendations = useMemo(() => {
    return recommendations
      .slice(0, 10)
      .map((rec) => ({
        name: rec.item.title.length > 20 ? rec.item.title.substring(0, 20) + '...' : rec.item.title,
        score: parseFloat(rec.score.toFixed(2)),
      }));
  }, [recommendations]);

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Genre Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Genre Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genreData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genreData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Mood Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Mood Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4ECDC4" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Recommendations by Score */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Top Recommendations
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topRecommendations} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="score" fill="#9D4EDD" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Rating Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Rating Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ratingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ratingData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Year Distribution */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Year Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#FFD93D" name="Movies" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RecommendationChart;
