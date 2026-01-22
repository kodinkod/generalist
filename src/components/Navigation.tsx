import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { Home, Add, Movie, StarRate } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppBar
      position="sticky"
      sx={{
        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
        boxShadow: 2,
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => navigate('/')}
          sx={{ mr: 2 }}
        >
          <Movie />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
          Movie Recommender
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{
              fontWeight: location.pathname === '/' ? 700 : 400,
              backgroundColor: location.pathname === '/' ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}
          >
            Home
          </Button>

          <Button
            color="inherit"
            startIcon={<StarRate />}
            onClick={() => navigate('/rate-movies')}
            sx={{
              fontWeight: location.pathname === '/rate-movies' ? 700 : 400,
              backgroundColor: location.pathname === '/rate-movies' ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}
          >
            Rate Movies
          </Button>

          <Button
            color="inherit"
            startIcon={<Add />}
            onClick={() => navigate('/add-movie')}
            sx={{
              fontWeight: location.pathname === '/add-movie' ? 700 : 400,
              backgroundColor: location.pathname === '/add-movie' ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}
          >
            Add Movie
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
