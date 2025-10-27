'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Button,
  TextField,
  Stack,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';

import Grid from '@mui/material/Grid';
import { Chip, FormHelperText } from '@mui/material';

import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Tooltip } from '@mui/material';
export default function NarudzbaDetaljiPage() {
  const params = useParams();
  const router = useRouter();
  const [narudzba, setNarudzba] = useState<any>(null);
  const [stavke, setStavke] = useState<any[]>([]);
  const [proizvodi, setProizvodi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [editMode, setEditMode] = useState<any>(null);
  const [odabraniProizvod, setOdabraniProizvod] = useState<any>(null);
  const [kolicina, setKolicina] = useState(1);
  const [terminIsporuke, setTerminIsporuke] = useState<dayjs.Dayjs | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [terminError, setTerminError] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const isLocked =
  status==='NARUČENA' ||
  status==='U_OBRADI' ||
    status === 'NA_ADRESI' ||
    status === 'ISPORUCENA' ||
    status === 'PREUZETA';
    const statusColorMap: Record<string, string> = {
      KREIRANA: 'grey',
      NARUČENA: '#2196f3', // plava
      U_OBRADI: '#ff9800', // narandžasta
      ISPORUCENA: '#4caf50', // zelena
      NA_ADRESI: '#9c27b0', // ljubičasta
      PREUZETA: '#009688', // tirkiz
      OTKAZANA: '#f44336', // crvena
    };



    // izbriši ovaj dio jer ti objekt statusColorMap zapravo uopšte ne treba
// const statusColorMap: Record<string, string> = {

// Ostavimo helper funkciju vani
const getStatusChip = (status: string) => {
  const map: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    KREIRANA: { label: 'Kreirana', color: '#616161', bg: '#eeeeee' },
    NARUČENA: { label: 'Naručena', color: '#1976d2', bg: '#e3f2fd' },
    U_OBRADI: { label: 'U obradi', color: '#ed6c02', bg: '#fff3e0' },
    NA_ADRESI: { label: 'Na adresi', color: '#6a1b9a', bg: '#f3e5f5' },
    ISPORUCENA: { label: 'Isporučena', color: '#2e7d32', bg: '#e8f5e9' },
    PREUZETA: { label: 'Preuzeta', color: '#1b5e20', bg: '#c8e6c9' },
    OTKAZANA: { label: 'Otkazana', color: '#d32f2f', bg: '#ffebee' },
  };

  const s = map[status] || { label: status, color: '#757575', bg: '#f5f5f5' };

  return (
    <Chip
      label={s.label}
      sx={{
        bgcolor: s.bg,
        color: s.color,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        px: 0.5,
      }}
      size="small"
    />
  );
};

useEffect(() => {
  const checkTermin = async () => {
    if (!terminIsporuke) {
      setTerminError('');
      return;
    }

    const sada = dayjs();

    // ⛔ Ako je termin u prošlosti
    if (terminIsporuke.isBefore(sada)) {
      setTerminError('Odabrani termin je sada u prošlosti. Odaberite drugi termin ukoliko želite naručiti.');
      return;
    }

    // 🔄 Provjeri da li je termin zauzet
    const { data: zauzeti, error } = await supabase
      .from('narudzbe')
      .select('id, termin_isporuke')
      .not('termin_isporuke', 'is', null)
      .in('status', ['KREIRANA', 'NARUČENA', 'ISPORUCENA']);

    if (error) {
      console.error(error);
      setTerminError('Greška pri provjeri termina.');
      return;
    }

    const zauzet = zauzeti?.some(
      (n) =>
        dayjs(n.termin_isporuke).isSame(terminIsporuke, 'minute') &&
        n.id !== narudzba?.id
    );

    if (zauzet) {
      setTerminError('Taj termin je sada zauzet. Odaberite drugi.');
      return;
    }

    setTerminError('');
  };

  checkTermin();
}, [terminIsporuke]);


    
    
  useEffect(() => {
    const fetchNarudzba = async () => {
      if (!params.id) return;
      setLoading(true);
      try {
        const { data: nData, error: nError } = await supabase
          .from('narudzbe')
          .select('*, korisnici(ime, prezime)')
          .eq('id', params.id)
          .single();
        if (nError) throw nError;
        setNarudzba(nData);
        setStatus(nData.status);
        setTerminIsporuke(nData.termin_isporuke ? dayjs(nData.termin_isporuke) : null);

        const { data: sData, error: sError } = await supabase
          .from('stavke_narudzbe')
          .select('id, kolicina, cijena_po_komadu, proizvod_id, proizvodi(id, naziv, opis, slika, cijena_po_komadu)')
          .eq('narudzba_id', params.id);
        if (sError) throw sError;

        setStavke(
          sData.map((s: any) => ({
            id: s.id,
            proizvod_id: s.proizvod_id,
            naziv: s.proizvodi?.naziv,
            opis: s.proizvodi?.opis,
            slika: s.proizvodi?.slika,
            kolicina: s.kolicina,
            cijena: s.cijena_po_komadu,
            ukupno: s.cijena_po_komadu * s.kolicina,
          }))
        );

        const { data: pData, error: pError } = await supabase.from('proizvodi').select('*');
        if (pError) throw pError;
        setProizvodi(pData);
      } catch (err: any) {
        console.error(err);
        toast.error('Greška pri učitavanju narudžbe');
        router.push('/narudzbe');
      } finally {
        setLoading(false);
      }
    };
    fetchNarudzba();
  }, [params.id]);

  const ukupno = stavke.reduce((acc, s) => acc + s.ukupno, 0);

  // --------- HANDLERI ---------
  const handleDeleteStavka = (id: number) => {
    if (isLocked) return;
    setStavke(stavke.filter((s) => s.id !== id));
  };

  const handleEditStavkaSave = () => {
    if (!editMode) return;
    setStavke(
      stavke.map((s) =>
        s.id === editMode.id ? { ...editMode, ukupno: editMode.kolicina * editMode.cijena } : s
      )
    );
    setEditMode(null);
  };

  const handleAddStavkaTemp = () => {
    if (isLocked) return;
    if (!odabraniProizvod) return toast.error('Odaberite proizvod');
    if (kolicina <= 0) return toast.error('Količina mora biti veća od 0');
    const cijenaZaKoristiti =
    odabraniProizvod.akcijska_cijena && odabraniProizvod.akcijska_cijena > 0
      ? odabraniProizvod.akcijska_cijena
      : odabraniProizvod.cijena_po_komadu;
    const nova = {
      id: Date.now(),
      proizvod_id: odabraniProizvod.id,
      naziv: odabraniProizvod.naziv,
      kolicina,
      cijena: cijenaZaKoristiti,
      ukupno: cijenaZaKoristiti * kolicina,
      temp: true,
    };

    setStavke([...stavke, nova]);
    setOdabraniProizvod(null);
    setKolicina(1);
  };

  const handleSaveSve = async (newStatus?: string) => {
    if (!narudzba?.id) return;
    
    if (newStatus === 'NARUČENA') {
      if (!stavke.length) {
        toast.error('Ne možete naručiti bez ijedne stavke.');
        await new Promise((r) => setTimeout(r, 10));
        return;
      }
      const sveNula = stavke.every((s) => s.kolicina <= 0);
      if (sveNula) {
        toast.error('Ne možete naručiti ako su sve količine 0.');
        await new Promise((r) => setTimeout(r, 10));
        return;
      }
      if (!terminIsporuke) {
        toast.error('Ne možete naručiti bez definisanog termina isporuke.');
        await new Promise((r) => setTimeout(r, 10));
        return;
      }
      if (!terminIsporuke) {
        toast.error('Ne možete naručiti bez definisanog termina isporuke!');
        return; // prekid funkcije
      }
      if (terminIsporuke === null || terminIsporuke === undefined) {
        toast.error('Ne možete sačuvati promjene bez definisanog termina isporuke.');
        return;
      }
    }

    
if (newStatus === 'NARUČENA') {
  for (const s of stavke) {
    if (s.kolicina <= 0) continue;
    
    const { data: proizvodData, error: getErr } = await supabase
      .from('proizvodi')
      .select('kolicina')
      .eq('id', s.proizvod_id)
      .single();
    if (getErr) throw getErr;

    const novaKolicina = (proizvodData.kolicina || 0) - s.kolicina;

    
    const { error: updateErr } = await supabase
      .from('proizvodi')
      .update({ kolicina: novaKolicina })
      .eq('id', s.proizvod_id);
    if (updateErr) throw updateErr;
  }
}

// Ako je status OTKAZANA, vrati količine natrag
if (newStatus === 'OTKAZANA' && status!=='KREIRANA') {
  for (const s of stavke) {
    if (s.kolicina <= 0) continue;
    const { data: proizvodData, error: getErr } = await supabase
      .from('proizvodi')
      .select('kolicina')
      .eq('id', s.proizvod_id)
      .single();
    if (getErr) throw getErr;

    const novaKolicina = (proizvodData.kolicina || 0) + s.kolicina;

    const { error: updateErr } = await supabase
      .from('proizvodi')
      .update({ kolicina: novaKolicina })
      .eq('id', s.proizvod_id);
    if (updateErr) throw updateErr;
  }
}


    try {
      const validneStavke = stavke.filter((s) => s.kolicina > 0);

      const { data: postojeciZapisi } = await supabase
        .from('stavke_narudzbe')
        .select('id')
        .eq('narudzba_id', narudzba.id);

      const trenutniIds = validneStavke.filter((s) => !s.temp).map((s) => s.id);
      const zaBrisanje = postojeciZapisi?.filter((pz: any) => !trenutniIds.includes(pz.id)) || [];

      for (const b of zaBrisanje) {
        await supabase.from('stavke_narudzbe').delete().eq('id', b.id);
      }

      for (const s of stavke) {
        if (s.temp) {
          await supabase.from('stavke_narudzbe').insert({
            narudzba_id: narudzba.id,
            proizvod_id: s.proizvod_id,
            kolicina: s.kolicina,
            cijena_po_komadu: s.cijena,
          });
        } else {
          await supabase
            .from('stavke_narudzbe')
            .update({
              kolicina: s.kolicina,
              proizvod_id: s.proizvod_id,
              cijena_po_komadu: s.cijena,
            })
            .eq('id', s.id);
        }
      }

      await supabase
        .from('narudzbe')
        .update({
          status: newStatus || status,
          termin_isporuke: terminIsporuke
            ? terminIsporuke.format('YYYY-MM-DD HH:mm:ss')
            : null,
        })
        .eq('id', narudzba.id);

      setStatus(newStatus || status);
      if(newStatus === 'NARUČENA'){
        toast.success('Narudžba uspješno naručena!');
      } else {
        toast.success('Promjene uspješno sačuvane!');
      }
      
      router.push('/narudzbe');
    } catch (err) {
      console.error(err);
      toast.error('Greška pri spremanju promjena');
    }
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress />
      </Box>
    );

  if (!narudzba)
    return (
      <Typography variant="h6" align="center" sx={{ mt: 4 }}>
        Nije pronađena narudžba
      </Typography>
    );
    const nemaStavki = stavke.length === 0;
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 4, backgroundColor: '#ffffff' }}>
        {/* HEADER */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Detalji narudžbe #{narudzba.id}
          </Typography>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/narudzbe')}
          >
            Nazad
          </Button>
        </Stack>

        {/* STATUS I TERMIN */}
       {/* STATUS I TERMIN */}
<Box
  sx={{
    mb: 3,
    p: 2,
    borderRadius: 2,
    backgroundColor: '#fafafa',
    boxShadow: 1,
  }}
>
  <Grid container spacing={2} alignItems="center">
    {/* Lijeva strana — status i datum */}
    <Grid item xs={12} md={6}>
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      bgcolor: '#f9f9f9',
      px: 2,
      py: 1,
      borderRadius: 2,
      border: '1px solid #e0e0e0',
      width: 'fit-content',
    }}
  >
    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
      Status:
    </Typography>
    {getStatusChip(status)}


  </Box>

  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
    {(() => {
      const value = narudzba.datum_kreiranja;
      if (!value) return '-';
      const date = new Date(value.endsWith('Z') ? value : value + 'Z');
      if (isNaN(date.getTime())) return '-';
      return `Kreirano: ${dayjs(date).format('DD.MM.YYYY. HH:mm')}`;
    })()}
  </Typography>
