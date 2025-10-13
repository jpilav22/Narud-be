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
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

type NarudzbeTableProps = {
  narudzbe: any[];
  onChange: () => void;
  loading: boolean;
  onEdit: (row: any) => void;
  userRole?: string;
};

export default function NarudzbeTable({
  narudzbe,
  onChange,
  loading,
  onEdit,
}: NarudzbeTableProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [filteredNarudzbe, setFilteredNarudzbe] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.uloga === 'ADMIN') {
      setFilteredNarudzbe(narudzbe);
    } else {
      setFilteredNarudzbe(narudzbe.filter((n) => n.korisnik_id === user.id));
    }
  }, [user, narudzbe]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('narudzbe').delete().eq('id', confirmDelete.id);
    if (error) {
      console.error('Greška pri brisanju narudžbe:', error);
      toast.error('Greška pri brisanju narudžbe');
    } else {
      toast.success('Narudžba obrisana');
      onChange();
    }
    setConfirmDelete(null);
  };

  const columns: GridColDef[] = [
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
    },
    {
      field: 'termin_isporuke',
      headerName: 'Termin isporuke',
      flex: 1.3,
      valueFormatter: (value: any) => {
        if (!value) return '-';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '-';
        const dan = String(date.getDate()).padStart(2, '0');
        const mjesec = String(date.getMonth() + 1).padStart(2, '0');
        const godina = date.getFullYear();
        const sati = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${dan}.${mjesec}.${godina}. ${sati}:${minute}`;
      },
    },
    {
      field: 'actions',
      headerName: 'Akcije',
      sortable: false,
      flex: 1.5,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            color="primary"
            size="small"
            onClick={() => onEdit(params.row)}
            sx={{
              bgcolor: '#e3f2fd',
              '&:hover': { bgcolor: '#bbdefb' },
              borderRadius: 2,
            }}
          >
            <Edit fontSize="small" />
          </IconButton>

          <IconButton
            color="error"
            size="small"
            onClick={() => setConfirmDelete(params.row)}
            sx={{
              bgcolor: '#ffebee',
              '&:hover': { bgcolor: '#ffcdd2' },
              borderRadius: 2,
            }}
          >
            <Delete fontSize="small" />
          </IconButton>

          <IconButton
            color="info"
            size="small"
            onClick={() => router.push(`/narudzbe/${params.row.id}`)}
            sx={{
              bgcolor: '#e1f5fe',
              '&:hover': { bgcolor: '#b3e5fc' },
              borderRadius: 2,
            }}
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
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
          height: 450,
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
          rows={filteredNarudzbe}
          columns={columns}
          getRowId={(r) => r.id}
          pageSizeOptions={[5, 10]}
          disableRowSelectionOnClick
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
            Da li ste sigurni da želite obrisati ovu narudžbu?
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
