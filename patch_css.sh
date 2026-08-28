cat src/index.css | sed '/@layer base {/a\
\
  .dark {\
    --color-white: var(--color-slate-900);\
    --color-slate-50: var(--color-slate-950);\
    --color-slate-100: var(--color-slate-800);\
    --color-slate-200: var(--color-slate-700);\
    --color-slate-300: var(--color-slate-600);\
    --color-slate-400: var(--color-slate-500);\
    --color-slate-500: var(--color-slate-400);\
    --color-slate-600: var(--color-slate-300);\
    --color-slate-700: var(--color-slate-200);\
    --color-slate-800: var(--color-slate-100);\
    --color-slate-900: var(--color-white);\
    --color-emerald-50: oklch(27.9% 0.077 45.635); /* Approximate dark emerald bg */\
    --color-emerald-700: oklch(76.9% 0.188 70.08); /* Approximate light emerald text */\
    color-scheme: dark;\
  }\
' > src/index.css.new
mv src/index.css.new src/index.css
