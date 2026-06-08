import { Injectable } from "@nestjs/common";
import { getTenantContext } from "@riyada/shared";
import { PrismaService } from "../../common/prisma/prisma.service";

/** Skills-aware marketplace: products (courses/bundles/paths/subscriptions/tracks), orders, and
 *  checkout. Payment capture is a Stripe/invoice seam; the order + payment records are real. */
@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(kind?: string, q?: string) {
    const { tenantId } = getTenantContext();
    return this.prisma.db.product.findMany({
      where: { tenantId, ...(kind ? { kind } : {}), ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) },
      take: 100,
    });
  }

  async checkout(items: { productId: string; quantity: number }[]) {
    const { tenantId, organizationId } = getTenantContext();
    const products = await this.prisma.db.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, tenantId },
    });
    const priceById = new Map(products.map((p) => [p.id, p.priceCents]));
    const currency = products[0]?.currency ?? "USD";
    const totalCents = items.reduce((sum, i) => sum + (priceById.get(i.productId) ?? 0) * i.quantity, 0);

    const order = await this.prisma.db.order.create({
      data: {
        tenantId,
        organizationId,
        totalCents,
        currency,
        status: "pending",
        items: {
          create: items.map((i) => ({ productId: i.productId, quantity: i.quantity, priceCents: priceById.get(i.productId) ?? 0 })),
        },
        // Payment capture seam: a Stripe PaymentIntent / invoice would be created here.
        payments: { create: { provider: "invoice", amountCents: totalCents, currency, status: "pending" } },
      },
      include: { items: true, payments: true },
    });
    return order;
  }
}
