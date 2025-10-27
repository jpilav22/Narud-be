'use client';

import * as React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Box,
  IconButton,
  Divider,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Store,
  ShoppingCart,
  Dashboard,
  Group ,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
// Unutar DashboardLayout funkcije, odmah prije definiranja drawer:

import { Person } from '@mui/icons-material';
const drawerWidth = 240;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
 
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const isAdmin = user?.uloga === 'ADMIN';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button onClick={() => router.push('/dashboard')}>
          <ListItemIcon><Dashboard /></ListItemIcon>
          <ListItemText primary="Početna" />
        </ListItem>
        <ListItem button onClick={() => router.push('/proizvodi')}>
          <ListItemIcon><Store /></ListItemIcon>
          <ListItemText primary="Proizvodi" />
        </ListItem>

        <ListItem button onClick={() => router.push('/narudzbe')}>
          <ListItemIcon><ShoppingCart /></ListItemIcon>
          <ListItemText primary="Narudžbe" />
        </ListItem>
         {/* Prikazati samo ako je ADMIN */}
  {isAdmin && (
    <ListItem button onClick={() => router.push('/korisnici')}>
       <ListItemIcon><Group /></ListItemIcon>
      <ListItemText primary="Korisnici" />
    </ListItem>
  )}
        
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><Logout /></ListItemIcon>
          <ListItemText primary="Odjava" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'primary.main',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Upravljanje proizvodima i narudžbama
          </Typography>
          <Tooltip title="Profil">
  <IconButton
    onClick={() => router.push('/profil')}
    sx={{
      bgcolor: '#9c27b0',       // ljubićasta pozadina
      '&:hover': { bgcolor: '#7b1fa2' }, // tamnija nijansa na hover
      borderRadius: '50%',       // potpuno okrugla
      p: 1.2,                    // unutarnji padding
    }}
  >
    <Person sx={{ color: 'white', fontSize: 28 }} /> {/* bijela ikona */}
  </IconButton>
</Tooltip>


        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Glavni sadržaj */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
