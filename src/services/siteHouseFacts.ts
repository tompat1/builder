/**
 * Plain-English house description for the site-placement AI render.
 * Attachments and roof come first so they survive the worker prompt length cap.
 */

export type SiteHouseFactsInput = {
  sizeName: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  roofType: string;
  roofCovering?: string;
  wallDesc: string;
  terraces: Array<{
    side: string;
    depth: number;
    building?: string;
    buildingColor?: string;
    buildingDoor?: string;
    buildingWindow?: string;
    hotTub?: boolean;
  }>;
};

function coveringText(covering: string | undefined) {
  const key = covering || 'metal';
  return (
    {
      metal: 'standing-seam sheet metal (plåttak)',
      felt: 'smooth dark roofing felt (takpapp)',
      tiles: 'concrete roof tiles (takpannor)',
      shingles: 'architectural roof shingles (shingeltak)'
    }[key] || `${key} roofing`
  );
}

export function describeRoof(roofType: string, roofCovering?: string) {
  const covering = coveringText(roofCovering);
  if (roofType === 'pulpettak') {
    return `single-slope mono-pitch shed roof (pulpettak, 12° slope) with ${covering}, strictly NOT a gable roof, NO center ridge, NO triangular peak`;
  }
  if (roofType === 'flackt') {
    return `modern flat roof (flackt tak) with clean horizontal parapet trim and ${covering}, strictly NOT a gable roof`;
  }
  if (roofType === 'sadeltak14') {
    return `low-pitch dual-pitch gable roof (sadeltak 14°) with raised eaves and ${covering}`;
  }
  return `classic dual-pitch symmetrical gable roof (sadeltak 22°) with ${covering}`;
}

function colorWord(color?: string) {
  if (color === 'svart') return 'charcoal black';
  if (color === 'falurod') return 'Falu red';
  if (color === 'gra') return 'slate grey';
  if (color === 'vit') return 'white';
  if (color === 'match') return 'matching color';
  return 'natural timber';
}

function doorWord(door?: string) {
  if (door === 'solid') return 'solid wood door';
  if (door === 'lervik') return 'timber door with vertical glass slit';
  if (door === 'stehag') return 'framed glass door';
  return 'full-glass sauna door';
}

function windowWord(window?: string) {
  if (window === 'none') return 'windowless walls';
  if (window === 'panorama') return 'large panoramic glass view window';
  if (window === 'sprojat') return 'mullioned window';
  if (window === 'frost') return 'frosted ribbon window';
  return 'standard framed window';
}

/** Deck + sauna/shed/hot-tub wording for every configured terrace. */
export function describeTerraces(terraces: SiteHouseFactsInput['terraces']) {
  if (!terraces.length) return '';
  const parts: string[] = [];
  for (const deck of terraces) {
    const bits: string[] = [];
    if (deck.building === 'sauna') {
      bits.push(
        `an attached compact ${colorWord(deck.buildingColor)} sauna cabin with a ${doorWord(deck.buildingDoor)}, ${windowWord(deck.buildingWindow)}, a flat or low mono-pitch black roof and a small chimney pipe`
      );
    } else if (deck.building === 'shed') {
      bits.push('an attached timber shed');
    }
    if (deck.hotTub) {
      bits.push(
        'a round cedar hot tub with stainless-steel hoops, built-in wood stove and tall metal flue'
      );
    }
    const side = deck.side || 'front';
    if (bits.length) {
      parts.push(
        `a wooden terrace deck on the ${side} with ${bits.join(' and ')} (depth about ${deck.depth} m)`
      );
    } else {
      parts.push(`a wooden terrace deck on the ${side} (depth about ${deck.depth} m)`);
    }
  }
  return parts.join('; ');
}

/**
 * Facts string for the site composite. Must keep terrace/sauna/tub/roof near the
 * start — the worker truncates this string.
 */
export function siteHouseFacts(input: SiteHouseFactsInput) {
  const attachments = describeTerraces(input.terraces);
  const roof = describeRoof(input.roofType, input.roofCovering);
  const size = `${input.sizeName}, ${input.widthMm} × ${input.depthMm} × ${input.heightMm} mm`;
  const lead = attachments
    ? `Insert only the NEW configured 3D house from image 1 (two panels: facade + overview). Completely omit any old shed. Must include these attached outdoor parts: ${attachments}.`
    : 'Insert only the NEW configured 3D house from image 1. Completely omit any old shed. No terrace, sauna, shed, or hot tub — house shell only.';
  return `${lead} Roof: ${roof}. ${size}, ${input.wallDesc}.`;
}

/** Metres the deck sticks out past each wall — used to frame capture cameras. */
export function terraceOverhangBySide(
  terraces: Array<{ side: string; depth: number }> | undefined
): Record<'front' | 'back' | 'left' | 'right', number> {
  const out = { front: 0, back: 0, left: 0, right: 0 };
  for (const deck of terraces ?? []) {
    if (deck.side === 'front' || deck.side === 'back' || deck.side === 'left' || deck.side === 'right') {
      out[deck.side] = Math.max(out[deck.side], Number(deck.depth) || 0);
    }
  }
  return out;
}
