import * as THREE from 'three';
import { paintBoards } from '../color/paint';
import type { MaterialKey, PanelOrientation, RoofCovering } from '../store/useConfigStore';

export interface PlankTextureOptions {
  material: MaterialKey;
  customHex?: string | null;
  panelOrientation?: PanelOrientation;
  panelWidthMm?: number;
}

/** Turn vertical boards onto their side for liggande cladding. */
export function orientBoards(
  source: HTMLCanvasElement,
  panelOrientation?: PanelOrientation,
  upright = false
): HTMLCanvasElement {
  if (upright || panelOrientation !== 'liggande') return source;
  const turned = document.createElement('canvas');
  turned.width = source.width;
  turned.height = source.height;
  const ctx = turned.getContext('2d')!;
  ctx.translate(source.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(source, 0, 0);
  return turned;
}

/** Four boards per tile. Repeat so each board is the chosen width. */
export function applyCladdingRepeat(
  texture: THREE.Texture,
  options: { panelWidthMm?: number; panelOrientation?: PanelOrientation },
  upright = false
): void {
  const cover = Math.max(0.07, (options.panelWidthMm ?? 145) / 1000);
  const moduleM = 4 * cover;
  const along = 2.4;
  if (!upright && options.panelOrientation === 'liggande') {
    texture.repeat.set(1 / along, 1 / moduleM);
  } else {
    texture.repeat.set(1 / moduleM, 1 / along);
  }
}

/**
 * Procedural Canvas Textures for Authentic Scandinavian Timber.
 */
export function createVerticalPlankTexture(
  options: PlankTextureOptions,
  upright = false,
  overrideColor?: string | null
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Four boards per tile, so neighbouring boards can differ and the width stays readable.
  const plankCount = 4;
  const plankW = 1024 / plankCount;

  // Close pale spruce tones. Neighbouring boards stay in the same family.
  const spruceTones = [
    { base: '#f6ead8', grain: '#e4d2b4', darkGrain: '#cbb892' },
    { base: '#f4e7d4', grain: '#e2d0b2', darkGrain: '#c9b690' },
    { base: '#f7ebda', grain: '#e6d4b6', darkGrain: '#cdba94' },
    { base: '#f3e5d2', grain: '#e0ceb0', darkGrain: '#c7b48e' },
    { base: '#f5e9d6', grain: '#e3d1b3', darkGrain: '#cab791' },
    { base: '#f8ecdb', grain: '#e7d5b7', darkGrain: '#cebb95' }
  ];

  let isNaturalWood = false;
  let isBlack = false;
  let colorPalette: { base: string; grain: string; darkGrain: string };

  if (overrideColor && overrideColor !== 'same') {
    if (overrideColor === 'wood') {
      isNaturalWood = true;
      colorPalette = spruceTones[0];
    } else if (overrideColor === 'white') {
      colorPalette = { base: '#f8fafc', grain: '#e2e8f0', darkGrain: '#cbd5e1' };
    } else if (overrideColor === 'falurod') {
      colorPalette = { base: '#892622', grain: '#731c19', darkGrain: '#591310' };
    } else if (overrideColor === 'grey') {
      colorPalette = { base: '#64748b', grain: '#475569', darkGrain: '#334155' };
    } else if (overrideColor === 'black') {
      isBlack = true;
      colorPalette = { base: '#1a1c1b', grain: '#121413', darkGrain: '#070808' };
    } else if (overrideColor.startsWith('#')) {
      colorPalette = paintBoards(overrideColor);
    } else {
      colorPalette = { base: '#f8fafc', grain: '#e2e8f0', darkGrain: '#cbd5e1' };
    }
  } else {
    isNaturalWood = options.material === 'wood' && !options.customHex;
    isBlack = options.material === 'black' && !options.customHex;
    const painted = options.customHex ? paintBoards(options.customHex) : null;
    if (painted) {
      colorPalette = painted;
    } else if (options.material === 'falurod') {
      colorPalette = { base: '#892622', grain: '#731c19', darkGrain: '#591310' };
    } else if (options.material === 'grey') {
      colorPalette = { base: '#64748b', grain: '#475569', darkGrain: '#334155' };
    } else if (options.material === 'white') {
      colorPalette = { base: '#f8fafc', grain: '#e2e8f0', darkGrain: '#cbd5e1' };
    } else if (options.material === 'black') {
      colorPalette = { base: '#1a1c1b', grain: '#121413', darkGrain: '#070808' };
    } else {
      colorPalette = spruceTones[0];
    }
  }

  let seed = 42;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // 1. Draw each board with authentic grain & natural knot variations
  for (let p = 0; p < plankCount; p++) {
    const px = p * plankW;
    const blackBoards = [
      { base: '#1a1c1b', grain: '#121413', darkGrain: '#070808' },
      { base: '#242725', grain: '#191c1a', darkGrain: '#0b0d0c' },
      { base: '#151716', grain: '#0e100f', darkGrain: '#050606' },
      { base: '#202320', grain: '#161816', darkGrain: '#090b0a' }
    ];
    const tone = isNaturalWood
      ? spruceTones[p % spruceTones.length]
      : isBlack
        ? blackBoards[p % blackBoards.length]
        : colorPalette;

    ctx.fillStyle = tone.base;
    ctx.fillRect(px, 0, plankW, 1024);

    // Fine longitudinal wood grain fibers
    const fiberCount = 40;
    for (let f = 0; f < fiberCount; f++) {
      const fx = px + rnd() * plankW;
      const wavePeriod = 70 + rnd() * 110;
      const waveAmp = 1.0 + rnd() * 2.0;
      const isDark = rnd() > 0.6;

      ctx.strokeStyle = isDark ? tone.darkGrain : tone.grain;
      ctx.globalAlpha = isDark ? 0.25 : 0.16;
      ctx.lineWidth = 0.8 + rnd() * 0.8;

      ctx.beginPath();
      for (let y = 0; y <= 1024; y += 16) {
        const ox = Math.sin(y / wavePeriod) * waveAmp;
        if (y === 0) ctx.moveTo(fx + ox, y);
        else ctx.lineTo(fx + ox, y);
      }
      ctx.stroke();
    }

    // Earlywood / latewood growth ring bands
    const bandCount = 4 + Math.floor(rnd() * 3);
    for (let b = 0; b < bandCount; b++) {
      const bx = px + rnd() * plankW;
      ctx.fillStyle = tone.grain;
      ctx.globalAlpha = 0.07 + rnd() * 0.05;
      ctx.fillRect(bx - 3, 0, 6, 1024);
    }

    // Natural wood knots (kvistar) on spruce boards
    if (isNaturalWood && rnd() > 0.38) {
      const knotY = 140 + rnd() * 740;
      const knotX = px + 14 + rnd() * (plankW - 28);
      const knotR = 3.5 + rnd() * 6;
      const knotAspect = 1.3 + rnd() * 0.7;

      // Concentric growth deflection rings
      for (let r = knotR * 2.4; r >= knotR; r -= 1.6) {
        ctx.strokeStyle = tone.darkGrain;
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(knotX, knotY, r, r * knotAspect, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Dark amber knot center core
      const knotGrad = ctx.createRadialGradient(knotX, knotY, 1, knotX, knotY, knotR);
      knotGrad.addColorStop(0, '#5a381e');
      knotGrad.addColorStop(0.7, '#784a28');
      knotGrad.addColorStop(1, '#a66e3b');
      ctx.fillStyle = knotGrad;
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.ellipse(knotX, knotY, knotR, knotR * knotAspect, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark perimeter ring
      ctx.strokeStyle = '#3b2210';
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // A shadow joint and a lit edge, subtle and authentic on Scandinavian timber
    const seam = Math.max(3, Math.round(plankW * (isNaturalWood ? 0.025 : 0.035)));
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = isNaturalWood ? 'rgba(90, 68, 42, 0.45)' : (isBlack ? 'rgba(0, 0, 0, 0.65)' : 'rgba(25, 25, 25, 0.45)');
    ctx.fillRect(px + plankW - seam, 0, seam, 1024);

    ctx.fillStyle = isNaturalWood ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.32)';
    ctx.fillRect(px, 0, Math.max(2, Math.round(seam * 0.42)), 1024);
  }

  ctx.globalAlpha = 1.0;
  const texture = new THREE.CanvasTexture(orientBoards(canvas, options.panelOrientation, upright));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  applyCladdingRepeat(texture, options, upright);
  return texture;
}

/** Store UV axes in metres so the shared repeat matches the board size on every face. */
export function writeMetreUvs(geo: THREE.BufferGeometry, yShift: number): void {
  const pos = geo.getAttribute('position');
  const uv = geo.getAttribute('uv');
  const norm = geo.getAttribute('normal');
  if (!pos || !uv || !norm) return;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i) + yShift;
    const z = pos.getZ(i);
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    const u = ny > 0.5 || nx > 0.5 ? (nx > 0.5 ? z : x) : x;
    const v = ny > 0.5 ? z : y;
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
}

/** Single solid vertical corner board (knutbräda) texture without internal tiling seams or gaplines. */
export function createCornerBoardTexture(
  materialKey: MaterialKey,
  customHex?: string | null,
  overrideColor?: string | null
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const spruceTones = [
    { base: '#f6ead8', grain: '#e4d2b4', darkGrain: '#cbb892' },
    { base: '#f4e7d4', grain: '#e2d0b2', darkGrain: '#c9b690' }
  ];
  let isNaturalWood = false;
  let isBlack = false;
  let colorPalette: { base: string; grain: string; darkGrain: string };

  if (overrideColor && overrideColor !== 'same') {
    if (overrideColor === 'wood') {
      isNaturalWood = true;
      colorPalette = spruceTones[0];
    } else if (overrideColor === 'white') {
      colorPalette = { base: '#f8fafc', grain: '#e2e8f0', darkGrain: '#cbd5e1' };
    } else if (overrideColor === 'falurod') {
      colorPalette = { base: '#892622', grain: '#731c19', darkGrain: '#591310' };
    } else if (overrideColor === 'grey') {
      colorPalette = { base: '#64748b', grain: '#475569', darkGrain: '#334155' };
    } else if (overrideColor === 'black') {
      isBlack = true;
      colorPalette = { base: '#1a1c1b', grain: '#121413', darkGrain: '#070808' };
    } else if (overrideColor.startsWith('#')) {
      colorPalette = paintBoards(overrideColor);
    } else {
      colorPalette = { base: '#f8fafc', grain: '#e2e8f0', darkGrain: '#cbd5e1' };
    }
  } else {
    isNaturalWood = materialKey === 'wood' && !customHex;
    isBlack = materialKey === 'black' && !customHex;
    const painted = customHex ? paintBoards(customHex) : null;
    if (painted) {
      colorPalette = painted;
    } else if (materialKey === 'falurod') {
      colorPalette = { base: '#892622', grain: '#731c19', darkGrain: '#591310' };
    } else if (materialKey === 'grey') {
      colorPalette = { base: '#64748b', grain: '#475569', darkGrain: '#334155' };
    } else if (materialKey === 'white') {
      colorPalette = { base: '#f8fafc', grain: '#e2e8f0', darkGrain: '#cbd5e1' };
    } else if (materialKey === 'black') {
      colorPalette = { base: '#1a1c1b', grain: '#121413', darkGrain: '#070808' };
    } else {
      colorPalette = spruceTones[0];
    }
  }

  ctx.fillStyle = colorPalette.base;
  ctx.fillRect(0, 0, 512, 1024);

  let seed = 97;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const fiberCount = 55;
  for (let f = 0; f < fiberCount; f++) {
    const fx = rnd() * 512;
    const wavePeriod = 80 + rnd() * 120;
    const waveAmp = 1.0 + rnd() * 1.8;
    const isDark = rnd() > 0.6;

    ctx.strokeStyle = isDark ? colorPalette.darkGrain : colorPalette.grain;
    ctx.globalAlpha = isDark ? 0.22 : 0.14;
    ctx.lineWidth = 0.8 + rnd() * 0.7;

    ctx.beginPath();
    for (let y = 0; y <= 1024; y += 16) {
      const ox = Math.sin(y / wavePeriod) * waveAmp;
      if (y === 0) ctx.moveTo(fx + ox, y);
      else ctx.lineTo(fx + ox, y);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 2, 1024);
  ctx.globalAlpha = 0.20;
  ctx.fillStyle = '#000000';
  ctx.fillRect(510, 0, 2, 1024);

  ctx.globalAlpha = 1.0;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1 / 2.4);
  return texture;
}

export function createCornerBoardBumpMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 1024);

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, '#787878');
  grad.addColorStop(0.5, '#8c8c8c');
  grad.addColorStop(1, '#787878');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1024);

  const bumpTexture = new THREE.CanvasTexture(canvas);
  bumpTexture.wrapS = THREE.ClampToEdgeWrapping;
  bumpTexture.wrapT = THREE.RepeatWrapping;
  bumpTexture.repeat.set(1, 1 / 2.4);
  return bumpTexture;
}

