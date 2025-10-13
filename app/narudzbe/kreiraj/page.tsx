"use client";
import { Container, Typography, Paper } from "@mui/material";
import NarudzbaForm from "../components/NarudzbaForm";

export default function KreirajNarudzbuPage() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h5" gutterBottom>
          Nova narudžba
        </Typography>
        <NarudzbaForm />
      </Paper>
    </Container>
  );
}
