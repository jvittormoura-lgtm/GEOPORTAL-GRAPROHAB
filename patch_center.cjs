const fs = require('fs');
let content = fs.readFileSync('src/components/MapComponent.tsx', 'utf8');

const oldEffect = `      highlightLayerRef.current = hlLayer;
    }
  }, [selectedFeature]);`;

const newEffect = `      highlightLayerRef.current = hlLayer;
      
      try {
        const bounds = hlLayer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16, duration: 1.5 });
        }
      } catch (e) {
        console.warn('Could not fit bounds to selected feature', e);
      }
    }
  }, [selectedFeature]);`;

content = content.replace(oldEffect, newEffect);
fs.writeFileSync('src/components/MapComponent.tsx', content);
console.log('Centered map patched!');