/** Map UVs across a single solid board without internal tiling seams or gaplines. */
export function writeSingleBoardUvs(geo: THREE.BufferGeometry, yShift: number): void {
  const pos = geo.getAttribute('position');
  const uv = geo.getAttribute('uv');
  const norm = geo.getAttribute('normal');
  if (!pos || !uv || !norm) return;

  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const spanX = Math.max(0.001, maxX - minX);
  const spanZ = Math.max(0.001, maxZ - minZ);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i) + yShift;
    const z = pos.getZ(i);
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));

    let u = 0;
    if (ny > 0.5) {
      u = (x - minX) / spanX;
    } else if (nx > 0.5) {
      u = (z - minZ) / spanZ;
    } else {
      u = (x - minX) / spanX;
    }
    uv.setXY(i, u, y);
  }
  uv.needsUpdate = true;
}

export function createRoofFeltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2a313c';
  ctx.fillRect(0, 0, 256, 256);
  let seed = 17;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 1800; i++) {
    const shade = rnd() > 0.5 ? 58 : 28;
    ctx.fillStyle = `rgba(${shade}, ${shade + 4}, ${shade + 8}, 0.35)`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 1.5, 1 + rnd());
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 3);
  texture.anisotropy = 8;
  return texture;
}

export function createRoofMetalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#7d8b99';
  ctx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = '#c5d0da';
    ctx.fillRect(x, 0, 2, 256);
    ctx.fillStyle = '#4e5c6a';
    ctx.fillRect(x + 2, 0, 3, 256);
    ctx.fillStyle = '#9aabba';
    ctx.fillRect(x + 5, 0, 24, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  texture.anisotropy = 8;
  return texture;
}

