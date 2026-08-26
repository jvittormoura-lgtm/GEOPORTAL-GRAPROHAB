const fs = require('fs');
let content = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

content = content.replace("  onToggleAuthModal: () => void;\n  onChangePassword: () => void;", "  onToggleAuthModal: () => void;");

content = content.replace("  onToggleAuthModal,\n  onChangePassword,\n  onLogoutGestor,", "  onToggleAuthModal,\n  onLogoutGestor,");

const authSwitcherRegex = /\{\/\* Auth \/ Mode Switcher \*\/\}\s*\{appMode === 'gestor' \? \([\s\S]*?Sair<\/span>\s*<\/button>\s*<\/div>\s*\)\s*:/;

const newAuthSwitcher = `{/* Auth / Mode Switcher */}
        {appMode === 'gestor' ? (
          <button
            onClick={onLogoutGestor}
            className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Sair do modo de edição de gestor"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair do Gestor</span>
          </button>
        ) :`;

content = content.replace(authSwitcherRegex, newAuthSwitcher);
content = content.replace("Lock, Unlock, Key,", "Lock, Unlock,");

fs.writeFileSync('src/components/Navbar.tsx', content);