</Grid>




    {/* Desna strana — termin isporuke */}
    <Grid item xs={12} md={6}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateTimePicker
          label="Termin isporuke"
          value={terminIsporuke}
          onChange={async (newValue) => {
            if (status !== 'KREIRANA' && status !== 'OTKAZANA' ) return;
            if (!newValue) return;
            const sat = newValue.hour();
            const sada = dayjs();
            if (newValue.isBefore(sada)) {
              toast.error('Ne možete odabrati termin u prošlosti.');
              return;
            }
            if (sat < 8 || sat >= 19) {
              toast.error('Termin isporuke mora biti od 08:00 do 19:00.');
              return;
            }

            const { data: zauzeti, error } = await supabase
              .from('narudzbe')
              .select('termin_isporuke')
              .not('termin_isporuke', 'is', null)
              .in('status', ['KREIRANA', 'NARUČENA', 'ISPORUCENA']);

            if (error) {
              console.error(error);
              toast.error('Greška pri provjeri termina.');
              return;
            }

            const zauzet = zauzeti?.some((n) =>
              dayjs(n.termin_isporuke).isSame(newValue, 'minute')
            );
            if (zauzet) {
              toast.error('Taj termin je već zauzet. Odaberite drugi.');
              return;
            }

            setTerminIsporuke(newValue);
          }}
          disablePast
          minutesStep={30}
          ampm={false}
          sx={{ width: '100%' }}
          disabled={status !== 'KREIRANA' && status !== 'OTKAZANA' }
        />
      </LocalizationProvider>

      <FormHelperText sx={{ color: 'text.secondary', mt: 0.5 }}>
        Dostava moguća od 08:00 do 19:00 sati.
      </FormHelperText>

      {terminError && (
  <FormHelperText error sx={{ mt: 1 }}>
    {terminError}
  </FormHelperText>
)}

    </Grid>
  </Grid>
