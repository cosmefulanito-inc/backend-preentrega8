import * as repository from "../repositories/services.repository.js"

export async function getServices() {
  return repository.getAll()
}

export async function getServiceById(id) {
  return repository.getById(id)
}

export async function addService(data) {
  return repository.create(data) // el id es generado por Mongo ahora
}

export async function deleteService(id){
  return repository.remove(id)
}

export async function updateService(id, changes){
  return repository.update(id, changes)
}

const ALLOWED_SORT_FIELDS = ["name", "price", "duration", "category"]

export async function getPaginatedServices(query) {
  const { category, available, page, limit, sortBy, order } = query
  
  // Filtros: solo se agregan si vinieron en la URL
  const filter = {}
  if (category) filter.category = category
  if (available !== undefined) filter.available = available === "true"
  
  // Paginación: valores por defecto si no vienen o no son válidos
  const pageNumber = Number(page) > 0 ? Number(page) : 1
  const limitNumber = Number(limit) > 0 ? Number(limit) : 10
  const skip = (pageNumber - 1) * limitNumber
  
  // Ordenamiento: solo por campos permitidos
  const sort = {}
  if (ALLOWED_SORT_FIELDS.includes(sortBy)) {
    sort[sortBy] = order === "desc" ? -1 : 1
  }
  
  const { docs, total } = await repository.getPaginated(filter, { skip, limit: limitNumber, sort })
  
  // Metadatos
  const totalPages = Math.ceil(total / limitNumber)
  
  return {
    payload: docs,
    total,
    page: pageNumber,
    limit: limitNumber,
    totalPages,
    hasPrevPage: pageNumber > 1,
    hasNextPage: pageNumber < totalPages,
  }
}