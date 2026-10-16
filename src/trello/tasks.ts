/** Build Trello cards from a saved house: project checklist + sticky notes. */

export interface TrelloCardDraft {
  name: string;
  desc: string;
}

export interface HouseTaskSource {
  name?: string;
  locale?: 'sv' | 'en';
  notes?: Array<{ text?: string; link?: { kind?: string; wall?: string; slotId?: string } }>;
  config?: Record<string, unknown> | null;
}

type Copy = {
  project: string;
  size: string;
  foundation: string;
  walls: string;
  roof: string;
  openings: string;
  loft: string;
  terrace: string;
  interior: string;
  note: string;
  noteOn: string;
};

const SV: Copy = {
  project: 'Projektöversikt',
  size: 'Bekräfta mått och bygglov',
  foundation: 'Grund och platta',
  walls: 'Ytterväggar och fasad',
  roof: 'Tak och täckning',
  openings: 'Dörrar, fönster och port',
  loft: 'Sovloft',
  terrace: 'Altan / uteplats',
  interior: 'Innerväggar och rum',
  note: 'Anteckning från Builder',
  noteOn: 'Fäst på'
};

const EN: Copy = {
  project: 'Project overview',
  size: 'Confirm dimensions and permits',
  foundation: 'Foundation and slab',
  walls: 'Exterior walls and facade',
  roof: 'Roof and covering',
  openings: 'Doors, windows, and gate',
  loft: 'Sleeping loft',
  terrace: 'Terrace / deck',
  interior: 'Interior walls and rooms',
  note: 'Note from Builder',
  noteOn: 'Pinned to'
};

function copyFor(locale: 'sv' | 'en' | undefined): Copy {
  return locale === 'en' ? EN : SV;
}

function meters(mm: unknown) {
  const n = Number(mm);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `${Math.round(n / 10) / 100} m`;
}

function linkLabel(link: { kind?: string; wall?: string; slotId?: string } | undefined, locale: 'sv' | 'en') {
  if (!link?.kind || link.kind === 'board') return '';
  if (link.kind === 'wall') {
    const wall = link.wall || '';
    return locale === 'en' ? `wall (${wall})` : `vägg (${wall})`;
  }
  if (link.kind === 'slot') return link.slotId || 'slot';
  return link.kind;
}

/** Turn the open house into Trello card drafts (checklist + notes). */
export function trelloCardsFromHouse(source: HouseTaskSource): TrelloCardDraft[] {
  const locale = source.locale === 'en' ? 'en' : 'sv';
  const copy = copyFor(locale);
  const config = source.config && typeof source.config === 'object' ? source.config : {};
  const cards: TrelloCardDraft[] = [];

  const width = meters(config.buildingWidth);
  const depth = meters(config.buildingDepth);
  const height = meters(config.buildingHeight);
  const sizeLine = [width && `W ${width}`, depth && `D ${depth}`, height && `H ${height}`]
    .filter(Boolean)
    .join(' · ');

  cards.push({
    name: copy.project,
    desc: [
      source.name ? `Builder: ${source.name}` : 'Builder house',
      sizeLine,
      config.activeRoof ? `Roof: ${String(config.activeRoof)}` : '',
      config.activeMaterial ? `Facade: ${String(config.activeMaterial)}` : ''
    ].filter(Boolean).join('\n')
  });

  cards.push({
    name: copy.size,
    desc: sizeLine || (locale === 'en' ? 'Check plot limits and municipal rules.' : 'Kontrollera tomtgränser och kommunens regler.')
  });

  cards.push({ name: copy.foundation, desc: '' });
  cards.push({
    name: copy.walls,
    desc: [
      config.panelOrientation ? `Orientation: ${String(config.panelOrientation)}` : '',
      config.claddingSizeId ? `Cladding: ${String(config.claddingSizeId)}` : '',
      config.activePaintId || config.customPaint ? 'Custom paint selected' : ''
    ].filter(Boolean).join('\n')
  });

  cards.push({
    name: copy.roof,
    desc: [
      config.activeRoof ? String(config.activeRoof) : '',
      config.roofCovering ? String(config.roofCovering) : '',
      config.flushRoof ? (locale === 'en' ? 'Flush roof' : 'Flush-tak') : ''
    ].filter(Boolean).join('\n')
  });

  cards.push({
    name: copy.openings,
    desc: [
      config.activeDoor ? `Door: ${String(config.activeDoor)}` : '',
      config.activeWindow ? `Window: ${String(config.activeWindow)}` : '',
      config.activeGate ? `Gate: ${String(config.activeGate)}` : ''
    ].filter(Boolean).join('\n')
  });

  if (config.hasLoft || config.activeLoft) {
    cards.push({
      name: copy.loft,
      desc: [
        config.loftCount != null ? `Count: ${String(config.loftCount)}` : '',
        config.loftPlacement ? `Placement: ${String(config.loftPlacement)}` : '',
        config.hasLoftStair ? `Stair: ${String(config.loftStairType || 'yes')}` : ''
      ].filter(Boolean).join('\n')
    });
  }

  const terraces = Array.isArray(config.terraces) ? config.terraces : [];
  if (terraces.length) {
    cards.push({
      name: copy.terrace,
      desc: terraces
        .map((item) => {
          if (!item || typeof item !== 'object') return '';
          const row = item as { side?: string; depth?: string };
          return [row.side, row.depth].filter(Boolean).join(' · ');
        })
        .filter(Boolean)
        .join('\n')
    });
  }

  const rooms = Array.isArray(config.placedRooms) ? config.placedRooms : [];
  if (rooms.length || config.showInnerWalls) {
    cards.push({
      name: copy.interior,
      desc: rooms.length
        ? (locale === 'en' ? `${rooms.length} placed room(s)` : `${rooms.length} placerade rum`)
        : ''
    });
  }

  const notes = Array.isArray(source.notes) ? source.notes : [];
  for (const note of notes) {
    const text = String(note?.text ?? '').trim().replace(/\s+/g, ' ');
    if (!text) continue;
    const where = linkLabel(note.link, locale);
    cards.push({
      name: text.length > 80 ? `${text.slice(0, 77)}…` : text,
      desc: where ? `${copy.note}\n${copy.noteOn}: ${where}` : copy.note
    });
  }

  return cards.slice(0, 40);
}
