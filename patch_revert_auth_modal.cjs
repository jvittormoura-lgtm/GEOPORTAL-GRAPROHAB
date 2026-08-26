const fs = require('fs');
let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

const interfaceRegex = /interface AuthModalProps \{[\s\S]*?\}/;
content = content.replace(interfaceRegex, `interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  masterPassword?: string;
  onUpdatePassword?: (newPass: string) => void;
}`);

const destructureRegex = /export const AuthModal: React\.FC<AuthModalProps> = \(\{[\s\S]*?onUpdatePassword,\s*initialMode = 'login'\s*\}\) => \{/;
content = content.replace(destructureRegex, `export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  masterPassword = 'graprohab2025',
  onUpdatePassword
}) => {`);

const statesRegex = /const \[isChangingPassword, setIsChangingPassword\] = useState\(initialMode === 'change_password'\);\n  const \[newPassword, setNewPassword\] = useState\(''\);\n  const \[successChangeMsg, setSuccessChangeMsg\] = useState\(''\);\n  const \[isForgotPassword, setIsForgotPassword\] = useState\(false\);\n  const \[forgotEmail, setForgotEmail\] = useState\(''\);\n  const \[forgotSuccess, setForgotSuccess\] = useState\(''\);\n\n  React\.useEffect\(\(\) => \{\n    if \(isOpen\) \{\n      setIsChangingPassword\(initialMode === 'change_password'\);\n      setIsForgotPassword\(false\);\n      setForgotSuccess\(''\);\n      setErrorMsg\(''\);\n      setInputPassword\(''\);\n      setNewPassword\(''\);\n    \}\n  \}, \[isOpen, initialMode\]\);\n\n  const handleForgotPassword = \(e: React\.FormEvent\) => \{\n[\s\S]*?  \};/;
content = content.replace(statesRegex, `const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [successChangeMsg, setSuccessChangeMsg] = useState('');`);

const formReplacementRegex = /\{isForgotPassword \? \([\s\S]*?className="absolute right-3 top-1\/2 -translate-y-1\/2 text-slate-400 hover:text-slate-200"\s*>\s*\{showPassword \? <EyeOff className="w-4 h-4" \/> : <Eye className="w-4 h-4" \/>\}\s*<\/button>\s*<\/div>\s*<\/div>\s*<div className="flex items-center justify-between text-xs">\s*<label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">\s*<input\s*type="checkbox"\s*checked=\{rememberMe\}\s*onChange=\{\(e\) => setRememberMe\(e\.target\.checked\)\}\s*className="w-3\.5 h-3\.5 rounded text-sky-600 bg-slate-900 border-slate-700"\s*\/>\s*<span>Manter conectado<\/span>\s*<\/label>\s*<button\s*type="button"\s*onClick=\{\(\) => setIsForgotPassword\(true\)\}\s*className="text-sky-400 hover:text-sky-300 font-medium transition-colors"\s*>\s*Esqueci a senha\s*<\/button>\s*<\/div>/;

content = content.replace(formReplacementRegex, `{!isChangingPassword ? (
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
                  <span>Manter conectado nesta sessão</span>
                </label>
              </div>`);

fs.writeFileSync('src/components/AuthModal.tsx', content);
