/**
 * Event bus abstraction over RabbitMQ (topic exchange `riyada.events`). Producers publish via the
 * transactional outbox (so a DB commit and an event never diverge); consumers are idempotent and
 * dead-lettered on repeated failure. This interface lets the modules stay broker-agnostic and lets
 * tests use an in-memory bus. See docs/01 §19 for the event catalog.
 */
import { Injectable } from "@nestjs/common";

export interface DomainEvent<T = unknown> {
  type: string; // e.g. "enrollment.completed"
  tenantId: string;
  payload: T;
  occurredAt: Date;
}

export type EventHandler = (e: DomainEvent) => Promise<void>;

@Injectable()
export class EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  on(type: string, handler: EventHandler) {
    const list = this.handlers.get(type) ?? [];
    list.push(handler);
    this.handlers.set(type, list);
  }

  /** In production: write to the outbox table in the same tx, then a relay publishes to RabbitMQ.
   *  In-process delivery here keeps the event-driven shape testable without the broker. */
  async publish(event: DomainEvent): Promise<void> {
    for (const handler of this.handlers.get(event.type) ?? []) {
      try {
        await handler(event);
      } catch (err) {
        // dead-letter + retry-with-backoff in production; logged here.
        // eslint-disable-next-line no-console
        console.error(`event handler failed for ${event.type}`, err);
      }
    }
  }
}
