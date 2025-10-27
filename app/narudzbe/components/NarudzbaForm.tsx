'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { Tooltip } from '@mui/material';

import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

type Proizvod = {
  id: string;
  naziv: string;
  cijena_po_komadu: number;
  kolicina: number;
  akcijska_cijena:number;
};

type Stavka = {
  id?: string;
  proizvodId: string;
  naziv: string;
  cijena: number;
  kolicina: number;
  ukupno: number;
};

export default function NarudzbaForm({ onSuccess , onClose, existingNarudzba }: any) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [proizvodi, setProizvodi] = useState<Proizvod[]>([]);
  const [stavke, setStavke] = useState<Stavka[]>([]);
  const [odabraniProizvod, setOdabraniProizvod] = useState<Proizvod | null>(null);
  const [kolicina, setKolicina] = useState<number>(1);
  const [aktivnaNarudzba, setAktivnaNarudzba] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [stavkaZaEdit, setStavkaZaEdit] = useState<Stavka | null>(null);
  const [novaKolicina, setNovaKolicina] = useState<number>(1);
  const [noviProizvod, setNoviProizvod] = useState<Proizvod | null>(null);
  const [terminIsporuke, setTerminIsporuke] = useState<dayjs.Dayjs | null>(null);

  const ukupnaCijena = stavke.reduce((acc, s) => acc + s.ukupno, 0);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (existingNarudzba) setAktivnaNarudzba(existingNarudzba);

    const u = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(u);

    const fetchData = async () => {
      const { data: proizvodiData, error: proizvodiError } = await supabase
        .from('proizvodi')
        .select('*');
      if (proizvodiError) toast.error('Greška pri učitavanju proizvoda');
      else setProizvodi(proizvodiData);

      if (u) {
        const { data: aktivna, error: narudzbaErr } = await supabase
          .from('narudzbe')
          .select('*')
          .eq('korisnik_id', u.id)
          .eq('status', 'KREIRANA')
          .single();

        if (!narudzbaErr && aktivna) {
          setAktivnaNarudzba(aktivna);

          const { data: stavkeData } = await supabase
            .from('stavke_narudzbe')
            .select('id, proizvod_id, kolicina, cijena_po_komadu, proizvodi (naziv, akcijska_cijena)')
            .eq('narudzba_id', aktivna.id);

          if (stavkeData) {
            setStavke(
              stavkeData.map((s: any) => ({
                id: s.id,
                proizvodId: s.proizvod_id,
                naziv: s.proizvodi?.naziv || '',
               


                cijena: s.akcijska_cijena && s.akcijska_cijena !== 0 ? s.akcijska_cijena : s.cijena_po_komadu,

                kolicina: s.kolicina,
                ukupno: (s.akcijska_cijena && s.akcijska_cijena !== 0 ? s.akcijska_cijena : s.cijena_po_komadu) * s.kolicina,
              }))
            );
          }
        }
      }
    };

    fetchData();
  }, [existingNarudzba]);

useEffect(() => {
  

  const setDefaultTermin = async () => {
    const sutra = dayjs().add(1, 'day').hour(8).minute(0).second(0);
    let termin = sutra;

    const { data: zauzeti } = await supabase
      .from('narudzbe')
      .select('termin_isporuke')
      .not('termin_isporuke', 'is', null)
      .in('status', ['KREIRANA', 'NARUČENA', 'ISPORUCENA']);

    const zauzetiTermini = zauzeti?.map((n) => dayjs(n.termin_isporuke)) || [];

    // Traži prvi slobodan termin između 8 i 19
    while (zauzetiTermini.some((z) => z.isSame(termin, 'minute')) && termin.hour() < 19) {
      termin = termin.add(30, 'minute');
    }

    if (termin.hour() >= 19) {
      toast.error('Nema slobodnih termina sutra od 08:00 do 19:00');
      setTerminIsporuke(null);
    } else {
      setTerminIsporuke(termin);
    }
  };

  setDefaultTermin();
}, [existingNarudzba]);


