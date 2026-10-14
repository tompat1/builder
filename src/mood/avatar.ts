/**
 * AI Avatar generator for MoodBoard participants.
 * Blends up to 3 chosen themes into a unique, stylish vector SVG avatar.
 */

export interface AvatarTheme {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  tagline: string;
  taglineEn: string;
  bgGradient: [string, string, string];
  accent: string;
  fg: string;
}

export const AVATAR_THEMES: AvatarTheme[] = [
  {
    id: 'Foresty',
    name: 'Skoglig',
    nameEn: 'Foresty',
    emoji: '🌲',
    tagline: 'Djupa barrskogar, mossa och jordnära toner',
    taglineEn: 'Deep pines, moss, and earthy tones',
    bgGradient: ['#133327', '#22523d', '#3f785b'],
    accent: '#a7d7b5',
    fg: '#f0fdf4'
  },
  {
    id: 'Adventure',
    name: 'Äventyr',
    nameEn: 'Adventure',
    emoji: '🧭',
    tagline: 'Bergsryggar, kompasser och gyllene upptäckarglöd',
    taglineEn: 'Mountain ridges, compasses, and explorer amber',
    bgGradient: ['#3b1f13', '#66391d', '#9a5e2f'],
    accent: '#f59e0b',
    fg: '#fffbeb'
  },
  {
    id: 'Flowery',
    name: 'Blommig',
    nameEn: 'Flowery',
    emoji: '🌸',
    tagline: 'Mjuka kronblad, pastellbris och organisk blomstring',
    taglineEn: 'Soft petals, pastel breeze, and organic blooms',
    bgGradient: ['#4c1d42', '#7e2d6b', '#b35398'],
    accent: '#f472b6',
    fg: '#fdf2f8'
  },
  {
    id: 'Dramatic',
    name: 'Dramatisk',
    nameEn: 'Dramatic',
    emoji: '⚡',
    tagline: 'Skarp kontrast, elektrisk stämning och mörka skuggor',
    taglineEn: 'Sharp contrast, electric mood, and deep shadows',
    bgGradient: ['#180828', '#381254', '#5b1f87'],
    accent: '#e11d48',
    fg: '#ffffff'
  },
  {
    id: 'Chill',
    name: 'Chill',
    nameEn: 'Chill',
    emoji: '☕',
    tagline: 'Avslappnad lounge, kaffearom och lugna vågformer',
    taglineEn: 'Relaxed lounge, cozy warmth, and serene waves',
    bgGradient: ['#162a2c', '#284649', '#466c6f'],
    accent: '#38bdf8',
    fg: '#f0fdfa'
  },
  {
    id: 'Musically',
    name: 'Musikalisk',
    nameEn: 'Musically',
    emoji: '🎵',
    tagline: 'Ljudvågor, vinylgrooves och rytmisk energi',
    taglineEn: 'Soundwaves, vinyl grooves, and rhythmic pulse',
    bgGradient: ['#23153c', '#43236e', '#6e38a8'],
    accent: '#c084fc',
    fg: '#faf5ff'
  },
  {
    id: 'Dreamy',
    name: 'Drömsk',
    nameEn: 'Dreamy',
    emoji: '✨',
    tagline: 'Stjärnglans, månskära och eteriska nebulosor',
    taglineEn: 'Starlight, crescent moon, and ethereal nebulas',
    bgGradient: ['#1e1b4b', '#312e81', '#4f46e5'],
    accent: '#a5b4fc',
    fg: '#eef2ff'
  },
  {
    id: 'Cinematic',
    name: 'Filmisk',
    nameEn: 'Cinematic',
    emoji: '🎬',
    tagline: 'Anamorfisk linsreflex, 35mm-grain och widescreen-känsla',
    taglineEn: 'Anamorphic flare, 35mm grain, and widescreen mood',
    bgGradient: ['#0f172a', '#1e293b', '#334155'],
    accent: '#38bdf8',
    fg: '#f8fafc'
  },
  {
    id: 'Colorful',
    name: 'Färgstark',
    nameEn: 'Colorful',
    emoji: '🎨',
    tagline: 'Sprakande prisma, geometriska pops och ren glädje',
    taglineEn: 'Vibrant prism, geometric pops, and pure energy',
    bgGradient: ['#7c2d12', '#c2410c', '#e11d48'],
    accent: '#fbbf24',
    fg: '#fffbeb'
  },
  {
    id: 'Noir (B/W)',
    name: 'Noir (Svartvit)',
    nameEn: 'Noir (B/W)',
    emoji: '🕶️',
    tagline: 'Monokrom dramatik, djup svärta och rökiga konturer',
    taglineEn: 'Monochrome contrast, deep ink, and smoky silhouettes',
    bgGradient: ['#09090b', '#18181b', '#27272a'],
    accent: '#e4e4e7',
    fg: '#fafafa'
  },
  {
    id: 'Graffiti',
    name: 'Graffiti',
    nameEn: 'Graffiti',
    emoji: '💥',
    tagline: 'Spraystänk, street-stencil och neon-taggar',
    taglineEn: 'Spray paint splatter, street stencil, and neon tags',
    bgGradient: ['#2e1065', '#581c87', '#7e22ce'],
    accent: '#22c55e',
    fg: '#f0fdf4'
  }
];

