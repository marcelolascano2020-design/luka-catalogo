import { useState, useEffect, useRef } from 'react';

const IMAGES = [
  'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800',
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800',
  'https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=800',
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);
  const timer = useRef(null);

  const next = () => setCurrent(i => (i + 1) % IMAGES.length);

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(next, 3000);
    return () => clearInterval(timer.current);
  }, [paused]);

  return (
    <div style={{
      display: 'none',        // overridden to 'block' by media query below
      padding: '0 16px 16px',
    }}
      className="luka-hero-carousel"
    >
      {/* Track */}
      <div
        style={{ position: 'relative', height: 200, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'opacity 0.5s ease',
              opacity: i === current ? 1 : 0,
            }}
          />
        ))}
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Imagen ${i + 1}`}
            style={{
              width: i === current ? 20 : 8,
              height: 8, borderRadius: 999, border: 'none', padding: 0, cursor: 'pointer',
              background: i === current ? '#F5C842' : '#D1C4B8',
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>

      <style>{`
        @media (max-width: 980px) { .luka-hero-carousel { display: block !important; } }
      `}</style>
    </div>
  );
}