</Box>



        {/* DUGMAD ZA STATUS */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
        <Button
      variant="contained"
      color="info"
      onClick={() => handleSaveSve('NARUČENA')}
      disabled={isLocked || nemaStavki || (status !== 'KREIRANA' && status !== 'OTKAZANA') ||  !!terminError}
    >
      Naruči
    </Button>
    
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleSaveSve('OTKAZANA')}
            disabled={status !== 'KREIRANA' && status !== 'NARUČENA' &&  status !== 'U_OBRADI'}
          >
            Otkaži
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleSaveSve('PREUZETA')}
            disabled={status !== 'ISPORUCENA' && status !== 'NA_ADRESI'}
          >
            Preuzeta
          </Button>
          {user?.uloga === 'ADMIN' && (
            <>
              <Button
                variant="contained"
                color="warning"
                onClick={() => handleSaveSve('U_OBRADI')}
                disabled={status !== 'NARUČENA'}
              >
                U obradi
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleSaveSve('ISPORUCENA')}
                disabled={status !== 'U_OBRADI' && status !== 'NA_ADRESI'}
              >
                Isporuči (iz radnje)
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSaveSve('NA_ADRESI')}
                disabled={status !== 'ISPORUCENA'}
              >
                Na adresi
              </Button>
            </>
          )}
        </Box>

        {/* Dodavanje stavki */}
        {!isLocked && (
  <Box sx={{ mt: 2 }}>
    {/* Polja za dodavanje stavki */}
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Autocomplete
        options={proizvodi}
        getOptionLabel={(option) => option.naziv}
        value={odabraniProizvod}
        onChange={(_, val) => setOdabraniProizvod(val)}
        sx={{ flex: 2 }}
        renderInput={(params) => <TextField {...params} label="Proizvod" />}
      />
     <TextField
  type="number"
  label="Količina"
  value={kolicina}
  onChange={(e) => setKolicina(Number(e.target.value))}
  sx={{ width: 100 }}
  InputProps={{ inputProps: { min: 0 } }} // dopušta 0 radi prikaza greške
  error={kolicina < 1}
  helperText={kolicina < 1 ? 'Količina mora biti najmanje 1' : ''}
/>


      <Tooltip title="Dodaj proizvod u narudžbu">
  <span>
  <Button
  variant="contained"
  onClick={handleAddStavkaTemp}
  disabled={!odabraniProizvod || kolicina < 1}
  sx={{ height: 56 }}
>
  <AddIcon />
</Button>

  </span>
</Tooltip>

    </Box>

    {/* Helper text odmah ispod */}
    <FormHelperText sx={{ color: nemaStavki ? 'error.main' : 'text.secondary', mt: 0.5 }}>
  {nemaStavki
    ? 'Ne možete naručiti bez ijedne stavke.'
    : 'Odaberite proizvod'}
</FormHelperText>

  </Box>
)}






      
      
      </Paper>

      {/* GRID STAVKI SA EDIT I DELETE */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {stavke.map((s: any) => (
          <Card key={s.id} sx={{ display: 'flex', flexDirection: 'column', height: '100%', boxShadow: 3 }}>
            <CardMedia
              component="img"
              height="180"
              image={s.slika || '/no-image.png'}
              alt={s.naziv}
              sx={{ objectFit: 'cover' }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">{s.naziv}</Typography>
                {!isLocked && (
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Uredi količinu">
  <IconButton
    size="small"
    color="primary"
    onClick={() => setEditMode({ ...s })}
  >
    <EditIcon fontSize="small" />
  </IconButton>
</Tooltip>
<Tooltip title="Obriši stavku">
  <IconButton
    size="small"
    color="error"
    onClick={() => handleDeleteStavka(s.id)}
  >
    <DeleteIcon fontSize="small" />
  </IconButton>
</Tooltip>

                  </Stack>
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {s.opis || 'Bez opisa.'}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2">
                <strong>Količina:</strong> {s.kolicina}
              </Typography>
              <Typography variant="body2">
                <strong>Cijena:</strong> {s.cijena.toFixed(2)} KM
              </Typography>
              <Typography variant="body2">
                <strong>Ukupno:</strong> {s.ukupno.toFixed(2)} KM
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* MODAL ZA EDIT */}
      <Dialog open={!!editMode} onClose={() => setEditMode(null)}>
        <DialogTitle>Uredi stavku</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField
  label="Količina"
  type="number"
  value={editMode?.kolicina ?? 0}
  onChange={(e) => {
    const val = Number(e.target.value);
    setEditMode((prev: any) => ({ ...prev, kolicina: val }));
  }}
  InputProps={{ inputProps: { min: 0 } }}
  error={editMode?.kolicina < 1}
  helperText={editMode?.kolicina < 1 ? 'Količina mora biti najmanje 1' : ''}
/>


        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMode(null)}>Otkaži</Button>
          <Button
  variant="contained"
  onClick={handleEditStavkaSave}
  disabled={editMode?.kolicina < 1}
>
  Sačuvaj
</Button>

        </DialogActions>
      </Dialog>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
{/* UKUPNA CIJENA */}
<Box
  sx={{
    mt: 3,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    p: 2,
    borderRadius: 2,
    backgroundColor: '#fff',
    boxShadow: 2,
  }}
>
  <Typography variant="h6" sx={{ fontWeight: 600 }}>
    Ukupna cijena: {ukupno.toFixed(2)} KM
  </Typography>
</Box>





    <Button
      variant="contained"
      sx={{ mt: 1 }}
      onClick={() => handleSaveSve()}
      disabled={isLocked || nemaStavki || !!terminError}
    >
      Sačuvaj promjene
    </Button>
    {nemaStavki && (
      <Typography variant="caption" color="error">
        Nije moguće sačuvati promjene bez ijedne stavke
      </Typography>
    )}
  </Box>

    </Box>
  );
}
