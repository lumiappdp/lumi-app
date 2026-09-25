import './LegalModal.css';

// Componente Modal para Exibição dos Documentos Legais e de Suporte do Lumi App
// Apresenta layout limpo em Glassmorphism com animação e scroll suave
// @param {Object} props
// @param {string} props.theme - 'dark' ou 'light'
// @param {Object} props.docData - Dados do documento { title, subtitle, sections }
// @param {Function} props.onClose - Callback para fechar o modal
export function LegalModal({ theme = 'dark', docData, onClose }) {
  if (!docData) return null;

  return (
    <div className={`legal-modal-backdrop ${theme}`} onClick={onClose}>
      <div className="legal-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho do Modal com Botão Fechar */}
        <div className="legal-modal-header">
          <div className="legal-header-text">
            <h2 className="legal-modal-title">{docData.title}</h2>
            <p className="legal-modal-subtitle">{docData.subtitle}</p>
          </div>
          <button type="button" className="legal-close-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        {/* Corpo com Scroll de Conteúdo */}
        <div className="legal-modal-body">
          {docData.sections?.map((sec, idx) => (
            <div key={idx} className="legal-doc-section">
              <h3 className="legal-section-heading">{sec.heading}</h3>
              <div className="legal-section-content">
                {sec.content.split('\n').map((paragraph, pIdx) => (
                  <p key={pIdx} className="legal-paragraph">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé com Botão Entendido */}
        <div className="legal-modal-footer">
          <button type="button" className="legal-confirm-btn" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export default LegalModal;
