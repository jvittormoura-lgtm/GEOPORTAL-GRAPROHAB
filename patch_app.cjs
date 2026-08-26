const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const authModalOpenRegex = /const \[isAuthModalOpen, setIsAuthModalOpen\] = useState\(false\);/;
content = content.replace(authModalOpenRegex, `const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);\n  const [authModalMode, setAuthModalMode] = useState<'login' | 'change_password'>('login');`);

const onToggleAuthModalRegex = /onToggleAuthModal=\{\(\) => setIsAuthModalOpen\(true\)\}/;
content = content.replace(onToggleAuthModalRegex, `onToggleAuthModal={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}\n        onChangePassword={() => { setAuthModalMode('change_password'); setIsAuthModalOpen(true); }}`);

const authModalRegex = /<AuthModal\s*isOpen=\{isAuthModalOpen\}[\s\S]*?onUpdatePassword=\{[\s\S]*?\}\s*\/>/;
content = content.replace(authModalRegex, `<AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => {
            setIsAuthModalOpen(false);
            setPendingAuthAction(null);
          }}
          onSuccess={handleAuthSuccess}
          masterPassword={masterPassword}
          onUpdatePassword={(newPass) => {
            setMasterPassword(newPass);
            localStorage.setItem('graprohab_custom_pass', newPass);
            showToast('Senha de gestor atualizada!');
          }}
        />`);

fs.writeFileSync('src/App.tsx', content);
console.log('patched App.tsx');
