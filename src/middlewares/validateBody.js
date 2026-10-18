export const validateBody = (schema) => {

    return (req, res, next) => {

        const result = schema.safeParse(req.body)

        if (!result.success) {
            return res.status(400).json({
                status: "error",
                message: "Datos inválidos",
                error: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            })
        }

        req.body = result.data

        next() // esto da paso a que se ejecute el controller, no olvidar
    }
}