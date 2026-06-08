import Link from "next/link";

// Marketing landing — the public face of RiyadaIntel. Full-bleed (outside the app sidebar).
const PROVIDERS = ["GO1", "OpenSesame", "Microsoft Learn", "AWS Skill Builder", "Coursera", "LinkedIn Learning", "Udemy", "Skillsoft", "O'Reilly", "Cybrary"];

const LAYERS = [
  { t: "Skills Intelligence", d: "A living Skills Graph maps people, roles, courses and certifications — and finds every gap." },
  { t: "Career Intelligence", d: "Pick a target role; get a prerequisite-ordered roadmap with time and cost." },
  { t: "Compliance Intelligence", d: "ISO, GDPR, NIS2, SOC2 and more — green / amber / red, with audit readiness." },
  { t: "Certification Intelligence", d: "Track expiries, CPD and renewals; automate reminders before they lapse." },
  { t: "AI Recommendation Engine", d: "Every assignment is explainable — the system tells you the why." },
  { t: "Content Aggregation Hub", d: "One catalog across every major provider and your own internal knowledge." },
];

export default function Landing() {
  return (
    <div>
      {/* nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">Riyada<span className="text-brand">Intel</span></span>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/catalog" className="text-muted hover:text-fg">Catalog</Link>
          <Link href="/login" className="text-muted hover:text-fg">Log in</Link>
          <Link href="/learner" className="rounded-lg bg-brand px-4 py-2 font-medium text-white">Launch platform</Link>
        </nav>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-16 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand">AI-Powered Workforce Intelligence Platform</p>
        <h1 className="mx-auto mt-5 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight">
          Stop buying courses.<br />Start closing gaps.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          RiyadaIntel connects skills, compliance, certifications, careers and learning from every
          major training provider into a single intelligence layer — and tells you who needs what
          training, and why.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/learner" className="rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white">Explore the platform →</Link>
          <Link href="/catalog" className="rounded-lg border border-border px-5 py-3 text-sm font-medium hover:bg-card">Browse the course catalog</Link>
        </div>
        <p className="mt-10 text-xs uppercase tracking-widest text-muted">Aggregates every major provider</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          {PROVIDERS.map((p) => <span key={p}>{p}</span>)}
        </div>
      </section>

      {/* moat */}
      <section className="border-y border-border bg-card/40 py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">The content is not the moat.</h2>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-brand">The intelligence layer is.</p>
          <p className="mt-4 text-muted">Everyone can resell the same courses. RiyadaIntel owns the Skills Graph, the gap analysis, and the compliance, certification and career reasoning that turn a catalog into workforce readiness.</p>
        </div>
      </section>

      {/* layers */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {LAYERS.map((l) => (
            <div key={l.t} className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-medium">{l.t}</h3>
              <p className="mt-2 text-sm text-muted">{l.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">See it on live data</h2>
          <p className="max-w-xl text-muted">A seeded demo organization is loaded — explore the learner dashboard, the aggregated catalog, compliance and RIYADA AI.</p>
          <Link href="/login" className="mt-2 rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white">Log in to the demo →</Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        RiyadaIntel · AI-Powered Workforce Intelligence · Middle East · Europe · Africa · Asia
      </footer>
    </div>
  );
}
