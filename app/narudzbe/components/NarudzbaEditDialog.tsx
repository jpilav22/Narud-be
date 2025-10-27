'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Autocomplete,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Tooltip, Chip, FormHelperText } from '@mui/material';

export default function NarudzbaEditDialog({ open, onClose, narudzba, onSuccess }: any) {
  const router = useRouter();
  const [stavke, setStavke] = useState<any[]>([]);
  const [originalStavke, setOriginalStavke] = useState<any[]>([]);
  const [proizvodi, setProizvodi] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [ukupno, setUkupno] = useState(0);
  const [odabraniProizvod, setOdabraniProizvod] = useState<any>(null);
  const [kolicina, setKolicina] = useState(1);
  const [editMode, setEditMode] = useState<any>(null);
  const [datumIsporuke, setDatumIsporuke] = useState<string>('');
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
    const nemaStavki = stavke.length === 0;
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
      if (narudzba?.id) {
        setStatus(narudzba.status);
    
        // Ako već postoji termin u narudžbi — postavi ga u picker
        if (narudzba.termin_isporuke) {
          setTerminIsporuke(dayjs(narudzba.termin_isporuke));
        } else {
          setTerminIsporuke(null);
        }
    
        fetchProizvodi();
        fetchStavke();
      }
    }, [narudzba]);

  const fetchProizvodi = async () => {
    const { data, error } = await supabase.from('proizvodi').select('*');
    if (error) toast.error('Greška pri učitavanju proizvoda');
    else setProizvodi(data);
  };

  const fetchStavke = async () => {
    const { data, error } = await supabase
      .from('stavke_narudzbe')
      .select('*, proizvodi (naziv, akcijska_cijena)')
      .eq('narudzba_id', narudzba.id);

    if (error) {
      toast.error('Greška pri učitavanju stavki');
      return;
    }

    const mapped = (data || []).map((s: any) => ({
      id: s.id,
      proizvod_id: s.proizvod_id,
      naziv: s.proizvodi?.naziv || 'Nepoznato',
      kolicina: s.kolicina,
      cijena: s.akcijska_cijena && s.akcijska_cijena !== 0 
            ? s.akcijska_cijena 
            : s.cijena_po_komadu, // <-- ovdje je ključ
           
      ukupno: (s.akcijska_cijena && s.akcijska_cijena !== 0 ? s.akcijska_cijena : s.cijena_po_komadu) * s.kolicina,
    }));

    setStavke(mapped);
    setOriginalStavke(mapped.map((s) => ({ ...s })));
    setUkupno(mapped.reduce((sum, s) => sum + s.ukupno, 0));
  };

  const handleDeleteTemp = (id: number) => {
    if (isLocked) return;
    setStavke(stavke.filter((s) => s.id !== id));
  };

  const handleAddStavkaTemp = () => {
    if (isLocked) return;
    if (!odabraniProizvod) return toast.error('Odaberite proizvod');
    if (kolicina <= 0) return toast.error('Količina mora biti veća od 0');

    const nova = {
      id: Date.now(),
      proizvod_id: odabraniProizvod.id,
      naziv: odabraniProizvod.naziv,
      kolicina,
      cijena: odabraniProizvod.akcijska_cijena && odabraniProizvod.akcijska_cijena !== 0 
            ? odabraniProizvod.akcijska_cijena 
            : odabraniProizvod.cijena_po_komadu, // <-- ovdje je ključ
      
      ukupno: (odabraniProizvod.akcijska_cijena && odabraniProizvod.akcijska_cijena !== 0 ? odabraniProizvod.akcijska_cijena : odabraniProizvod.cijena_po_komadu) * kolicina,
      temp: true,
    };

    setStavke([...stavke, nova]);
    setOdabraniProizvod(null);
    setKolicina(1);
  };

  const handleEditStavkaTemp = () => {

    if (!editMode || isLocked) return;
    setStavke(
      stavke.map((s) =>
        s.id === editMode.id ? { ...editMode, ukupno: editMode.kolicina * editMode.cijena } : s
      )
    );
    setEditMode(null);
  };

  const handleCancelAll = () => {
    setStavke(originalStavke.map((s) => ({ ...s })));
    setStatus(narudzba.status);
    setDatumIsporuke(narudzba.termin_isporuke || '');
    onClose();
  };



