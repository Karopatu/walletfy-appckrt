import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setInitialBalance } from '../store/balanceSlice';
import type { Event } from '../types/event';
import Moment from 'moment';
import {
  Container,
  Paper,
  TextInput,
  Text,
  //Button, //
  Group,
  Stack,
  Collapse,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconPencil } from '@tabler/icons-react'; // IconTrash está aquí, pero su uso está comentado


// Componente para mostrar un solo evento
interface EventItemProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void; // Esta prop se usará cuando se descomente el botón
}

const EventItem: React.FC<EventItemProps> = ({ event, onEdit }) => {
  const isIncome = event.type === 'ingreso';
  const amountColor = isIncome ? 'green.6' : 'red.6';

  return (
    <Group justify="space-between" align="center" py="xs" px="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
      <Group>
        <Badge color={isIncome ? 'green' : 'red'} variant="light" size="sm">
          {isIncome ? 'Ingreso' : 'Egreso'}
        </Badge>
        <Stack gap={0}>
          <Text fw={500} size="sm">{event.name}</Text>
          {event.description && (
            <Text c="dimmed" size="xs" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
              {event.description}
            </Text>
          )}
        </Stack>
      </Group>
      <Group gap="xs">
        <Text fw={600} c={amountColor}>
          {isIncome ? '+' : '-'} ${event.amount.toFixed(2)}
        </Text>
        <Text c="dimmed" size="xs">{Moment(event.date).format('DD/MM/YYYY')}</Text>
        <ActionIcon variant="subtle" color="gray" onClick={() => onEdit(event)} aria-label="Editar evento">
          <IconPencil size={18} />
        </ActionIcon>
        {/* Descomenta la siguiente línea CUANDO VAYAS A IMPLEMENTAR LA FUNCIONALIDAD DE ELIMINAR */}
        {/* <ActionIcon variant="subtle" color="red" onClick={() => onDelete(event.id)} aria-label="Eliminar evento">
          <IconTrash size={18} />
        </ActionIcon> */}
      </Group>
    </Group>
  );
};


// Componente para agrupar eventos por mes
interface MonthGroupProps {
  monthName: string;
  year: number;
  totalIngresos: number;
  totalEgresos: number;
  monthlyBalance: number; // Nuevo campo para el balance mensual
  globalBalance: number;  // Nuevo campo para el balance global de ese mes
  events: Event[];
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
}

const MonthGroup: React.FC<MonthGroupProps> = ({
  monthName, year, totalIngresos, totalEgresos, monthlyBalance, globalBalance, events, onEditEvent, onDeleteEvent
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Paper shadow="md" radius="md" p="md" mb="md">
      <Group justify="space-between" align="center" onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
        <Text fw={700} size="lg">{monthName} {year}</Text>
        <ActionIcon variant="subtle" color="gray">
          {isExpanded ? <IconChevronUp size={24} /> : <IconChevronDown size={24} />}
        </ActionIcon>
      </Group>

      <Stack gap="xs" mt="sm">
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">Ingresos del mes:</Text>
          <Text fw={600} c="green.6">${totalIngresos.toFixed(2)}</Text>
        </Group>
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">Egresos del mes:</Text>
          <Text fw={600} c="red.6">${totalEgresos.toFixed(2)}</Text>
        </Group>
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">Balance Mensual:</Text>
          <Text fw={600} c={monthlyBalance >= 0 ? 'blue.6' : 'red.6'}>${monthlyBalance.toFixed(2)}</Text>
        </Group>
        <Group justify="space-between" align="center">
          <Text size="sm" fw={700}>Balance Global:</Text>
          <Text fw={700} c={globalBalance >= 0 ? 'blue.7' : 'red.7'}>${globalBalance.toFixed(2)}</Text>
        </Group>
      </Stack>

      <Collapse in={isExpanded}>
        <Stack gap="xs" mt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)', paddingTop: 'var(--mantine-spacing-md)' }}>
          {events.length > 0 ? (
            events.map(event => (
              <EventItem key={event.id} event={event} onEdit={onEditEvent} onDelete={onDeleteEvent} />
            ))
          ) : (
            <Text c="dimmed" size="sm" ta="center">No hay eventos para este mes.</Text>
          )}
        </Stack>
      </Collapse>
    </Paper>
  );
};

// Definimos un tipo local para la estructura del acumulador de meses
type MonthData = {
  monthName: string;
  year: number;
  totalIngresos: number;
  totalEgresos: number;
  events: Event[];
};

// Propiedades para el componente BalanceFlow
interface BalanceFlowProps {
  onEditEvent: (event: Event) => void; // Función para pasar al App.tsx para iniciar edición
}

