import React from 'react';
import { Link } from 'react-router-dom';
import {
  IconBuilding,
  IconClock,
  IconGitHub,
  IconGlobe,
  IconLinkedIn,
  IconLock,
  IconMail,
  IconMapPin,
} from './Icons';

/* ════════════════════════════════════════════════════════
   FOOTER — Smart Campus Hub · Industry-grade
   Dark glassmorphism, animated grid, real content
════════════════════════════════════════════════════════ */

const footerCss = `
  .ft-root {
    position: relative;
    background: #060812;
    color: #e8ecff;
    overflow: hidden;
    z-index: 1;
  }

  /* ── Top image strip ── */
  .ft-img-strip {
    position: relative;
    width: 100%;
    height: 260px;
    overflow: hidden;
  }
  .ft-img-strip img {
    width: 100%; height: 100%;
    object-fit: cover;
    filter: brightness(.28) saturate(1.4);
  }
  .ft-img-strip::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 30%, #060812 100%);
  }
  .ft-img-strip-label {
    position: absolute; bottom: 28px; left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    text-align: center;
  }
  .ft-img-strip-label h2 {
    font-family: 'DM Sans', sans-serif;
    font-size: clamp(1.35rem, 3.2vw, 2.2rem);
    font-weight: 700;
    letter-spacing: -1px;
    color: #fff;
    white-space: nowrap;
  }
  .ft-img-strip-label h2 span {
    background: linear-gradient(90deg, #4f6fff, #00e5c3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* ── Animated grid background ── */
  .ft-grid {
    position: absolute; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(79,111,255,.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(79,111,255,.05) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse 100% 80% at 50% 0%, black 0%, transparent 80%);
  }

  /* ── Top glow line ── */
  .ft-glow-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(79,111,255,.55), rgba(0,229,195,.4), transparent);
    position: relative; z-index: 2;
  }

  /* ── Main footer body ── */
  .ft-body {
    position: relative; z-index: 2;
    max-width: 1180px;
    margin: 0 auto;
    padding: 60px 40px 40px;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 48px;
  }

  /* brand col */
  .ft-brand-logo {
    display: flex; align-items: center; gap: 12px; margin-bottom: 18px;
  }
  .ft-logo-icon {
    width: 42px; height: 42px; border-radius: 12px;
    background: linear-gradient(135deg, #4f6fff, #00e5c3);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem;
    color: #ffffff;
    line-height: 0;
    box-shadow: 0 0 20px rgba(79,111,255,.4);
    flex-shrink: 0;
  }
  .ft-logo-icon svg { display: block; }
  .ft-logo-text {
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 1.05rem;
    color: #e8ecff;
    line-height: 1.2;
  }
  .ft-logo-sub {
    font-size: .65rem;
    color: #6b7599;
    font-weight: 400;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .ft-brand-desc {
    font-size: .88rem;
    color: #6b7599;
    line-height: 1.78;
    margin-bottom: 24px;
  }

  /* status badge */
  .ft-status {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 14px; border-radius: 100px;
    background: rgba(0,229,195,.08);
    border: 1px solid rgba(0,229,195,.22);
    font-size: .73rem; font-weight: 600;
    color: #00e5c3; letter-spacing: .05em;
  }
  .ft-status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #00e5c3;
    box-shadow: 0 0 8px #00e5c3;
    animation: ftpulse 2s ease-in-out infinite;
  }
  @keyframes ftpulse { 0%,100%{opacity:1} 50%{opacity:.35} }

  /* social icons */
  .ft-socials {
    display: flex; gap: 10px; margin-top: 24px;
  }
  .ft-social-btn {
    width: 38px; height: 38px; border-radius: 10px;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(99,130,255,.18);
    display: flex; align-items: center; justify-content: center;
    line-height: 0;
    color: #6b7599; font-size: .95rem;
    text-decoration: none;
    transition: background .2s, color .2s, border-color .2s, transform .2s;
  }
  .ft-social-btn svg { display:block; }
  .ft-social-btn:hover {
    background: rgba(79,111,255,.18);
    border-color: rgba(79,111,255,.5);
    color: #a3b5ff;
    transform: translateY(-3px);
  }

  /* nav cols */
  .ft-col-title {
    font-family: 'DM Sans', sans-serif;
    font-size: .78rem; font-weight: 700;
    color: #e8ecff;
    text-transform: uppercase; letter-spacing: .12em;
    margin-bottom: 20px;
    position: relative;
    padding-bottom: 10px;
  }
  .ft-col-title::after {
    content: '';
    position: absolute; left: 0; bottom: 0;
    width: 24px; height: 2px;
    background: linear-gradient(90deg, #4f6fff, #00e5c3);
    border-radius: 2px;
  }

  .ft-nav-list {
    list-style: none;
    display: flex; flex-direction: column; gap: 10px;
  }
  .ft-nav-list a {
    font-size: .875rem;
    color: #6b7599;
    text-decoration: none;
    display: flex; align-items: center; gap: 6px;
    transition: color .2s, gap .2s;
  }
  .ft-nav-list a::before {
    content: '›';
    font-size: .8rem;
    opacity: 0;
    transition: opacity .2s;
  }
  .ft-nav-list a:hover { color: #a3b5ff; gap: 10px; }
  .ft-nav-list a:hover::before { opacity: 1; }

  /* contact info items */
  .ft-contact-item {
    display: flex; align-items: flex-start; gap: 10px;
    margin-bottom: 12px;
  }
  .ft-contact-icon {
    width: 28px; height: 28px; border-radius: 8px;
    background: rgba(79,111,255,.12);
    border: 1px solid rgba(79,111,255,.22);
    display: flex; align-items: center; justify-content: center;
    color: #a3b5ff;
    line-height: 0;
    font-size: .75rem; flex-shrink: 0; margin-top: 1px;
  }
  .ft-contact-icon svg { display:block; }
  .ft-contact-text { font-size: .82rem; color: #6b7599; line-height: 1.5; }
  .ft-contact-text strong { display: block; color: #a3b5ff; font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 1px; }

  /* ── Divider ── */
  .ft-divider {
    position: relative; z-index: 2;
    max-width: 1180px; margin: 0 auto;
    padding: 0 40px;
  }
  .ft-divider hr {
    border: none;
    border-top: 1px solid rgba(99,130,255,.13);
  }

  /* ── Bottom bar ── */
  .ft-bottom {
    position: relative; z-index: 2;
    max-width: 1180px; margin: 0 auto;
    padding: 20px 40px 36px;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
  }
  .ft-copyright {
    font-size: .8rem; color: #6b7599;
    display: flex; align-items: center; gap: 6px;
  }
  .ft-copyright a { color: #a3b5ff; text-decoration: none; transition: color .2s; }
  .ft-copyright a:hover { color: #00e5c3; }

  .ft-badges {
    display: flex; gap: 8px; flex-wrap: wrap;
  }
  .ft-badge {
    font-size: .65rem; padding: 4px 10px; border-radius: 100px;
    font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.09);
    color: #6b7599;
  }
  .ft-badge.accent { background: rgba(79,111,255,.12); border-color: rgba(79,111,255,.28); color: #a3b5ff; }

  .ft-legal-links {
    display: flex; gap: 18px;
  }
  .ft-legal-links a {
    font-size: .78rem; color: #6b7599; text-decoration: none;
    transition: color .2s;
  }
  .ft-legal-links a:hover { color: #a3b5ff; }


  /* ── Responsive ── */
  @media (max-width: 900px) {
    .ft-body {
      grid-template-columns: 1fr 1fr;
      gap: 36px;
    }
  }
  @media (max-width: 580px) {
    .ft-body {
      grid-template-columns: 1fr;
      padding: 40px 24px 28px;
    }
    .ft-bottom {
      flex-direction: column; align-items: flex-start;
      padding: 16px 24px 32px;
    }
    .ft-img-strip { height: 180px; }
    .ft-img-strip-label h2 { font-size: 1.2rem; }
  }
`;

