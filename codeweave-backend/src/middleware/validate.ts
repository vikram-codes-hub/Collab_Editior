import { Request, Response, NextFunction } from 'express'
import { ObjectSchema } from 'joi'

/* ============================================================
   Validate middleware
   Validates req.body against a Joi schema
   Blocks request with 400 if validation fails
   ============================================================ */
export const validate = (schema: ObjectSchema) => (
  req:  Request,
  res:  Response,
  next: NextFunction
) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly:   false,   // return ALL errors not just first
    stripUnknown: true,    // remove unknown fields from body
  })

  if (error) {
    return res.status(400).json({
      error:   'Validation failed',
      details: error.details.map(d => d.message),
    })
  }

  // Replace req.body with validated + stripped value
  req.body = value
  next()
}