/**
 * Carry a Builder house into Trello as a ground-up build board.
 * Leftmost lists are the first things to do (critical utilities, then
 * earthworks and foundation). Later phase lists are backlog themes already
 * filled for the next runs. Sticky notes and Builder decisions append after.
 */

export type TrelloListKey =
  | 'critical'
  | 'phase1'
  | 'phase2'
  | 'phase3'
  | 'phase4'
  | 'phase5'
  | 'phase6'
  | 'builder'
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

type ChecklistItem = { name: string; desc: string };

type Copy = {
  lists: Record<TrelloListKey, string>;
  critical: ChecklistItem[];
  phase1: ChecklistItem[];
  phase2: ChecklistItem[];
  phase3: ChecklistItem[];
  phase4: ChecklistItem[];
  phase5: ChecklistItem[];
  phase6: ChecklistItem[];
  project: string;
  milestoneSize: string;
  milestoneRoof: string;
  milestoneFacade: string;
  milestoneOpenings: string;
  milestoneFloor: string;
  milestoneDone: string;
  milestoneOpen: string;
  sizeConfirm: string;
  openings: string;
  loft: string;
  terrace: string;
  interior: string;
  floorDone: string;
  floorOpen: string;
  note: string;
  noteOn: string;
};

const LIST_ORDER: TrelloListKey[] = [
  'critical',
  'phase1',
  'phase2',
  'phase3',
  'phase4',
  'phase5',
  'phase6',
  'builder',
  'notes',
  'doing',
  'done'
];

