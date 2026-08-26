const fs = require('fs');
let content = fs.readFileSync('src/components/BasemapSelector.tsx', 'utf8');

content = content.replace("  const [customUrl, setCustomUrl] = useState('');\\n", "");
content = content.replace("  const [mapboxToken, setMapboxToken] = useState('');\\n", "");
content = content.replace("  const [mapboxStyleId, setMapboxStyleId] = useState('mapbox/streets-v12');\\n", "");

const handleApplyCustomMapboxRegex = /const handleApplyCustomMapbox = \(\) => \{[\s\S]*?onClose\(\);\s*\};/;
content = content.replace(handleApplyCustomMapboxRegex, '');

const handleApplyCustomXyzRegex = /const handleApplyCustomXyz = \(\) => \{[\s\S]*?onClose\(\);\s*\};/;
content = content.replace(handleApplyCustomXyzRegex, '');

fs.writeFileSync('src/components/BasemapSelector.tsx', content);
console.log('patched unused states');
