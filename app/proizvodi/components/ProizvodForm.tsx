'use client';

import { useForm } from 'react-hook-form';
import { Box, Button, TextField, Typography, Paper, Divider } from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';

export default function ProizvodForm({ onSuccess, selectedProizvod, onCancelEdit }: any) {
  const { register, handleSubmit, reset } = useForm();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (selectedProizvod) {
      reset(selectedProizvod);
      if (selectedProizvod.slika) setPreviewUrl(selectedProizvod.slika);
    } else {
      reset({
        sifra: '',
        naziv: '',
        kolicina: '',
        cijena_po_komadu: '',
        opis: '',
      });
      setPreviewUrl(null);
    }
  }, [selectedProizvod, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImageToStorage = async (id: string) => {
    if (!imageFile) return null;

    setUploading(true);
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${id}_${Date.now()}.${fileExt}`;
    const filePath = `proizvodi/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('proizvodi')
      .upload(filePath, imageFile, { upsert: true });

    if (uploadError) {
      toast.error('Greška pri uploadu slike');
      console.error(uploadError);
      setUploading(false);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from('proizvodi')
      .getPublicUrl(filePath);

    setUploading(false);
    return publicData?.publicUrl || null;
  };

  const onSubmit = async (data: any) => {
    try {
      let proizvodId = selectedProizvod?.id || crypto.randomUUID();
      let imageUrl = selectedProizvod?.slika || null;

      if (imageFile) {
        const uploadedUrl = await uploadImageToStorage(proizvodId);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      let error;
      if (selectedProizvod) {
        const { error: updateError } = await supabase
          .from('proizvodi')
          .update({
            sifra: data.sifra,
            naziv: data.naziv,
            kolicina: parseInt(data.kolicina),
            cijena_po_komadu: parseFloat(data.cijena_po_komadu),
            opis: data.opis || '',
            slika: imageUrl,
          })
          .eq('id', selectedProizvod.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('proizvodi')
          .insert([{
            id: proizvodId,
            sifra: data.sifra,
            naziv: data.naziv,
            kolicina: parseInt(data.kolicina),
            cijena_po_komadu: parseFloat(data.cijena_po_komadu),
            opis: data.opis || '',
            slika: imageUrl,
          }]);
        error = insertError;
      }

      if (error) {
        console.error('Supabase error:', error);
        toast.error(error.message || 'Greška pri spremanju proizvoda');
      } else {
        toast.success(selectedProizvod ? 'Proizvod ažuriran' : 'Proizvod dodat');
        reset();
        setImageFile(null);
        setPreviewUrl(null);
        onSuccess();
      }
    } catch (err) {
      console.error('Neočekivana greška:', err);
      toast.error('Neočekivana greška pri spremanju proizvoda');
    }
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          {selectedProizvod ? '' : ''}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField label="Šifra" {...register('sifra', { required: true })} sx={{ flex: 1, minWidth: 150 }} />
          <TextField label="Naziv" {...register('naziv', { required: true })} sx={{ flex: 2, minWidth: 200 }} />
          <TextField label="Količina" type="number" {...register('kolicina', { required: true })} sx={{ width: 150 }} />
          <TextField
            label="Cijena (KM)"
            type="number"
            inputProps={{ step: '0.01' }}
            {...register('cijena_po_komadu', { required: true })}
            sx={{ width: 150 }}
          />
        </Box>

        <TextField
          label="Opis"
          multiline
          rows={3}
          {...register('opis')}
          sx={{ width: '100%' }}
        />

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              style={{ width: 150, height: 150, objectFit: 'contain', border: '1px solid #ccc', borderRadius: 8 }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">Nema odabrane slike</Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Button variant="contained" component="label">
              Odaberi sliku
              <input type="file" hidden accept="image/*" onChange={handleFileChange} />
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={uploading}
            >
              {uploading ? 'Učitavanje...' : selectedProizvod ? 'Spremi izmjene' : 'Dodaj'}
            </Button>
            <Button variant="outlined" color="secondary" onClick={onCancelEdit}>
              Odustani
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
