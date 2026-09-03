import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import type { Request, Response } from "express";
import { DomainError } from "@riyada/shared";
import { recordError } from "../errors/error-log";

/** Maps DomainError + HttpException to RFC-7807 problem+json. Also the single choke point every
 *  unhandled backend exception passes through (this filter is @Catch() with no type argument), so
 *  it doubles as basic error monitoring: every exception is logged to ErrorLog, and anything at
 *  or above 500 — a real bug, not an expected validation rejection — triggers an email alert
 *  (see error-log.ts for the throttling). This is what would have surfaced the Team Dashboard
 *  failure proactively instead of it sitting silent until someone clicked the page. */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof DomainError) {
      void recordError({
        source: "api", message: exception.message, path: req.originalUrl, method: req.method,
        statusCode: exception.status, meta: { code: exception.code },
      });
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
      void recordError({
        source: "api", message: exception.message, path: req.originalUrl, method: req.method,
        statusCode: status,
      });
      return res.status(status).json({
        type: "about:blank",
        title: exception.name,
        status,
        detail: exception.message,
      });
    }
    const err = exception instanceof Error ? exception : new Error(String(exception));
    // eslint-disable-next-line no-console
    console.error(exception);
    void recordError({
      source: "api", message: err.message, stack: err.stack, path: req.originalUrl,
      method: req.method, statusCode: 500,
    });
    return res.status(500).json({ type: "about:blank", title: "internal_error", status: 500 });
  }
}
