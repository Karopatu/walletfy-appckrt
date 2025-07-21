import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { v4 as uuidv4 } from 'uuid'; // Para generar IDs únicos
import Moment from 'moment'; // Para manejar y formatear fechas
import { z } from 'zod'; // Para validación
import { eventSchema } from '../types/event'; // Esquema y tipo de Evento
import { addEvent, updateEvent } from '../store/eventsSlice'; // Acciones de Redux
import type { Event } from '../types/event'; // Importar tipo Event para TypeScript
// Importaciones de componentes Mantine
import {
  Container,
  Paper,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Button,
  Group,
  Text,
  Stack,
  FileInput, // Para el campo Adjunto
  rem // Para unidades de rem en estilos
} from '@mantine/core';
import { DateInput } from '@mantine/dates'; // Para la entrada de fecha

// Propiedades que el formulario podría recibir para el modo edición
interface EventFormProps {
  initialEvent?: Event; // Si se proporciona, estamos en modo edición
  onSave: () => void; // Función para llamar después de guardar (ej. redirigir)
}

const EventForm: React.FC<EventFormProps> = ({ initialEvent, onSave }) => {
  const dispatch = useAppDispatch();

  // Estado local del formulario, inicializado con el evento prop o valores vacíos
  const [formData, setFormData] = useState<Event>(initialEvent || {
    id: uuidv4(), // Generar un nuevo ID si es un nuevo evento
    name: '',
    description: null,
    amount: 0,
    date: Moment().format('YYYY-MM-DD'), // Fecha actual por defecto en formato string
    type: 'ingreso',
    attachment: null, // Inicializar attachment
  });

  // Estado para los errores de validación
  const [errors, setErrors] = useState<z.ZodIssue[]>([]);

  // Efecto para actualizar formData si initialEvent cambia (útil para edición)
  useEffect(() => {
    if (initialEvent) {
      setFormData({
        ...initialEvent,
        // DateInput puede parsear un string YYYY-MM-DD.
        date: Moment(initialEvent.date).format('YYYY-MM-DD'),
      });
    } else {
      setFormData({
        id: uuidv4(),
        name: '',
        description: null,
        amount: 0,
        date: Moment().format('YYYY-MM-DD'),
        type: 'ingreso',
        attachment: null,
      });
    }
    setErrors([]); 
  }, [initialEvent]);

  // Manejador de cambios para inputs de texto/número/select
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prevData => ({
      ...prevData,
      // Convertir a número si el input es de tipo 'number'
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  // Manejador de cambio para DateInput (retorna un string o null)
  const handleDateChange = (value: string | null) => {
    setFormData(prevData => ({
      ...prevData,
      date: value ?? '', // Guardar como string YYYY-MM-DD o vacío
    }));
  };

  // Manejador para FileInput (Adjunto) - Lee el archivo como Base64
  const handleAttachmentChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prevData => ({
          ...prevData,
          attachment: reader.result as string, // Guarda el archivo como Base64 string
        }));
      };
      reader.readAsDataURL(file); // Lee el archivo como URL de datos (Base64)
    } else {
      setFormData(prevData => ({
        ...prevData,
        attachment: null,
      }));
    }
  };

  // Manejador del envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]); // Limpiar errores previos

    try {
      const validatedData = eventSchema.parse({
        ...formData,
        amount: parseFloat(String(formData.amount)),
        description: formData.description === '' ? null : formData.description,
        attachment: formData.attachment === '' ? null : formData.attachment,
      });

      if (initialEvent) {
        dispatch(updateEvent(validatedData));
      } else {
        dispatch(addEvent(validatedData));
      }


      const updatedEventsString = localStorage.getItem('walletfyEvents');
      let updatedEvents: Event[] = updatedEventsString ? JSON.parse(updatedEventsString) : [];

      if (initialEvent) {
          updatedEvents = updatedEvents.map(ev => ev.id === validatedData.id ? validatedData : ev);
      } else {
          updatedEvents.push(validatedData);
      }
      localStorage.setItem('walletfyEvents', JSON.stringify(updatedEvents));


      onSave(); // Redirigir o realizar otra acción post-guardado
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(error.issues);
      }
      console.error('Error de validación:', error);
    }
  };

  // Función para obtener el mensaje de error para un campo específico
  const getErrorMessage = (fieldName: keyof Event) => {
    const error = errors.find(err => err.path[0] === fieldName);
    return error ? error.message : undefined; // Mantine expects undefined for no error
  };

  return (
    <Container size="sm" my="lg">
      <Paper shadow="md" radius="md" p="xl">
        <Text fz="lg" fw={700} mb="xl" ta="center">
          {initialEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack>
            {/* Campo Nombre */}
            <TextInput
              label="Nombre"
              placeholder="Nombre del evento"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={getErrorMessage('name')}
              maxLength={20}
              required
            />

            {/* Campo Descripción */}
            <Textarea
              label="Descripción (Opcional)"
              placeholder="Descripción del evento"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              error={getErrorMessage('description')}
              maxLength={100}
            />

            {/* Campo Cantidad */}
            <NumberInput
              label="Cantidad ($)"
              placeholder="0.00"
              name="amount"
              value={formData.amount}
              onChange={(val) => handleChange({ target: { name: 'amount', value: String(val), type: 'number' } } as React.ChangeEvent<HTMLInputElement>)} // Mantine NumberInput tiene un onChange diferente
              error={getErrorMessage('amount')}
              min={0}
              step={0.01}
              decimalScale={2}
              fixedDecimalScale // Mantiene 2 decimales fijos
              required
            />

            {/* Campo Fecha */}
            <DateInput
              label="Fecha"
              placeholder="Selecciona la fecha"
              value={formData.date || null} // Mantine DateInput espera un string (YYYY-MM-DD) o null
              onChange={handleDateChange}
              error={getErrorMessage('date')}
              valueFormat="YYYY-MM-DD" // Formato interno para el valor
              required
            />

            {/* Campo Tipo */}
            <Select
              label="Tipo"
              placeholder="Selecciona el tipo"
              name="type"
              value={formData.type}
              onChange={(val) =>
                setFormData((prevData) => ({
                  ...prevData,
                  type: val === 'ingreso' || val === 'egreso' ? val : prevData.type,
                }))
              } // Mantine Select tiene un onChange diferente
              data={['ingreso', 'egreso']}
              error={getErrorMessage('type')}
              required
            />

            [cite_start]{/* Campo Adjunto (FileInput) - Punto Extra [cite: 63]*/}
            <FileInput
              label="Adjunto (Imagen opcional)"
              placeholder="Arrastra o selecciona una imagen"
              value={formData.attachment ? new File([], 'imagen_adjunta.png', { type: 'image/png' }) : null} // Dummy File object for display
              onChange={handleAttachmentChange}
              error={getErrorMessage('attachment')}
              accept="image/png,image/jpeg,image/gif"
              clearable // Permite limpiar la selección
              valueComponent={({ value }) => {
                if (!value) return null;
                if (Array.isArray(value)) {
                  // If multiple files, show names joined
                  return <Text size="sm">{value.map((file) => file.name).join(', ')}</Text>;
                }
                // Single file
                return <Text size="sm">{value.name}</Text>;
              }}
            />
            {formData.attachment && (
              <Text c="dimmed" size="xs">
                Archivo adjunto (Base64): {formData.attachment.substring(0, 50)}...
              </Text>
            )}

            {/* Botón de Guardar */}
            <Button type="submit" mt="md">
              {initialEvent ? 'Actualizar Evento' : 'Crear Evento'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default EventForm;