const handleSaveChanges = async (finalStatus?: string) => {
  if (!narudzba?.id) return;
  const newStatus = finalStatus || status;

  try {
    const validne = stavke.filter((s) => s.kolicina > 0);

    if (validne.length === 0) {
      await supabase.from('narudzbe').delete().eq('id', narudzba.id);
      toast.success('Narudžba obrisana jer nema stavki');
      router.push('/narudzbe');
      onClose();
      onSuccess();
      return;
    }
    if (finalStatus === 'NARUČENA' && !terminIsporuke) {
      toast.error('Ne možete naručiti narudžbu bez definisanog termina isporuke!');
      return; // prekid funkcije, ništa se ne šalje
    }
    
    const { error: statusErr } = await supabase
      .from('narudzbe')
       .update({
         status: newStatus,
         termin_isporuke: terminIsporuke ? terminIsporuke.format('YYYY-MM-DD HH:mm:ss') : null,


       })
      .eq('id', narudzba.id);

    if (statusErr) throw statusErr;

    if (newStatus === 'NARUČENA') {
      for (const s of stavke) {
        // 1. Dohvati trenutnu količinu
        const { data: proizvodData, error: getErr } = await supabase
          .from('proizvodi')
          .select('kolicina')
          .eq('id', s.proizvod_id)
          .single();
    
        if (getErr) throw getErr;
    
        const novaKolicina = (proizvodData.kolicina || 0) - s.kolicina;
    
        // 2. Update sa novom količinom
        const { error: updateErr } = await supabase
          .from('proizvodi')
          .update({ kolicina: novaKolicina })
          .eq('id', s.proizvod_id);
    
        if (updateErr) throw updateErr;
      }
    }
    
    if (newStatus === 'NARUČENA') {
      for (const s of stavke) {
        
        const { data: proizvodData, error: getErr } = await supabase
          .from('proizvodi')
          .select('kolicina')
          .eq('id', s.proizvod_id)
          .single();
    
        if (getErr) throw getErr;
    
        const novaKolicina = (proizvodData.kolicina || 0) - s.kolicina;
    
        // 2. Update sa novom količinom
        const { error: updateErr } = await supabase
          .from('proizvodi')
          .update({ kolicina: novaKolicina })
          .eq('id', s.proizvod_id);
    
        if (updateErr) throw updateErr;
      }
    }     


    if (newStatus === 'OTKAZANA' && status !== 'KREIRANA') {
      for (const s of stavke) {
        // 1. Dohvati trenutnu količinu
        const { data: proizvodData, error: getErr } = await supabase
          .from('proizvodi')
          .select('kolicina')
          .eq('id', s.proizvod_id)
          .single();
    
        if (getErr) throw getErr;
    
        const novaKolicina = (proizvodData.kolicina || 0) + s.kolicina;
    
        // 2. Update sa novom količinom
        const { error: updateErr } = await supabase
          .from('proizvodi')
          .update({ kolicina: novaKolicina })
          .eq('id', s.proizvod_id);
    
        if (updateErr) throw updateErr;
      }
    } 

    if (!isLocked || newStatus === 'KREIRANA' || newStatus === 'OTKAZANA') {
      const obrisane = originalStavke.filter((s) => !validne.find((x) => x.id === s.id));
      for (const s of obrisane) {
        await supabase.from('stavke_narudzbe').delete().eq('id', s.id);
      }

      const nove = validne.filter((s) => s.temp);
      for (const s of nove) {
        await supabase.from('stavke_narudzbe').insert({
          narudzba_id: narudzba.id,
          proizvod_id: s.proizvod_id,
          kolicina: s.kolicina,
          cijena_po_komadu: s.cijena,
        });
      }

      const izmijenjene = validne.filter(
        (s) =>
          !s.temp &&
          originalStavke.find(
            (x) => x.id === s.id && (x.kolicina !== s.kolicina || x.proizvod_id !== s.proizvod_id)
          )
      );
      for (const s of izmijenjene) {
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

    toast.success('Narudžba uspješno ažurirana');
    onSuccess();
    onClose();
    router.push('/narudzbe');
  } catch (err) {
    toast.error('Greška pri spremanju promjena');
    console.error(err);
  }
};


  useEffect(() => {
    setUkupno(stavke.reduce((sum, s) => sum + s.ukupno, 0));
  }, [stavke]);

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
  
      // 🔄 Provjeri da li je termin zauzet u međuvremenu
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
          n.id !== narudzba.id
      );
  
      if (zauzet) {
        setTerminError('Taj termin je sada zauzet. Odaberite drugi.');
        return;
      }
  
      setTerminError('');
    };
  
    checkTermin();
  }, [terminIsporuke]);
  







  return (
    <Dialog open={open} onClose={handleCancelAll} maxWidth="md" fullWidth>
      <DialogTitle>Uredi narudžbu #{narudzba?.id}</DialogTitle>
      <DialogContent>
        {/* ---- MODERNI, RAVNI STATUS BLOK ---- */}



        {/* ---- TERMIN ISPORUKE ---- */}
        {/* Novi DateTimePicker za izmjenu termina isporuke */}
<LocalizationProvider dateAdapter={AdapterDayjs}>

  {/* ---- MODERNI, RAVNI STATUS BLOK ---- */}
<Box
  sx={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1.2,
    backgroundColor: '#f9f9f9',
    px: 2.2,
    py: 1,
    borderRadius: 2,
    border: '1px solid #e0e0e0',
    mb: 3,
  }}
