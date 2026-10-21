function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default function PseudoQr({ value, size = 180 }) {
  const modules = 25;
  const cell = size / modules;
  let state = hashSeed(String(value || 'lebah'));
  const rand = () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };

  const cells = [];
  const isFinder = (r, c) => {
    const inBox = (r0, c0) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
    return inBox(0, 0) || inBox(0, modules - 7) || inBox(modules - 7, 0);
  };

  for (let r = 0; r < modules; r += 1) {
    for (let c = 0; c < modules; c += 1) {
      if (isFinder(r, c)) continue;
      if (rand() > 0.52) cells.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#111" />);
    }
  }

  const finder = (r0, c0) => (
    <g key={`f-${r0}-${c0}`}>
      <rect x={c0 * cell} y={r0 * cell} width={cell * 7} height={cell * 7} fill="#111" />
      <rect x={(c0 + 1) * cell} y={(r0 + 1) * cell} width={cell * 5} height={cell * 5} fill="#fff" />
      <rect x={(c0 + 2) * cell} y={(r0 + 2) * cell} width={cell * 3} height={cell * 3} fill="#16a65c" />
    </g>
  );

  return (
    <svg className="qr-frame" viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Kode QR simulasi pembayaran">
      <rect width={size} height={size} fill="#fff" />
      {cells}
      {finder(0, 0)}
      {finder(0, modules - 7)}
      {finder(modules - 7, 0)}
    </svg>
  );
}
