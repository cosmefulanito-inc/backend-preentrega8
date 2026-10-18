import {z} from "zod"

export const createServiceSchema = z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().optional(),
    duration: z.number().min(1) ,
    price: z.number().min(1),
    category: z.string().trim().min(1), 
    available: z.boolean()
})



export const updateServiceSchema = createServiceSchema.partial()