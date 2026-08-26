const fs = require('fs');
let content = fs.readFileSync('src/components/BasemapSelector.tsx', 'utf8');

const osm = `{
    id: 'osm_standard',
    name: 'OSM Padrão',
    category: 'osm',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  }`;

const newOsms = `{
    id: 'osm_standard',
    name: 'OSM Padrão',
    category: 'osm',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },
  {
    id: 'osm_piano_fr',
    name: 'OSM Piano FR (OSM France)',
    category: 'osm',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c']
  }`;

content = content.replace(osm, newOsms);
fs.writeFileSync('src/components/BasemapSelector.tsx', content);
console.log('patched basemaps fr');
