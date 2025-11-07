import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Center, Stack, NavLink } from '@mantine/core';
import rutas from '../services/routing';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Find the active index based on the current route
  const activeIndex = rutas.findIndex(ruta => ruta.route === location.pathname);
  const [active, setActive] = useState(activeIndex >= 0 ? activeIndex : 0);

  const handleNavigation = (ruta, index) => {
    setActive(index);
    if (ruta.route === '/logout') {
      
      return;
    }
    navigate(ruta.route);
  };

  // Filter only the routes that should appear in the navbar
  const navbarRoutes = rutas.filter(ruta => ruta.navbar);

  const links = navbarRoutes.map((ruta, index) => (
    <NavLink
      key={ruta.label}
      label={ruta.label}
      leftSection={<ruta.icon size={20} stroke={1.5} />}
      active={location.pathname === ruta.route}
      onClick={() => handleNavigation(ruta, index)}
      style={{ borderRadius: 15 }}
    />
  ));

  return (
    <nav className="navbar">
      <Center>
        {/* Logo here if needed */}
      </Center>

      <div className="navbarMain">
        <Stack justify="start" gap={5}>
          {links}
        </Stack>
      </div>
    </nav>
  );
}

export default Navbar;