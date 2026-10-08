import fs from 'node:fs';
import path from 'node:path';

export const RASTER_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
export const WEBP_QUALITY = 80;

const LINK_EXTENSIONS = new Set(['.vue', '.ts', '.tsx', '.js', '.mjs', '.css', '.html', '.json']);
const LINK_DIRS = ['src', 'workers'];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

export function walk(dir, accept) {
  if (!fs.existsSync(dir)) return [];
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full, accept));
    else if (accept(full)) found.push(full);
  }
  return found;
}

export function listRasters(publicDir) {
  return walk(publicDir, (file) => RASTER_EXTENSIONS.has(path.extname(file).toLowerCase())).sort();
}

export function listLinkFiles(root) {
  const files = [];
  for (const dir of LINK_DIRS) {
    const base = path.join(root, dir);
    files.push(...walk(base, (file) => LINK_EXTENSIONS.has(path.extname(file).toLowerCase())));
  }
  const index = path.join(root, 'index.html');
  if (fs.existsSync(index)) files.push(index);
  return files.sort();
}

export function publicUrl(publicDir, file) {
  return `/${toPosix(path.relative(publicDir, file))}`;
}

export function planTargets(rasters, publicDir) {
  return rasters.map((file) => {
    const ext = path.extname(file).toLowerCase();
    const url = publicUrl(publicDir, file);
    return {
      file,
      ext,
      url,
      webp: file.slice(0, -ext.length) + '.webp',
      webpUrl: url.slice(0, -ext.length) + '.webp',
      dirUrl: url.slice(0, url.lastIndexOf('/'))
    };
  });
}

export function isReferenced(content, target) {
  if (content.includes(target.url)) return true;
  const relative = target.url.slice(1);
  const quoted = new RegExp(`(?<=['"\`\\s])${escapeRegExp(relative)}(?=['"\`\\s])`);
  if (quoted.test(content)) return true;
  const dynamic = new RegExp(`${escapeRegExp(target.dirUrl)}/\\$\\{[^}]+\\}${escapeRegExp(target.ext)}`);
  return dynamic.test(content);
}

export function rewriteText(content, targets) {
  let next = content;
  const byLength = [...targets].sort((a, b) => b.url.length - a.url.length);
  for (const target of byLength) {
    next = next.split(target.url).join(target.webpUrl);
    const relative = target.url.slice(1);
    const relativeWebp = target.webpUrl.slice(1);
    const quoted = new RegExp(`(?<=['"\`\\s])${escapeRegExp(relative)}(?=['"\`\\s])`, 'g');
    next = next.replace(quoted, relativeWebp);
  }
  const groups = new Map();
  for (const target of targets) groups.set(`${target.dirUrl}\0${target.ext}`, target);
  for (const target of groups.values()) {
    const dynamic = new RegExp(`${escapeRegExp(target.dirUrl)}/\\$\\{[^}]+\\}${escapeRegExp(target.ext)}`, 'g');
    next = next.replace(dynamic, (match) => `${match.slice(0, -target.ext.length)}.webp`);
  }
  return next;
}

export function leftovers(content, targets) {
  const groups = new Map();
  for (const target of targets) groups.set(`${target.dirUrl}\0${target.ext}`, target);
  const found = new Set();
  for (const target of groups.values()) {
    const extension = new RegExp(`${escapeRegExp(target.ext)}\\b`);
    for (const line of content.split('\n')) {
      if (line.includes(`${target.dirUrl}/`) && extension.test(line)) found.add(line.trim());
    }
  }
  return [...found];
}

function readTexts(files) {
  return new Map(files.map((file) => [file, fs.readFileSync(file, 'utf8')]));
}

function replaceFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (fs.existsSync(to)) fs.unlinkSync(to);
  try {
    fs.renameSync(from, to);
  } catch (error) {
    if (error.code !== 'EXDEV') throw error;
    fs.copyFileSync(from, to);
    fs.unlinkSync(from);
  }
}