>
  <Typography
    variant="subtitle2"
    sx={{
      fontWeight: 600,
      letterSpacing: 0.3,
      color: 'text.secondary',
    }}
  >
    Status:
  </Typography>
  {getStatusChip(status)}
</Box>

<DateTimePicker
  label="Termin isporuke"
  value={terminIsporuke}
  onChange={async (newValue) => {
    // Dozvoli promjenu samo ako je status KREIRANA
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
  sx={{ width: '100%', mt: 3 }}
  disabled={status !== 'KREIRANA' && status !== 'OTKAZANA' } // 🔹 Ovdje je ključ — disable ako nije KREIRANA
/>
{terminError && (
  <FormHelperText error sx={{ mt: 1 }}>
    {terminError}
  </FormHelperText>
)}



<FormHelperText>
Dostava moguća od 08:00 do 19:00 sati.
</FormHelperText>
</LocalizationProvider>

        {/* ---- STATUS DUGMAD ---- */}
        <Box sx={{ mb: 3 }}>




<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
  {/* Dugmad za akcije */}
  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    <Button
      variant="contained"
      color="info"
      onClick={() => handleSaveChanges('NARUČENA')}
      disabled={nemaStavki || isLocked || (status !== 'KREIRANA' && status !== 'OTKAZANA') ||  !!terminError}
    >
      Naruči
    </Button>

    <Button
      variant="contained"
      color="success"
      onClick={() => handleSaveChanges('PREUZETA')}
      disabled={status !== 'ISPORUCENA' && status !== 'NA_ADRESI'}
    >
      Preuzeta
    </Button>

    <Button
      variant="outlined"
      color="error"
      onClick={() => handleSaveChanges('OTKAZANA')}
      disabled={status !== 'KREIRANA' && status !== 'U_OBRADI' && status !== 'NARUČENA'}
    >
      Otkaži
    </Button>

    {user?.uloga === 'ADMIN' && (
      <>
        <Button
          variant="contained"
          color="warning"
          onClick={() => handleSaveChanges('U_OBRADI')}
          disabled={status !== 'NARUČENA'}
        >
          U obradi
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={() => handleSaveChanges('ISPORUCENA')}
          disabled={status !== 'U_OBRADI' && status !== 'NA_ADRESI'}
        >
          Isporuči (iz radnje)
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSaveChanges('NA_ADRESI')}
          disabled={status !== 'ISPORUCENA'}
        >
          Na adresi
        </Button>
      </>
    )}
  </Box>
  
  {/* Helper text ispod svih dugmadi */}
  {nemaStavki && (
    <FormHelperText error sx={{ mt: 1 }}>
      Ne možete naručiti bez ijedne stavke.
    </FormHelperText>
  )}
</Box>

        </Box>

        <Divider sx={{ my: 2 }} />

        {/* ---- STAVKE ---- */}
        {!isLocked && (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mt: 2 }}>
    <Autocomplete
      options={proizvodi}
      getOptionLabel={(option) => option.naziv}
      value={odabraniProizvod}
      onChange={(_, val) => setOdabraniProizvod(val)}
      sx={{ flex: 2 }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Proizvod"
          helperText={!odabraniProizvod ? 'Odaberite proizvod za dodavanje' : ''}
        />
      )}
    />

