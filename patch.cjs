const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
const bodyIndex = css.indexOf('  body {');
if (bodyIndex !== -1) {
    css = '@import "tailwindcss";\n@layer base {\n' + css.substring(bodyIndex);
    fs.writeFileSync('src/index.css', css);
}
