function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

export const EyeOpenIcon = () => (
  <Svg>
    <path
      d="M2.4 10.1C3.4 8.3 6.8 4 12 4s8.6 4.3 9.6 6.1a1.8 1.8 0 0 1 0 1.8C20.6 13.7 17.2 18 12 18S3.4 13.7 2.4 11.9a1.8 1.8 0 0 1 0-1.8Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="12" cy="11" r="3" stroke="currentColor" strokeWidth="1.6" />
  </Svg>
);

export const EyeClosedIcon = () => (
  <Svg>
    <path
      d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.9 10.9 0 0 1 12 4c5.2 0 8.6 4.3 9.6 6.1a1.8 1.8 0 0 1 0 1.8 16.1 16.1 0 0 1-3.1 3.8M6.6 6.6a16.6 16.6 0 0 0-4.2 3.5 1.8 1.8 0 0 0 0 1.8C3.5 13.7 6.8 18 12 18c.8 0 1.5-.1 2.2-.3"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
