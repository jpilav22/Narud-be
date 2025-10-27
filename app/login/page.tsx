'use client';
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Paper } from '@mui/material';

const theme = createTheme();

export default function SignIn() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const data = new FormData(event.currentTarget);
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    const { data: user, error: fetchError } = await supabase
      .from('korisnici')
      .select('*')
      .eq('email', email)
      .eq('password_hash', password)
      .single();

    if (fetchError || !user) {
      setError('Neispravni podaci za prijavu.');
      return;
    }

    localStorage.setItem('user', JSON.stringify(user));

    if (user.uloga === 'ADMIN') router.push('/dashboard');
    else router.push('/dashboard');
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Prijava
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField margin="normal" required fullWidth id="email" label="Email adresa" name="email" autoFocus />
            <TextField margin="normal" required fullWidth name="password" label="Lozinka" type="password" id="password" />
            {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Prijavi se
            </Button>
            <Button onClick={() => router.push('/register')} fullWidth>
              Nemate račun? Registrujte se
            </Button>
          </Box>

          {/* Sekcija sa pristupnim podacima */}
          <Paper
            elevation={3}
            sx={{
              mt: 4,
              p: 2.5,
              borderRadius: 2,
              backgroundColor: '#f9fafb',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Pristupni podaci:
            </Typography>
            <Typography variant="body2" sx={{ ml: 1.5 }}>
              <strong>Admin</strong><br />
              E-mail: admin@example.com<br />
              Lozinka: admin123
            </Typography>
            <Typography variant="body2" sx={{ ml: 1.5, mt: 1.5 }}>
              <strong>Korisnik</strong><br />
              E-mail: kupac@example.com<br />
              Lozinka: kupac123
            </Typography>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