export function getTheme(id: string): AvatarTheme {
  return AVATAR_THEMES.find((t) => t.id === id) || AVATAR_THEMES[0];
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Procedurally generates a distinctive, multi-layered SVG avatar
 * blending the chosen themes, participant name, and initials.
 */
export function generateAiAvatar(options: {
  name: string;
  themes: string[];
  seed?: string;
}): string {
  const { name, themes, seed = '' } = options;
  const picked = themes.slice(0, 3).map(getTheme);
  const primary = picked[0] || AVATAR_THEMES[0];
  const secondary = picked[1] || primary;
  const tertiary = picked[2] || secondary;

  const hash = hashCode(`${name}:${themes.join(',')}:${seed}`);

  // Base background gradient stops
  const color1 = primary.bgGradient[0];
  const color2 = secondary.bgGradient[1];
  const color3 = tertiary.bgGradient[2];
  const accent1 = primary.accent;
  const accent2 = secondary.accent;

  // Selected theme motifs to render
  const themeIds = new Set(picked.map((p) => p.id));
  const hasForest = themeIds.has('Foresty');
  const hasAdventure = themeIds.has('Adventure');
  const hasFlowery = themeIds.has('Flowery');
  const hasDramatic = themeIds.has('Dramatic');
  const hasChill = themeIds.has('Chill');
  const hasMusically = themeIds.has('Musically');
  const hasDreamy = themeIds.has('Dreamy');
  const hasCinematic = themeIds.has('Cinematic');
  const hasColorful = themeIds.has('Colorful');
  const hasNoir = themeIds.has('Noir (B/W)');
  const hasGraffiti = themeIds.has('Graffiti');

  const rot = (hash % 60) - 30;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="55%" stop-color="${color2}"/>
      <stop offset="100%" stop-color="${color3}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="${accent1}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${accent2}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="circleClip">
      <circle cx="60" cy="60" r="56"/>
    </clipPath>
  </defs>

  <!-- Outer frame ring -->
  <circle cx="60" cy="60" r="58" fill="none" stroke="${accent1}" stroke-width="2.5" stroke-opacity="0.7"/>

  <!-- Main avatar circle -->
  <g clip-path="url(#circleClip)">
    <rect width="120" height="120" fill="url(#bg)"/>
    <circle cx="60" cy="45" r="45" fill="url(#glow)"/>

    ${hasNoir ? `
    <!-- Noir High-contrast duotone stripes & shadow mask -->
    <rect width="120" height="120" fill="#000000" opacity="0.32"/>
    <path d="M-10,130 L130,-10 L80,-10 L-10,80 Z" fill="#ffffff" opacity="0.08"/>
    <path d="M-10,160 L160,-10 L120,-10 L-10,120 Z" fill="#000000" opacity="0.45"/>
    ` : ''}

    ${hasCinematic ? `
    <!-- Cinematic letterbox & lens streak flare -->
    <ellipse cx="60" cy="50" rx="55" ry="4" fill="${accent2}" opacity="0.45" transform="rotate(-15 60 50)"/>
    <rect y="0" width="120" height="10" fill="#000000" opacity="0.5"/>
    <rect y="110" width="120" height="10" fill="#000000" opacity="0.5"/>
    ` : ''}

    ${hasDreamy ? `
    <!-- Dreamy Crescent Moon & Starlight -->
    <path d="M88,24 A10,10 0 1,1 98,34 A12,12 0 1,0 88,24 Z" fill="${accent1}" opacity="0.85"/>
    <path d="M26,30 L28,34 L32,36 L28,38 L26,42 L24,38 L20,36 L24,34 Z" fill="#ffffff" opacity="0.75"/>
    <circle cx="95" cy="58" r="1.5" fill="#ffffff" opacity="0.6"/>
    <circle cx="34" cy="20" r="1.2" fill="#ffffff" opacity="0.5"/>
    ` : ''}

    ${hasForest ? `
    <!-- Forest pine silhouettes -->
    <path d="M15,95 L26,76 L37,95 Z" fill="#0e2319" opacity="0.85"/>
    <path d="M28,95 L42,70 L56,95 Z" fill="#143426" opacity="0.9"/>
    <path d="M78,95 L92,68 L106,95 Z" fill="#0e2319" opacity="0.85"/>
    <path d="M90,95 L102,78 L114,95 Z" fill="#173d2c" opacity="0.7"/>
    ` : ''}

    ${hasAdventure ? `
    <!-- Adventure compass horizon peaks -->
    <path d="M40,95 L60,65 L80,95 Z" fill="#451a03" opacity="0.6"/>
    <path d="M60,20 L64,28 L60,26 L56,28 Z" fill="${accent1}" opacity="0.85"/>
    <circle cx="60" cy="26" r="8" fill="none" stroke="${accent1}" stroke-dasharray="2,2" stroke-width="1" opacity="0.6"/>
    ` : ''}

    ${hasFlowery ? `
    <!-- Flowery botanical petal arc -->
    <circle cx="28" cy="30" r="4.5" fill="${accent1}" opacity="0.75"/>
    <circle cx="35" cy="26" r="4.5" fill="${accent2}" opacity="0.7"/>
    <circle cx="41" cy="32" r="4.5" fill="${accent1}" opacity="0.75"/>
    <circle cx="36" cy="38" r="4.5" fill="${accent2}" opacity="0.7"/>
    <circle cx="29" cy="37" r="4.5" fill="${accent1}" opacity="0.75"/>
    <circle cx="34" cy="33" r="2.5" fill="#ffffff" opacity="0.9"/>
    ` : ''}

    ${hasMusically ? `
    <!-- Musical wave pulses -->
    <rect x="22" y="52" width="3" height="14" rx="1.5" fill="${accent1}" opacity="0.8"/>
    <rect x="28" y="44" width="3" height="24" rx="1.5" fill="${accent2}" opacity="0.85"/>
    <rect x="34" y="48" width="3" height="18" rx="1.5" fill="${accent1}" opacity="0.8"/>
    <path d="M90,32 A8,8 0 0,0 84,40 L84,48 A4,3 0 1,0 87,51 L87,38 L95,35 L95,44 A4,3 0 1,0 98,47 L98,30 Z" fill="${accent1}" opacity="0.75"/>
    ` : ''}

    ${hasDramatic ? `
    <!-- Dramatic energy lightning slash -->
    <polygon points="68,10 52,48 64,48 48,90 74,42 60,42" fill="${accent1}" opacity="0.45"/>
    ` : ''}

    ${hasGraffiti ? `
    <!-- Graffiti paint splatters & urban drips -->
    <circle cx="94" cy="32" r="5" fill="${accent1}" opacity="0.8"/>
    <circle cx="102" cy="30" r="2.5" fill="${accent2}" opacity="0.75"/>
    <circle cx="90" cy="40" r="2" fill="${accent1}" opacity="0.7"/>
    <path d="M93,34 Q92,46 95,48" stroke="${accent1}" stroke-width="2" fill="none" opacity="0.75"/>
    <circle cx="24" cy="80" r="3.5" fill="${accent2}" opacity="0.75"/>
    ` : ''}

    ${hasChill ? `
    <!-- Chill zen gentle wave -->
    <path d="M10,85 Q35,70 60,85 T110,85" fill="none" stroke="${accent1}" stroke-width="3" opacity="0.45"/>
    <path d="M10,92 Q35,77 60,92 T110,92" fill="none" stroke="${accent2}" stroke-width="2" opacity="0.35"/>
    ` : ''}

    ${hasColorful ? `
    <!-- Colorful geometric energy facets -->
    <polygon points="20,20 35,15 28,32" fill="#f59e0b" opacity="0.65"/>
    <polygon points="85,85 105,75 95,100" fill="#ec4899" opacity="0.6"/>
    <polygon points="90,15 105,25 98,35" fill="#3b82f6" opacity="0.65"/>
    ` : ''}

    <!-- Central Stylish Persona Bust / Monogram Silhouette -->
    <!-- Shoulders -->
    <path d="M26,116 C26,94 40,84 60,84 C80,84 94,94 94,116 Z" fill="#ffffff" fill-opacity="0.18"/>
    <!-- Head circle -->
    <circle cx="60" cy="58" r="22" fill="#ffffff" fill-opacity="0.22" stroke="${accent1}" stroke-width="1.8" stroke-opacity="0.75"/>

    <!-- Theme Accents on Character -->
    ${hasChill ? `
    <!-- Cool glasses -->
    <rect x="49" y="52" width="9" height="6" rx="2" fill="${accent1}" opacity="0.9"/>
    <rect x="62" y="52" width="9" height="6" rx="2" fill="${accent1}" opacity="0.9"/>
    <line x1="58" y1="55" x2="62" y2="55" stroke="${accent1}" stroke-width="1.5"/>
    ` : ''}

    ${hasMusically ? `
    <!-- Headphones band -->
    <path d="M42,56 C42,44 48,36 60,36 C72,36 78,44 78,56" fill="none" stroke="${accent2}" stroke-width="3" stroke-linecap="round"/>
    <rect x="38" y="52" width="5" height="12" rx="2" fill="${accent1}"/>
    <rect x="77" y="52" width="5" height="12" rx="2" fill="${accent1}"/>
    ` : ''}

    ${hasNoir ? `
    <!-- Noir fedora slant shadow -->
    <path d="M40,43 Q60,36 80,43 L76,33 Q60,30 44,33 Z" fill="#09090b" opacity="0.9"/>
    <line x1="36" y1="44" x2="84" y2="44" stroke="#ffffff" stroke-width="1.2" opacity="0.75"/>
    ` : ''}

  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Creates an elegant branded account avatar for registered house owners.
 */
export function defaultAccountAvatar(name: string): string {
  const initials = getInitials(name || 'Ägare');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="ownerBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#173D35"/>
      <stop offset="60%" stop-color="#0f2b25"/>
      <stop offset="100%" stop-color="#0a1d19"/>
    </linearGradient>
    <radialGradient id="ownerGlow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#e7d3b0" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#173D35" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="none" stroke="#e7d3b0" stroke-width="2.5" stroke-opacity="0.8"/>
  <circle cx="60" cy="60" r="56" fill="url(#ownerBg)"/>
  <circle cx="60" cy="45" r="45" fill="url(#ownerGlow)"/>

  <!-- Timber architectural corner lines -->
  <line x1="20" y1="20" x2="35" y2="20" stroke="#e7d3b0" stroke-width="1" stroke-opacity="0.4"/>
  <line x1="20" y1="20" x2="20" y2="35" stroke="#e7d3b0" stroke-width="1" stroke-opacity="0.4"/>
  <line x1="100" y1="100" x2="85" y2="100" stroke="#e7d3b0" stroke-width="1" stroke-opacity="0.4"/>
  <line x1="100" y1="100" x2="100" y2="85" stroke="#e7d3b0" stroke-width="1" stroke-opacity="0.4"/>

  <!-- Owner bust -->
  <path d="M26,116 C26,94 40,84 60,84 C80,84 94,94 94,116 Z" fill="#ffffff" fill-opacity="0.15"/>
  <circle cx="60" cy="56" r="22" fill="#ffffff" fill-opacity="0.22" stroke="#e7d3b0" stroke-width="2" stroke-opacity="0.9"/>
  <text x="60" y="64" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="20" fill="#ffffff">${escapeXml(initials)}</text>

  <!-- Crown icon -->
  <path d="M52,30 L60,25 L68,30 L66,34 L54,34 Z" fill="#e7d3b0" opacity="0.9"/>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getInitials(name: string): string {
  const clean = name.trim();
  if (!clean) return 'MB';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
