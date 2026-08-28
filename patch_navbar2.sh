sed -i '/{\/\* Basemaps Modal Trigger \*\/}/i\
        {/* Dark Mode Toggle */}\
        <button\
          onClick={toggleDarkMode}\
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg flex items-center justify-center transition-colors"\
          title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}\
        >\
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}\
        </button>\
' src/components/Navbar.tsx