const Footer = () => {
  return (
    <>
      <style>{footerCss}</style>
      <footer className="ft-root">
        <div className="ft-grid" />

        {/* ── Campus image strip ── */}
        <div className="ft-img-strip">
          <img
            src="https://i.imgur.com/2y7fRN7.jpeg"
            alt="SLIIT Campus"
          />
          <div className="ft-img-strip-label">
            <h2>Smart Campus Hub &nbsp;<span>· SLIIT</span></h2>
          </div>
        </div>

        <div className="ft-glow-line" />

        {/* ── Main grid ── */}
        <div className="ft-body">

          {/* Brand */}
          <div>
            <div className="ft-brand-logo">
              <div className="ft-logo-icon"><IconBuilding size={22} /></div>
              <div>
                <div className="ft-logo-text">Smart Campus Hub</div>
                <div className="ft-logo-sub">SLIIT · IT3030</div>
              </div>
            </div>
            <p className="ft-brand-desc">
              A unified operations platform serving SLIIT's students, staff, and
              administrators. Streamlining facility bookings, asset management, and
              incident resolution under one secure roof.
            </p>
            <div className="ft-status">
              <span className="ft-status-dot" />
              All systems operational
            </div>
            <div className="ft-socials">
              {[
                { icon: <IconLinkedIn size={18} />, href: 'https://www.linkedin.com', label: 'LinkedIn' },
                { icon: <IconGitHub size={18} />, href: 'https://github.com', label: 'GitHub' },
                { icon: <IconMail size={18} />, href: 'mailto:support@smartcampus.sliit.lk', label: 'Email' },
                { icon: <IconGlobe size={18} />, href: 'https://sliit.lk', label: 'SLIIT' },
              ].map(s => (
                <a key={s.label} href={s.href} className="ft-social-btn" aria-label={s.label} title={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <div className="ft-col-title">Platform</div>
            <ul className="ft-nav-list">
              <li><Link to="/dashboard/resources">Resource Catalogue</Link></li>
              <li><Link to="/dashboard/bookings">My Bookings</Link></li>
              <li><Link to="/dashboard/incidents">Incident Tickets</Link></li>
              <li><Link to="/dashboard/notifications">Notifications</Link></li>
              <li><Link to="/dashboard/analytics">Analytics</Link></li>
              <li><Link to="/login">Sign In</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <div className="ft-col-title">Support</div>
            <ul className="ft-nav-list">
              <li><Link to="/contact">Contact Support</Link></li>
              <li><a href="/user-guide">User Guide</a></li>
              <li><a href="/admin-handbook">Admin Handbook</a></li>
              <li><a href="/api-reference">API Reference</a></li>
              <li><a href="/report-bug">Report a Bug</a></li>
              <li><a href="/system-status">System Status</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="ft-col-title">Contact</div>
            <div className="ft-contact-item">
              <div className="ft-contact-icon"><IconMapPin size={16} /></div>
              <div className="ft-contact-text">
                <strong>Location</strong>
                SLIIT, Malabe,<br />Sri Lanka
              </div>
            </div>
            <div className="ft-contact-item">
              <div className="ft-contact-icon"><IconMail size={16} /></div>
              <div className="ft-contact-text">
                <strong>Email</strong>
                support@smartcampus.sliit.lk
              </div>
            </div>
            <div className="ft-contact-item">
              <div className="ft-contact-icon"><IconClock size={16} /></div>
              <div className="ft-contact-text">
                <strong>Support Hours</strong>
                Mon – Fri, 8 AM – 6 PM
              </div>
            </div>
            <div className="ft-contact-item">
              <div className="ft-contact-icon"><IconLock size={16} /></div>
              <div className="ft-contact-text">
                <strong>Auth</strong>
                OAuth 2.0 · Google Sign-In
              </div>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="ft-divider"><hr /></div>

        {/* ── Bottom bar ── */}
        <div className="ft-bottom">
          <div className="ft-copyright">
            © 2026 Smart Campus Hub · SLIIT &nbsp;·&nbsp;
            Designed &amp; built for &nbsp;<a href="https://sliit.lk" target="_blank" rel="noreferrer">IT3030</a>
          </div>
          <div className="ft-badges">
            <span className="ft-badge accent">Spring Boot</span>
            <span className="ft-badge accent">React 18</span>
            <span className="ft-badge">REST API</span>
            <span className="ft-badge">JWT Auth</span>
            <span className="ft-badge">MySQL</span>
          </div>
          <div className="ft-legal-links">
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms-of-use">Terms of Use</a>
            <a href="/accessibility">Accessibility</a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
