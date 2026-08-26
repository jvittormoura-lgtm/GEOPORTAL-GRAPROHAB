const fs = require('fs');
let content = fs.readFileSync('src/components/BasemapSelector.tsx', 'utf8');

const oldBasemap = `{
    id: 'jawg_street',
    name: 'JAWG Street',
    category: 'osm',
    url: 'https://tile.jawg.io/jawg-streets/{z}/{x}/{y}.png?access-token=community',
    attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank" class="jawg-attrib">&copy; <b>Jawg</b>Maps</a> | <a href="https://www.openstreetmap.org/copyright" title="OpenStreetMap is open data licensed under ODbL" target="_blank" class="osm-attrib">&copy; OSM contributors</a>',
    maxZoom: 22
  }`;

const newBasemap = `{
    id: 'osm_standard',
    name: 'OSM Padrão',
    category: 'osm',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  }`;

content = content.replace(oldBasemap, newBasemap);
fs.writeFileSync('src/components/BasemapSelector.tsx', content);
console.log('patched basemaps 2');