<TextField
  type="number"
  label="Količina"
  value={kolicina}
  onChange={(e) => setKolicina(Number(e.target.value))}
  sx={{ width: 120 }}
  InputProps={{ inputProps: { min: 0 } }}
  error={kolicina < 1}
  helperText={kolicina < 1 ? 'Količina mora biti najmanje 1' : ''}
/>


    <Tooltip title="Dodaj proizvod u narudžbu">
      <Button
        variant="contained"
        onClick={handleAddStavkaTemp}
        disabled={!odabraniProizvod || kolicina < 1}
        sx={{ height: 56 }}
      >
        <AddIcon />
      </Button>
    </Tooltip>
  </Box>
)}


        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Proizvod</TableCell>
                <TableCell>Količina</TableCell>
                <TableCell>Cijena po komadu</TableCell>
                <TableCell>Ukupno</TableCell>
                {!isLocked && <TableCell align="center">Akcije</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {stavke.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.naziv}</TableCell>
                  <TableCell>{s.kolicina}</TableCell>
                  <TableCell>{s.cijena.toFixed(2)}</TableCell>
                  <TableCell>{s.ukupno.toFixed(2)}</TableCell>
                  {!isLocked && (
                    <TableCell align="center">
                      <Tooltip title="Uredi stavku">
  <span>
    <Button
      size="small"
      onClick={() => setEditMode({ ...s })}
      sx={{ minWidth: 30 }}
      disabled={isLocked}
    >
      <EditIcon fontSize="small" />
    </Button>
  </span>
</Tooltip>

<Tooltip title="Obriši stavku">
  <span>
    <Button
      size="small"
      color="error"
      onClick={() => handleDeleteTemp(s.id)}
      sx={{ minWidth: 30 }}
      disabled={isLocked}
    >
      <DeleteIcon fontSize="small" />
    </Button>
  </span>
</Tooltip>

                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
        {stavke.length === 0 && (
  <FormHelperText error sx={{ mt: 1 }}>
    Ne možete sačuvati narudžbu bez ijedne stavke.
  </FormHelperText>
)}

        {/* Uredi stavku dijalog */}
        {editMode && (
          <Dialog open={!!editMode} onClose={() => setEditMode(null)}>
            <DialogTitle>Uredi stavku</DialogTitle>
            <DialogContent>
              <Autocomplete
                options={proizvodi}
                getOptionLabel={(option) => option.naziv}
                value={proizvodi.find((p) => p.id === editMode.proizvod_id) || null}
                onChange={(_, val) =>
                  setEditMode((prev: any) => ({
                    ...prev,
                    proizvod_id: val?.id,
                    naziv: val?.naziv,
                    cijena: val?.cijena_po_komadu,
                  }))
                }
                renderInput={(params) => <TextField {...params} label="Proizvod" />}
                sx={{ mt: 1 }}
              />
              <TextField
  type="number"
  label="Količina"
  value={editMode.kolicina}
  onChange={(e) =>
    setEditMode((prev: any) => ({ ...prev, kolicina: Number(e.target.value) }))
  }
  fullWidth
  sx={{ mt: 2 }}
  error={editMode.kolicina < 1}
  helperText={editMode.kolicina < 1 ? 'Količina mora biti najmanje 1' : ''}
/>

            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditMode(null)}>Odustani</Button>
              <Button
  variant="contained"
  onClick={handleEditStavkaTemp}
  disabled={editMode.kolicina < 1}
>
  Sačuvaj
</Button>

            </DialogActions>
          </Dialog>
        )}
      </DialogContent>
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

      <DialogActions>
        <Button onClick={handleCancelAll}>Zatvori</Button>
        {(status === 'KREIRANA' || status === 'OTKAZANA' ) && (
          <Button variant="contained" onClick={() => handleSaveChanges()  }disabled={stavke.length === 0 || !!terminError}>
            Sačuvaj promjene
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