const BalanceFlow: React.FC<BalanceFlowProps> = ({ onEditEvent }) => {
  const dispatch = useAppDispatch();
  const allEvents = useAppSelector((state) => state.events.events);
  const initialBalance = useAppSelector((state) => state.balance.initialBalance);

  const [localInitialBalance, setLocalInitialBalance] = useState<number>(initialBalance);

  // Sincronizar el estado local del input con el estado de Redux
  useEffect(() => {
    setLocalInitialBalance(initialBalance);
  }, [initialBalance]);

  // Manejar cambio en el input de balance inicial
  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setLocalInitialBalance(isNaN(value) ? 0 : value);
  };

  // Guardar balance inicial en Redux y Local Storage al perder el foco
  const handleBlur = () => {
    dispatch(setInitialBalance(localInitialBalance));
  };

  // --- Lógica de cálculo de balance por meses ---
  const groupedEvents = allEvents.reduce((acc: Record<string, MonthData>, event) => {
    const monthYear = Moment(event.date).format('YYYY-MM'); // "2025-01"
    if (!acc[monthYear]) {
      acc[monthYear] = {
        monthName: Moment(event.date).format('MMMM'), // "January"
        year: Moment(event.date).year(), // 2025
        totalIngresos: 0,
        totalEgresos: 0,
        events: [],
      };
    }

    acc[monthYear].events.push(event);
    if (event.type === 'ingreso') {
      acc[monthYear].totalIngresos += event.amount;
    } else {
      acc[monthYear].totalEgresos += event.amount;
    }
    return acc;
  }, {} as Record<string, MonthData>);

  // Ordenar los meses de forma cronológica (más antiguos primero)
  const sortedMonthsKeys = Object.keys(groupedEvents).sort((a, b) => {
    return Moment(a).valueOf() - Moment(b).valueOf();
  });

  // Calcular el balance global acumulado mes a mes
  const balanceHistory: Record<string, number> = {};
  let currentGlobalBalance = initialBalance; // Empieza con el balance inicial

  const monthsWithCalculations = sortedMonthsKeys.map(monthKey => {
    const monthData = groupedEvents[monthKey];
    const monthlyBalance = monthData.totalIngresos - monthData.totalEgresos;

    // El balance global para este mes es el global del mes anterior + el balance de este mes
    currentGlobalBalance += monthlyBalance;
    balanceHistory[monthKey] = currentGlobalBalance;

    return {
      monthKey,
      monthName: monthData.monthName,
      year: monthData.year,
      totalIngresos: monthData.totalIngresos,
      totalEgresos: monthData.totalEgresos,
      monthlyBalance: monthlyBalance,
      globalBalance: currentGlobalBalance, // Este es el balance global *hasta el final* de este mes
      events: monthData.events.sort((a: Event, b: Event) => Moment(a.date).valueOf() - Moment(b.date).valueOf()),
    };
  });

  // Función dummy para eliminar evento (para puntos extra), por ahora solo un console.log
  const handleDeleteEvent = (id: string) => {
    console.log(`Solicitud de eliminación para el evento con ID: ${id}`);
    // Aquí iría la lógica de dispatch de deleteEvent y actualización de localStorage
  };


  return (
    <Container size="md" my="lg">
      <Text ta="center" fz="h2" fw={700} mb="xl">Flujo de Balance</Text>

      {/* Input de Dinero Inicial */}
      <Paper shadow="sm" radius="md" p="md" mb="lg">
        <Group grow align="center">
          <TextInput
            label={<Text fw={500} size="sm">Dinero Inicial</Text>}
            placeholder="0"
            type="number"
            value={localInitialBalance}
            onChange={handleBalanceChange}
            onBlur={handleBlur}
            step="0.01"
            min="0"
            rightSection={<Text fz="sm" c="dimmed">$</Text>}
            style={{ flexGrow: 1 }}
          />
          {/* El botón "Calcular" de la imagen no es funcionalmente necesario si se actualiza onBlur */}
          {/* <Button variant="light" onClick={handleBlur} mt="xl">Calcular</Button> */}
        </Group>
      </Paper>

      {/* Número de eventos */}
      {allEvents.length > 0 && (
        <Text fz="md" fw={500} ta="center" mb="lg">
          Tienes {allEvents.length} eventos en {sortedMonthsKeys.length} meses
        </Text>
      )}

      {/* Mostrar Balance Global Actual (similar a la captura de pantalla) */}
      <Paper shadow="sm" radius="md" p="md" mb="lg" bg="blue.6" c="white">
        <Text ta="center" fz="lg" fw={500}>Balance Global Actual</Text>
        <Text ta="center" fz="h1" fw={900}>${currentGlobalBalance.toFixed(2)}</Text>
      </Paper>


      {/* Meses agrupados con eventos */}
      <Stack>
        {monthsWithCalculations.length > 0 ? (
          monthsWithCalculations.map(month => (
            <MonthGroup
              key={month.monthKey}
              monthName={month.monthName}
              year={month.year}
              totalIngresos={month.totalIngresos}
              totalEgresos={month.totalEgresos}
              monthlyBalance={month.monthlyBalance}
              globalBalance={month.globalBalance}
              events={month.events}
              onEditEvent={onEditEvent} // Pasa la función de edición
              onDeleteEvent={handleDeleteEvent} // Pasa la función de eliminación (dummy por ahora)
            />
          ))
        ) : (
          <Paper shadow="sm" radius="md" p="xl" ta="center">
            <Text c="dimmed" size="lg">¡Aún no hay eventos registrados!</Text>
            <Text c="dimmed" size="sm" mt="xs">Crea tu primer evento para ver tu flujo de balance.</Text>
          </Paper>
        )}
      </Stack>
    </Container>
  );
};

export default BalanceFlow;