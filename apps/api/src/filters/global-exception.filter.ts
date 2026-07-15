import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log the error natively through Pino so Datadog/Cloudwatch captures it properly
    // Do not log 404s or 401s as critical errors, but do log 500s
    if (httpStatus >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : exception, 'Unhandled Exception');
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
