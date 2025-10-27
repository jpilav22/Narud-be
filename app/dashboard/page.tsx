'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
} from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { ArcElement } from 'chart.js';
ChartJS.register(ArcElement);

import DashboardLayout from './components/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { ShoppingCart, Store, People, AttachMoney } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    proizvodi: 0,
    narudzbe: 0,
    korisnici: 0,
    stavkeUKorpi: 0,
    prihod: 0,
  });
  const [chartData, setChartData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [akcijskiProizvodi, setAkcijskiProizvodi] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      if (user.uloga === 'ADMIN') {
        const { count: proizvodi } = await supabase.from('proizvodi').select('*', { count: 'exact', head: true });
        const { count: narudzbe } = await supabase.from('narudzbe').select('*', { count: 'exact', head: true });
        const { count: korisnici } = await supabase.from('korisnici').select('*', { count: 'exact', head: true });

        const { data: prihodi } = await supabase
          .from('stavke_narudzbe')
          .select('ukupna_cijena')
          .in(
            'narudzba_id',
            (
              await supabase
                .from('narudzbe')
                .select('id')
                .in('status', ['ISPORUCENA', 'PREUZETA', 'NA_ADRESI'])
            ).data!.map((n: any) => n.id)
          );

        const ukupniPrihod = prihodi?.reduce((acc: number, item: any) => acc + Number(item.ukupna_cijena || 0), 0) || 0;

        const { data: stavke } = await supabase
          .from('stavke_narudzbe')
          .select('proizvod_id, kolicina, proizvodi(naziv,slika)')
          .in(
            'narudzba_id',
            (
              await supabase
                .from('narudzbe')
                .select('id')
                .in('status', ['ISPORUCENA', 'PREUZETA', 'NA_ADRESI'])
            ).data!.map((n: any) => n.id)
          );

          const topMap: Record<string, { naziv: string; prodano: number; slika?: string }> = {};
          stavke?.forEach((s: any) => {
            const naziv = s.proizvodi.naziv;
            const slika = s.proizvodi.slika;
            if (!topMap[naziv]) topMap[naziv] = { naziv, prodano: 0, slika };
            topMap[naziv].prodano += s.kolicina;
          });
        const topProductsArr = Object.values(topMap).sort((a, b) => b.prodano - a.prodano).slice(0, 5);

        const { data: narudzbePoMjesecu } = await supabase
          .from('narudzbe')
          .select('termin_isporuke')
          .in('status', ['ISPORUCENA', 'PREUZETA', 'NA_ADRESI']);

        const mjeseci = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const brojeviPoMjesecu = new Array(12).fill(0);
        narudzbePoMjesecu?.forEach((n: any) => {
          if (n.termin_isporuke) {
            const date = new Date(n.termin_isporuke);
            brojeviPoMjesecu[date.getMonth()] += 1;
          }
        });

        setStats({ proizvodi, narudzbe, korisnici, prihod: ukupniPrihod });
        setTopProducts(topProductsArr);
        setChartData({
          labels: mjeseci,
          datasets: [
            {
              label: 'Narudžbe po mjesecu',
              data: brojeviPoMjesecu,
              borderColor: '#00acc1',
              backgroundColor: 'rgba(0,172,193,0.2)',
              tension: 0.4,
            },
          ],
        });

        const { data: narudzbeStatus } = await supabase.from('narudzbe').select('status');
        const statusCount: Record<string, number> = {};
        narudzbeStatus?.forEach((n: any) => {
          statusCount[n.status] = (statusCount[n.status] || 0) + 1;
        });

        setChartData((prev: any) => ({
          ...prev,
          statusData: {
            labels: Object.keys(statusCount),
            datasets: [
              {
                data: Object.values(statusCount),
                backgroundColor: ['#42a5f5', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc'],
              },
            ],
          },
        }));



        const { data: prihodData } = await supabase
        .from('stavke_narudzbe')
        .select('ukupna_cijena, narudzbe!inner(termin_isporuke)')
        .in('narudzbe.status', ['ISPORUCENA', 'PREUZETA', 'NA_ADRESI']);
      
      const prihodiPoMjesecu = new Array(12).fill(0);
      prihodData?.forEach((s) => {
        const datum = s.narudzbe?.termin_isporuke ? new Date(s.narudzbe.termin_isporuke) : null;
        if (datum) prihodiPoMjesecu[datum.getMonth()] += Number(s.ukupna_cijena || 0);
      });
      
      setChartData((prev: any) => ({
        ...prev,
        prihodData: {
          labels: mjeseci,
          datasets: [
            {
              label: 'Prihod po mjesecu (KM)',
              data: prihodiPoMjesecu,
              backgroundColor: 'rgba(66,165,245,0.6)',
              borderRadius: 6,
            },
          ],
        },
      }));
      



      } else {
        const { count: narudzbe } = await supabase
          .from('narudzbe')
          .select('*', { count: 'exact', head: true })
          .eq('korisnik_id', user.id);

        const { data: aktivnaNarudzba } = await supabase
          .from('narudzbe')
          .select('id')
          .eq('korisnik_id', user.id)
          .eq('status', 'KREIRANA')
          .single();

        const { count: stavkeUKorpi } = aktivnaNarudzba
          ? await supabase
              .from('stavke_narudzbe')
              .select('*', { count: 'exact', head: true })
              .eq('narudzba_id', aktivnaNarudzba.id)
          : { count: 0 };

        const { data: mojeStavke } = await supabase
          .from('stavke_narudzbe')
          .select('proizvodi(naziv,slika), kolicina, narudzbe!inner(korisnik_id)')
          .eq('narudzbe.korisnik_id', user.id);

          // 🔽 Dohvati proizvode koji su na akciji
          const { data: akcijski, error } = await supabase
  .from('proizvodi')
  .select('id, naziv, cijena_po_komadu, akcijska_cijena, slika')
  .is('na_akciji', true)
  .limit(4);

if (error) console.error('Greška kod dohvata akcijskih proizvoda:', error);
console.log('Akcijski proizvodi:', akcijski);
setAkcijskiProizvodi(akcijski || []);

        


          const favoritMap: Record<string, { prodano: number; slika?: string }> = {};
          mojeStavke?.forEach((s: any) => {
            const naziv = s.proizvodi.naziv;
            const slika = s.proizvodi.slika;
            if (!favoritMap[naziv]) favoritMap[naziv] = { prodano: 0, slika };
            favoritMap[naziv].prodano += s.kolicina;
          });
          const favorit = Object.entries(favoritMap)
            .map(([naziv, val]) => ({ naziv, prodano: val.prodano, slika: val.slika }))
            .sort((a, b) => b.prodano - a.prodano)[0];
          
          setTopProducts(favorit ? [favorit] : []);
          

        setStats({ ...stats, narudzbe, stavkeUKorpi });

        const { data: mojeNarudzbe } = await supabase
          .from('narudzbe')
          .select('termin_isporuke')
          .eq('korisnik_id', user.id);

        const mjeseci = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const brojeviPoMjesecu = new Array(12).fill(0);
        mojeNarudzbe?.forEach((n: any) => {
          if (n.termin_isporuke) {
            const date = new Date(n.termin_isporuke);
            brojeviPoMjesecu[date.getMonth()] += 1;
          }
        });

        setChartData({
          labels: mjeseci,
          datasets: [
            {
              label: 'Moje narudžbe',
              data: brojeviPoMjesecu,
              borderColor: '#ff7043',
              backgroundColor: 'rgba(255,112,67,0.2)',
              tension: 0.4,
            },
          ],
        });
      }
    };

    fetchStats();
  }, [user]);

  if (!user) return <Typography>Učitavanje...</Typography>;

  return (
    <DashboardLayout>
      <Box sx={{ backgroundColor: '#f9fafb', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg" sx={{ px: 3 }}>
          {/* Naslov */}
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" fontWeight={700}>
              Dobrodošli, {user?.ime || user?.email}!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Pregled vaših aktivnosti i performansi sistema.
            </Typography>
          </Box>
  
          {/* KPI kartice */}
          <Grid container spacing={3} justifyContent="center">
            {(user.uloga === 'ADMIN'
              ? [
                  { icon: <Store color="primary" />, label: 'Ukupno proizvoda', value: stats.proizvodi },
                  { icon: <ShoppingCart color="primary" />, label: 'Ukupno narudžbi', value: stats.narudzbe },
                  { icon: <People color="primary" />, label: 'Ukupno korisnika', value: stats.korisnici },
                  { icon: <AttachMoney color="primary" />, label: 'Prihod', value: `${stats.prihod}KM` },
                ]
              : [
                  { icon: <ShoppingCart color="primary" />, label: 'Moje narudžbe', value: stats.narudzbe },
                  { icon: <ShoppingCart color="secondary" />, label: 'Stavke u korpi', value: stats.stavkeUKorpi },
                ]
            ).map((item, i) => (
              <Grid key={i} item xs={12} sm={6} md={user.uloga === 'ADMIN' ? 3 : 4}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    borderRadius: 3,
                    height: '100%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: '.3s',
                    '&:hover': { transform: 'translateY(-4px)' },
                  }}
                >
                  <Box mb={1}>{item.icon}</Box>
                  <Typography color="text.secondary">{item.label}</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {item.value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
  
            {/* Omiljeni proizvod pored korpe */}
            


            
          </Grid>

          
  
          {/* ADMIN layout */}
          {user.uloga === 'ADMIN' && (
            <>
              <Grid container spacing={3} alignItems="stretch" sx={{ mt: 5 }}>
                {/* Lijevo - status narudžbi */}
              {/* Lijevo - Pie graf + Bar graf pored */}
{chartData?.statusData && chartData?.prihodPoProizvodima && (
  <Grid item xs={12} md={12}>
    <Box sx={{ display: 'flex', gap: 2 }}>
      {/* Pie graf */}
      <Paper
        sx={{
          width: 300, // fiksna širina Pie grafa
          height: 240, // ista visina kao što želiš
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Pie data={chartData.statusData} options={{ maintainAspectRatio: false }} />
      </Paper>

      {/* Bar graf pored Pie */}
      <Paper
        sx={{
          width: 600, 
          height: 240, 
          borderRadius: 3,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Typography variant="subtitle1" fontWeight={500} mb={1}>
          Prihod po proizvodima
        </Typography>
        <Box sx={{ width: '100%', height: '100%' }}>
          <Bar
            data={chartData.prihodPoProizvodima}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </Box>
      </Paper>
    </Box>
  </Grid>
)}

  
                {/* Desno - najprodavaniji proizvodi */}
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" fontWeight={600} mb={2}>
                    Najčešće kupovani proizvodi
                  </Typography>
                  <Grid container spacing={3}>
                    {topProducts.map((p, i) => (
                      <Grid item xs={12} sm={6} md={4} key={i}>
                        <Paper
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            height: '100%',
                            textAlign: 'center',
                            background: i === 0 ? '#e3f2fd' : '#fff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            transition: '.3s',
                            '&:hover': { transform: 'translateY(-4px)' },
                          }}
                        >
                          {p.slika ? (
                            <img
                              src={p.slika}
                              alt={p.naziv}
                              style={{
                                width: '100%',
                                height: 160,
                                objectFit: 'contain',
                                borderRadius: 12,
                                border: '2px solid #e0e0e0',
                                backgroundColor: '#fff',
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: '100%',
                                height: 160,
                                borderRadius: 2,
                                border: '2px dashed #ccc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#fafafa',
                              }}
                            >
                              <Typography color="text.secondary" variant="body2">
                                Nema slike
                              </Typography>
                            </Box>
                          )}
                          <Typography variant="h6" fontWeight={600} mt={2}>
                            {p.naziv}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Prodano:
                          </Typography>
                          <Typography variant="h5" color="primary" fontWeight={700}>
                            {p.prodano}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>


              
  
              {/* Linijski grafikon */}
              {chartData && (
                <Paper sx={{ p: 3, borderRadius: 3, mt: 5, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Narudžbe po mjesecu
                  </Typography>
                  <Box sx={{ width: '100%', height: 400 }}>
                    <Line data={chartData} options={{ maintainAspectRatio: false }} />
                  </Box>
                </Paper>
              )}
            </>
          )}

{user.uloga !== 'ADMIN' && (
  <Box sx={{ mt: 4, textAlign: 'center' }}>
    {/* Podnaslov */}
    <Typography 
      variant="h5" 
      fontWeight={700} 
      sx={{ mb: 3 }}
    >
      Proizvodi po akcijskim cijenama!
    </Typography>

    {/* Grid sa proizvodima */}
    <Grid container spacing={3} justifyContent="center">
      {akcijskiProizvodi.map((p, i) => (
        <Grid key={i} item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              height: '100%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              textAlign: 'center',
              transition: '.3s',
              '&:hover': { transform: 'translateY(-4px)' },
            }}
          >
            {/* Slika proizvoda */}
            {p.slika ? (
              <img
                src={p.slika}
                alt={p.naziv}
                style={{
                  width: '100%',
                  height: 160,
                  objectFit: 'contain',
                  borderRadius: 12,
                  border: '2px solid #e0e0e0',
                  backgroundColor: '#fff',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: 160,
                  borderRadius: 2,
                  border: '2px dashed #ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fafafa',
                }}
              >
                <Typography color="text.secondary" variant="body2">
                  Nema slike
                </Typography>
              </Box>
            )}

            {/* Naziv i cijena */}
            <Typography variant="h6" fontWeight={600} mt={2}>
              {p.naziv}
            </Typography>
            {p.akcijska_cijena ? (
              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="body1"
                  sx={{ textDecoration: 'line-through', color: '#888' }}
                >
                  {p.cijena_po_komadu} KM
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: '#d32f2f', fontWeight: 700 }}
                >
                  {p.akcijska_cijena} KM
                </Typography>
              </Box>
            ) : (
              <Typography variant="h5" color="primary" fontWeight={700} sx={{ mt: 1 }}>
                {p.cijena_po_komadu} KM
              </Typography>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  </Box>
)}





  
          {/* KUPAC layout */}
          {user.uloga !== 'ADMIN' && chartData && (



            <Paper sx={{ p: 3, borderRadius: 3, mt: 5, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Vaše narudžbe po mjesecu
              </Typography>
              <Box sx={{ width: '100%', height: 400 }}>
                <Line data={chartData} options={{ maintainAspectRatio: false }} />
              </Box>
            </Paper>
          )}
  
          {/* Footer */}
          <Box textAlign="center" mt={6} color="text.secondary">
            <Typography variant="body2">
              © {new Date().getFullYear()} SmartShop — Kontrolna tabla
            </Typography>
          </Box>
        </Container>
      </Box>
    </DashboardLayout>
  );
  
  
}