useEffect(() => {
  const setDefaultTermin = async () => {
    const sutra = dayjs().add(1, 'day').hour(8).minute(0).second(0);
    let termin = sutra;

    const { data: zauzeti } = await supabase
      .from('narudzbe')
      .select('termin_isporuke')
      .not('termin_isporuke', 'is', null)
      .in('status', ['KREIRANA', 'NARUČENA', 'ISPORUCENA']);

    const zauzetiTermini = zauzeti?.map((n) => dayjs(n.termin_isporuke)) || [];

    while (zauzetiTermini.some((z) => z.isSame(termin, 'minute')) && termin.hour() < 19) {
      termin = termin.add(30, 'minute');
    }

    if (termin.hour() >= 19) {
      toast.error('Nema slobodnih termina sutra između 08:00 i 19:00');
      setTerminIsporuke(null);
    } else {
      setTerminIsporuke(termin);
    }
  };

  setDefaultTermin();
}, [existingNarudzba]);




  
  const dodajStavku = async () => {
    if (!odabraniProizvod) return toast.error('Odaberite proizvod');
    if (kolicina <= 0) return toast.error('Količina mora biti veća od 0');
    if (!user) return toast.error('Nema korisnika');

    let narudzbaId = aktivnaNarudzba?.id;

    try {
      if (!aktivnaNarudzba) {
        const { data: nova, error: novaErr } = await supabase
          .from('narudzbe')
          .insert([
            {
              korisnik_id: user.id,
              kupac: user.ime,
              adresa_isporuke: user.adresa,
              status: 'KREIRANA',
              datum_kreiranja: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (novaErr) throw novaErr;
        setAktivnaNarudzba(nova);
        narudzbaId = nova.id;
      }

      const { data: novaStavkaData, error: stavkaErr } = await supabase
  .from('stavke_narudzbe')
  .insert([
    {
      narudzba_id: narudzbaId,
      proizvod_id: odabraniProizvod.id,
      kolicina,
      cijena_po_komadu: odabraniProizvod.akcijska_cijena && odabraniProizvod.akcijska_cijena !== 0 
                         ? odabraniProizvod.akcijska_cijena 
                         : odabraniProizvod.cijena_po_komadu,
      
    },
  ])
  .select()
  .single();

if (stavkaErr) throw stavkaErr;

const novaStavka: Stavka = {
  id: novaStavkaData.id,
  proizvodId: odabraniProizvod.id,
  naziv: odabraniProizvod.naziv,
  cijena: odabraniProizvod.akcijska_cijena && odabraniProizvod.akcijska_cijena !== 0 
           ? odabraniProizvod.akcijska_cijena 
           : odabraniProizvod.cijena_po_komadu,
  kolicina,
  ukupno: (odabraniProizvod.akcijska_cijena && odabraniProizvod.akcijska_cijena !== 0 
           ? odabraniProizvod.akcijska_cijena 
           : odabraniProizvod.cijena_po_komadu) * kolicina,
};


      setStavke([...stavke, novaStavka]);
      setOdabraniProizvod(null);
      setKolicina(1);
      toast.success('Stavka dodana u narudžbu');
    } catch {
      toast.error('Greška pri dodavanju stavke');
    }
  };

  const zatvoriFormu = () => router.push('/narudzbe');

  const spremiNarudzbu = async () => {
    if (!aktivnaNarudzba) return toast.error('Nema aktivne narudžbe');
  
    try {
      const { data, error } = await supabase
        .from('narudzbe')
        .update({
          status: 'KREIRANA',
          termin_isporuke: terminIsporuke ? terminIsporuke.format('YYYY-MM-DD HH:mm:ss') : null,
        })
        .eq('id', aktivnaNarudzba.id);
  
      if (error) {
        console.error('Supabase error:', error);
        toast.error('Greška pri spremanju narudžbe: ' + error.message);
        return;
      }
  
      console.log('Uspješno spremljeno:', data);
      toast.success('Narudžba spremljena!');
      onSuccess();
      onClose();
      router.push('/narudzbe');
    } catch (err) {
      console.error('Runtime error:', err);
      toast.error('Greška pri spremanju narudžbe (runtime)');
    }
  };
  

  const posaljiNarudzbu = async () => {
    if (!aktivnaNarudzba) return toast.error('Nema aktivne narudžbe');
    if (!terminIsporuke) return toast.error('Odaberite termin isporuke prije slanja!');
    const sat = terminIsporuke.hour();
    if (sat < 8 || sat >= 19) {
      return toast.error('Termin isporuke mora biti od 08:00 do 19:00.');
    }

    const { data: zauzeti } = await supabase
      .from('narudzbe')
      .select('termin_isporuke')
      .not('termin_isporuke', 'is', null)
      .in('status', ['KREIRANA', 'NARUČENA', 'ISPORUCENA']);

    if (zauzeti?.some((n) => dayjs(n.termin_isporuke).isSame(terminIsporuke, 'minute'))) {
      return toast.error('Odabrani termin je već zauzet!');
    }

    try {
      for (const s of stavke) {
        const { data: p, error: pErr } = await supabase
          .from('proizvodi')
          .select('kolicina')
          .eq('id', s.proizvodId)
          .single();
  
        if (pErr) throw pErr;
        if (!p || p.kolicina < s.kolicina)
          return toast.error(`Nema dovoljno proizvoda: ${s.naziv}`);
  
        await supabase
          .from('proizvodi')
          .update({ kolicina: p.kolicina - s.kolicina })
          .eq('id', s.proizvodId);
      }

      await supabase
        .from('narudzbe')
        .update({
          status: 'NARUČENA',
          termin_isporuke: terminIsporuke.format('YYYY-MM-DD HH:mm:ss'),
        })
        .eq('id', aktivnaNarudzba.id);

      toast.success('Narudžba poslana!');
      setAktivnaNarudzba(null);
      setStavke([]);
      onSuccess();
      onClose();
      router.push('/narudzbe');
    } catch {
      toast.error('Greška pri slanju narudžbe');
    }
  };

  const ponistiNarudzbu = async () => {
    if (!aktivnaNarudzba) {
      onSuccess();
      onClose();
      router.push('/narudzbe');
      return;
    }
    try {
      await supabase.from('stavke_narudzbe').delete().eq('narudzba_id', aktivnaNarudzba.id);
      await supabase.from('narudzbe').delete().eq('id', aktivnaNarudzba.id);
      toast.success('Narudžba poništena!');
      setAktivnaNarudzba(null);
      setStavke([]);
      zatvoriFormu();
    } catch {
      toast.error('Greška pri poništavanju narudžbe');
    }
  };

  const obrisiStavku = async (stavka: Stavka) => {
    if (!aktivnaNarudzba) return;
    try {
      if (stavka.id) await supabase.from('stavke_narudzbe').delete().eq('id', stavka.id);
      setStavke(stavke.filter((s) => s.proizvodId !== stavka.proizvodId));
      toast.success('Stavka obrisana');
    } catch {
      toast.error('Greška pri brisanju stavke');
    }
  };

  const handleEdit = (stavka: Stavka) => {
    setStavkaZaEdit(stavka);
    setNoviProizvod(proizvodi.find((p) => p.id === stavka.proizvodId) || null);
    setNovaKolicina(stavka.kolicina);
    setEditOpen(true);
  };

  const sacuvajEdit = async () => {
    if (!stavkaZaEdit || !noviProizvod) return;
    try {
      if (stavkaZaEdit.id)
        await supabase
          .from('stavke_narudzbe')
          .update({
            proizvod_id: noviProizvod.id,
            kolicina: novaKolicina,
            cijena_po_komadu: noviProizvod.akcijska_cijena && noviProizvod.akcijska_cijena !== 0 
                         ? noviProizvod.akcijska_cijena 
                         : noviProizvod.cijena_po_komadu,    // <-- dodaj ovo
          })
          .eq('id', stavkaZaEdit.id);

          setStavke(
            stavke.map((s) =>
              s.id === stavkaZaEdit.id
                ? {
                    ...s,
                    proizvodId: noviProizvod.id,
                    naziv: noviProizvod.naziv,
                    kolicina: novaKolicina,
                    cijena: noviProizvod.akcijska_cijena && noviProizvod.akcijska_cijena !== 0 
                  ? noviProizvod.akcijska_cijena 
                  : noviProizvod.cijena_po_komadu,
          ukupno: (noviProizvod.akcijska_cijena && noviProizvod.akcijska_cijena !== 0 
                  ? noviProizvod.akcijska_cijena 
                  : noviProizvod.cijena_po_komadu) * novaKolicina,
                  }
                : s
            )
          );
          
          if (novaKolicina < 1) {
            toast.error('Količina mora biti najmanje 1');
            return;
          }
          
      const { data: refreshed } = await supabase
      .from('stavke_narudzbe')
      .select('id, proizvod_id, kolicina, cijena_po_komadu, proizvodi (naziv, akcijska_cijena)')
      .eq('narudzba_id', aktivnaNarudzba.id);
      if (refreshed) {
        setStavke(
          refreshed.map((s: any) => ({
            id: s.id,
            proizvodId: s.proizvod_id,
            naziv: s.proizvodi?.naziv || '',
            cijena: s.akcijska_cijena && s.akcijska_cijena !== 0 
            ? s.akcijska_cijena 
            : s.cijena_po_komadu, // <-- ovdje je ključ
            kolicina: s.kolicina,
            ukupno: (s.akcijska_cijena && s.akcijska_cijena !== 0 ? s.akcijska_cijena : s.cijena_po_komadu) * s.kolicina,
          }))
        );
      }
      
      setEditOpen(false);
      toast.success('Stavka ažurirana');
    } catch {
      toast.error('Greška pri ažuriranju stavke');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      {/* Informacije o korisniku */}
      <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Informacije o korisniku</Typography>
          <Button
            color="error"
            onClick={() => {
              const potvrda = confirm('Želite li spremiti narudžbu prije izlaska?');
              if (potvrda) spremiNarudzbu();
              else ponistiNarudzbu();
            }}
          >
            ✕
          </Button>
        </Box>
        <TextField label="Ime korisnika" value={user?.ime || ''} InputProps={{ readOnly: true }} />
        <TextField label="Przime korisnika" value={user?.prezime || ''} InputProps={{ readOnly: true }} />
        <TextField
          label="Adresa isporuke"
          value={user?.adresa || ''}
          InputProps={{ readOnly: true }}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            label="Termin isporuke"
            value={terminIsporuke}
            onChange={async (newValue) => {
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
            slotProps={{
              textField: {
                helperText: 'Dostava moguća od 08:00 do 19:00 sati.',
              },
            }}
          />
        </LocalizationProvider>
      </Paper>

      {/* Dodavanje stavki */}
      {!aktivnaNarudzba || aktivnaNarudzba.status === 'KREIRANA' ? (
        <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
  InputProps={{ inputProps: { min: 0 } }} // dozvoli unos 0 radi greške
  error={kolicina < 1} // crveni border ako je < 1
  helperText={kolicina < 1 ? 'Količina mora biti najmanje 1' : ''} // isti tekst
/>

          <Tooltip title="Dodaj stavku u narudžbu">
  <span>
    <Button 
      variant="contained" 
      onClick={dodajStavku} 
      disabled={kolicina <= 0 || !odabraniProizvod}
    >
      +
    </Button>
  </span>
</Tooltip>

        </Paper>
      ) : null}

      {/* Tabela stavki */}
      {stavke.length > 0 && (
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Proizvod</TableCell>
                <TableCell>Količina</TableCell>
                <TableCell>Cijena po komadu</TableCell>
                <TableCell>Ukupno</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stavke.map((s, idx) => (
                <TableRow key={idx}>
                  <TableCell>{s.naziv}</TableCell>
                  <TableCell>{s.kolicina}</TableCell>
                  <TableCell>{s.cijena.toFixed(2)}</TableCell>
                  <TableCell>{s.ukupno.toFixed(2)}</TableCell>
                  <TableCell>
                  <Tooltip title="Uredi stavku">
  <Button size="small" onClick={() => handleEdit(s)}>
    <EditIcon fontSize="small" />
  </Button>
</Tooltip>
<Tooltip title="Obriši stavku">
  <Button size="small" color="error" onClick={() => obrisiStavku(s)}>
    <DeleteIcon fontSize="small" />
  </Button>
</Tooltip>

                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Divider sx={{ my: 1 }} />
         
        </Paper>
      )}
<Divider sx={{ my: 2 }} />

{/* UKUPNA CIJENA BLOK */}
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
    Ukupna cijena: {ukupnaCijena.toFixed(2)} KM
  </Typography>
</Box>

      {/* Dugmad akcija */}
      {aktivnaNarudzba && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
          <Button 
  variant="outlined" 
  color="warning" 
  onClick={spremiNarudzbu} 
  disabled={stavke.length === 0}
>
  Spremi narudžbu
</Button>
<Button 
  variant="contained" 
  onClick={posaljiNarudzbu} 
  disabled={stavke.length === 0}
>
  Naruči
</Button>

          <Button variant="outlined" color="error" onClick={ponistiNarudzbu}>
            Poništi
          </Button>
        </Box>
      )}

      {/* Dijalog za edit stavke */}
      {/* Dijalog za edit stavke */}
<Dialog open={editOpen} onClose={() => setEditOpen(false)}>
  <DialogTitle>Uredi stavku</DialogTitle>
  <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Autocomplete
      options={proizvodi}
      getOptionLabel={(option) => option.naziv}
      value={noviProizvod}
      onChange={(_, newVal) => setNoviProizvod(newVal)}
      renderInput={(params) => <TextField {...params} label="Proizvod" />}
    />

<TextField
  label="Količina"
  type="number"
  value={novaKolicina}
  onChange={(e) => {
    const val = Number(e.target.value);
    setNovaKolicina(val);
  }}
  InputProps={{ inputProps: { min: 0 } }} // dozvoli unos 0 da se može prikazati greška
  error={novaKolicina < 1} // crveni border ako je količina < 1
  helperText={novaKolicina < 1 ? 'Količina mora biti najmanje 1' : ''} // isti tekst kao u dodavanju
  sx={{ width: '100%' }}
/>

  </DialogContent>

  <DialogActions>
    <Button onClick={() => setEditOpen(false)}>Otkaži</Button>
    <Button
      variant="contained"
      onClick={sacuvajEdit}
      disabled={!noviProizvod || novaKolicina <= 0}
    >
      Sačuvaj
    </Button>
  </DialogActions>
</Dialog>

    </Box>
  );
}