const SV: Copy = {
  lists: {
    critical: '1. Kritiska beslut först',
    phase1: '2. Fas 1: Markarbete',
    phase2: '3. Fas 2: Grundläggning',
    phase3: '4. Fas 3: Stomme',
    phase4: '5. Fas 4: Klimatskärm',
    phase5: '6. Fas 5: Installationer',
    phase6: '7. Fas 6: Inredning',
    builder: 'Builder-beslut',
    notes: 'Anteckningar',
    doing: 'Pågår',
    done: 'Klart'
  },
  critical: [
    {
      name: '1. Vatten och avlopp (VA)',
      desc: 'Kapacitet för el & vatten — kritisk punkt. Säkerställ att tomten kan försörja huset med VA innan övrigt arbete låses.'
    },
    {
      name: '2. Vattenledningarnas djup',
      desc: 'Året-runt-hus: gräv VA på frostfritt djup (ca 1,2–2 m beroende på ort) eller använd självreglerande värmekabel på rören.'
    },
    {
      name: '3. Elplan och kabeldragning',
      desc: 'Planera var kablar går. Räcker tomtens huvudsäkring (t.ex. 16A/20A) till värme, vitvaror och eventuell elbilsladdning? Placera elcentral.'
    },
    {
      name: '4. Isolering för året-runt',
      desc: 'Rejäl isolering i grund, väggar och tak (ofta ca 200–300 mm beroende på material) samt 3-glasfönster.'
    },
    {
      name: '5. Val av värmekälla',
      desc: 'Direktverkande el blir dyrt över vintern. Föredra luft-luftvärmepump (låg investering) eller vattenburen golvvärme kopplad till central värmepump.'
    }
  ],
  phase1: [
    {
      name: '1.1 Utsättning',
      desc: 'Sätt ut husets exakta koordinater och höjdlägen på tomten.'
    },
    {
      name: '1.2 Schakt',
      desc: 'Schakta bort organisk jord till stabil undergrund (lera, grus eller berg).'
    },
    {
      name: '1.3 Schakt för ledningar',
      desc: 'Gräv ledningsschakt från anslutningspunkter för vatten, avlopp och el till frostfritt djup.'
    },
    {
      name: '1.4 Geotextil och makadam',
      desc: 'Lägg geotextil och fyll schaktet med makadam/kross.'
    },
    {
      name: '1.5 Packning',
      desc: 'Packa bädden ordentligt med tung markvibrator.'
    },
    {
      name: '1.6 Dränering och rör',
      desc: 'Montera dränering runt grunden, dagvattenbrunnar samt huvudledningar för VA under mark.'
    }
  ],
  phase2: [
    {
      name: '2.1 Form / L-element',
      desc: 'Montera isolerade sockelelement (L-element) runt omkretsen.'
    },
    {
      name: '2.2 Isolering under platta',
      desc: 'Lägg EPS-skivor under plattan (ofta 200–300 mm för året-runt).'
    },
    {
      name: '2.3 Uppdragningar för installationer',
      desc: 'Dra elrör, vatten och avlopp upp genom isoleringen där kök och badrum ska ligga.'
    },
    {
      name: '2.4 Armering',
      desc: 'Lägg armeringsnät och armeringsjärn.'
    },
    {
      name: '2.5 Betonggjutning',
      desc: 'Gjut, avjämna och glätta plattan. Låt den härda ordentligt.'
    }
  ],
  phase3: [
    {
      name: '3.1 Syllisolering och syll',
      desc: 'Lägg fuktspärr (syllisolering) och bulta träsyll till betongplattan.'
    },
    {
      name: '3.2 Väggstomme',
      desc: 'Res bärande ytterväggsreglar, inklusive överstycken för fönster och dörrar.'
    },
    {
      name: '3.3 Takstolar',
      desc: 'Lyft, rikta och fäst takstolar mot väggstommarna.'
    },
    {
      name: '3.4 Skivning / stagning',
      desc: 'Montera utvändig skiva eller gips som stabiliserar stommen.'
    }
  ],
  phase4: [
    {
      name: '4.1 Råspont',
      desc: 'Spika råspont över takstolarna.'
    },
    {
      name: '4.2 Underlagspapp',
      desc: 'Rulla ut och häfta vattentät underlagspapp direkt.'
    },
    {
      name: '4.3 Vindduk',
      desc: 'Klä ytterväggarna med ångöppen, vindtät vindduk.'
    },
    {
      name: '4.4 Fönster och ytterdörr',
      desc: 'Montera energieffektiva 3-glasfönster och isolerad ytterdörr. Täta med fönstertape.'
    },
    {
      name: '4.5 Yttertak och plåt',
      desc: 'Lägg slutlig taktäckning (tegel eller plåt), hängrännor och stuprör.'
    },
    {
      name: '4.6 Läkt och fasadpanel',
      desc: 'Sätt stående läkt för luftspalt, spika sedan utvändig träpanel.'
    }
  ],
  phase5: [
    {
      name: '5.1 El-dragning (grov)',
      desc: 'Dra VP-rör och dosor genom väggreglarna.'
    },
    {
      name: '5.2 VVS-dragning (grov)',
      desc: 'Montera interna PEX-rör (rör-i-rör) i väggramarna.'
    },
    {
      name: '5.3 Ventilationskanaler',
      desc: 'Dra kanaler för tilluft och frånluft (badrumsfläkt).'
    },
    {
      name: '5.4 Isolering vägg och tak',
      desc: 'Passa mineralull tätt mellan reglar och takstolar.'
    },
    {
      name: '5.5 Ångspärr',
      desc: 'Häfta kontinuerlig plastångspärr på den varma sidan. Tejpa alla skarvar lufttätt.'
    },
    {
      name: '5.6 Glespanel / installationsregel',
      desc: 'Sätt liggande glespanel så eldragning inte punkterar ångspärren.'
    }
  ],
  phase6: [
    {
      name: '6.1 Innertak och väggskivor',
      desc: 'Montera gips eller träpanel på väggar och tak.'
    },
    {
      name: '6.2 Spackling och målning',
      desc: 'Tejpa skarvar, spackla, slipa och måla eller tapetsera.'
    },
    {
      name: '6.3 Golv',
      desc: 'Lägg underlagsfoam och slutligt golv (parkett, laminat eller klinker).'
    },
    {
      name: '6.4 Tätskikt badrum',
      desc: 'Applicera godkänt tätskikt på badrummets väggar och golv.'
    },
    {
      name: '6.5 Kakel och vitvaror',
      desc: 'Kakla badrum, montera toalett, dusch, köksskåp och vitvaror.'
    },
    {
      name: '6.6 Lister och innerdörrar',
      desc: 'Montera golvlister, foder och innerdörrar.'
    },
    {
      name: '6.7 Slutkoppling el och VVS',
      desc: 'Behörig elektriker och rörmokare gör slutanslutning till elcentral och vatten.'
    }
  ],
  project: 'Projektöversikt från Builder',
  milestoneSize: 'Builder: storlek vald',
  milestoneRoof: 'Builder: tak valt',
  milestoneFacade: 'Builder: fasad vald',
  milestoneOpenings: 'Builder: öppningar placerade',
  milestoneFloor: 'Builder: planlösning klar',
  milestoneDone: 'Beslutat i Builder',
  milestoneOpen: 'Kvar i Builder',
  sizeConfirm: 'Bekräfta mått och bygglov mot tomten',
  openings: 'Öppningar i stommen (dörrar, fönster, port)',
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
    critical: '1. Critical first',
    phase1: '2. Phase 1: Earthworks',
    phase2: '3. Phase 2: Foundation',
    phase3: '4. Phase 3: Framing',
    phase4: '5. Phase 4: Weatherproofing',
    phase5: '6. Phase 5: Rough-ins',
    phase6: '7. Phase 6: Interiors',
    builder: 'Builder decisions',
    notes: 'Notes',
    doing: 'Doing',
    done: 'Done'
  },
  critical: [
    {
      name: '1. Water & sewage (VA)',
      desc: 'Capacity for electricity & water — critical path. Confirm the plot can supply the house before locking other work.'
    },
    {
      name: '2. Frost-free pipe depth',
      desc: 'Year-round house: bury water/sewage to frost-free depth (about 1.2–2 m by region) or use self-regulating heat cable on the pipes.'
    },
    {
      name: '3. Electricity plan & cable routes',
      desc: 'Plan where cables run. Does the plot main fuse (e.g. 16A/20A) cover heat, appliances, and possible EV charging? Place the consumer unit.'
    },
    {
      name: '4. Year-round insulation',
      desc: 'Solid insulation in slab, walls, and roof (often about 200–300 mm by material) plus triple glazing.'
    },
    {
      name: '5. Choose heat source',
      desc: 'Direct electric heat is expensive over winter. Prefer an air-to-air heat pump (low investment) or waterborne underfloor heat on a central heat pump.'
    }
  ],
  phase1: [
    {
      name: '1.1 Site demarcation',
      desc: 'Stake out exact coordinates and height levels of the house on the plot.'
    },
    {
      name: '1.2 Excavation',
      desc: 'Dig out the footprint; remove organic soil down to a stable subgrade (clay, gravel, or bedrock).'
    },
    {
      name: '1.3 Trenching for utilities',
      desc: 'Dig trenches from connection points for water, sewage, and electricity to frost-free depth.'
    },
    {
      name: '1.4 Geotextile & gravel',
      desc: 'Lay geotextile and fill with crushed stone/gravel.'
    },
    {
      name: '1.5 Compaction',
      desc: 'Compact the gravel bed thoroughly with a heavy vibratory plate.'
    },
    {
      name: '1.6 Drainage & piping',
      desc: 'Install perimeter drainage, stormwater wells, and main underground sewage/water pipes.'
    }
  ],
  phase2: [
    {
      name: '2.1 Formwork / L-elements',
      desc: 'Assemble insulated foundation elements (L-elements) around the perimeter.'
    },
    {
      name: '2.2 Under-slab insulation',
      desc: 'Lay EPS sheets under the slab (usually 200–300 mm for year-round use).'
    },
    {
      name: '2.3 Utility stub-ins',
      desc: 'Pull electricity conduits, water pipes, and sewage drains up through the insulation where kitchen and bathroom will be.'
    },
    {
      name: '2.4 Reinforcement',
      desc: 'Lay steel rebar mesh and reinforcing bars.'
    },
    {
      name: '2.5 Concrete pour',
      desc: 'Pour, level, and smooth the slab. Let it cure properly.'
    }
  ],
  phase3: [
    {
      name: '3.1 Sill gasket & plate',
      desc: 'Install a moisture barrier (sill gasket) and bolt the wooden bottom plate to the slab.'
    },
    {
      name: '3.2 Wall framing',
      desc: 'Erect load-bearing exterior wall studs, including headers for windows and doors.'
    },
    {
      name: '3.3 Roof trusses',
      desc: 'Lift, align, and secure roof trusses to the wall frames.'
    },
    {
      name: '3.4 Sheathing',
      desc: 'Install exterior sheathing or gypsum to brace the frame.'
    }
  ],
  phase4: [
    {
      name: '4.1 Roof boarding',
      desc: 'Nail tongue-and-groove roof boards (råspont) over the trusses.'
    },
    {
      name: '4.2 Roof underlayment',
      desc: 'Roll out and staple waterproof underlayment felt immediately.'
    },
    {
      name: '4.3 Wind barrier',
      desc: 'Wrap exterior walls in a breathable windproof membrane.'
    },
    {
      name: '4.4 Windows & doors',
      desc: 'Install energy-efficient triple glazing and an insulated front door. Seal with window tape.'
    },
    {
      name: '4.5 Roofing finish & flashing',
      desc: 'Install final roofing (tiles or metal), gutters, and downspouts.'
    },
    {
      name: '4.6 Exterior battens & cladding',
      desc: 'Fix vertical battens for a ventilation gap, then nail exterior wooden siding.'
    }
  ],
  phase5: [
    {
      name: '5.1 Electrical rough-in',
      desc: 'Pull electrical conduits (VP-rör) and back-boxes through the wall studs.'
    },
    {
      name: '5.2 Plumbing rough-in',
      desc: 'Install internal PEX water pipes (pipe-in-pipe) inside the wall frames.'
    },
    {
      name: '5.3 Ventilation ducts',
      desc: 'Install ducts for fresh air supply and bathroom exhaust.'
    },
    {
      name: '5.4 Wall & ceiling insulation',
      desc: 'Fit mineral wool tightly between studs and roof trusses.'
    },
    {
      name: '5.5 Vapor barrier',
      desc: 'Staple a continuous plastic vapor barrier on the warm side. Tape all overlaps airtight.'
    },
    {
      name: '5.6 Interior service battens',
      desc: 'Install horizontal battens so wiring does not puncture the vapor barrier.'
    }
  ],
  phase6: [
    {
      name: '6.1 Wall & ceiling boarding',
      desc: 'Mount drywall or interior wood panels on walls and ceilings.'
    },
    {
      name: '6.2 Plastering & painting',
      desc: 'Tape joints, mud, sand, and paint or wallpaper.'
    },
    {
      name: '6.3 Flooring',
      desc: 'Install underlayment foam and final flooring (parquet, laminate, or tile).'
    },
    {
      name: '6.4 Bathroom waterproofing',
      desc: 'Apply certified liquid waterproofing membrane on bathroom walls and floor.'
    },
    {
      name: '6.5 Tiling & fixtures',
      desc: 'Tile the bathroom; install toilet, shower, kitchen cabinets, and appliances.'
    },
    {
      name: '6.6 Final trim',
      desc: 'Install baseboards, window casings, and interior doors.'
    },
    {
      name: '6.7 Final electrical & plumbing hookup',
      desc: 'Licensed electrician and plumber make final connections to the main panel and water supply.'
    }
  ],
  project: 'Project overview from Builder',
  milestoneSize: 'Builder: size chosen',
  milestoneRoof: 'Builder: roof chosen',
  milestoneFacade: 'Builder: facade chosen',
  milestoneOpenings: 'Builder: openings placed',
  milestoneFloor: 'Builder: floor plan done',
  milestoneDone: 'Decided in Builder',
  milestoneOpen: 'Still open in Builder',
  sizeConfirm: 'Confirm dimensions and permits against the plot',
  openings: 'Openings in the shell (doors, windows, gate)',
  loft: 'Sleeping loft',
  terrace: 'Terrace / deck',
  interior: 'Interior walls and rooms',
  floorDone: 'Floor plan marked done',
  floorOpen: 'Floor plan not marked done yet',
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

