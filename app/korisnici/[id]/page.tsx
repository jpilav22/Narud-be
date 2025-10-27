'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Box, Container, CssBaseline, TextField, Avatar, Button, Typography, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { Edit, Delete } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import toast from 'react-hot-toast';
import KorisniciEditForm from '../components/KorisniciEditForm';

const theme = createTheme();

export default function KorisnikDetalji() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [korisnik, setKorisnik] = React.useState<any>(null);

  const [openEdit, setOpenEdit] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    const fetchKorisnik = async () => {
      const { data } = await supabase.from('korisnici').select('*').eq('id', id).single();
      setKorisnik(data);
    };
    fetchKorisnik();
  }, [id]);

  const handleDelete = async () => {
    if (!korisnik) return;
    const { error } = await supabase.from('korisnici').delete().eq('id', korisnik.id);
    if (error) {
      toast.error('Greška pri brisanju korisnika');
      console.error(error);
    } else {
      toast.success('Korisnik obrisan');
      router.push('/korisnici');
    }
    setConfirmDelete(false);
  };

  if (!korisnik) return <Typography>Učitavanje...</Typography>;

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}><InfoIcon /></Avatar>
          <Typography component="h1" variant="h5">Detalji korisnika</Typography>
          <Box sx={{ mt: 3, width: '100%' }}>
            {/* Neinteraktivna polja */}
            <TextField fullWidth label="Ime" margin="normal" value={korisnik.ime} InputProps={{ readOnly: true }} />
            <TextField fullWidth label="Prezime" margin="normal" value={korisnik.prezime} InputProps={{ readOnly: true }} />
            <TextField fullWidth label="Adresa" margin="normal" value={korisnik.adresa} InputProps={{ readOnly: true }} />
            <TextField fullWidth label="Telefon" margin="normal" value={korisnik.telefon} InputProps={{ readOnly: true }} />
            <TextField fullWidth label="Email" margin="normal" value={korisnik.email} InputProps={{ readOnly: true }} />

            {/* Dva dugmeta identična onima iz tabele */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Tooltip title="Uredi korisnika">
                <IconButton
                  color="primary"
                  onClick={() => setOpenEdit(true)}
                  sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' }, borderRadius: 2 }}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Obriši korisnika">
                <IconButton
                  color="error"
                  onClick={() => setConfirmDelete(true)}
                  sx={{ bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' }, borderRadius: 2 }}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>

            <Button fullWidth sx={{ mt: 2 }} onClick={() => router.push('/korisnici')}>Nazad</Button>
          </Box>
        </Box>

        {/* Modal za edit */}
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Uredi korisnika</DialogTitle>
          <DialogContent>
            <KorisniciEditForm
              korisnik={korisnik}
              onSuccess={() => {
                toast.success('Korisnik uspješno uređen');
                setOpenEdit(false);
              }}
              onCancel={() => setOpenEdit(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Modal za potvrdu brisanja */}
        <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
          <DialogTitle>Potvrda brisanja</DialogTitle>
          <DialogContent>
            <Typography>Da li ste sigurni da želite obrisati korisnika "<b>{korisnik.ime} {korisnik.prezime}</b>"?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDelete(false)}>Odustani</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>Obriši</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}
