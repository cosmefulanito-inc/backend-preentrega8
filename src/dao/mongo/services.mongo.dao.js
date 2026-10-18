import Service from "../../models/service.model.js"

export async function getAll(){
    try {
        const services = await Service.find().lean()
        return services

    } catch (error) {
        console.error("Error al obtener servicios de MongoDB", error)
        throw error
    }
}

export async function create(serviceData) {
    try {
        const newService = await Service.create(serviceData)
        return newService
    } catch (error) {
        console.error("Error al crear servicio en MongoDB", error)
        throw error
    }
}

export async function getById(id) {
    try {
        const foundServiceById = await Service.findById(id).lean()
        return foundServiceById ?? null        
    } catch (error) {
        console.error("Error al buscar servicio por ID en Mongo", error)
        throw error
    }
}

export async function update(id, changes) {
    try {
        const updatedService = await Service.findByIdAndUpdate(id, changes).lean()
        return updatedService ?? null
    } catch (error) {
        console.error("Error al modificar servicio en MongoDB", error)
        throw error
    }    
}

export async function remove(id) {
    try {
        const removedService = await Service.findByIdAndDelete(id).lean()
        return removedService !== null // devuelve true si se pudo eliminar el servicio        
    } catch (error) {
        console.error("Error al internar eliminar servicio en MongoDB", error)
        throw error        
    }
}

export async function getPaginated(filter, { skip, limit, sort }) {
    try {
        const docs = await Service.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean()

        const total = await Service.countDocuments(filter)

        return { docs, total }
    } catch (error) {
        console.error("Error al obtener servicios paginados de MongoDB", error)
        throw error
    }
}

