"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Mail, ShieldCheck, X } from "lucide-react";

export function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>{open && <InviteDialog key="invite" onClose={onClose} />}</AnimatePresence>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Informe o nome e um e-mail válido.");
      return;
    }
    // O envio depende da futura integração. A interface apenas prepara o convite.
    setError("");
    setSent(true);
  }

  return (
    <div className="modal-layer">
      <motion.button
        className="modal-backdrop"
        aria-label="Fechar convite"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <div className="invite-modal-position">
        <motion.div
          className="invite-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-title"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
        >
          <button className="modal-close icon-button" aria-label="Fechar convite" onClick={onClose}>
            <X size={20} />
          </button>
          {sent ? (
            <div className="invite-success">
              <span>
                <Check size={30} />
              </span>
              <h2 id="invite-title">Convite preparado</h2>
              <p>Convite de {name} preparado. O envio ficará disponível após a integração.</p>
              <button className="primary-button" onClick={onClose}>
                Concluir
              </button>
            </div>
          ) : (
            <>
              <div className="modal-icon">
                <Mail size={23} />
              </div>
              <h2 id="invite-title">Convidar cliente</h2>
              <p>Prepare um convite para que o cliente compartilhe seus dados financeiros.</p>
              <form onSubmit={handleSubmit}>
                <label htmlFor="invite-name">Nome do cliente</label>
                <input
                  id="invite-name"
                  placeholder="Ex.: Maria Silva"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <label htmlFor="invite-email">E-mail</label>
                <input
                  id="invite-email"
                  type="email"
                  placeholder="cliente@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                {error && <span className="form-error">{error}</span>}
                <div className="modal-note">
                  <ShieldCheck size={17} /> O envio será habilitado com a integração.
                </div>
                <button type="submit" className="primary-button">
                  Preparar convite <ArrowRight size={17} />
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
