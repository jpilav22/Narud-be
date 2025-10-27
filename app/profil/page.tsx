'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import PersonIcon from '@mui/icons-material/Person';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import toast from 'react-hot-toast';

const theme = createTheme();

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [edited, setEdited] = React.useState(false);
  const [formData, setFormData] = React.useState<any>({});

  // Dohvati prijavljenog korisnika iz localStorage ili supabase auth
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      setFormData(u);
    }
  }, []);

  if (!user) return <Typography sx={{ mt: 4, textAlign: 'center' }}>Učitavanje korisnika...</Typography>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setEdited(true);
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('korisnici')
      .update(formData)
      .eq('id', user.id);

    if (error) {
      toast.error('Greška pri čuvanju promjena');
      console.error(error);
    } else {
      toast.success('Promjene uspješno sačuvane');
      setEdited(false);
      localStorage.setItem('user', JSON.stringify(formData));
      setUser(formData);
      router.push('/dashboard');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <PersonIcon />
          </Avatar>
          <Typography component="h1" variant="h5">Moj profil</Typography>
          <Box sx={{ mt: 3, width: '100%' }}>
            <TextField
              fullWidth
              label="Ime"
              name="ime"
              margin="normal"
              value={formData.ime || ''}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Prezime"
              name="prezime"
              margin="normal"
              value={formData.prezime || ''}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Adresa"
              name="adresa"
              margin="normal"
              value={formData.adresa || ''}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Telefon"
              name="telefon"
              margin="normal"
              value={formData.telefon || ''}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              margin="normal"
              value={formData.email || ''}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Lozinka"
              type="password"
              name="password_hash"
              margin="normal"
              value={formData.password_hash || ''}
              onChange={handleChange}
            />

            {/* Dugme za sačuvaj promjene se pojavljuje samo ako je nešto editovano */}
            
             <Button
             fullWidth
             variant="contained"
             sx={{ mt: 2 }}
             onClick={handleSave}
             disabled={!edited} // ne može se kliknuti dok nije editovano ništa
           >
             Sačuvaj promjene
           </Button>
            

            <Button
              fullWidth
              sx={{ mt: 1 }}
              onClick={() => router.push('/dashboard')}
            >
              Nazad
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
