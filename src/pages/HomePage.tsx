import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Box,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  Star,
  Mood,
  Category,
  LocalMovies,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface RecommendationSystem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  path: string;
}

const HomePage = () => {
  const navigate = useNavigate();

  const systems: RecommendationSystem[] = [
    {
      id: 'trending',
      name: 'Trending Now',
      description: 'Most popular movies rated recently',
      icon: <TrendingUp sx={{ fontSize: 48 }} />,
      color: '#FF6B6B',
      path: '/recommendations/trending',
    },
    {
      id: 'top-rated',
      name: 'Top Rated',
      description: 'Highest rated movies of all time',
      icon: <Star sx={{ fontSize: 48 }} />,
      color: '#FFD93D',
      path: '/recommendations/top-rated',
    },
    {
      id: 'by-mood',
      name: 'Find by Mood',
      description: 'Discover movies that match your current mood',
      icon: <Mood sx={{ fontSize: 48 }} />,
      color: '#6BCB77',
      path: '/recommendations/by-mood',
    },
    {
      id: 'by-genre',
      name: 'Browse by Genre',
      description: 'Explore movies by your favorite genres',
      icon: <Category sx={{ fontSize: 48 }} />,
      color: '#4D96FF',
      path: '/recommendations/by-genre',
    },
    {
      id: 'for-you',
      name: 'Personalized For You',
      description: 'AI-powered recommendations based on your taste',
      icon: <LocalMovies sx={{ fontSize: 48 }} />,
      color: '#9D4EDD',
      path: '/recommendations/for-you',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Movie Recommender
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Discover your next favorite movie with AI-powered recommendations
        </Typography>
        <Chip
          label="Hybrid Algorithm: Collaborative + Content-Based"
          color="primary"
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        {systems.map((system) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={system.id}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(system.path)}
                sx={{ height: '100%', p: 3 }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mb: 2,
                      color: system.color,
                    }}
                  >
                    {system.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    sx={{ fontWeight: 600, textAlign: 'center' }}
                  >
                    {system.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: 'center' }}
                  >
                    {system.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Rate movies to improve your personalized recommendations
        </Typography>
      </Box>
    </Container>
  );
};

export default HomePage;
