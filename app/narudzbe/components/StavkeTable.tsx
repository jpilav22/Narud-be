import { Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";

export default function StavkeTable({ stavke }: { stavke: any[] }) {
  if (!stavke.length) return null;

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Naziv proizvoda</TableCell>
          <TableCell align="right">Količina</TableCell>
          <TableCell align="right">Cijena/kom</TableCell>
          <TableCell align="right">Ukupno</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {stavke.map((s, i) => (
          <TableRow key={i}>
            <TableCell>{s.naziv}</TableCell>
            <TableCell align="right">{s.kolicina}</TableCell>
            <TableCell align="right">{s.cijena_po_komadu.toFixed(2)}</TableCell>
            <TableCell align="right">{s.ukupna_cijena.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
