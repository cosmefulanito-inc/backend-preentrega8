import { Router } from "express"
import { validateBody } from "../middlewares/validate.middleware.js"
import { createBookingSchema, addServiceToBookingSchema } from "../validations/booking.validation.js"

import {
  ControllerGetAll,
  ControllerCreateBooking,
  ControllerGetBookingById,
  ControllerBookingUpdate,
  ControllerDeleteBooking
} from "../controllers/bookings.controller.js"

const router = Router()

router.get("/", ControllerGetAll)
router.get("/:bid", ControllerGetBookingById)

router.post("/", validateBody(createBookingSchema), ControllerCreateBooking)
router.post("/:bid/services/:sid", validateBody(addServiceToBookingSchema), ControllerAddServiceToBooking)
router.delete("/:bid", ControllerDeleteBooking)




export default router