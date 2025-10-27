'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Box, TextField, Avatar, Button, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type Props = {
  korisnik: any;
  onSuccess: () => void; // ✅ koristi se i za "Sačuvaj" i za "Odustani"
  onCancel: () => void; // ✅ dodano: () => void;
};

export default function KorisniciEditForm({ korisnik, onSuccess }: Props) {
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);
    const updated = {
      ime: data.get('ime') as string,
      prezime: data.get('prezime') as string,
      adresa: data.get('adresa') as string,
      telefon: data.get('telefon') as string,
      email: data.get('email') as string,
      password_hash: data.get('password') as string,
    };

    const { error: updateError } = await supabase
      .from('korisnici')
      .update(updated)
      .eq('id', korisnik.id);

    if (updateError) {
      console.error(updateError);
      toast.error('Greška pri uređivanju korisnika');
      return setError(updateError.message);
    }

    toast.success('Korisnik uspješno uređen');
    onSuccess(); // ✅ zatvori edit panel i osvježi listu
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
      <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto' }}>
        <EditIcon />
      </Avatar>
      <Typography variant="h5" textAlign="center" mt={1}>
        Uredi korisnika
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField required fullWidth label="Ime" name="ime" margin="normal" defaultValue={korisnik.ime} />
        <TextField required fullWidth label="Prezime" name="prezime" margin="normal" defaultValue={korisnik.prezime} />
        <TextField required fullWidth label="Adresa" name="adresa" margin="normal" defaultValue={korisnik.adresa} />
        <TextField fullWidth label="Telefon" name="telefon" margin="normal" defaultValue={korisnik.telefon} />
        <TextField required fullWidth label="Email" name="email" margin="normal" defaultValue={korisnik.email} />
        <TextField required fullWidth label="Lozinka" type="password" name="password" margin="normal" defaultValue={korisnik.password_hash} />

        {error && <Typography color="error">{error}</Typography>}

        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
          Sačuvaj promjene
        </Button>

        <Button
          fullWidth
          variant="outlined"
          color="secondary"
          sx={{ mt: 1 }}
          onClick={onSuccess} // ✅ ovo sada zatvara panel kao i kod sačuvaj
        >
          Odustani
        </Button>
      </Box>
    </Box>
  );
}
