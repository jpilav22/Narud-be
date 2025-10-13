'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import ProizvodForm from './ProizvodForm';

type ProizvodFormDialogProps = {
  open: boolean;
  onClose: () => void;
  selectedProizvod: any | null;
  onSuccess: () => void;
};

export default function ProizvodFormDialog({ open, onClose, selectedProizvod, onSuccess }: ProizvodFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{selectedProizvod ? 'Uredi proizvod' : 'Dodaj novi proizvod'}</DialogTitle>
      <DialogContent>
        <ProizvodForm
          onSuccess={() => {
            onSuccess();
            onClose();
          }}
          selectedProizvod={selectedProizvod}
          onCancelEdit={onClose}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zatvori</Button>
      </DialogActions>
    </Dialog>
  );
}
