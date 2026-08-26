const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);\n  const [authModalMode, setAuthModalMode] = useState<'login' | 'change_password'>('login');", "  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);");

content = content.replace("onToggleAuthModal={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}\n        onChangePassword={() => { setAuthModalMode('change_password'); setIsAuthModalOpen(true); }}", "onToggleAuthModal={() => setIsAuthModalOpen(true)}");

content = content.replace("initialMode={authModalMode}\n          onClose", "onClose");

fs.writeFileSync('src/App.tsx', content);
