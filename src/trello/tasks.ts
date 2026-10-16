/**
 * Carry a Builder house project into Trello: milestone columns from the
 * configurator flow, construction todos from the saved config, and sticky
 * notes as open tasks. Items already decided in Builder land on Done.
 */

export type TrelloListKey =
  | 'milestones'
  | 'size'
  | 'structure'
  | 'roof'
  | 'openings'
  | 'outdoor'
  | 'interior'
  | 'notes'
  | 'doing'
  | 'done';

export interface TrelloCardDraft {
  name: string;
  desc: string;
  list: TrelloListKey;
}

export interface TrelloListDraft {
  key: TrelloListKey;
  name: string;
}

export interface TrelloBoardPlan {
  lists: TrelloListDraft[];
  cards: TrelloCardDraft[];
}

export interface HouseTaskSource {
  name?: string;
  locale?: 'sv' | 'en';
  notes?: Array<{ text?: string; link?: { kind?: string; wall?: string; slotId?: string } }>;
  config?: Record<string, unknown> | null;
}

type Copy = {
  lists: Record<TrelloListKey, string>;
  milestoneSize: string;
  milestoneRoof: string;
  milestoneFacade: string;
  milestoneOpenings: string;
  milestoneFloor: string;
  milestoneDone: string;
  milestoneOpen: string;
  project: string;
  sizeConfirm: string;
  foundation: string;
  walls: string;
  materials: string;
  roof: string;
  openings: string;
  loft: string;
  terrace: string;
  interior: string;
  floorDone: string;
  floorOpen: string;
  note: string;
  noteOn: string;
};

const SV: Copy = {
  lists: {
    milestones: 'Milstolpar',
    size: 'Mått & lov',
    structure: 'Stomme & fasad',
    roof: 'Tak',
    openings: 'Öppningar',
    outdoor: 'Loft & ute',
    interior: 'Planlösning',
    notes: 'Anteckningar',
    doing: 'Pågår',
    done: 'Klart'
  },
  milestoneSize: 'Välj storlek',
  milestoneRoof: 'Välj tak',
  milestoneFacade: 'Välj fasad',
  milestoneOpenings: 'Placera öppningar',
  milestoneFloor: 'Klarmarkera planlösning',
  milestoneDone: 'Beslutat i Builder',
  milestoneOpen: 'Kvar i Builder',
  project: 'Projektöversikt',
  sizeConfirm: 'Bekräfta mått och bygglov',
  foundation: 'Grund och platta',
  walls: 'Ytterväggar och fasad',
  materials: 'Material och färg',
  roof: 'Tak och täckning',
  openings: 'Dörrar, fönster och port',
  loft: 'Sovloft',
  terrace: 'Altan / uteplats',
  interior: 'Innerväggar och rum',
  floorDone: 'Planlösningen är markerad som klar',
  floorOpen: 'Planlösningen är inte klarmarkerad ännu',
  note: 'Anteckning från Builder',
  noteOn: 'Fäst på'
};

const EN: Copy = {
  lists: {
    milestones: 'Milestones',
    size: 'Size & permits',
    structure: 'Structure & facade',
    roof: 'Roof',
    openings: 'Openings',
    outdoor: 'Loft & outdoor',
    interior: 'Floor plan',
    notes: 'Notes',
    doing: 'Doing',
    done: 'Done'
  },
  milestoneSize: 'Choose size',
  milestoneRoof: 'Choose roof',
  milestoneFacade: 'Choose facade',
  milestoneOpenings: 'Place openings',
  milestoneFloor: 'Mark floor plan done',
  milestoneDone: 'Decided in Builder',
  milestoneOpen: 'Still open in Builder',
  project: 'Project overview',
  sizeConfirm: 'Confirm dimensions and permits',
  foundation: 'Foundation and slab',
  walls: 'Exterior walls and facade',
  materials: 'Materials and paint',
  roof: 'Roof and covering',
  openings: 'Doors, windows, and gate',
  loft: 'Sleeping loft',
  terrace: 'Terrace / deck',
  interior: 'Interior walls and rooms',
  floorDone: 'Floor plan marked done',
  floorOpen: 'Floor plan not marked done yet',
  note: 'Note from Builder',
  noteOn: 'Pinned to'
};

