const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace('@import "tailwindcss";    color-scheme: dark;  }', '@import "tailwindcss";\n@layer base {');
fs.writeFileSync('src/index.css', css);
