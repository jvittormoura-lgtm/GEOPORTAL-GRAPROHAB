const fs = require('fs');
let content = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

const interfaceRegex = /onToggleAuthModal: \(\) => void;/;
content = content.replace(interfaceRegex, `onToggleAuthModal: () => void;\n  onChangePassword: () => void;`);

const propsDestructureRegex = /onToggleAuthModal,\s*onLogoutGestor,/;
content = content.replace(propsDestructureRegex, `onToggleAuthModal,\n  onChangePassword,\n  onLogoutGestor,`);

const authSwitcherRegex = /\{\/\* Auth \/ Mode Switcher \*\/\}\s*\{appMode === 'gestor' \? \([\s\S]*?Sair do Gestor<\/span>\s*<\/button>\s*\)\s*:/;

const newAuthSwitcher = `{/* Auth / Mode Switcher */}
        {appMode === 'gestor' ? (
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-800 pl-2">
            <button
              onClick={onChangePassword}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Trocar Senha de Gestor"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mudar Senha</span>
            </button>
            <button
              onClick={onLogoutGestor}
              className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Sair do modo de edição de gestor"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        ) :`;

content = content.replace(authSwitcherRegex, newAuthSwitcher);

fs.writeFileSync('src/components/Navbar.tsx', content);
console.log('patched Navbar');
