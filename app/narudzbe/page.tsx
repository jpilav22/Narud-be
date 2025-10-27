'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, CircularProgress, IconButton, Paper, Stack, Badge } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '../dashboard/components/DashboardLayout';

import { Toaster } from 'react-hot-toast';
import NarudzbeTable from './components/NarudzbeTable';
import NarudzbaFormDialog from './components/NarudzbaFormDialog';
import NarudzbaEditDialog from './components/NarudzbaEditDialog';
import { Tooltip, Chip, FormHelperText } from '@mui/material';
export default function NarudzbePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [narudzbe, setNarudzbe] = useState<any[]>([]);
  const [loadingNarudzbe, setLoadingNarudzbe] = useState(true);
  const [selectedNarudzba, setSelectedNarudzba] = useState<any | null>(null);
  const [openNarudzbaDialog, setOpenNarudzbaDialog] = useState(false);
  const [openNarudzbaEdit, setOpenNarudzbaEdit] = useState(false);
  const [aktivnaNarudzba, setAktivnaNarudzba] = useState<any | null>(null);
  const [brojStavki, setBrojStavki] = useState<number>(0);
  const [flag, setFlag] = useState(0);

  // 🔹 Dohvati korisnika
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // 🔹 Dohvati narudžbe
  useEffect(() => {
    const fetchNarudzbe = async () => {
      setLoadingNarudzbe(true);
      const { data } = await supabase
        .from('narudzbe')
        .select('*, korisnici(ime, prezime)')
        .order('datum_kreiranja', { ascending: false });
      setNarudzbe(data || []);
      setLoadingNarudzbe(false);
    };
    fetchNarudzbe();
  }, [flag]);

  // 🔹 Postavi aktivnu narudžbu
  useEffect(() => {
    if (user && narudzbe.length) {
      const aktivna = narudzbe.find(
        (n) => n.korisnik_id === user.id && n.status === 'KREIRANA'
      );
      setAktivnaNarudzba(aktivna || null);
    }
  }, [user, narudzbe]);

  // 🔹 Broj stavki u korpi
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

  if (user === null)
    return (
      <Typography variant="h6" sx={{ mt: 4, textAlign: 'center' }}>
        Učitavanje korisnika...
      </Typography>
    );

  if (!user)
    return (
      <Typography variant="h6" sx={{ mt: 4, textAlign: 'center' }}>
        Morate biti prijavljeni da biste pristupili ovoj stranici.
      </Typography>
    );

  return (
    <DashboardLayout>
      <Container sx={{ py: 4 }}>
        <Toaster
          position="top-center"
          toastOptions={{ style: { transform: 'translateY(50px)' } }}
        />

        {/* 🔹 HEADER */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">
              {user.uloga === 'ADMIN' ? 'Sve narudžbe' : 'Moje narudžbe'}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* 🛒 Korpa */}
              <Box sx={{ textAlign: 'center' }}>
              <Tooltip title={aktivnaNarudzba ? "Detalji narudžbe" : "Nova narudžba"}>
                <IconButton
                  color="primary"
                  onClick={() => {
                    if (aktivnaNarudzba)
                      router.push(`/narudzbe/${aktivnaNarudzba.id}`);
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
                </Tooltip>
                {!aktivnaNarudzba && (
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}
                  >
                    Dodaj narudžbu
                  </Typography>
                )}
              </Box>

              
            </Box>
          </Stack>
        </Paper>

        {/* 🔹 TABELA NARUDŽBI */}
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
          {loadingNarudzbe ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
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

        {/* 🔹 DIJALOZI */}
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
      </Container>
    </DashboardLayout>
  );
}
