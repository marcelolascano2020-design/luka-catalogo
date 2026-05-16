export default function Footer() {
  return (
    <footer className="luka-footer">
      <div className="luka-footer-inner">
        <div>
          <div className="luka-footer-brand">
            <img src="/assets/logo.jpg" alt="Luka" className="luka-logo-sm" style={{ objectFit: 'contain' }} />
            <div>
              <strong>Luka</strong>
              <span>Alimentos balanceados para mascotas</span>
            </div>
          </div>
        </div>
        <div>
          <div className="luka-eyebrow">Visitanos</div>
          <p>Octavio Pinto 2207<br />X5000 Córdoba</p>
        </div>
        <div>
          <div className="luka-eyebrow">Contacto</div>
          <p>+54 9 3515 50-4248<br />Lun a Sáb · 9 a 19 h</p>
        </div>
        <div>
          <div className="luka-eyebrow">Envíos</div>
          <p>Córdoba Capital<br />Coordinación por WhatsApp</p>
        </div>
      </div>
      <div className="luka-footer-fine">© {new Date().getFullYear()} Luka · Forrajería · Catálogo orientativo</div>
    </footer>
  );
}
