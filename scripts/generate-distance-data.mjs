import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(root, 'public/resources/DistanceVSEffort_ImageList.json');
const outputDirectory = join(root, 'public/resources/dve');

const requiredFields = [
  'Image',
  'FileName',
  'Effort',
  'Quality',
  'Size',
  'Pixels',
  'E-Speed',
  'BPP',
  'SSIMU2',
  'Name',
];

const rows = JSON.parse(await readFile(sourcePath, 'utf8'));

if (!Array.isArray(rows)) {
  throw new TypeError('Distance vs. Effort source data must be an array.');
}

const images = new Map();

for (const [index, row] of rows.entries()) {
  for (const field of requiredFields) {
    if (row[field] === undefined || row[field] === null) {
      throw new TypeError(`Row ${index} is missing required field ${field}.`);
    }
  }

  const id = row.Image.replace(/\.[^.]+$/, '');
  let image = images.get(id);

  if (!image) {
    image = {
      id,
      name: row.Name,
      source: row.Image,
      pixels: row.Pixels,
      efforts: new Map(),
    };
    images.set(id, image);
  }

  if (image.name !== row.Name || image.source !== row.Image || image.pixels !== row.Pixels) {
    throw new TypeError(`Row ${index} has inconsistent shared metadata for ${id}.`);
  }

  const effort = String(row.Effort);
  const variants = image.efforts.get(effort) ?? [];

  // [quality, filename, encoded bytes, encode speed, bpp, SSIMULACRA2]
  variants.push([row.Quality, row.FileName, row.Size, row['E-Speed'], row.BPP, row.SSIMU2]);
  image.efforts.set(effort, variants);
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const catalog = [];

for (const image of images.values()) {
  const efforts = Object.fromEntries(
    [...image.efforts.entries()]
      .sort(([left], [right]) => Number(right) - Number(left))
      .map(([effort, variants]) => [
        effort,
        variants.sort((left, right) => left[0] - right[0]),
      ]),
  );

  const chunk = {
    version: 1,
    id: image.id,
    name: image.name,
    source: image.source,
    pixels: image.pixels,
    efforts,
  };

  await writeFile(join(outputDirectory, `${image.id}.json`), `${JSON.stringify(chunk)}\n`);
  catalog.push({
    id: image.id,
    name: image.name,
    efforts: Object.keys(efforts).map(Number),
  });
}

const index = {
  version: 1,
  defaultImage: catalog[0]?.id,
  images: catalog,
};

await writeFile(join(outputDirectory, 'index.json'), `${JSON.stringify(index)}\n`);

console.log(`Generated ${catalog.length} Distance vs. Effort data chunks from ${rows.length} source rows.`);
