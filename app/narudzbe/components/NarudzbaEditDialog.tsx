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
      .select('*, proizvodi (naziv)')
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
      cijena: s.cijena_po_komadu,
      ukupno: s.kolicina * s.cijena_po_komadu,
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
      cijena: odabraniProizvod.cijena_po_komadu,
      ukupno: odabraniProizvod.cijena_po_komadu * kolicina,
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
      router.push('/proizvodi');
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
    router.push('/proizvodi');
  } catch (err) {
    toast.error('Greška pri spremanju promjena');
    console.error(err);
  }
};


  useEffect(() => {
    setUkupno(stavke.reduce((sum, s) => sum + s.ukupno, 0));
  }, [stavke]);

  return (
    <Dialog open={open} onClose={handleCancelAll} maxWidth="md" fullWidth>
      <DialogTitle>Uredi narudžbu #{narudzba?.id}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Ukupno: <b>{ukupno.toFixed(2)} KM</b>
        </Typography>

        {/* ---- TERMIN ISPORUKE ---- */}
        {/* Novi DateTimePicker za izmjenu termina isporuke */}
<LocalizationProvider dateAdapter={AdapterDayjs}>
<DateTimePicker
  label="Termin isporuke"
  value={terminIsporuke}
  onChange={async (newValue) => {
    // Dozvoli promjenu samo ako je status KREIRANA
    if (status !== 'KREIRANA') return;
    if (!newValue) return;

    const sat = newValue.hour();
    const sada = dayjs();

    if (newValue.isBefore(sada)) {
      toast.error('Ne možete odabrati termin u prošlosti.');
      return;
    }

    if (sat < 8 || sat >= 19) {
      toast.error('Termin isporuke mora biti između 08:00 i 19:00.');
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
  disabled={status !== 'KREIRANA'} // 🔹 Ovdje je ključ — disable ako nije KREIRANA
/>

</LocalizationProvider>

        {/* ---- STATUS DUGMAD ---- */}
        <Box sx={{ mb: 3 }}>
          <Typography>
            Status narudžbe: <b>{status}</b>
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="info"
              onClick={() => handleSaveChanges('NARUČENA')}
              disabled={status !== 'KREIRANA'&&status !== 'OTKAZANA' }
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
              disabled={status !== 'KREIRANA'&& status !== 'U_OBRADI' && status !== 'NARUČENA'}
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
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* ---- STAVKE ---- */}
        {!isLocked && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
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
            />
            <Button variant="contained" onClick={handleAddStavkaTemp}>
              <AddIcon fontSize="small" />
            </Button>
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
                      <Button
                        size="small"
                        onClick={() => setEditMode({ ...s })}
                        sx={{ minWidth: 30 }}
                      >
                        <EditIcon fontSize="small" />
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDeleteTemp(s.id)}
                        sx={{ minWidth: 30 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

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
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditMode(null)}>Odustani</Button>
              <Button variant="contained" onClick={handleEditStavkaTemp}>
                Sačuvaj 
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancelAll}>Zatvori</Button>
        {(status === 'KREIRANA' || status === 'OTKAZANA' ) && (
          <Button variant="contained" onClick={() => handleSaveChanges()}>
            Sačuvaj promjene
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
