// incremento
import Booking from "../../models/bookings.model.js"

export async function getAll() {
  try {
    const data = await Booking.find().lean()
    return data
  } catch (error) {
        console.error("Error al obtener reservas de MongoDB", error)
        throw error
  }
}

export async function getById(id) {
    try {
        const foundBooking = await Booking.findById(id)
        .populate("services.service") // agrego populate para traer los servicios usando el id de mongo
        .lean()
        
        return foundBooking ?? null

    } catch (error) {
        console.error("Error al obtener reserva por id de MongoDB", error)
        throw error        
    }  
}

export async function create(bookingData) {
    try {
        const newBooking = await Booking.create(bookingData)
        return newBooking.toObject()
    } catch (error) {
        console.error("Error al crear nueva reserva en MongoDB", error)
        throw error        
    }  
}

export async function update(id, changes) {

    try {        
        const booking = await Booking.findById(id)
        if (!booking) return null
        
        const { _id, serviceId, quantity = 1, ...allowedChanges } = changes
        
        booking.set(allowedChanges) // aplica cambios
    
        const existing = booking.services.find(item => String(item.service) === serviceId) // busco si exoste ua el servicio
        
        if (existing) {
            existing.quantity += Number(quantity) // si ya existe el servicio, suma a cantidad
        } else if (serviceId) {
            booking.services.push({ service: serviceId, quantity: Number(quantity) }) // no existe: agrega nuevo servicio
        }
        
        await booking.save() // garda cambios en booking
        
        return booking.toObject()

    } catch (error) {
        console.error("Error al modificar reserva en MongoDB", error)
        throw error             
    }
}

export async function remove(id) {
    try {
        const removedBooking = await Booking.findByIdAndDelete(id).lean()
         return removedBooking !== null // devuelve true si se pudo eliminar el servicio        
    } catch (error) {
        console.error("Error al internar eliminar reserva en MongoDB", error)
        throw error        
    }
}
