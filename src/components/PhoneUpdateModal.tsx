import React, { useState, useEffect } from 'react';
import { Phone, Check, X, Building2, MessageCircle } from 'lucide-react';
import { formatPhone, cleanDigits } from '../services/brasilApi';
import { cleanPhoneForWhatsApp } from '../utils/formatters';

interface PhoneUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  currentPhone: string;
  onSavePhone: (clientId: string, newPhone: string) => void;
}

export const PhoneUpdateModal: React.FC<PhoneUpdateModalProps> = ({
  isOpen,
  onClose,
  clientId,
  clientName,
  currentPhone,
  onSavePhone,
}) => {
  const [phoneInput, setPhoneInput] = useState(currentPhone || '');
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setPhoneInput(currentPhone || '');
    setError(null);
    setSavedSuccess(false);
  }, [currentPhone, isOpen]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhoneInput(formatted);
    setError(null);
    setSavedSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cleanDigits(phoneInput);
    if (digits.length < 10) {
      setError('Por favor, informe um telefone válido com DDD (mínimo 10 dígitos).');
      return;
    }

    onSavePhone(clientId, phoneInput);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const waNumber = cleanPhoneForWhatsApp(phoneInput);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs transition-opacity">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-black/10 dark:border-slate-800 overflow-hidden transform transition-all text-black dark:text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-modal-title"
      >
        <div className="px-6 py-4 bg-black dark:bg-slate-950 text-white border-b-2 border-blue-600 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 id="phone-modal-title" className="text-sm font-bold text-white">
                Atualizar Telefone do Cliente
              </h3>
              <p className="text-xs text-slate-300">Acesso rápido para vendedores e equipe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Cliente Selecionado</span>
              <span className="text-sm font-bold text-black dark:text-white">{clientName}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black dark:text-slate-300 mb-1.5" htmlFor="client-phone-input">
              Novo Número de Telefone / Celular
            </label>
            <div className="relative">
              <input
                id="client-phone-input"
                type="text"
                value={phoneInput}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                maxLength={15}
                className="w-full px-3.5 py-2.5 pl-10 text-sm font-mono bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-black dark:text-white"
                autoFocus
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Formato com DDD: fixo (10 dígitos) ou WhatsApp/celular (11 dígitos).
            </p>
          </div>

          {phoneInput && cleanDigits(phoneInput).length >= 10 && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>WhatsApp: +{waNumber}</span>
              </div>
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-900 ml-2"
              >
                Testar Link
              </a>
            </div>
          )}

          {error && (
            <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          {savedSuccess && (
            <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl flex items-center gap-2 font-bold">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Telefone atualizado com sucesso no cadastro!</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savedSuccess}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              Salvar Telefone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
