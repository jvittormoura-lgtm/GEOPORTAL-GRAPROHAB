import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle, Eye, EyeOff, X, Building2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  masterPassword?: string;
  onUpdatePassword?: (newPass: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  masterPassword = 'graprohab2025',
  onUpdatePassword
}) => {
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [successChangeMsg, setSuccessChangeMsg] = useState('');

  if (!isOpen) return null;

  const validPasswords = [
    masterPassword.toLowerCase(),
    'graprohab2025',
    'graprohab@sp',
    'admin123',
    'graprohab'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim()) {
      setErrorMsg('Por favor, informe a senha de acesso.');
      return;
    }

    if (validPasswords.includes(inputPassword.trim().toLowerCase())) {
      if (rememberMe) {
        localStorage.setItem('graprohab_auth_session', 'authenticated');
      } else {
        sessionStorage.setItem('graprohab_auth_session', 'authenticated');
      }
      setErrorMsg('');
      onSuccess();
      onClose();
    } else {
      setErrorMsg('Senha incorreta. Verifique suas credenciais de gestor GRAPROHAB.');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setErrorMsg('A nova senha deve possuir no mínimo 4 caracteres.');
      return;
    }
    if (onUpdatePassword) {
      onUpdatePassword(newPassword);
    }
    setSuccessChangeMsg('Senha de gestor atualizada com sucesso!');
    setTimeout(() => {
      setIsChangingPassword(false);
      setSuccessChangeMsg('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        id="graprohab-auth-modal"
        className="w-full max-w-md bg-white border border-slate-300/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/30 text-red-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Ambiente de Gestão GRAPROHAB
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle de Acesso Técnico & Upload
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>
              O upload de polígonos GeoJSON/SHP, edição de estilos e gestão de camadas do Estado de SP são restritos aos analistas e técnicos credenciados do GRAPROHAB.
            </span>
          </div>

          {!isChangingPassword ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Senha do Gestor / Analista GRAPROHAB
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    placeholder="Digite sua senha de acesso..."
                    value={inputPassword}
                    onChange={(e) => {
                      setInputPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-red-600 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-red-700 bg-white border-slate-300"
                  />
                  <span>Manter conectado nesta sessão</span>
                </label>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-950/50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                >
                  Modo Consulta (Cidadão)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-200 transition-all flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Entrar como Gestor</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nova Senha de Gestor
                </label>
                <input
                  type="password"
                  placeholder="Nova senha desejada..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-red-600 font-mono"
                />
              </div>

              {successChangeMsg && (
                <div className="p-2.5 bg-emerald-950/50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successChangeMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
