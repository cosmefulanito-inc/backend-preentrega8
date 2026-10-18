import { Router } from "express"

import {
  ControllerGetServices,
  ControllerGetServiceById,
  ControllerCreateService,
  ControllerUpdateService,
  ControllerDeleteService
} from "../controllers/services.controller.js"

import {validateBody} from "../middlewares/validateBody.js"

import {createServiceSchema} from "../validation/service.validations.js"

const router = Router()

router.get("/", ControllerGetServices)
router.get("/:sid", ControllerGetServiceById)
router.post("/", validateBody(createServiceSchema), ControllerCreateService)
router.put("/:sid", ControllerUpdateService)
router.delete("/:sid", ControllerDeleteService)

export default router