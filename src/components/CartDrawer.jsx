import { useState } from 'react';
import { Icon } from './Icons';
import { ProductImage } from './ProductCard';

const WA_PHONE = import.meta.env.VITE_WHATSAPP_NUMBER || "5493515504248";

function buildWhatsAppLink(items, note) {
  const lines = items.map(it => `• ${it.qty}× ${it.p.brand} ${it.p.name} (${it.p.size})`);
  const body = ["¡Hola Luka! Quiero hacer este pedido:", "", ...lines, "", note ? `Nota: ${note}` : "", "¡Gracias!"]
    .filter(Boolean).join("\n");
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(body)}`;
}

export default function CartDrawer({ open, items, onClose, onQty, onRemove, onClear }) {
  const [note, setNote] = useState('');
  const totalItems = items.reduce((s, it) => s + it.qty, 0);
  const waLink = buildWhatsAppLink(items, note);

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
            <a className="luka-cta-wa" href={waLink} target="_blank" rel="noopener noreferrer">
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
