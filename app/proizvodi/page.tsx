'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, CircularProgress, TextField, Badge, IconButton, Paper, Stack } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ProizvodiTable from './components/ProizvodiTable';
import ProizvodFormDialog from './components/ProizvodFormDialog';
import NarudzbeTable from '../narudzbe/components/NarudzbeTable';
import NarudzbaFormDialog from '../narudzbe/components/NarudzbaFormDialog';
import { Toaster } from 'react-hot-toast';
import NarudzbaEditDialog from '../narudzbe/components/NarudzbaEditDialog';

export default function ProizvodiPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [proizvodi, setProizvodi] = useState<any[]>([]);
  const [filteredProizvodi, setFilteredProizvodi] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [narudzbe, setNarudzbe] = useState<any[]>([]);
  const [loadingProizvodi, setLoadingProizvodi] = useState(true);
  const [loadingNarudzbe, setLoadingNarudzbe] = useState(true);
  const [selectedNarudzba, setSelectedNarudzba] = useState<any | null>(null);
  const [openNarudzbaDialog, setOpenNarudzbaDialog] = useState(false);
  const [flag, setFlag] = useState(0);
  const [selectedProizvod, setSelectedProizvod] = useState<any | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openNarudzbaEdit, setOpenNarudzbaEdit] = useState(false);
  const [aktivnaNarudzba, setAktivnaNarudzba] = useState<any | null>(null);
  const [brojStavki, setBrojStavki] = useState<number>(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const fetchProizvodi = async () => {
      setLoadingProizvodi(true);
      const { data } = await supabase.from('proizvodi').select('*').order('naziv', { ascending: true });
      setProizvodi(data || []);
      setFilteredProizvodi(data || []);
      setLoadingProizvodi(false);
    };

    const fetchNarudzbe = async () => {
      setLoadingNarudzbe(true);
      const { data } = await supabase.from('narudzbe').select('*').order('datum_kreiranja', { ascending: false });
      setNarudzbe(data || []);
      setLoadingNarudzbe(false);
    };

    fetchProizvodi();
    fetchNarudzbe();
  }, [flag]);

  useEffect(() => {
    if (user && narudzbe.length) {
      const aktivna = narudzbe.find(
        (n) => n.korisnik_id === user.id && n.status === 'KREIRANA'
      );
      setAktivnaNarudzba(aktivna || null);
    }
  }, [user, narudzbe]);

  useEffect(() => {
    const fetchBrojStavki = async () => {
      if (!aktivnaNarudzba) {
        setBrojStavki(0);
        return;
      }
      const { count } = await supabase
        .from('stavke_narudzbe')
        .select('*', { count: 'exact', head: true })
        .eq('narudzba_id', aktivnaNarudzba.id);
      setBrojStavki(count || 0);
    };
    fetchBrojStavki();
  }, [aktivnaNarudzba, flag]);

  const refresh = () => setFlag((f) => f + 1);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProizvodi(proizvodi);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredProizvodi(proizvodi.filter((p) => p.naziv.toLowerCase().includes(lower)));
    }
  }, [searchTerm, proizvodi]);

  if (user === null)
    return <Typography variant="h6" sx={{ mt: 4, textAlign: 'center' }}>Učitavanje korisnika...</Typography>;

  if (!user)
    return <Typography variant="h6" sx={{ mt: 4, textAlign: 'center' }}>Morate biti prijavljeni da biste pristupili ovoj stranici.</Typography>;

  return (
    <Container sx={{ py: 4 }}>
      <Toaster position="top-center" toastOptions={{ style: { transform: 'translateY(50px)' } }} />

      {/* HEADER */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Upravljanje proizvodima i narudžbama</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
           <IconButton
    color="primary"
    onClick={() => {
      if (aktivnaNarudzba) router.push(`/narudzbe/${aktivnaNarudzba.id}`);
      else {
        setSelectedNarudzba(null);  
      setOpenNarudzbaDialog(true); 
      }
    }}
  >
    <Badge badgeContent={brojStavki > 0 ? brojStavki : 0} color="error">
      <ShoppingCart fontSize="medium" />
    </Badge>
  </IconButton>

  
  {!aktivnaNarudzba && (
    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
      Dodaj narudžbu
    </Typography>
  )} 
</Box>

            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
            >
              Odjava
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* PRETRAGA */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <TextField
          label="Pretraga po nazivu proizvoda"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="npr. Hljeb, Mlijeko, Ulje..."
        />
      </Paper>

      
    

      {/* TABELE */}
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <Paper sx={{ flex: 1, minWidth: 400, p: 3, borderRadius: 3, boxShadow: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Proizvodi</Typography>
          {loadingProizvodi ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
          ) : (
            <ProizvodiTable
              proizvodi={filteredProizvodi}
              onChange={refresh}
              loading={loadingProizvodi}
              onEdit={(proizvod: any) => {
                setSelectedProizvod(proizvod);
                setOpenDialog(true);
              }}
              userRole={user.uloga}
            />
          )}
          {user.uloga === 'ADMIN' && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setSelectedProizvod(null);
              setOpenDialog(true);
            }}
          >
            Dodaj novi proizvod
          </Button>
        </Box>
      )}
        </Paper>

        <Paper sx={{ flex: 1, minWidth: 400, p: 3, borderRadius: 3, boxShadow: 3 }}>
        {user.uloga !== 'ADMIN' && (<Typography variant="h5" sx={{ mb: 2 }}>Moje narudžbe</Typography>)}
        {user.uloga === 'ADMIN' && (<Typography variant="h5" sx={{ mb: 2 }}>Sve narudžbe</Typography>)}
          {loadingNarudzbe ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
          ) : (
            <NarudzbeTable
              narudzbe={narudzbe}
              onChange={refresh}
              loading={loadingNarudzbe}
              onEdit={(narudzba: any) => {
                setSelectedNarudzba(narudzba);
                setOpenNarudzbaEdit(true);
              }}
              userRole={user.uloga}
            />
          )}
            
        </Paper>
      </Box>
      
      {/* DIALOGS */}
      <NarudzbaEditDialog
        open={openNarudzbaEdit}
        onClose={() => setOpenNarudzbaEdit(false)}
        narudzba={selectedNarudzba}
        onSuccess={refresh}
      />

      <NarudzbaFormDialog
        open={openNarudzbaDialog}
        onClose={() => setOpenNarudzbaDialog(false)}
        selectedNarudzba={selectedNarudzba}
        onSuccess={refresh}
      />

      <ProizvodFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        selectedProizvod={selectedProizvod}
        onSuccess={refresh}
      />
    </Container>
  );
}