export async function convertPublicImages({ root, encode }) {
  const publicDir = path.join(root, 'public');
  const targets = planTargets(listRasters(publicDir), publicDir);
  if (targets.length === 0) {
    return { converted: 0, dropped: 0, relinked: [], savedBytes: 0 };
  }

  const originals = readTexts(listLinkFiles(root));
  const before = [...originals.values()].join('\n');
  const rewritten = new Map();
  for (const [file, text] of originals) {
    const next = rewriteText(text, targets);
    if (next !== text) rewritten.set(file, next);
  }
  const after = [...originals.entries()].map(([file, text]) => rewritten.get(file) ?? text).join('\n');
  const unresolved = leftovers(after, targets);
  if (unresolved.length > 0) {
    const error = new Error(`Refusing to convert. These lines still point at a PNG or JPEG:\n${unresolved.join('\n')}`);
    error.leftovers = unresolved;
    throw error;
  }

  const actions = targets.map((target) => {
    const webpExists = fs.existsSync(target.webp);
    const referenced = isReferenced(before, target);
    if (webpExists && !referenced) return { ...target, action: 'drop' };
    const sourceNewer = webpExists && fs.statSync(target.file).mtimeMs > fs.statSync(target.webp).mtimeMs;
    if (webpExists && !sourceNewer) return { ...target, action: 'relink' };
    return { ...target, action: 'encode' };
  });

  const staged = [];
  for (const target of actions.filter((item) => item.action === 'encode')) {
    const temp = path.join(root, '.tmp', 'image-convert', toPosix(path.relative(publicDir, target.webp)));
    fs.mkdirSync(path.dirname(temp), { recursive: true });
    await encode(target.file, temp);
    const size = fs.statSync(temp).size;
    if (size <= 0) throw new Error(`WebP for ${target.url} was empty. Original kept.`);
    staged.push({ target, temp, size });
  }

  let savedBytes = 0;
  for (const item of staged) {
    const sourceBytes = fs.statSync(item.target.file).size;
    replaceFile(item.temp, item.target.webp);
    savedBytes += sourceBytes - item.size;
  }
  for (const [file, text] of rewritten) fs.writeFileSync(file, text);

  for (const target of actions) {
    if (target.action !== 'encode') savedBytes += fs.statSync(target.file).size;
    fs.unlinkSync(target.file);
  }

  const verify = leftovers([...readTexts(listLinkFiles(root)).values()].join('\n'), targets);
  if (verify.length > 0) {
    throw new Error(`Relink check failed after writing:\n${verify.join('\n')}`);
  }

  return {
    converted: staged.length,
    dropped: actions.filter((item) => item.action === 'drop').length,
    relinked: [...rewritten.keys()].map((file) => toPosix(path.relative(root, file))).sort(),
    savedBytes
  };
}

export function auditPublicImages(root) {
  const errors = [];
  const publicDir = path.join(root, 'public');
  for (const file of listRasters(publicDir)) {
    errors.push(`${publicUrl(publicDir, file)} is still a PNG or JPEG. Run npm run images.`);
  }

  const blob = [...readTexts(listLinkFiles(root)).values()].join('\n');
  const staticUrls = /['"`](\/(?:[\w.-]+\/)*[\w.-]+\.(webp|png|jpe?g|gif|svg|avif))['"`]/g;
  for (const match of blob.matchAll(staticUrls)) {
    const url = match[1];
    const extension = match[2].toLowerCase();
    if (extension === 'png' || extension === 'jpg' || extension === 'jpeg') {
      errors.push(`${url} is still linked. Run npm run images.`);
    }
    if (!fs.existsSync(path.join(publicDir, url.slice(1)))) {
      errors.push(`${url} is linked and missing from public/.`);
    }
  }

  const dynamicUrls = /(\/(?:[\w.-]+\/)+)\$\{[^}]+\}\.(webp|png|jpe?g)/g;
  let checksMerchCards = false;
  for (const match of blob.matchAll(dynamicUrls)) {
    if (match[2].toLowerCase() !== 'webp') {
      errors.push(`${match[1]}\${…}.${match[2]} still uses a PNG or JPEG. Run npm run images.`);
    }
    if (match[1] === '/merch/cta/') checksMerchCards = true;
  }

  if (checksMerchCards) {
    const merchPath = path.join(root, 'src/site/merch.ts');
    const merch = fs.existsSync(merchPath) ? fs.readFileSync(merchPath, 'utf8') : '';
    for (const line of merch.split('\n')) {
      const match = line.match(/\bid:\s*'([^']+)'/);
      if (!match || /\bcta:\s*'/.test(line)) continue;
      const url = `/merch/cta/${match[1]}.webp`;
      if (!fs.existsSync(path.join(publicDir, url.slice(1)))) errors.push(`${url} is missing.`);
    }
  }

  return [...new Set(errors)];
}

export function formatMegabytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
