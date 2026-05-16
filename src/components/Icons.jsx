export const Icon = {
  Search: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
  ),
  Cart: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="9" cy="21" r="1.5"/><circle cx="18" cy="21" r="1.5"/></svg>
  ),
  Close: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
  ),
  Plus: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
  ),
  Minus: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
  ),
  Whatsapp: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.25-.1-.45-.15-.65.15-.2.3-.7.95-.85 1.15-.15.2-.3.2-.6.05-.3-.15-1.25-.46-2.4-1.48-.9-.8-1.5-1.78-1.65-2.08-.15-.3 0-.46.13-.6.13-.13.3-.34.45-.51.13-.17.18-.3.27-.5.1-.2.04-.37-.02-.52-.07-.15-.66-1.58-.9-2.16-.24-.57-.48-.5-.66-.5h-.56c-.2 0-.5.07-.78.37-.27.3-1.04 1-1.04 2.45s1.06 2.85 1.21 3.05c.15.2 2.1 3.2 5.1 4.5.71.3 1.27.48 1.7.62.71.22 1.36.19 1.87.12.57-.08 1.7-.7 1.94-1.36.24-.67.24-1.25.17-1.36-.07-.13-.27-.2-.57-.34zM12 2C6.5 2 2 6.5 2 12c0 1.74.45 3.4 1.3 4.88L2 22l5.25-1.27A9.94 9.94 0 0 0 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
  ),
  Calc: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h.01M16 11h.01M8 15h2M12 15h.01M16 15h.01M8 19h2M12 19h.01M16 19h.01"/></svg>
  ),
  Pin: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
  ),
  Phone: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>
  ),
  Filter: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
  ),
  Trash: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
  ),
  Arrow: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
  ),
  Paw: ({ s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><ellipse cx="6" cy="9" rx="2" ry="2.6"/><ellipse cx="10" cy="6" rx="2" ry="2.6"/><ellipse cx="14" cy="6" rx="2" ry="2.6"/><ellipse cx="18" cy="9" rx="2" ry="2.6"/><path d="M12 11c-3.5 0-6 2.5-6 5.5 0 1.6 1.4 2.5 3 2.5 1 0 1.8-.4 3-.4s2 .4 3 .4c1.6 0 3-.9 3-2.5 0-3-2.5-5.5-6-5.5z"/></svg>
  ),
};
