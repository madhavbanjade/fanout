function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

export const MentionIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-4 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const CommentIcon = () => (
  <Svg>
    <path
      d="M4 5h16v11H8l-4 4V5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PersonIcon = () => (
  <Svg>
    <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const TruckIcon = () => (
  <Svg>
    <path d="M3 7h11v9H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M14 10h4l3 3v3h-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="7.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="17.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" />
  </Svg>
);

export const PackageIcon = () => (
  <Svg>
    <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M4 7.5 12 12l8-4.5M12 12v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </Svg>
);

export const ClockIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ShieldIcon = () => (
  <Svg>
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </Svg>
);

export const RefreshIcon = () => (
  <Svg>
    <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M18 4v4h-4M6 20v-4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MoonIcon = () => (
  <Svg>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </Svg>
);
