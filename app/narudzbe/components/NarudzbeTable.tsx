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
  Chip,
  Tooltip,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material';
import { Edit, Delete, Info } from '@mui/icons-material';
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
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [korisnikFilter, setKorisnikFilter] = useState('');
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (!user) return;
    let data =
      user.uloga === 'ADMIN'
        ? narudzbe
        : narudzbe.filter((n) => n.korisnik_id === user.id);

    if (statusFilter) data = data.filter((n) => n.status === statusFilter);
    if (dateFilter)
      data = data.filter((n) => n.termin_isporuke?.startsWith(dateFilter));


    if (user.uloga === 'ADMIN' && korisnikFilter.trim()) {
      const term = korisnikFilter.trim().toLowerCase();
      data = data.filter((n) => {
        const ime = n.korisnici?.ime?.toLowerCase() || '';
        const prezime = n.korisnici?.prezime?.toLowerCase() || '';
        return ime.includes(term) || prezime.includes(term);
      });
    }

    setFilteredNarudzbe(data);
  }, [user, narudzbe, statusFilter, dateFilter, korisnikFilter]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase
      .from('narudzbe')
      .delete()
      .eq('id', confirmDelete.id);

    if (error) {
      console.error('Greška pri brisanju narudžbe:', error);
      toast.error('Greška pri brisanju narudžbe');
    } else {
      toast.success('Narudžba obrisana');
      onChange();
    }
    setConfirmDelete(null);
  };

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

  const columns: GridColDef[] = [
...(user?.uloga === 'ADMIN'
      ? [
          {
            field: 'korisnik',
            headerName: 'Korisnik',
            flex: 1.3,
            sortable: true,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
              const row = params?.row;
              if (!row) return '-';
              const korisnik =
                row.korisnici
                  ? `${row.korisnici.ime} ${row.korisnici.prezime}`
                  : '-';
              return <Typography>{korisnik}</Typography>;
            },
          },
        ]
      : []),
    
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'termin_isporuke',
      headerName: 'Termin isporuke',
      flex: 1.3,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
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
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Stack direction="row" spacing={1.5} justifyContent="center">
          <Tooltip title="Uredi narudžbu">
            <IconButton
              color="primary"
              size="medium"
              onClick={() => onEdit(params.row)}
              sx={{
                bgcolor: '#e3f2fd',
                '&:hover': { bgcolor: '#bbdefb' },
                borderRadius: 2,
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Obriši narudžbu">
            <IconButton
              color="error"
              size="medium"
              onClick={() => setConfirmDelete(params.row)}
              sx={{
                bgcolor: '#ffebee',
                '&:hover': { bgcolor: '#ffcdd2' },
                borderRadius: 2,
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Detalji narudžbe">
            <IconButton
              color="info"
              size="medium"
              onClick={() => router.push(`/narudzbe/${params.row.id}`)}
              sx={{
                bgcolor: '#e1f5fe',
                '&:hover': { bgcolor: '#b3e5fc' },
                borderRadius: 2,
              }}
            >
              <Info fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
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
        overflowX: 'auto',
      }}
    >
      {/* Filter traka */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        mb={2}
        alignItems="center"
        justifyContent="space-between"
      >
{user?.uloga === 'ADMIN' && (
          <TextField
            label="Filtriraj po korisniku"
            placeholder="Unesi ime ili prezime"
            value={korisnikFilter}
            onChange={(e) => setKorisnikFilter(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 260 } }}
          />
        )}


        <TextField
          select
          label="Filtriraj po statusu"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 220 } }}
          size="small"
        >
          <MenuItem value="">Svi</MenuItem>
          <MenuItem value="KREIRANA">Kreirana</MenuItem>
          <MenuItem value="U_OBRADI">U obradi</MenuItem>
          <MenuItem value="NARUČENA">Naručena</MenuItem>
          <MenuItem value="ISPORUCENA">Isporučena</MenuItem>
          <MenuItem value="NA_ADRESI">Na adresi</MenuItem>
          <MenuItem value="PREUZETA">Preuzeta</MenuItem>
          <MenuItem value="OTKAZANA">Otkazana</MenuItem>
        </TextField>

        <TextField
          type="date"
          label="Filtriraj po datumu isporuke"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          size="small"
          sx={{ width: { xs: '100%', sm: 220 } }}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      {/* Tabela */}
      <Box
        sx={{
          height: 480,
          width: '100%',
          minWidth: 800,
          '& .MuiDataGrid-root': {
            bgcolor: 'white',
            borderRadius: 2,
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
          pageSizeOptions={[5, 10, 20]}
          disableRowSelectionOnClick
        />
      </Box>

      {/* Dijalog za brisanje */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Potvrda brisanja</DialogTitle>
        <DialogContent>
          <Typography>Da li ste sigurni da želite obrisati ovu narudžbu?</Typography>
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
