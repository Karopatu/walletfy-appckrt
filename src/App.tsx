import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { toggleTheme, setTheme } from './store/themeSlice';
import { setEvents } from './store/eventsSlice';
import type { Event } from './types/event';

import { AppShell, Group, Text, ActionIcon, useMantineColorScheme, useComputedColorScheme, Button } from '@mantine/core'; // Añade Container
import { IconSun, IconMoon } from '@tabler/icons-react';

import BalanceFlow from './components/BalanceFlow';
import EventForm from './components/EventForm'; // Asegúrate de que esta línea esté descomentada



const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme.mode);

  const [currentView, setCurrentView] = useState<'balance' | 'form'>('balance');
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

  // Primer useEffect: Para CARGA INICIAL y configuración de Mantine (se ejecuta solo una vez)
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      dispatch(setTheme(storedTheme));
      setColorScheme(storedTheme);
    } else {
      setColorScheme(theme);
    }

    const storedEvents = localStorage.getItem('walletfyEvents');
    if (storedEvents) {
      try {
        const parsedEvents: Event[] = JSON.parse(storedEvents);
        dispatch(setEvents(parsedEvents));
      } catch (e) {
        console.error("Error al parsear eventos del Local Storage", e);
        localStorage.removeItem('walletfyEvents');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Segundo useEffect: Para reaccionar a cambios del tema (Redux) y aplicar a Mantine/HTML
  useEffect(() => {
    if (document.documentElement) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  const handleToggleTheme = () => {
    const newTheme = computedColorScheme === 'light' ? 'dark' : 'light';
    dispatch(toggleTheme());
    setColorScheme(newTheme); // Usa newTheme aquí directamente
  };

  const handleCreateEventClick = () => {
    setEditingEvent(undefined);
    setCurrentView('form');
  };

  // Función para manejar la edición de un evento desde BalanceFlow
  const handleEditEvent = (eventToEdit: Event) => {
    setEditingEvent(eventToEdit);
    setCurrentView('form'); // Cambiar a la vista del formulario
  };

  const handleEventFormSave = () => {
    setCurrentView('balance');
    setEditingEvent(undefined);
  };

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Text fw={700} size="xl">Walletfy</Text>
          </Group>

          <Group>
            <ActionIcon
              onClick={handleToggleTheme}
              variant="default"
              size="xl"
              aria-label="Toggle color scheme"
            >
              {computedColorScheme === 'light' ? (
                <IconSun stroke={1.5} />
              ) : (
                <IconMoon stroke={1.5} />
              )}
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {/* Botones de navegación */}
        <Group justify="center" mb="lg">
          <Button
            variant={currentView === 'balance' ? 'filled' : 'light'}
            onClick={() => { setCurrentView('balance'); setEditingEvent(undefined); }}
          >
            Ver Balance
          </Button>
          <Button
            variant={currentView === 'form' && !editingEvent ? 'filled' : 'light'}
            onClick={handleCreateEventClick}
          >
            Añadir Evento
          </Button>
        </Group>

        {/* Aquí se renderizarán los componentes BalanceFlow y EventForm */}
        {currentView === 'balance' ? (
          <BalanceFlow onEditEvent={handleEditEvent} />
        ) : (
          <EventForm initialEvent={editingEvent} onSave={handleEventFormSave} /> 
          //DESCOMENTADO y se pasa la prop initialEvent 
        )}
      </AppShell.Main>
    </AppShell>
  );
};

export default App;