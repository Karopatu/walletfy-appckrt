import { z } from 'zod';

export const eventSchema = z.object({
  id: z.string().uuid({ message: "El ID debe ser un UUID válido." }),
  name: z.string()
    .min(1, { message: "El nombre es obligatorio." })
    .max(20, { message: "El nombre no puede exceder los 20 caracteres." }),
  description: z.string()
    .max(100, { message: "La descripción no puede exceder los 100 caracteres." })
    .optional()
    .nullable(),
  amount: z.number()
    .positive({ message: "La cantidad debe ser un número positivo." })
    .finite({ message: "La cantidad debe ser un número válido." }),
  date: z.string().refine(
    (str) => !isNaN(new Date(str).getTime()),
    { message: "La fecha debe ser una fecha válida en formato YYYY-MM-DD o similar." }
  ),
  type: z.enum(["egreso", "ingreso"], {
    message: "El tipo debe ser 'egreso' o 'ingreso'."
  }),
  attachment: z.string().optional().nullable(),
});

export type Event = z.infer<typeof eventSchema>;