import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Postgres errors
  if ((err as any).code) {
    const pgCode = (err as any).code;

    // Unique violation
    if (pgCode === "23505") {
      return res.status(409).json({
        error: "Resource already exists",
      });
    }

    // Foreign key violation
    if (pgCode === "23503") {
      return res.status(400).json({
        error: "Referenced resource does not exist",
      });
    }
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" });
  }

  // Unknown / unexpected errors
  console.error("Unhandled error:", err);

  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
};
