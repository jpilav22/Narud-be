'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import NarudzbaForm from './NarudzbaForm';

type NarudzbaFormDialogProps = {
  open: boolean;
  onClose: () => void;
  selectedNarudzba: any | null;
  onSuccess: () => void;
};

export default function NarudzbaFormDialog({ open, onClose, selectedNarudzba, onSuccess }: NarudzbaFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{selectedNarudzba ? 'Uredi narudžbu' : 'Nova narudžba'}</DialogTitle>
      <DialogContent>
      <NarudzbaForm
  existingNarudzba={selectedNarudzba}
  onSuccess={onSuccess}
  onClose={onClose}
/>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zatvori</Button>
      </DialogActions>
    </Dialog>
  );
}
