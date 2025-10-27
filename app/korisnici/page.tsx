'use client';

import React, { useState } from 'react';
import KorisniciTable from './components/KorisniciTable';
import { Box, Typography, Paper, Stack } from '@mui/material';
import DashboardLayout from '../dashboard/components/DashboardLayout';
export default function KorisniciPage() {
  const [loading, setLoading] = useState(false);

  return (
    <DashboardLayout>


    <Box sx={{ p: 3 }}>

    <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">
              { 'Korisnici'}
            </Typography>
            </Stack>
            </Paper>
      
      <KorisniciTable loading={loading} />
    </Box>
    </DashboardLayout>
  );
}