function roomEntries(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).filter(Boolean);
  }
  return [];
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

function pushChecklist(cards: TrelloCardDraft[], list: TrelloListKey, items: ChecklistItem[]) {
  for (const item of items) {
    push(cards, list, item.name, item.desc);
  }
}

/** Full board plan: critical path first, then build phases, then Builder notes. */
export function trelloBoardPlanFromHouse(source: HouseTaskSource): TrelloBoardPlan {
  const locale = source.locale === 'en' ? 'en' : 'sv';
  const copy = copyFor(locale);
  const config = source.config && typeof source.config === 'object' ? source.config : {};
  const cards: TrelloCardDraft[] = [];

  pushChecklist(cards, 'critical', copy.critical);
  pushChecklist(cards, 'phase1', copy.phase1);
  pushChecklist(cards, 'phase2', copy.phase2);
  pushChecklist(cards, 'phase3', copy.phase3);
  pushChecklist(cards, 'phase4', copy.phase4);
  pushChecklist(cards, 'phase5', copy.phase5);
  pushChecklist(cards, 'phase6', copy.phase6);

  const width = meters(config.buildingWidth);
  const depth = meters(config.buildingDepth);
  const height = meters(config.buildingHeight);
  const sizeLine = [width && `W ${width}`, depth && `D ${depth}`, height && `H ${height}`]
    .filter(Boolean)
    .join(' · ');
  const sizeChosen = Boolean(width && depth);
  const roofChosen = Boolean(config.activeRoof);
  const material = typeof config.activeMaterial === 'string' ? config.activeMaterial : '';
  const facadeChosen = Boolean(config.activePaintId || config.customPaint)
    || (material !== '' && material !== 'wood');
  const openings = slotCounts(config);
  const openingsChosen = openings.door + openings.window + openings.gate + openings.other > 0;
  const floorDone = Boolean(config.floorPlanDone);
  const rooms = roomEntries(config.placedRooms);
  const terraces = Array.isArray(config.terraces) ? config.terraces : [];
  const loftId = typeof config.activeLoft === 'string' ? config.activeLoft : '';
  const hasLoft = config.hasLoft === true || (loftId !== '' && loftId !== 'none');

  push(
    cards,
    'builder',
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
    'builder',
    copy.milestoneSize,
    sizeChosen ? `${copy.milestoneDone}\n${sizeLine}` : copy.milestoneOpen,
    sizeChosen
  );
  push(
    cards,
    'builder',
    copy.milestoneRoof,
    roofChosen ? `${copy.milestoneDone}\n${String(config.activeRoof)}` : copy.milestoneOpen,
    roofChosen
  );
  push(
    cards,
    'builder',
    copy.milestoneFacade,
    facadeChosen
      ? `${copy.milestoneDone}\n${String(config.activeMaterial || config.activePaintId || 'paint')}`
      : copy.milestoneOpen,
    facadeChosen
  );
  push(
    cards,
    'builder',
    copy.milestoneOpenings,
    openingsChosen
      ? `${copy.milestoneDone}\nDoors ${openings.door} · Windows ${openings.window} · Gates ${openings.gate}`
      : copy.milestoneOpen,
    openingsChosen
  );
  push(
    cards,
    'builder',
    copy.milestoneFloor,
    floorDone
      ? `${copy.floorDone}${rooms.length ? `\n${rooms.length} room(s)` : ''}`
      : copy.floorOpen,
    floorDone
  );

  push(cards, 'builder', copy.sizeConfirm, sizeLine || copy.milestoneOpen);

  if (openingsChosen) {
    push(
      cards,
      'builder',
      copy.openings,
      [
        openings.door || openings.window || openings.gate
          ? `Placed — doors ${openings.door}, windows ${openings.window}, gates ${openings.gate}`
          : '',
        config.activeDoor ? `Door: ${String(config.activeDoor)}` : '',
        config.activeWindow ? `Window: ${String(config.activeWindow)}` : '',
        config.activeGate ? `Gate: ${String(config.activeGate)}` : ''
      ].filter(Boolean).join('\n'),
      openingsChosen
    );
  }

  if (hasLoft) {
    push(
      cards,
      'builder',
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
      'builder',
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
      'builder',
      copy.interior,
      [
        rooms.length
          ? (locale === 'en' ? `${rooms.length} placed room(s)` : `${rooms.length} placerade rum`)
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
      [text, where ? `${copy.noteOn}: ${where}` : ''].filter(Boolean).join('\n')
    );
  }

  return {
    lists: LIST_ORDER.map((key) => ({ key, name: copy.lists[key] })),
    cards: cards.slice(0, 80)
  };
}

/** Cards only (legacy helper). */
export function trelloCardsFromHouse(source: HouseTaskSource): TrelloCardDraft[] {
  return trelloBoardPlanFromHouse(source).cards;
}
