# @riyada/web — Next.js 15 frontend

App Router, TypeScript, Tailwind + ShadCN, Framer Motion. Dark/light mode, English + Arabic
with full RTL. Design system in docs/04-product-and-design.md.

```
apps/web/src/
├── app/
│   ├── (marketing)/            # riyadaintel.com public site
│   ├── (auth)/                 # Keycloak OIDC login/callback
│   └── (app)/
│       ├── learner/            # my learning, recommendations, certs, career studio
│       ├── manager/            # team skills heatmap, assignments, approvals
│       ├── compliance/         # green/amber/red dashboard, audit readiness
│       ├── admin/              # org settings, providers, RBAC, branding (white-label)
│       ├── marketplace/        # browse/search, AI matching
│       └── ai/                 # RIYADA AI assistant surface
├── components/                 # ShadCN-based design system components
├── lib/                        # api client, i18n, rtl, theme
└── locales/                    # en, ar
```

Dashboards (Platform, Organization, Compliance, Finance, Manager, Provider, Learner) are
composed from a shared `<MetricCard>` / `<RiskBadge>` / `<TrendChart>` kit so a new dashboard is
a layout, not a rebuild. PWA + offline learning via service worker; architecture is ready for
React Native (iOS/Android) reusing `lib/` and the API client.
