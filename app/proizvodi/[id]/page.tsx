'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  CircularProgress,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CardMedia,
  Grid,
  IconButton,
} from '@mui/material';

import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import toast from 'react-hot-toast';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

export default function ProizvodDetalji() {
  const { id } = useParams();
  const router = useRouter();
  const [proizvod, setProizvod] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const fetchProizvod = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('proizvodi')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Greška pri dohvaćanju proizvoda:', error);
      toast.error('Greška pri dohvaćanju proizvoda');
    } else {
      setProizvod(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProizvod();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile) return toast.error('Odaberite sliku za upload');
    setUploading(true);

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${id}_${Date.now()}.${fileExt}`;
    const filePath = `proizvodi/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('proizvodi')
      .upload(filePath, imageFile, { upsert: true });

    if (uploadError) {
      toast.error('Greška pri uploadu slike');
      console.error(uploadError);
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage.from('proizvodi').getPublicUrl(filePath);
    const publicUrl = publicData?.publicUrl;

    if (!publicUrl) {
      toast.error('Greška pri dobavljanju URL-a slike');
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase
      .from('proizvodi')
      .update({ slika: publicUrl })
      .eq('id', id);

    if (dbError) {
      toast.error('Greška pri spremanju slike u proizvod');
      console.error(dbError);
    } else {
      toast.success('Slika uspješno dodana');
      await fetchProizvod();
      setPreviewUrl(null);
      setImageFile(null);
    }

    setUploading(false);
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );

  if (!proizvod)
    return (
      <Typography align="center" mt={5}>
        Proizvod nije pronađen.
      </Typography>
    );

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8f9fa, #e3f2fd)',
        py: 8,
      }}
    >
      <Card
        sx={{
          width: 800,
          p: 4,
          boxShadow: 6,
          borderRadius: 4,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: 10,
          },
          background: 'linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#1976d2' }}>
            {proizvod.naziv}
          </Typography>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/proizvodi')}
          >
            Nazad
          </Button>
        </Box>

        <Box
  sx={{
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
    gap: 4,
  }}
