import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';

const DURATION = 2500;  // ms visible
const FADE_MS  = 300;   // ms fade-out

export function useToast() {
  const [toast, setToast] = useState(null); // { name, key }
  const timer = useRef(null);

  const show = (productName) => {
    clearTimeout(timer.current);
    const short = productName.length > 20 ? productName.slice(0, 20).trimEnd() + '…' : productName;
    setToast({ name: short, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), DURATION + FADE_MS);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, showToast: show };
}

export default function Toast({ toast }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) { setVisible(false); return; }
    // Trigger enter on next tick so CSS transition fires
    const raf = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => setVisible(false), DURATION);
    return () => { cancelAnimationFrame(raf); clearTimeout(hide); };
  }, [toast?.key]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 72,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? 0 : -16}px)`,
        zIndex: 200,
        background: '#2B1F14',
        color: '#fff',
        borderRadius: 12,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 8px 32px rgba(43,31,20,0.28)',
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
        pointerEvents: 'none',
      }}
    >
      <span style={{
        width: 24, height: 24, borderRadius: '50%',
        background: '#4ade80', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon.Check s={13} />
      </span>
      <span>
        <span style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>¡Agregado! </span>
        {toast.name}
      </span>
    </div>
  );
}
