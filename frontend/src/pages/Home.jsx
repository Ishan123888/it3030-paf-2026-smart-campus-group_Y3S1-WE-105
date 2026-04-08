import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  IconBuilding,
  IconCalendar,
  IconChart,
  IconChevronLeft,
  IconChevronRight,
  IconShield,
  IconWrench,
} from '../components/common/Icons';

function toImgurDirect(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  const match = trimmed.match(/imgur\.com\/([a-zA-Z0-9]+)(\.[a-zA-Z0-9]+)?/);
  if (!match) return trimmed;
  const id = match[1];
  const ext = match[2] || '.jpg';
  return `https://i.imgur.com/${id}${ext}`;
}

const HERO_SLIDES = [
  toImgurDirect('https://imgur.com/xDZVwip'),
  toImgurDirect('https://imgur.com/HYrM29J'),
  toImgurDirect('https://imgur.com/HYrM29J'),
];

const SPLIT_IMAGE = HERO_SLIDES[1] || '/home-split.jpg';

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <div className="text-xs font-extrabold tracking-[0.22em] text-[var(--accent2)] uppercase">{eyebrow}</div>
      ) : null}
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-3xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-sm leading-7 text-[var(--muted)] sm:text-base">{subtitle}</p> : null}
    </div>
  );
}

function ImageCover({ src, alt, className }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return <div className={['bg-gradient-to-br from-slate-900/40 via-slate-900/20 to-transparent', className].join(' ')} />;
  }
  return <img src={src} alt={alt} className={className} onError={() => setOk(false)} />;
}

