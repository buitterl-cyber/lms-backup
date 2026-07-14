import { Injectable, Logger } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outbound email transport for nudges, sales inquiries, and notification fan-out.
 * Config is env-driven (SMTP_HOST/PORT/USER/PASS/FROM in .env, loaded by ecosystem.config.js).
 * With no SMTP_HOST configured it degrades to log-only so nothing in the product blocks on mail.
 */
@Injectable()
export class MailerService {
  private readonly log = new Logger(MailerService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    this.from = process.env.SMTP_FROM || process.env.SMTP_USER || "lms@excis.com";
    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
          // Internal relay is reached by LAN IP, so the cert CN can't match; opt-in relaxation.
          tls: process.env.SMTP_TLS_INSECURE === "true" ? { rejectUnauthorized: false } : undefined,
        })
      : null;
  }

  /** Send; never throws (delivery failure must not fail the triggering request). */
  async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      this.log.log(`[log-only] to=${to} subject="${subject}"`);
      return false;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      return true;
    } catch (err) {
      this.log.warn(`send to=${to} failed: ${(err as Error).message}`);
      return false;
    }
  }
}
