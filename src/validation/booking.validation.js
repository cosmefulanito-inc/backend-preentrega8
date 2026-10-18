import { z } from "zod"

export const createBookingSchema = z.object({
    clientName: z.string().trim().min(1, "El nombre del cliente es obligatorio"),
    clientEmail: z.string().trim().email("El email no tiene un formato válido"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato AAAA-MM-DD"),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "La hora debe tener el formato HH:MM")
})

export const addServiceToBookingSchema = z.object({
    quantity: z.number().int("La cantidad debe ser un número entero").min(1, "La cantidad debe ser al menos 1").optional()
})