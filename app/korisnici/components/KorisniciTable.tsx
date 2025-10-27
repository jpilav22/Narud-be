'use client';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, IconButton, CircularProgress, Paper, Tooltip, Snackbar, Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

// Import forme za edit i dodavanje
import KorisniciEditForm from './KorisniciEditForm';
import KorisniciForm from './KorisniciForm';

type KorisniciTableProps = {
  loading: boolean;
};

export default function KorisniciTable({ loading }: KorisniciTableProps) {
  const router = useRouter();
  const [korisnici, setKorisnici] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const [selectedKorisnik, setSelectedKorisnik] = useState<any | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  const [filterIme, setFilterIme] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterAdresa, setFilterAdresa] = useState('');
  

  const fetchKorisnici = async () => {
    const { data, error } = await supabase.from('korisnici').select('*');
    if (error) {
      toast.error('Greška pri učitavanju korisnika');
      console.error(error);
    } else {
      setKorisnici(data || []);
    }
  };

  useEffect(() => {
    fetchKorisnici();
  }, []);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleDelete = async () => {
    if (!confirmDelete) return;
  
    const { error } = await supabase
      .from('korisnici')
      .delete()
      .eq('id', confirmDelete.id);
  
    if (error) {
      console.error('Greška pri brisanju korisnika:', error);
      toast.error('Greška pri brisanju korisnika');
      setSnackbar({
        open: true,
        message: 'Greška pri brisanju korisnika',
        severity: 'error',
      });
    } else {
      toast.success('Korisnik obrisan');
      setSnackbar({
        open: true,
        message: 'Korisnik uspješno obrisan',
        severity: 'success',
      });
      await fetchKorisnici();
    }
  
    setConfirmDelete(null);
  };
  
  
  

  const filteredKorisnici = korisnici.filter(k =>
    (`${k.ime} ${k.prezime}`).toLowerCase().includes(filterIme.toLowerCase())&&
    k.email.toLowerCase().includes(filterEmail.toLowerCase())&&
    k.adresa.toLowerCase().includes(filterAdresa.toLowerCase())

  );

  const columns: GridColDef[] = [
    { field: 'ime', headerName: 'Ime', flex: 1 },
    { field: 'prezime', headerName: 'Prezime', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1.5 },
    { field: 'telefon', headerName: 'Telefon', flex: 1 },
    { field: 'adresa', headerName: 'Adresa', flex: 1.5 },
    {
      field: 'actions',
      headerName: 'Akcije',
      flex: 1,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Tooltip title="Detalji korisnika">
            <IconButton
              color="info"
              size="small"
              onClick={() => router.push(`/korisnici/${params.row.id}`)}
              sx={{ bgcolor: '#e1f5fe', '&:hover': { bgcolor: '#b3e5fc' }, borderRadius: 2 }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Uredi korisnika">
            <IconButton
              color="primary"
              size="small"
              onClick={() => { setSelectedKorisnik(params.row); setOpenEdit(true); }}
              sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' }, borderRadius: 2 }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Obriši korisnika">
            <IconButton
              color="error"
              size="small"
              onClick={() => setConfirmDelete(params.row)}
              sx={{ bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' }, borderRadius: 2 }}
            >
              <Delete fontSize="small" />
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

  return (
    <>
      <Paper elevation={4} sx={{ p: 3, borderRadius: 4, bgcolor: '#fafafa', boxShadow: '0px 3px 10px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Pretraži po imenu i prezimenu" value={filterIme} onChange={(e) => setFilterIme(e.target.value)} size="small" />
            <TextField label="Pretraži po emailu" value={filterEmail} onChange={(e) => setFilterEmail(e.target.value)} size="small" />
            <TextField label="Pretraži po adresi" value={filterAdresa} onChange={(e) => setFilterAdresa(e.target.value)} size="small" />
               
          </Box>
          
        </Box>

        <Box sx={{ height: 500, width: '100%', '& .MuiDataGrid-root': { bgcolor: 'white', borderRadius: 2 } }}>
          <DataGrid
            rows={filteredKorisnici}
            columns={columns}
            getRowId={(r) => r.id}
            pageSizeOptions={[5, 10, 20]}
            autoHeight={false}
          />
        </Box>
        <Button startIcon={<Add />} variant="contained" onClick={() => setOpenAdd(true)}>
            Dodaj korisnika
          </Button>
      </Paper>

     {/* Modal za Dodavanje */}
<Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Dodaj korisnika</DialogTitle>
  <DialogContent>
    <KorisniciForm
      onSuccess={() => {
        fetchKorisnici();   // osvježi tabelu
        toast.success('Korisnik uspješno dodat'); // ✅ toast
        setOpenAdd(false);  // zatvori modal
      }}
      onCancel={() => setOpenAdd(false)} // ✅ zatvori modal
    />
  </DialogContent>
</Dialog>

{/* Modal za Edit */}
<Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Uredi korisnika</DialogTitle>
  <DialogContent>
    {selectedKorisnik && (
      <KorisniciEditForm
        korisnik={selectedKorisnik}
        onSuccess={() => {
          fetchKorisnici();               // osvježi tabelu
          toast.success('Korisnik uspješno uređen'); // ✅ toast
          setOpenEdit(false);              // zatvori modal
        }}
        onCancel={() => setOpenEdit(false)} // ✅ zatvori modal
      />
    )}
  </DialogContent>
</Dialog>


      {/* Potvrda brisanja */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Potvrda brisanja</DialogTitle>
        <DialogContent>
          <Typography>
            Da li ste sigurni da želite obrisati korisnika "<b>{confirmDelete?.ime} {confirmDelete?.prezime}</b>"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirmDelete(null)}>Odustani</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Obriši</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
