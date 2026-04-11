import rateLimit from 'express-rate-limit'

/* 
   Rate Limiters
   authLimiter      → login/register (10 per 15 min)
   apiLimiter       → general API   (100 per 1 min)
   executionLimiter → code run      (5 per 1 min)
   */

/*Auth routes */
export const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  message:         { error: 'Too many attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/*General API */
export const apiLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             100,
  message:         { error: 'Too many requests, slow down' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/*Code execution */
export const executionLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             5,
  message:         { error: 'Execution limit reached, wait a minute' },
  standardHeaders: true,
  legacyHeaders:   false,
})