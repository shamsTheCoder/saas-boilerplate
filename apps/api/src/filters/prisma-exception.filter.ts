import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Maps Prisma client errors to meaningful HTTP responses.
 * Registered globally in main.ts BEFORE GlobalExceptionFilter so it runs first.
 *
 * P2002 — Unique constraint violation   → 409 Conflict
 * P2025 — Record not found              → 404 Not Found
 * P2003 — Foreign key constraint failed → 400 Bad Request
 * P2014 — Relation violation            → 400 Bad Request
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const fields = (exception.meta?.target as string[])?.join(', ') ?? 'field';
        message = `A record with this ${fields} already exists`;
        break;
      }
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = (exception.meta?.cause as string) ?? 'Record not found';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Referenced record does not exist';
        break;
      case 'P2014':
        status = HttpStatus.BAD_REQUEST;
        message = 'Relation constraint violated';
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'An unexpected database error occurred';
    }

    res.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
      prismaCode: exception.code,
    });
  }
}
