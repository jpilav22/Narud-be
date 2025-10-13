'use client';
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme();

export default function SignUp() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const data = new FormData(event.currentTarget);
    const korisnik = {
      ime: data.get('ime') as string,
      prezime: data.get('prezime') as string,
      telefon: data.get('telefon') as string,
      adresa: data.get('adresa') as string,
      email: data.get('email') as string,
      password_hash: data.get('password') as string,
      uloga: 'KORISNIK',
    };

    
    const { error: insertError } = await supabase.from('korisnici').insert([korisnik]);

    if (insertError) {
      console.error(insertError);
      setError('Greška pri registraciji: ' + insertError.message);
      return;
    }

    alert('Registracija uspješna!');
    router.push('/login');
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
            <PersonAddAltIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Registracija
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField required fullWidth id="ime" label="Ime" name="ime" margin="normal" />
            <TextField required fullWidth id="prezime" label="Prezime" name="prezime" margin="normal" />
            <TextField required fullWidth id="adresa" label="Adresa" name="adresa" margin="normal" />
            <TextField fullWidth id="telefon" label="Telefon" name="telefon" margin="normal" />
            <TextField required fullWidth id="email" label="Email" name="email" margin="normal" />
            <TextField required fullWidth name="password" label="Lozinka" type="password" id="password" margin="normal" />

            {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}

            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Registruj se
            </Button>
            <Button onClick={() => router.push('/login')} fullWidth>
              Već imate račun? Prijavite se
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