const Home = () => {
  const services = useMemo(
    () => [
      {
        icon: <IconBuilding size={20} />,
        title: 'Facilities & Assets',
        desc: 'Discover spaces and equipment with availability-first browsing.',
        to: '/dashboard/resources',
      },
      {
        icon: <IconCalendar size={20} />,
        title: 'Bookings',
        desc: 'Request, track, and manage approvals with a clear audit trail.',
        to: '/dashboard/bookings',
      },
      {
        icon: <IconWrench size={20} />,
        title: 'Incident Tickets',
        desc: 'Report issues, follow progress, and close tickets with confidence.',
        to: '/dashboard/incidents',
      },
    ],
    [],
  );

  const highlights = useMemo(
    () => [
      { no: '01', title: 'Fast Requests', desc: 'Create bookings and tickets in seconds with structured forms.' },
      { no: '02', title: 'Clear Workflow', desc: 'Statuses, approvals, and notifications stay transparent end-to-end.' },
      { no: '03', title: 'Role Security', desc: 'Admin/user permissions designed for campus operations.' },
    ],
    [],
  );

  const modules = useMemo(
    () => [
      { icon: <IconShield size={18} />, title: 'Role-Based Access', desc: 'Secure access paths for staff and students.' },
      { icon: <IconChart size={18} />, title: 'Analytics', desc: 'Operational visibility across bookings and incidents.' },
      { icon: <IconCalendar size={18} />, title: 'Smart Scheduling', desc: 'Reduce conflicts with predictable approval flows.' },
      { icon: <IconBuilding size={18} />, title: 'Resource Catalogue', desc: 'Keep assets organized and searchable.' },
      { icon: <IconWrench size={18} />, title: 'Maintenance', desc: 'Track issues with owners and resolution history.' },
      { icon: <IconShield size={18} />, title: 'Audit Ready', desc: 'Action trails that help governance and reporting.' },
    ],
    [],
  );

  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [busy, setBusy] = useState(false);

  const goTo = useCallback(
    (idx) => {
      if (busy) return;
      const n = HERO_SLIDES.length;
      if (!n) return;
      const target = ((idx % n) + n) % n;
      if (target === current) return;
      setBusy(true);
      setPrev(current);
      setCurrent(target);
      window.setTimeout(() => {
        setPrev(null);
        setBusy(false);
      }, 850);
    },
    [busy, current],
  );

  const next = useCallback(() => goTo(current + 1), [goTo, current]);
  const back = useCallback(() => goTo(current - 1), [goTo, current]);

  useEffect(() => {
    const id = window.setInterval(() => next(), 5200);
    return () => window.clearInterval(id);
  }, [next]);

  const slideClass = (i) => {
    if (i === current) return 'hero-slide active';
    if (i === prev) return 'hero-slide exit';
    return 'hero-slide enter';
  };

  return (
    <div className="bg-[var(--bg)] text-[var(--text)]">
      {/* Hero */}
      <section className="relative -mt-16 min-h-[78vh] overflow-hidden pt-16">
        <div className="absolute inset-0">
          {HERO_SLIDES.map((src, i) => (
            <div key={src || i} className={slideClass(i)}>
              <ImageCover src={src} alt={`Hero slide ${i + 1}`} className="h-full w-full object-cover" />
            </div>
          ))}
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-[var(--bg)]" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold tracking-wide text-white/85 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[var(--accent2)] shadow-[0_0_16px_var(--accent2)]" />
            Smart Campus Hub · SLIIT
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Take Your Campus Operations <span className="text-[var(--accent2)]">Forward</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            Book facilities, manage assets, and resolve incidents in one secure platform — designed for students, staff,
            and administrators.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent2)] px-5 py-3 text-sm font-extrabold text-[#061018] shadow-[0_14px_40px_rgba(0,229,195,.18)] hover:opacity-95"
            >
              Get Started <IconChevronRight size={18} />
            </Link>
            <a
              href="#what-we-do"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-extrabold text-white/90 backdrop-blur hover:bg-white/10"
            >
              What We Do
            </a>
          </div>

          <div className="mt-10 flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={back}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white/85 backdrop-blur hover:bg-white/10"
            >
              <IconChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-2">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={[
                    'h-2 rounded-full transition',
                    i === current ? 'w-7 bg-[var(--accent2)]' : 'w-2 bg-white/35 hover:bg-white/55',
                  ].join(' ')}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Next slide"
              onClick={next}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white/85 backdrop-blur hover:bg-white/10"
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section id="what-we-do" className="bg-[var(--surface)] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="What We Do"
            title="Everything You Need, In One Place"
            subtitle="A clean workflow for facilities, bookings, and incident resolution — built for day-to-day campus operations."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {services.map((s) => (
              <Link
                key={s.title}
                to={s.to}
                className="card-3d group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_12px_40px_rgba(2,6,23,.06)]"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent2)]/15 text-[var(--accent2)] ring-1 ring-[var(--accent2)]/20">
                  {s.icon}
                </div>
                <div className="mt-4 text-base font-extrabold text-[var(--text)]">{s.title}</div>
                <div className="mt-2 text-sm leading-6 text-[var(--muted)]">{s.desc}</div>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[var(--accent)]">
                  Learn more <IconChevronRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights split */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            <div className="rounded-3xl bg-[#0b1220] p-8 text-white shadow-[0_18px_60px_rgba(0,0,0,.35)]">
              <div className="text-xs font-extrabold tracking-[0.22em] uppercase text-white/60">Why Smart Campus</div>
              <div className="mt-3 text-2xl font-extrabold tracking-tight">Unique, responsive, and functional</div>
              <p className="mt-3 text-sm leading-7 text-white/70">
                A professional user experience with the operational features you need — without clutter.
              </p>

              <div className="mt-8 space-y-6">
                {highlights.map((h) => (
                  <div key={h.no} className="flex gap-4">
                    <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-sm font-extrabold text-[var(--accent2)] ring-1 ring-white/10">
                      {h.no}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold">{h.title}</div>
                      <div className="mt-1 text-sm leading-6 text-white/70">{h.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent2)] px-5 py-3 text-sm font-extrabold text-[#061018] hover:opacity-95"
                >
                  Launch Dashboard <IconChevronRight size={18} />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-extrabold text-white/90 hover:bg-white/10"
                >
                  Contact Support
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,.20)]">
              <ImageCover src={SPLIT_IMAGE} alt="Preview" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs font-bold text-white/85 backdrop-blur">
                  Seamless · Secure · Fast
                </div>
                <div className="mt-3 text-lg font-extrabold text-white">Designed for real campus workflows</div>
                <div className="mt-1 text-sm text-white/75">Simple navigation, clear states, and clean layouts.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules grid */}
      <section className="bg-[var(--surface)] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Modules"
            title="A Platform That Scales"
            subtitle="Choose what you need today, expand tomorrow — everything stays consistent and easy to use."
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, idx) => (
              <div
                key={`${m.title}-${idx}`}
                className="card-3d rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_12px_40px_rgba(2,6,23,.06)]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)] ring-1 ring-[var(--accent)]/18">
                    {m.icon}
                  </div>
                  <div className="text-sm font-extrabold text-[var(--text)]">{m.title}</div>
                </div>
                <div className="mt-3 text-sm leading-6 text-[var(--muted)]">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
