import fs from 'node:fs';
export const assets={art:JSON.parse(fs.readFileSync(new URL('../data/hani-building/art-map-v1.json',import.meta.url))),canon:JSON.parse(fs.readFileSync(new URL('../data/hani-building/spatial-contract.json',import.meta.url))),sprites:JSON.parse(fs.readFileSync(new URL('../assets/sprites-v2/manifest.json',import.meta.url)))};
