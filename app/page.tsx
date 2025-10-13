'use client';
import { Button, Container, Typography, Box, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function Home() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: 'url("images\onlineshopping.jfif")', // tvoja slika
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.7)', // blagi overlay
          backdropFilter: 'blur(2px)', // malo zamuti pozadinu
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper 
          elevation={6} 
          sx={{ 
            p: 5, 
            borderRadius: 4, 
            textAlign: 'center', 
            background: 'rgba(255,255,255,0.9)', 
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <ShoppingCartIcon sx={{ fontSize: 60, color: '#00acc1' }} />
          </Box>

          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Dobrodošli u Online Prodavnicu!
          </Typography>

          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
            Pregledajte naše proizvode i kreirajte svoje narudžbe
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              onClick={() => router.push('/login')}
              sx={{ px: 4, py: 1.5, fontWeight: 600 }}
            >
              Prijava
            </Button>

            <Button 
              variant="outlined" 
              color="primary" 
              size="large" 
              onClick={() => router.push('/register')}
              sx={{ px: 4, py: 1.5, fontWeight: 600 }}
            >
              Registracija
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
