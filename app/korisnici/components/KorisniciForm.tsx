'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Box, TextField, Avatar, Button, Typography } from '@mui/material';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import toast from 'react-hot-toast';

type Props = {
  onSuccess: () => void; // Zatvaranje modala + refresh tabele
  onCancel: () => void;  // Zatvaranje modala bez dodavanja
};

export default function KorisniciForm({ onSuccess, onCancel }: Props) {
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);
    const korisnik = {
      ime: data.get('ime') as string,
      prezime: data.get('prezime') as string,
      adresa: data.get('adresa') as string,
      telefon: data.get('telefon') as string,
      email: data.get('email') as string,
      password_hash: data.get('password') as string,
      uloga: 'KORISNIK',
    };

    const { error: insertError } = await supabase.from('korisnici').insert([korisnik]);

    if (insertError) {
      console.error(insertError);
      toast.error('Greška pri dodavanju korisnika');
      return setError(insertError.message);
    }

    toast.success('Korisnik uspješno dodat');
    onSuccess(); // Zatvori modal + osvježi tabelu
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
      <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto' }}>
        <PersonAddAltIcon />
      </Avatar>
      <Typography variant="h5" textAlign="center" mt={1}>
        Dodaj korisnika
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField required fullWidth label="Ime" name="ime" margin="normal" />
        <TextField required fullWidth label="Prezime" name="prezime" margin="normal" />
        <TextField required fullWidth label="Adresa" name="adresa" margin="normal" />
        <TextField fullWidth label="Telefon" name="telefon" margin="normal" />
        <TextField required fullWidth label="Email" name="email" margin="normal" />
        <TextField required fullWidth label="Lozinka" type="password" name="password" margin="normal" />

        {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}

        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
          Sačuvaj
        </Button>

        <Button
          fullWidth
          variant="outlined"
          color="secondary"
          sx={{ mt: 1 }}
          onClick={onCancel} // Zatvara modal bez dodavanja
        >
          Odustani
        </Button>
      </Box>
    </Box>
  );
}
