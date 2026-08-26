const fs = require('fs');
let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

const interfaceRegex = /interface AuthModalProps \{[\s\S]*?\}/;
content = content.replace(interfaceRegex, `interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  masterPassword?: string;
  onUpdatePassword?: (newPass: string) => void;
  initialMode?: 'login' | 'change_password';
}`);

const destructureRegex = /export const AuthModal: React\.FC<AuthModalProps> = \(\{[\s\S]*?onUpdatePassword\n\}\) => \{/;
content = content.replace(destructureRegex, `export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  masterPassword = 'graprohab2025',
  onUpdatePassword,
  initialMode = 'login'
}) => {`);

const statesRegex = /const \[isChangingPassword, setIsChangingPassword\] = useState\(false\);\n  const \[newPassword, setNewPassword\] = useState\(''\);\n  const \[successChangeMsg, setSuccessChangeMsg\] = useState\(''\);/;
content = content.replace(statesRegex, `const [isChangingPassword, setIsChangingPassword] = useState(initialMode === 'change_password');
  const [newPassword, setNewPassword] = useState('');
  const [successChangeMsg, setSuccessChangeMsg] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setIsChangingPassword(initialMode === 'change_password');
      setIsForgotPassword(false);
      setForgotSuccess('');
      setErrorMsg('');
      setInputPassword('');
      setNewPassword('');
    }
  }, [isOpen, initialMode]);

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMsg('Por favor, informe um e-mail válido.');
      return;
    }
    setErrorMsg('');
    setForgotSuccess(\`Um link de redefinição de senha foi enviado para \${forgotEmail}\`);
    setTimeout(() => {
      setIsForgotPassword(false);
      setForgotSuccess('');
      setForgotEmail('');
    }, 3000);
  };`);

const formReplacementRegex = /\{\!isChangingPassword \? \([\s\S]*?className="absolute right-3 top-1\/2 -translate-y-1\/2 text-slate-400 hover:text-slate-200"\s*>\s*\{showPassword \? <EyeOff className="w-4 h-4" \/> : <Eye className="w-4 h-4" \/>\}\s*<\/button>\s*<\/div>\s*<\/div>\s*<div className="flex items-center justify-between text-xs">\s*<label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">\s*<input\s*type="checkbox"\s*checked=\{rememberMe\}\s*onChange=\{\(e\) => setRememberMe\(e\.target\.checked\)\}\s*className="w-3\.5 h-3\.5 rounded text-sky-600 bg-slate-900 border-slate-700"\s*\/>\s*<span>Manter conectado nesta sessão<\/span>\s*<\/label>\s*<\/div>/;

content = content.replace(formReplacementRegex, `{isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E-mail de Recuperação
                </label>
                <input
                  type="email"
                  placeholder="Digite seu e-mail cadastrado..."
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all font-mono"
                  required
                />
              </div>
              {forgotSuccess && (
                <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}
              {errorMsg && (
                <div className="p-2.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotSuccess('');
                    setErrorMsg('');
                  }}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                >
                  Enviar
                </button>
              </div>
            </form>
          ) : !isChangingPassword ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Senha do Gestor / Analista GRAPROHAB
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    placeholder="Digite sua senha de acesso..."
                    value={inputPassword}
                    onChange={(e) => {
                      setInputPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-sky-600 bg-slate-900 border-slate-700"
                  />
                  <span>Manter conectado</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
                >
                  Esqueci a senha
                </button>
              </div>`);

fs.writeFileSync('src/components/AuthModal.tsx', content);
console.log('patched AuthModal');
