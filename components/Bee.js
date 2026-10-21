export default function Bee({ size = 72, className = '', label = 'Leba si maskot lebah' }) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 120 96"
      width={size}
      height={size * 0.8}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="60" cy="62" rx="30" ry="24" fill="#f5b301" />
      <path d="M42 44c6 4 6 32 0 36" stroke="#2b2113" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M60 38c6 6 6 44 0 48" stroke="#2b2113" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M78 44c6 4 6 32 0 36" stroke="#2b2113" strokeWidth="7" strokeLinecap="round" fill="none" />
      <ellipse cx="30" cy="34" rx="21" ry="13" fill="#16a65c" opacity="0.55" transform="rotate(-24 30 34)" />
      <ellipse cx="90" cy="34" rx="21" ry="13" fill="#16a65c" opacity="0.55" transform="rotate(24 90 34)" />
      <circle cx="60" cy="26" r="15" fill="#ffd35c" />
      <circle cx="54" cy="24" r="2.6" fill="#2b2113" />
      <circle cx="66" cy="24" r="2.6" fill="#2b2113" />
      <path d="M54 31c4 3 8 3 12 0" stroke="#2b2113" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M52 12c-4-5-10-5-13-1" stroke="#2b2113" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M68 12c4-5 10-5 13-1" stroke="#2b2113" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="38" cy="10" r="3" fill="#16a65c" />
      <circle cx="82" cy="10" r="3" fill="#16a65c" />
      <path d="M96 66c8 0 12 6 12 12" stroke="#c98a00" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function HexPattern({ opacity = 0.35 }) {
  return (
    <svg className="hexes" aria-hidden="true" width="100%" height="100%" viewBox="0 0 600 260" preserveAspectRatio="none">
      <g fill="none" stroke="#fff" strokeWidth="2" opacity={opacity}>
        {[0, 1, 2, 3, 4, 5].map((col) =>
          [0, 1, 2, 3].map((row) => {
            const x = 40 + col * 108;
            const y = 40 + row * 66 + (col % 2 ? 33 : 0);
            return <polygon key={`${col}-${row}`} points={`${x},${y - 30} ${x + 26},${y - 15} ${x + 26},${y + 15} ${x},${y + 30} ${x - 26},${y + 15} ${x - 26},${y - 15}`} />;
          }),
        )}
      </g>
    </svg>
  );
}
