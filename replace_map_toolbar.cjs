const fs = require('fs');
let code = fs.readFileSync('src/components/MapComponent.tsx', 'utf8');

// Replace imports
code = code.replace("import { BasemapDropdown } from \"./BasemapDropdown\";", "");
code = code.replace("import { AddressSearch } from './AddressSearch';", "import { MapToolbar } from './MapToolbar';");

const targetRegex = /{\/\* Address Search Bar \*\/}[\s\S]*?Medir Distância e Área"[\s\S]*?<\/button>\s*<\/div>/;

const replacement = `<MapToolbar 
        onFlyTo={handleAddressFlyTo}
        activeBasemap={activeBasemap}
        onSelectBasemap={onSelectBasemap}
        onLocateMe={handleLocateMe}
        onResetExtent={handleResetExtent}
        isMeasuring={isMeasuring}
        onToggleMeasure={() => setIsMeasuring(!isMeasuring)}
      />`;

if (targetRegex.test(code)) {
  code = code.replace(targetRegex, replacement);
  fs.writeFileSync('src/components/MapComponent.tsx', code);
  console.log('Replaced successfully');
} else {
  console.log('Target string not found');
}
