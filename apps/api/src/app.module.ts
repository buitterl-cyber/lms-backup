import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { PrismaModule } from "./common/prisma/prisma.module";
import { TenantMiddleware } from "./common/tenant/tenant.middleware";
import { AuditInterceptor } from "./common/audit/audit.interceptor";
import { HealthController } from "./common/health.controller";
import { DemoModule } from "./modules/demo/demo.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JobsModule } from "./jobs/jobs.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { SkillsModule } from "./modules/skills/skills.module";
import { WorkforceModule } from "./modules/workforce/workforce.module";
import { RecommendationsModule } from "./modules/recommendations/recommendations.module";
import { ComplianceModule } from "./modules/compliance/compliance.module";
import { CertificationModule } from "./modules/certification/certification.module";
import { CareerModule } from "./modules/career/career.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { EnrollmentModule } from "./modules/enrollment/enrollment.module";
import { AssessmentsModule } from "./modules/assessments/assessments.module";
import { ProvidersModule } from "./modules/providers/providers.module";
import { MarketplaceModule } from "./modules/marketplace/marketplace.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ReportingModule } from "./modules/reporting/reporting.module";
import { AiModule } from "./modules/ai/ai.module";

@Module({
  imports: [
    PrismaModule,
    JobsModule,
    IdentityModule,
    SkillsModule,
    WorkforceModule,
    RecommendationsModule,
    ComplianceModule,
    CertificationModule,
    CareerModule,
    CatalogModule,
    EnrollmentModule,
    AssessmentsModule,
    ProvidersModule,
    MarketplaceModule,
    NotificationsModule,
    ReportingModule,
    AiModule,
    DemoModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Applies to every route; the middleware itself lets public paths (health, demo bootstrap)
    // through (NestJS 11 / path-to-regexp v8 makes .exclude() with a global prefix unreliable).
    consumer.apply(TenantMiddleware).forRoutes("{*path}");
  }
}
