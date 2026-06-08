import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import type { Response } from "express";
import { DomainError } from "@riyada/shared";

/** Maps DomainError + HttpException to RFC-7807 problem+json. */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof DomainError) {
      return res.status(exception.status).json({
        type: `https://riyadaintel.com/errors/${exception.code}`,
        title: exception.code,
        status: exception.status,
        detail: exception.message,
        errors: exception.detail,
      });
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return res.status(status).json({
        type: "about:blank",
        title: exception.name,
        status,
        detail: exception.message,
      });
    }
    // eslint-disable-next-line no-console
    console.error(exception);
    return res.status(500).json({ type: "about:blank", title: "internal_error", status: 500 });
  }
}