export function createRoofTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#6a655f';
  ctx.fillRect(0, 0, 256, 256);
  const tileW = 32;
  const tileH = 22;
  for (let row = 0; row < 14; row++) {
    const offset = row % 2 === 0 ? 0 : tileW / 2;
    for (let col = -1; col < 10; col++) {
      const x = col * tileW + offset;
      const y = row * (tileH - 6);
      ctx.fillStyle = '#514c47';
      ctx.fillRect(x, y + tileH - 8, tileW - 2, 8);
      ctx.fillStyle = row % 2 === 0 ? '#7a756e' : '#6e6962';
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 2, tileW - 4, tileH - 6, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 3);
  texture.anisotropy = 8;
  return texture;
}

/** Overlapping asphalt tabs. Square cuts and a dark course shadow, so they do not read as concrete tiles. */
export function createRoofShingleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2c2824';
  ctx.fillRect(0, 0, 256, 256);

  const tabW = 64;
  const course = 48;
  const rows = Math.ceil(256 / course) + 1;
  for (let row = 0; row < rows; row++) {
    const offset = row % 2 === 0 ? 0 : tabW / 2;
    const y = row * course;
    for (let col = -1; col < 6; col++) {
      const x = col * tabW + offset;
      const tone = (row + col) % 3 === 0 ? '#5a4b3e' : (row + col) % 3 === 1 ? '#4d4036' : '#43382f';
      ctx.fillStyle = tone;
      ctx.fillRect(x + 2, y + 2, tabW - 4, course - 4);
      ctx.fillStyle = 'rgba(255, 236, 210, 0.08)';
      ctx.fillRect(x + 2, y + 2, tabW - 4, 3);
      ctx.fillStyle = '#1c1815';
      ctx.fillRect(x, y + course - 10, tabW, 10);
      ctx.fillRect(x + tabW - 2, y, 2, course);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 4);
  texture.anisotropy = 8;
  return texture;
}

