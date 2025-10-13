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
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

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

  const handleDelete = async () => {
    if (!confirmDelete) return;

    const { error } = await supabase.from('proizvodi').delete().eq('id', confirmDelete.id);

    if (error) {
      console.error('Greška pri brisanju:', error);
      toast.error('Greška pri brisanju proizvoda');
    } else {
      toast.success('Proizvod obrisan');
      onChange();
    }

    setConfirmDelete(null);
  };

  const handleDodajUNarudzbu = async (proizvod: any) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return toast.error('Nema korisnika');
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
        const { data: novaNarudzba, error: novaErr } = await supabase
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
        narudzbaId = novaNarudzba.id;
      }

      const { error: stavkaErr } = await supabase.from('stavke_narudzbe').insert([
        {
          narudzba_id: narudzbaId,
          proizvod_id: proizvod.id,
          kolicina: 1,
          cijena_po_komadu: proizvod.cijena_po_komadu,
        },
      ]);

      if (stavkaErr) throw stavkaErr;
      toast.success(`Proizvod "${proizvod.naziv}" dodat u narudžbu`);
      onChange();
    } catch (err) {
      console.error(err);
      toast.error('Greška pri dodavanju proizvoda u narudžbu');
    }
  };

  const columns: GridColDef[] = [
    { field: 'sifra', headerName: 'Šifra', flex: 1 },
    { field: 'naziv', headerName: 'Naziv', flex: 2 },
    { field: 'kolicina', headerName: 'Količina', flex: 1, type: 'number' },
    { field: 'cijena_po_komadu', headerName: 'Cijena (KM)', flex: 1, type: 'number' },
    {
      field: 'actions',
      headerName: 'Akcije',
      sortable: false,
      flex: 1.5,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {userRole === 'ADMIN' && (
            <>
              <IconButton
                color="primary"
                size="small"
                onClick={() => onEdit(params.row)}
                sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' }, borderRadius: 2 }}
              >
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                color="error"
                size="small"
                onClick={() => setConfirmDelete(params.row)}
                sx={{ bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' }, borderRadius: 2 }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </>
          )}

          <IconButton
            color="info"
            size="small"
            onClick={() => router.push(`/proizvodi/${params.row.id}`)}
            sx={{ bgcolor: '#e1f5fe', '&:hover': { bgcolor: '#b3e5fc' }, borderRadius: 2 }}
          >
            <InfoIcon fontSize="small" />
          </IconButton>

          <IconButton
            color="success"
            size="small"
            onClick={() => handleDodajUNarudzbu(params.row)}
            title="Dodaj u narudžbu"
            sx={{ bgcolor: '#e8f5e9', '&:hover': { bgcolor: '#c8e6c9' }, borderRadius: 2 }}
          >
            <AddShoppingCartIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (loading)
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 300,
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Paper
      elevation={4}
      sx={{
        p: 3,
        borderRadius: 4,
        bgcolor: '#fafafa',
        boxShadow: '0px 3px 10px rgba(0,0,0,0.1)',
      }}
    >
      <Box
        sx={{
          height: 420,
          width: '100%',
          '& .MuiDataGrid-root': {
            bgcolor: 'white',
            borderRadius: 2,
            boxShadow: '0px 2px 6px rgba(0,0,0,0.1)',
          },
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: '#f5f5f5',
            fontWeight: 600,
          },
          '& .MuiDataGrid-row:hover': {
            bgcolor: '#f1f8e9',
          },
        }}
      >
        <DataGrid
          rows={proizvodi}
          columns={columns}
          getRowId={(r) => r.id}
          pageSizeOptions={[5, 10]}
        />
      </Box>

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Potvrda brisanja</DialogTitle>
        <DialogContent>
          <Typography>
            Da li ste sigurni da želite obrisati proizvod "
            <b>{confirmDelete?.naziv}</b>"?
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
    </Paper>
  );
}
