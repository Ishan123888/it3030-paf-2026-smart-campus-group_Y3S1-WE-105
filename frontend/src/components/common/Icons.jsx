import React from 'react';

const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
});

function Svg({ size = 20, className, children, ...props }) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export function IconBell(props) {
  return (
    <Svg {...props}>
      <path
        d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M18 16V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconChevronDown(props) {
  return (
    <Svg {...props}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconChevronLeft(props) {
  return (
    <Svg {...props}>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconChevronRight(props) {
  return (
    <Svg {...props}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconMenu(props) {
  return (
    <Svg {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconX(props) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconShield(props) {
  return (
    <Svg {...props}>
      <path
        d="M12 2l8 4v6c0 5-3.4 9.5-8 10-4.6-.5-8-5-8-10V6l8-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCalendar(props) {
  return (
    <Svg {...props}>
      <path
        d="M7 3v3M17 3v3M4.5 9.5h15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 6h11A2.5 2.5 0 0 1 20 8.5v10A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-10A2.5 2.5 0 0 1 6.5 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconBuilding(props) {
  return (
    <Svg {...props}>
      <path
        d="M4 21V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8 8h2M8 12h2M8 16h2M12 8h2M12 12h2M12 16h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2.5 21h19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconWrench(props) {
  return (
    <Svg {...props}>
      <path
        d="M21 6.5a5 5 0 0 1-7 4.6L8.6 16.5a2 2 0 0 1-2.9 0l-0.2-0.2a2 2 0 0 1 0-2.9l5.4-5.4A5 5 0 0 1 17.5 3l-2.1 2.1 3.5 3.5L21 6.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconChart(props) {
  return (
    <Svg {...props}>
      <path d="M4 19V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 16v-5M12 16v-8M16 16v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconMapPin(props) {
  return (
    <Svg {...props}>
      <path
        d="M12 22s7-4.5 7-12a7 7 0 1 0-14 0c0 7.5 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.8" />
    </Svg>
  );
}

export function IconClock(props) {
  return (
    <Svg {...props}>
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconLock(props) {
  return (
    <Svg {...props}>
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v6A2.5 2.5 0 0 1 17.5 22h-11A2.5 2.5 0 0 1 4 19.5v-6A2.5 2.5 0 0 1 6.5 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 15v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconMail(props) {
  return (
    <Svg {...props}>
      <path
        d="M4.5 7.5h15v9h-15v-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M5 8l7 6 7-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconGlobe(props) {
  return (
    <Svg {...props}>
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 12h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M12 2c3 3 3 17 0 20-3-3-3-17 0-20Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconLinkedIn(props) {
  return (
    <Svg {...props}>
      <path
        d="M6.5 9.5V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 6.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="currentColor"
      />
      <path
        d="M10.5 18v-4.4c0-1.8 1-3.1 2.7-3.1 1.7 0 2.8 1.3 2.8 3.1V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.5 10v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconGitHub(props) {
  return (
    <Svg {...props}>
      <path
        d="M9 19c-4 1.5-4-2-5-2m10 4v-3c0-.8.3-1.5.8-2-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.2 1.2a10.8 10.8 0 0 1 5.8 0C17.9 3.3 19 3.6 19 3.6c.6 1.7.2 3 .1 3.3.8.9 1.2 2 1.2 3.3 0 4.4-2.7 5.4-5.3 5.7.5.5.9 1.3.9 2.5V21"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