const LIST_ORDER: TrelloListKey[] = [
  'milestones',
  'size',
  'structure',
  'roof',
  'openings',
  'outdoor',
  'interior',
  'notes',
  'doing',
  'done'
];

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

function slotCounts(config: Record<string, unknown>) {
  const slots = config.wallSlots;
  const counts = { door: 0, window: 0, gate: 0, other: 0 };
  if (!slots || typeof slots !== 'object' || Array.isArray(slots)) return counts;
  for (const value of Object.values(slots as Record<string, { type?: string; itemId?: string | null }>)) {
    if (!value || typeof value !== 'object') continue;
    if (!value.itemId) continue;
    if (value.type === 'door') counts.door += 1;
    else if (value.type === 'window') counts.window += 1;
    else if (value.type === 'gate') counts.gate += 1;
    else counts.other += 1;
  }
  return counts;
}

function push(
  cards: TrelloCardDraft[],
  list: TrelloListKey,
  name: string,
  desc: string,
  done = false
) {
  cards.push({
    name,
    desc,
    list: done ? 'done' : list
  });
}

/** Full board plan: milestone lists + todos carried from the house. */
export function trelloBoardPlanFromHouse(source: HouseTaskSource): TrelloBoardPlan {
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
  const sizeChosen = Boolean(width && depth);
  const roofChosen = Boolean(config.activeRoof);
  const facadeChosen = Boolean(config.activeMaterial || config.activePaintId || config.customPaint);
  const openings = slotCounts(config);
  const openingsChosen = openings.door + openings.window + openings.gate + openings.other > 0
    || Boolean(config.activeDoor || config.activeWindow || config.activeGate);
  const floorDone = Boolean(config.floorPlanDone);
  const rooms = Array.isArray(config.placedRooms) ? config.placedRooms : [];
  const terraces = Array.isArray(config.terraces) ? config.terraces : [];
  const hasLoft = Boolean(config.hasLoft || config.activeLoft);

  push(
    cards,
    'milestones',
    copy.project,
    [
      source.name ? `Builder: ${source.name}` : 'Builder house',
      sizeLine,
      config.activeRoof ? `Roof: ${String(config.activeRoof)}` : '',
      config.activeMaterial ? `Facade: ${String(config.activeMaterial)}` : '',
      config.selectedSizeId ? `Size id: ${String(config.selectedSizeId)}` : ''
    ].filter(Boolean).join('\n')
  );

  push(
    cards,
    'milestones',
    copy.milestoneSize,
    sizeChosen
      ? `${copy.milestoneDone}\n${sizeLine}`
      : copy.milestoneOpen,
    sizeChosen
  );
  push(
    cards,
    'milestones',
    copy.milestoneRoof,
    roofChosen
      ? `${copy.milestoneDone}\n${String(config.activeRoof)}`
      : copy.milestoneOpen,
    roofChosen
  );
  push(
    cards,
    'milestones',
    copy.milestoneFacade,
    facadeChosen
      ? `${copy.milestoneDone}\n${String(config.activeMaterial || config.activePaintId || 'paint')}`
      : copy.milestoneOpen,
    facadeChosen
  );
  push(
    cards,
    'milestones',
    copy.milestoneOpenings,
    openingsChosen
      ? `${copy.milestoneDone}\nDoors ${openings.door} · Windows ${openings.window} · Gates ${openings.gate}`
      : copy.milestoneOpen,
    openingsChosen
  );
  push(
    cards,
    'milestones',
    copy.milestoneFloor,
    floorDone
      ? `${copy.floorDone}${rooms.length ? `\n${rooms.length} room(s)` : ''}`
      : copy.floorOpen,
    floorDone
  );

  push(
    cards,
    'size',
    copy.sizeConfirm,
    sizeLine || (locale === 'en'
      ? 'Check plot limits and municipal rules.'
      : 'Kontrollera tomtgränser och kommunens regler.')
  );

  push(cards, 'structure', copy.foundation, sizeLine);
  push(
    cards,
    'structure',
    copy.walls,
    [
      config.panelOrientation ? `Orientation: ${String(config.panelOrientation)}` : '',
      config.claddingSizeId ? `Cladding: ${String(config.claddingSizeId)}` : '',
      config.cornerBoards != null ? `Corner boards: ${String(config.cornerBoards)}` : ''
    ].filter(Boolean).join('\n')
  );
  push(
    cards,
    'structure',
    copy.materials,
    [
      config.activeMaterial ? String(config.activeMaterial) : '',
      config.activePaintId ? `Paint: ${String(config.activePaintId)}` : '',
      config.customPaint ? 'Custom paint selected' : '',
      config.cornerColor ? `Corners: ${String(config.cornerColor)}` : ''
    ].filter(Boolean).join('\n'),
    facadeChosen
  );

  push(
    cards,
    'roof',
    copy.roof,
    [
      config.activeRoof ? String(config.activeRoof) : '',
      config.roofCovering ? String(config.roofCovering) : '',
      config.flushRoof ? (locale === 'en' ? 'Flush roof' : 'Flush-tak') : ''
    ].filter(Boolean).join('\n'),
    roofChosen
  );

  push(
    cards,
    'openings',
    copy.openings,
    [
      openings.door || openings.window || openings.gate
        ? `Placed — doors ${openings.door}, windows ${openings.window}, gates ${openings.gate}`
        : '',
      config.activeDoor ? `Catalog door: ${String(config.activeDoor)}` : '',
      config.activeWindow ? `Catalog window: ${String(config.activeWindow)}` : '',
      config.activeGate ? `Catalog gate: ${String(config.activeGate)}` : '',
      config.doorCanopy ? (locale === 'en' ? 'Door canopy on' : 'Skärmtak på') : ''
    ].filter(Boolean).join('\n'),
    openingsChosen
  );

  if (hasLoft) {
    push(
      cards,
      'outdoor',
      copy.loft,
      [
        config.loftCount != null ? `Count: ${String(config.loftCount)}` : '',
        config.loftPlacement ? `Placement: ${String(config.loftPlacement)}` : '',
        config.hasLoftStair ? `Stair: ${String(config.loftStairType || 'yes')}` : ''
      ].filter(Boolean).join('\n')
    );
  }

  if (terraces.length) {
    push(
      cards,
      'outdoor',
      copy.terrace,
      terraces
        .map((item) => {
          if (!item || typeof item !== 'object') return '';
          const row = item as { side?: string; depth?: string; span?: string };
          return [row.side, row.depth, row.span].filter(Boolean).join(' · ');
        })
        .filter(Boolean)
        .join('\n')
    );
  }

  if (rooms.length || config.showInnerWalls || floorDone) {
    push(
      cards,
      'interior',
      copy.interior,
      [
        rooms.length
          ? (locale === 'en' ? `${rooms.length} placed room(s)` : `${rooms.length} placerade rum`)
          : '',
        config.showInnerWalls
          ? (locale === 'en' ? 'Inner walls shown' : 'Innerväggar visas')
          : '',
        floorDone ? copy.floorDone : copy.floorOpen
      ].filter(Boolean).join('\n'),
      floorDone
    );
  }

  const notes = Array.isArray(source.notes) ? source.notes : [];
  for (const note of notes) {
    const text = String(note?.text ?? '').trim().replace(/\s+/g, ' ');
    if (!text) continue;
    const where = linkLabel(note.link, locale);
    push(
      cards,
      'notes',
      text.length > 80 ? `${text.slice(0, 77)}…` : text,
      where ? `${copy.note}\n${copy.noteOn}: ${where}` : copy.note
    );
  }

  return {
    lists: LIST_ORDER.map((key) => ({ key, name: copy.lists[key] })),
    cards: cards.slice(0, 50)
  };
}

/** Cards only (legacy helper for callers that ignore list layout). */
export function trelloCardsFromHouse(source: HouseTaskSource): TrelloCardDraft[] {
  return trelloBoardPlanFromHouse(source).cards;
}
