import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { DomainExceptionFilter } from "./common/filters/domain-exception.filter";
import { recordError } from "./common/errors/error-log";

// Safety net for errors outside the request lifecycle (background jobs, timers, unawaited
// promises) — the DomainExceptionFilter only sees errors thrown during a request. PM2 will still
// restart the process on a genuine crash; this just makes sure we hear about it too.
process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  // eslint-disable-next-line no-console
  console.error("[unhandledRejection]", err);
  void recordError({ source: "api", message: err.message, stack: err.stack, statusCode: 500, meta: { kind: "unhandledRejection" } });
});
process.on("uncaughtException", (err) => {
  // eslint-disable-next-line no-console
  console.error("[uncaughtException]", err);
  void recordError({ source: "api", message: err.message, stack: err.stack, statusCode: 500, meta: { kind: "uncaughtException" } });
});

async function bootstrap() {
  // rawBody: true so provider webhook signature verification (HMAC over exact request bytes,
  // not our re-serialized JSON) has something to check against — see providers/webhooks/*.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use(helmet());
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? true, credentials: true });
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new DomainExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle("Riyada Intelligence API")
    .setDescription("AI-Powered Workforce Intelligence Platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Riyada Intelligence API on :${port} (docs at /api/docs)`);
}
bootstrap();
