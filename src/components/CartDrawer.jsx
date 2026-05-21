import { useState } from 'react';
import { Icon } from './Icons';
import { ProductImage } from './ProductCard';

const WA_PHONE = import.meta.env.VITE_WHATSAPP_NUMBER || "5493515504248";

const DELIVERY_OPTIONS = [
  { value: 'envio',  label: '🏠 Envío a domicilio' },
  { value: 'retiro', label: '🏪 Retiro en local — Octavio Pinto 2207' },
];

function buildWhatsAppLink(items, note, delivery) {
  const deliveryLine = delivery === 'envio'
    ? '🏠 Entrega: Envío a domicilio'
    : delivery === 'retiro'
    ? '🏪 Entrega: Retiro en local (Octavio Pinto 2207)'
    : '';
  const lines = items.map(it => `• ${it.qty}× ${it.p.brand} ${it.p.name} (${it.p.size})`);
  const body = ["¡Hola Luka! Quiero hacer este pedido:", "", ...lines, "", deliveryLine, note ? `Nota: ${note}` : "", "¡Gracias!"]
    .filter(Boolean).join("\n");
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(body)}`;
}

export default function CartDrawer({ open, items, onClose, onQty, onRemove, onClear }) {
  const [note, setNote] = useState('');
  const [delivery, setDelivery] = useState(null);
  const [deliveryError, setDeliveryError] = useState(false);
  const totalItems = items.reduce((s, it) => s + it.qty, 0);
  const waLink = buildWhatsAppLink(items, note, delivery);

  const handleDelivery = (v) => {
    setDelivery(v);
    setDeliveryError(false);
  };

  const handleWaClick = (e) => {
    if (!delivery) {
      e.preventDefault();
      setDeliveryError(true);
    }
  };

  return (
    <>
      <div className={`luka-scrim ${open ? 'is-open' : ''}`} onClick={onClose} />
      <aside className={`luka-cart ${open ? 'is-open' : ''}`}>
        <header className="luka-cart-head">
          <div>
            <div className="luka-eyebrow">Tu pedido</div>
            <h2>{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</h2>
          </div>
          <button className="luka-iconbtn" onClick={onClose} aria-label="Cerrar">
            <Icon.Close />
          </button>
        </header>

        <div className="luka-cart-body">
          {items.length === 0 && (
            <div className="luka-cart-empty">
              <div className="luka-empty-circle"><Icon.Cart s={28} /></div>
              <p>Tu lista de pedido está vacía.</p>
              <p className="luka-muted">Sumá productos del catálogo y mandanos el pedido por WhatsApp.</p>
            </div>
          )}
          {items.map(it => (
            <div key={it.p.id} className="luka-cart-row">
              <div className="luka-cart-thumb">
                <ProductImage p={it.p} ratio="1 / 1" />
              </div>
              <div className="luka-cart-info">
                <div className="luka-cart-brand">{it.p.brand}</div>
                <div className="luka-cart-name">{it.p.name}</div>
                <div className="luka-cart-size">{it.p.size}</div>
                <div className="luka-qty">
                  <button onClick={() => onQty(it.p.id, it.qty - 1)} disabled={it.qty <= 1}>
                    <Icon.Minus />
                  </button>
                  <span>{it.qty}</span>
                  <button onClick={() => onQty(it.p.id, it.qty + 1)}>
                    <Icon.Plus />
                  </button>
                  <button className="luka-trash" onClick={() => onRemove(it.p.id)} aria-label="Quitar">
                    <Icon.Trash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <footer className="luka-cart-foot">
            <label className="luka-field">
              <span>Nota para Luka (opcional)</span>
              <textarea
                rows="2"
                placeholder="Horario de retiro, marca preferida, etc."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </label>
            {/* Delivery selector */}
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                {DELIVERY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleDelivery(opt.value)}
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                      fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, textAlign: 'center',
                      border: '2px solid #2B1F14',
                      background: delivery === opt.value ? '#2B1F14' : 'transparent',
                      color: delivery === opt.value ? '#fff' : '#2B1F14',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {deliveryError && (
                <p style={{ margin: 0, fontSize: 12, color: '#c0392b', fontWeight: 600 }}>
                  Elegí cómo recibís tu pedido
                </p>
              )}
            </div>

            <a className="luka-cta-wa" href={waLink} target="_blank" rel="noopener noreferrer" onClick={handleWaClick}>
              <Icon.Whatsapp /> Enviar pedido por WhatsApp
            </a>
            <button className="luka-clear" onClick={onClear}>Vaciar lista</button>
            <p className="luka-fineprint">
              Precios y stock se confirman por WhatsApp. Retiro en local o envíos a domicilio en Córdoba Capital.
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}