>
  {/* Lijeva strana – slika i dugmad */}
  <Box>
    {(previewUrl || proizvod.slika) ? (
      <CardMedia
        component="img"
        src={previewUrl || proizvod.slika}
        alt={proizvod.naziv}
        sx={{
          width: '100%',
          height: 320,
          objectFit: 'contain',
          borderRadius: 3,
          border: '2px solid #e0e0e0',
          backgroundColor: '#fff',
        }}
      />
    ) : (
      <Box
        sx={{
          width: '100%',
          height: 320,
          borderRadius: 3,
          border: '2px dashed #ccc',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fafafa',
        }}
      >
        <Typography color="text.secondary">Nema slike</Typography>
      </Box>
    )}

    {user?.uloga === 'ADMIN' && (
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 3 }}>
        <Button variant="contained" component="label" sx={{ textTransform: 'none' }}>
          Odaberi sliku
          <input type="file" hidden accept="image/*" onChange={handleFileChange} />
        </Button>
        {imageFile && <Typography>{imageFile.name}</Typography>}
        <Button
          variant="outlined"
          onClick={handleUploadImage}
          disabled={!imageFile || uploading}
          sx={{ textTransform: 'none' }}
        >
          {uploading ? 'Učitavanje...' : 'Dodaj sliku'}
        </Button>
      </Box>
    )}

    <Box sx={{ mt: 3 }}>
      <IconButton
        color="success"
        size="large"
        title="Dodaj u narudžbu"
        sx={{
          bgcolor: '#e8f5e9',
          border: '1px solid #c8e6c9',
          '&:hover': { bgcolor: '#c8e6c9' },
        }}
        onClick={async () => {
          try {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) return toast.error('Nema korisnika');
            const user = JSON.parse(storedUser);
        
            // 🔹 Provjeri postoji li već KREIRANA narudžba
            let { data: narudzbaData } = await supabase
              .from('narudzbe')
              .select('*')
              .eq('korisnik_id', user.id)
              .eq('status', 'KREIRANA')
              .single();
        
            let narudzbaId = narudzbaData?.id;
        
            // 🔹 Ako ne postoji, kreiraj novu sa defaultnim terminom isporuke
            if (!narudzbaId) {
              // Dohvati sve zauzete termine
              const { data: zauzeti, error: zauzetiErr } = await supabase
                .from('narudzbe')
                .select('termin_isporuke')
                .not('termin_isporuke', 'is', null)
                .in('status', ['KREIRANA', 'NARUČENA', 'ISPORUCENA']);
        
              if (zauzetiErr) throw zauzetiErr;
        
              const zauzetiTermini = zauzeti?.map((n) => dayjs(n.termin_isporuke)) || [];
        
              // Počni od sutra u 08:00
              let termin = dayjs().add(1, 'day').hour(8).minute(0).second(0);
        
              // Traži prvi slobodan termin (svakih 30 minuta do 19h)
              while (zauzetiTermini.some((z) => z.isSame(termin, 'minute')) && termin.hour() < 19) {
                termin = termin.add(30, 'minute');
              }
        
              // Ako nema slobodnog termina
              if (termin.hour() >= 19) {
                toast.error('Nema slobodnih termina sutra između 08:00 i 19:00');
                return;
              }
        
              // Kreiraj novu narudžbu sa tim terminom
              const { data: novaNarudzba, error: novaErr } = await supabase
                .from('narudzbe')
                .insert([
                  {
                    korisnik_id: user.id,
                    kupac: user.ime,
                    adresa_isporuke: user.adresa,
                    status: 'KREIRANA',
                    datum_kreiranja: new Date().toISOString(),
                    termin_isporuke: termin.format('YYYY-MM-DD HH:mm:ss'),
                  },
                ])
                .select()
                .single();
        
              if (novaErr) throw novaErr;
              narudzbaId = novaNarudzba.id;
            }
        
            // 🔹 Dodaj proizvod u narudžbu
            await supabase.from('stavke_narudzbe').insert([
              {
                narudzba_id: narudzbaId,
                proizvod_id: proizvod.id,
                kolicina: 1,
                cijena_po_komadu: (proizvod.akcijska_cijena && proizvod.akcijska_cijena > 0)
  ? proizvod.akcijska_cijena
  : proizvod.cijena_po_komadu,

              },
            ]);
        
            toast.success(`Proizvod "${proizvod.naziv}" dodat u narudžbu`);
            router.push('/proizvodi');
          } catch (err) {
            console.error(err);
            toast.error('Greška pri dodavanju proizvoda u narudžbu');
          }
        }}
        
      >
        <AddShoppingCartIcon fontSize="medium" />
      </IconButton>
    </Box>
  </Box>

  {/* Desna strana – informacije o proizvodu */}
  <Card
    sx={{
      p: 3,
      backgroundColor: '#fafafa',
      borderRadius: 3,
      border: '1px solid #e0e0e0',
    }}
  >
    <Typography sx={{ mb: 1 }}>
      <b>Šifra:</b> {proizvod.sifra}
    </Typography>
    <Typography sx={{ mb: 1 }}>
      <b>Količina:</b> {proizvod.kolicina}
    </Typography>
    <Typography sx={{ mb: 1 }}>
  <b>Cijena:</b>{' '}
  {proizvod.akcijska_cijena && proizvod.akcijska_cijena > 0 ? (
    <Box component="span" sx={{ display: 'inline-flex', flexDirection: 'column', textAlign: 'right' }}>
      <Typography
        component="span"
        sx={{ textDecoration: 'line-through', color: '#888' }}
      >
        {proizvod.cijena_po_komadu} KM
      </Typography>
      <Typography component="span" sx={{ color: '#d32f2f', fontWeight: 700 }}>
        {proizvod.akcijska_cijena} KM
      </Typography>
    </Box>
  ) : (
    <Typography component="span">{proizvod.cijena_po_komadu} KM</Typography>
  )}
</Typography>

    <Typography sx={{ mb: 1 }}>
      <b>Opis:</b> {proizvod.opis || '-'}
    </Typography>
  </Card>
</Box>
      </Card>
    </Box>
  );
}
