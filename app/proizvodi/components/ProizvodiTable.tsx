'use client';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Box,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Paper,
  Tooltip,
  Snackbar,
  Alert,
  TextField,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Chip } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
type ProizvodiTableProps = {
  proizvodi: any[];
  onChange: () => void;
  loading: boolean;
  onEdit: (row: any) => void;
  userRole?: string;
};

export default function ProizvodiTable({
  proizvodi,
  onChange,
  loading,
  onEdit,
  userRole,
}: ProizvodiTableProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [filterNaziv, setFilterNaziv] = useState('');
  const [filterCijena, setFilterCijena] = useState<number | null>(null);
  const [filterKolicina, setFilterKolicina] = useState<number | null>(null);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
// prije DataGrid-a


// u kolonama

  const handleDelete = async () => {
    if (!confirmDelete) return;

    const { error } = await supabase.from('proizvodi').delete().eq('id', confirmDelete.id);

    if (error) {
      console.error('Greška pri brisanju proizvoda:', error);
      toast.error('Greška pri brisanju proizvoda');
    } else {
      toast.success('Proizvod obrisan');
      onChange();
    }

    setConfirmDelete(null);
  };

  const handleDodajUNarudzbu = async (proizvod: any) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setSnackbar({ open: true, message: 'Nema korisnika', severity: 'error' });
      return;
    }
    const user = JSON.parse(storedUser);

    try {
      let { data: narudzba } = await supabase
        .from('narudzbe')
        .select('*')
        .eq('korisnik_id', user.id)
        .eq('status', 'KREIRANA')
        .single();

      let narudzbaId = narudzba?.id;

      if (!narudzbaId) {
        // 🔹 Dohvati sve zauzete termine
        const { data: zauzeti, error: zauzetiErr } = await supabase
          .from('narudzbe')
          .select('termin_isporuke')
          .not('termin_isporuke', 'is', null)
          .in('status', ['KREIRANA', 'NARUČENA', 'ISPORUCENA']);
      
        if (zauzetiErr) throw zauzetiErr;
      
        const zauzetiTermini = zauzeti?.map((n) => dayjs(n.termin_isporuke)) || [];
      
        // 🔹 Počni od sutra u 08:00
        let termin = dayjs().add(1, 'day').hour(8).minute(0).second(0);
      
        // 🔹 Nađi prvi slobodan termin (svakih 30 minuta do 19h)
        while (zauzetiTermini.some((z) => z.isSame(termin, 'minute')) && termin.hour() < 19) {
          termin = termin.add(30, 'minute');
        }
      
        // 🔹 Ako nema slobodnog termina sutra
        if (termin.hour() >= 19) {
          toast.error('Nema slobodnih termina sutra između 08:00 i 19:00');
          return;
        }
      
        // 🔹 Kreiraj novu narudžbu sa tim terminom
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
      
      

      const { error: stavkaErr } = await supabase.from('stavke_narudzbe').insert([
        {
          narudzba_id: narudzbaId,
          proizvod_id: proizvod.id,
          kolicina: 1,
          cijena_po_komadu: proizvod.akcijska_cijena ?? proizvod.cijena_po_komadu,

        },
      ]);

      if (stavkaErr) throw stavkaErr;
      toast.success(`Proizvod "${proizvod.naziv}" je uspješno dodat u korpu`);
      onChange();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Greška pri dodavanju proizvoda u narudžbu', severity: 'error' });
    }
  };

  // Filtriranje proizvoda
  const filteredProizvodi = proizvodi.filter((p) => {
    const nazivMatch = p.naziv.toLowerCase().includes(filterNaziv.toLowerCase());

    const efektivnaCijena = p.akcijska_cijena ?? p.cijena_po_komadu;
const cijenaMatch = filterCijena === null || efektivnaCijena <= filterCijena;

    const kolicinaMatch =
      userRole === 'ADMIN' ? filterKolicina === null || p.kolicina <= filterKolicina : true;
    return nazivMatch && cijenaMatch && kolicinaMatch;
  });

  const adminColumns: GridColDef[] = [
    { field: 'sifra', headerName: 'Šifra', flex: 1, align: 'left', headerAlign: 'left', sortable: true },
    { field: 'naziv', headerName: 'Naziv', flex: 2, align: 'left', headerAlign: 'left', sortable: true },
    {
      field: 'kolicina',
      headerName: 'Količina',
      flex: 1,
      align: 'right',
      headerAlign: 'right',
      type: 'number',
      sortable: true,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 0 ? 'error' : params.value < 5 ? 'warning' : 'success'}
          size="small"
        />
      ),

      

    },
    {
      field: 'cijena_po_komadu',
      headerName: 'Cijena (KM)',
      flex: 1.3,
      align: 'right',
      headerAlign: 'right',
      sortable: true,
      

      renderCell: (params) => (
        params.row.akcijska_cijena ? (
          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant="body2"
              sx={{ textDecoration: 'line-through', color: '#888' }}
            >
              {params.row.cijena_po_komadu} 
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#d32f2f', fontWeight: 700 }}
            >
              {params.row.akcijska_cijena} 
            </Typography>
          </Box>
        ) : (
          <Typography variant="body1">{params.row.cijena_po_komadu} </Typography>
        )
      ),
    },
    
    {
      field: 'actions',
      headerName: 'Akcije',
      flex: 1.5,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Tooltip title="Uredi proizvod">
            <IconButton
              color="primary"
              size="small"
              onClick={() => onEdit(params.row)}
              sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' }, borderRadius: 2 }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Obriši proizvod">
            <IconButton
              color="error"
              size="small"
              onClick={() => setConfirmDelete(params.row)}
              sx={{ bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' }, borderRadius: 2 }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Detalji proizvoda">
            <IconButton
              color="info"
              size="small"
              onClick={() => router.push(`/proizvodi/${params.row.id}`)}
              sx={{ bgcolor: '#e1f5fe', '&:hover': { bgcolor: '#b3e5fc' }, borderRadius: 2 }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Dodaj u narudžbu">
            <IconButton
              color="success"
              size="small"
              onClick={() => handleDodajUNarudzbu(params.row)}
              sx={{ bgcolor: '#e8f5e9', '&:hover': { bgcolor: '#c8e6c9' }, borderRadius: 2 }}
            >
              <AddShoppingCartIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const userColumns: GridColDef[] = [
    { field: 'naziv', headerName: 'Naziv', flex: 2, align: 'left', headerAlign: 'left', sortable: true },
    {
      field: 'cijena_po_komadu',
      headerName: 'Cijena (KM)',
      flex: 1.3,
      align: 'right',
      headerAlign: 'right',
      sortable: true,
      
      renderCell: (params) => (
        params.row.akcijska_cijena ? (
          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant="body2"
              sx={{ textDecoration: 'line-through', color: '#888' }}
            >
              {params.row.cijena_po_komadu} 
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#d32f2f', fontWeight: 700 }}
            >
              {params.row.akcijska_cijena} 
            </Typography>
          </Box>
        ) : (
          <Typography variant="body1">{params.row.cijena_po_komadu} </Typography>
        )
      ),
    },
    
    
    {
      field: 'actions',
      headerName: 'Akcije',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Tooltip title="Detalji proizvoda">
            <IconButton
              color="info"
              size="small"
              onClick={() => router.push(`/proizvodi/${params.row.id}`)}
              sx={{ bgcolor: '#e1f5fe', '&:hover': { bgcolor: '#b3e5fc' }, borderRadius: 2 }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Dodaj u narudžbu">
            <IconButton
              color="success"
              size="small"
              onClick={() => handleDodajUNarudzbu(params.row)}
              sx={{ bgcolor: '#e8f5e9', '&:hover': { bgcolor: '#c8e6c9' }, borderRadius: 2 }}
            >
              <AddShoppingCartIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );

  const columns = userRole === 'ADMIN' ? adminColumns : userColumns;

  return (
    <>
      <Paper
        elevation={4}
        sx={{
          p: 3,
          borderRadius: 4,
          bgcolor: '#fafafa',
          boxShadow: '0px 3px 10px rgba(0,0,0,0.1)',
        }}
      >
        {/* Filteri */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Pretraži naziv"
            value={filterNaziv}
            onChange={(e) => setFilterNaziv(e.target.value)}
            size="small"
          />
          <TextField
            label="Max cijena"
            type="number"
            value={filterCijena ?? ''}
            onChange={(e) => setFilterCijena(e.target.value ? Number(e.target.value) : null)}
            size="small"
          />
          {userRole === 'ADMIN' && (
            <TextField
              label="Max količina"
              type="number"
              value={filterKolicina ?? ''}
              onChange={(e) => setFilterKolicina(e.target.value ? Number(e.target.value) : null)}
              size="small"
            />
          )}
        </Box>

        <Box
          sx={{
            height: 440,
            width: '100%',
            overflowX: userRole === 'ADMIN' ? 'auto' : 'hidden',
            '& .MuiDataGrid-root': {
              bgcolor: 'white',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              minWidth: userRole === 'ADMIN' ? '900px' : '100%',
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f9f9f9',
              fontWeight: 600,
              borderBottom: '1px solid #ddd',
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: '#f1f8e9',
            },
          }}
        >
          <DataGrid
            rows={filteredProizvodi}
            columns={columns}
            getRowId={(r) => r.id}
            pageSizeOptions={[5, 10, 20]}
            autoHeight={false}
          />
        </Box>
      </Paper>

      {/* Potvrda brisanja */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Potvrda brisanja</DialogTitle>
        <DialogContent>
          <Typography>
            Da li ste sigurni da želite obrisati proizvod "<b>{confirmDelete?.naziv}</b>"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirmDelete(null)}>
            Odustani
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Obriši
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar poruke */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