export function createRoofSurfaceMaterial(roofCovering?: RoofCovering): THREE.MeshStandardMaterial {
  if (roofCovering === 'metal') {
    return new THREE.MeshStandardMaterial({
      map: createRoofMetalTexture(),
      roughness: 0.34,
      metalness: 0.72
    });
  }
  if (roofCovering === 'tiles') {
    return new THREE.MeshStandardMaterial({
      map: createRoofTileTexture(),
      roughness: 0.86,
      metalness: 0.04
    });
  }
  if (roofCovering === 'shingles') {
    return new THREE.MeshStandardMaterial({
      map: createRoofShingleTexture(),
      roughness: 0.9,
      metalness: 0.02
    });
  }
  return new THREE.MeshStandardMaterial({
    map: createRoofFeltTexture(),
    color: '#3a4250',
    roughness: 0.92,
    metalness: 0.02
  });
}

export function createVerticalPlankBumpMap(
  options: { panelOrientation?: PanelOrientation; panelWidthMm?: number },
  upright = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Midtone neutral base height
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 1024, 1024);

  const plankCount = 4;
  const plankW = 1024 / plankCount;

  for (let p = 0; p < plankCount; p++) {
    const px = p * plankW;

    // Slight curvature / bevel on plank board (center elevated)
    const grad = ctx.createLinearGradient(px, 0, px + plankW, 0);
    grad.addColorStop(0, '#757575');
    grad.addColorStop(0.5, '#8c8c8c');
    grad.addColorStop(1, '#707070');
    ctx.fillStyle = grad;
    ctx.fillRect(px, 0, plankW, 1024);

    const seam = Math.max(3, Math.round(plankW * 0.035));
    ctx.fillStyle = '#555555';
    ctx.fillRect(px + plankW - seam, 0, seam, 1024);
    ctx.fillStyle = '#9c9c9c';
    ctx.fillRect(px, 0, Math.max(2, Math.round(seam * 0.4)), 1024);
  }

  const bumpTexture = new THREE.CanvasTexture(orientBoards(canvas, options.panelOrientation, upright));
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.wrapT = THREE.RepeatWrapping;
  applyCladdingRepeat(bumpTexture, options, upright);
  return bumpTexture;
}

export function createPineFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#eaddcf';
  ctx.fillRect(0, 0, 512, 512);

  // Horizontal floorboards
  const boardH = 32;
  for (let y = 0; y < 512; y += boardH) {
    ctx.fillStyle = '#d1c0ae';
    ctx.fillRect(0, y, 512, 1.5);

    // Staggered butt joints
    const jointX = (y % 64 === 0 ? 160 : 340) + ((y * 13) % 80);
    ctx.fillRect(jointX, y, 1.5, boardH);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}
