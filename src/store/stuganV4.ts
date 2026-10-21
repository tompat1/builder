/**
 * Stugan V4 — parametric concept from stugan_v4/builder_model.json.
 * Status: concept massing only, not construction drawings.
 * Units in the source brief are mm; helpers below use mm unless noted.
 */

export const STUGAN_V4_SIZE_ID = 'size-stugan-v4';

/** Exterior plan. X = east, Y/depth = north when front faces south. */
export const STUGAN_V4_WIDTH_MM = 6000;
export const STUGAN_V4_DEPTH_MM = 6600;
/** High west eave above finished ground (concept). */
export const STUGAN_V4_HIGH_EAVE_MM = 6400;
export const STUGAN_V4_ROOF_PITCH_DEG = 10;
export const STUGAN_V4_FOOTPRINT_M2 = 39.6;

export const STUGAN_V4_SOUTH_OVERHANG_MM = 2000;
export const STUGAN_V4_NORTH_OVERHANG_MM = 400;
export const STUGAN_V4_EAST_OVERHANG_MM = 350;
export const STUGAN_V4_WEST_OVERHANG_MM = 350;

export const STUGAN_V4_DECK_DEPTH_MM = 3000;
export const STUGAN_V4_DECK_WIDTH_MM = 6000;

/** Assumed existing slab top — measure on site. */
export const STUGAN_V4_SLAB_TOP_MM = 200;
/** Crawlspace clearance concept only — moisture strategy unresolved. */
export const STUGAN_V4_CRAWL_MM = 400;
/** Preliminary finished floor. */
export const STUGAN_V4_FINISHED_FLOOR_MM = 950;
export const STUGAN_V4_LOFT_FLOOR_MM = 3650;
export const STUGAN_V4_STOREY_RISE_MM = STUGAN_V4_LOFT_FLOOR_MM - STUGAN_V4_FINISHED_FLOOR_MM;
export const STUGAN_V4_LOFT_STRUCTURE_MM = 300;
export const STUGAN_V4_ROOF_ASSEMBLY_MM = 400;
export const STUGAN_V4_WALL_THICK_CONCEPT_MM = 300;

/** Loft strip along the west wall (gross). */
export const STUGAN_V4_LOFT_DEPTH_MM = 3500;
export const STUGAN_V4_ZONE_Y_MM = 2200;

/** Moss green inspired by Nordsjö H7.15.53 — verify physical swatch. */
export const STUGAN_V4_CLADDING_HEX = '#4f5f3d';

export type StuganConflictSeverity = 'conflict' | 'uncertain' | 'hold';

export interface StuganConflict {
  id: string;
  severity: StuganConflictSeverity;
  titleSv: string;
  titleEn: string;
  detailSv: string;
  detailEn: string;
}

export function stuganV4LowEaveMm(highEaveMm = STUGAN_V4_HIGH_EAVE_MM): number {
  const drop = STUGAN_V4_WIDTH_MM * Math.tan((STUGAN_V4_ROOF_PITCH_DEG * Math.PI) / 180);
  return Math.round(highEaveMm - drop);
}

export function stuganV4LoftClearWestMm(): number {
  // Underside ≈ high eave − roof assembly; clear above loft floor at west.
  return STUGAN_V4_HIGH_EAVE_MM - STUGAN_V4_ROOF_ASSEMBLY_MM - STUGAN_V4_LOFT_FLOOR_MM;
}

export function stuganV4LoftClearAtEastEdgeMm(): number {
  const dropAtLoftEdge =
    STUGAN_V4_LOFT_DEPTH_MM * Math.tan((STUGAN_V4_ROOF_PITCH_DEG * Math.PI) / 180);
  return Math.round(stuganV4LoftClearWestMm() - dropAtLoftEdge);
}

export interface StuganStairFlight {
  label: string;
  risers: number;
  goings: number;
  goingMm: number;
  riserMm: number;
  runMm: number;
  riseMm: number;
  /** Along loft strip (+X = east) or along house depth (+Y = north). */
  axis: 'x' | 'y';
}

export interface StuganStairSolution {
  type: 'u-stair';
  storeyRiseMm: number;
  totalRisers: number;
  riserMm: number;
  goingMm: number;
  landingMm: number;
  flightWidthMm: number;
  flights: StuganStairFlight[];
  opening: { widthMm: number; depthMm: number; x0: number; y0: number; x1: number; y1: number };
  fitsInCentralZone: boolean;
  notesSv: string[];
  notesEn: string[];
}

/**
 * U-stair in the central loft zone before bedroom walls are locked.
 * Two flights run east along the loft depth; a landing turns at the open edge.
 * Straight 250 mm goings need ~3750 mm and do not fit the 2200 mm mid zone alone.
 */
export function solveStuganV4Stair(options?: {
  storeyRiseMm?: number;
  goingMm?: number;
  landingMm?: number;
  flightWidthMm?: number;
}): StuganStairSolution {
  const storeyRiseMm = options?.storeyRiseMm ?? STUGAN_V4_STOREY_RISE_MM;
  const goingMm = options?.goingMm ?? 250;
  const landingMm = options?.landingMm ?? 900;
  const flightWidthMm = options?.flightWidthMm ?? 900;
  const totalRisers = Math.max(12, Math.round(storeyRiseMm / 168.75));
  const riserMm = Math.round((storeyRiseMm / totalRisers) * 100) / 100;
  const lowerRisers = Math.ceil(totalRisers / 2);
  const upperRisers = totalRisers - lowerRisers;
  const lowerGoings = Math.max(1, lowerRisers - 1);
  const upperGoings = Math.max(1, upperRisers - 1);
  const lowerRun = lowerGoings * goingMm;
  const upperRun = upperGoings * goingMm;

  // Place opening in central zone: x 0–3500, y 2200–4400 (SW origin).
  const zoneY0 = STUGAN_V4_ZONE_Y_MM;
  const zoneY1 = STUGAN_V4_ZONE_Y_MM * 2;
  const gap = 100;
  // Flights run east (+X) inside the 3500 mm loft strip; two flights sit side by side in Y.
  const packAlongX = Math.max(lowerRun, upperRun) + landingMm;
  const packAlongY = flightWidthMm * 2 + gap;
  const fitsAlongX = packAlongX <= STUGAN_V4_LOFT_DEPTH_MM - 200;
  const fitsAlongY = packAlongY <= STUGAN_V4_ZONE_Y_MM - 100;
  const fitsInCentralZone = fitsAlongX && fitsAlongY;

  const x0 = 400;
  const y0 = zoneY0 + Math.max(0, Math.round((STUGAN_V4_ZONE_Y_MM - packAlongY) / 2));
  const opening = {
    widthMm: Math.min(STUGAN_V4_LOFT_DEPTH_MM - 200, Math.max(packAlongX, lowerRun + landingMm)),
    depthMm: Math.min(STUGAN_V4_ZONE_Y_MM - 100, Math.max(packAlongY, flightWidthMm * 2 + gap)),
    x0,
    y0,
    x1: x0 + Math.min(STUGAN_V4_LOFT_DEPTH_MM - 200, Math.max(packAlongX, lowerRun + landingMm)),
    y1: y0 + Math.min(STUGAN_V4_ZONE_Y_MM - 100, Math.max(packAlongY, flightWidthMm * 2 + gap))
  };

  const notesSv = [
    `Våningshöjd ${storeyRiseMm} mm → ${totalRisers} sättsteg à ${riserMm} mm.`,
    `U-trappa: två lopp (${lowerRisers}+${upperRisers} sättsteg) med vilplan ${landingMm} mm.`,
    fitsInCentralZone
      ? 'U-trappan ryms i mittzonen 3500×2200 mm med lopp längs loftets djup (öst).'
      : 'U-trappan tränger mittzonen — omfördela master/gäst eller loftdjup innan väggar låses.'
  ];
  const notesEn = [
    `Storey rise ${storeyRiseMm} mm → ${totalRisers} risers at ${riserMm} mm.`,
    `U-stair: two flights (${lowerRisers}+${upperRisers} risers) with ${landingMm} mm landing.`,
    fitsInCentralZone
      ? 'U-stair fits the 3500×2200 mm central zone with runs along loft depth (east).'
      : 'U-stair exceeds the central zone — redistribute master/guest or loft depth before locking walls.'
  ];

  return {
    type: 'u-stair',
    storeyRiseMm,
    totalRisers,
    riserMm,
    goingMm,
    landingMm,
    flightWidthMm,
    flights: [
      {
        label: 'lower',
        risers: lowerRisers,
        goings: lowerGoings,
        goingMm,
        riserMm,
        runMm: lowerRun,
        riseMm: Math.round(lowerRisers * riserMm * 100) / 100,
        axis: 'x'
      },
      {
        label: 'upper',
        risers: upperRisers,
        goings: upperGoings,
        goingMm,
        riserMm,
        runMm: upperRun,
        riseMm: Math.round(upperRisers * riserMm * 100) / 100,
        axis: 'x'
      }
    ],
    opening,
    fitsInCentralZone,
    notesSv,
    notesEn
  };
}

export function stuganV4Conflicts(stair = solveStuganV4Stair()): StuganConflict[] {
  const lowEave = stuganV4LowEaveMm();
  const clearWest = stuganV4LoftClearWestMm();
  const clearEast = stuganV4LoftClearAtEastEdgeMm();
  const items: StuganConflict[] = [
    {
      id: 'concept-only',
      severity: 'hold',
      titleSv: 'Endast konceptmodell',
      titleEn: 'Concept model only',
      detailSv: 'Mått är modellindata, inte godkänd bygghandling.',
      detailEn: 'Dimensions are model inputs, not approved construction drawings.'
    },
    {
      id: 'slab-level',
      severity: 'uncertain',
      titleSv: 'Plattoversida +200 mm',
      titleEn: 'Slab top +200 mm',
      detailSv: 'Antaget — mät befintlig platta, armering och bärighet på plats.',
      detailEn: 'Assumed — survey existing slab, reinforcement and bearing on site.'
    },
    {
      id: 'crawlspace',
      severity: 'hold',
      titleSv: 'Luftutrymme 400 mm',
      titleEn: 'Crawlspace 400 mm',
      detailSv: 'Endast geometri. Fuktsäkring och skadeutredning är olösta.',
      detailEn: 'Geometry only. Moisture strategy and damage investigation unresolved.'
    },
    {
      id: 'finished-floor',
      severity: 'uncertain',
      titleSv: `Färdigt golv +${STUGAN_V4_FINISHED_FLOOR_MM} mm`,
      titleEn: `Finished floor +${STUGAN_V4_FINISHED_FLOOR_MM} mm`,
      detailSv: 'Preliminär höjd; kan behöva ändras efter platta och isolering.',
      detailEn: 'Preliminary; may change after slab and insulation design.'
    },
    {
      id: 'roof-assembly',
      severity: 'uncertain',
      titleSv: `Takuppbyggnad ${STUGAN_V4_ROOF_ASSEMBLY_MM} mm`,
      titleEn: `Roof assembly ${STUGAN_V4_ROOF_ASSEMBLY_MM} mm`,
      detailSv: `Preliminärt. Östra takfot ca +${lowEave} mm vid 10° fall.`,
      detailEn: `Preliminary. East eave ≈ +${lowEave} mm at 10° fall.`
    },
    {
      id: 'loft-headroom',
      severity: clearEast < 1900 ? 'conflict' : 'uncertain',
      titleSv: 'Fri höjd på loft',
      titleEn: 'Loft clear height',
      detailSv: `Ca ${clearWest} mm vid väst, ca ${clearEast} mm vid loftets östra kant (x=3500). Lägg sängar och gång mot väst.`,
      detailEn: `About ${clearWest} mm at west, about ${clearEast} mm at loft east edge (x=3500). Keep beds and paths toward the west.`
    },
    {
      id: 'canopy-structure',
      severity: 'hold',
      titleSv: 'Söderutsprång 2000 mm',
      titleEn: 'South overhang 2000 mm',
      detailSv: 'Kräver projekterade stolpar/balkar under snö- och vindlast — inte okontrollerad konsol.',
      detailEn: 'Needs designed posts/beams for snow and wind — not an uncontrolled cantilever.'
    },
    {
      id: 'cladding-colour',
      severity: 'uncertain',
      titleSv: 'Mossgrön panel',
      titleEn: 'Moss-green cladding',
      detailSv: `Hex ${STUGAN_V4_CLADDING_HEX} som skärmstand-in för Nordsjö H7.15.53 — verifiera fysisk brytning.`,
      detailEn: `Hex ${STUGAN_V4_CLADDING_HEX} is a screen stand-in for Nordsjö H7.15.53 — verify physical swatch.`
    },
    {
      id: 'stair',
      severity: stair.fitsInCentralZone ? 'uncertain' : 'conflict',
      titleSv: 'Central U-trappa',
      titleEn: 'Central U-stair',
      detailSv: stair.notesSv.join(' '),
      detailEn: stair.notesEn.join(' ')
    },
    {
      id: 'bedroom-walls',
      severity: 'hold',
      titleSv: 'Sovrumsväggar olåsta',
      titleEn: 'Bedroom walls unlocked',
      detailSv: 'Master norr och gäst söder är lagda som loftväggar; öppna/lås via storlekspanelen vid behov.',
      detailEn: 'Master north and guest south are placed as loft walls; unlock via the size panel if needed.'
    },
    {
      id: 'builder-height-cap',
      severity: 'conflict',
      titleSv: 'Byggarens normala maxtakhöjd',
      titleEn: 'Builder default height cap',
      detailSv: `Konceptet kräver västtakfot +${STUGAN_V4_HIGH_EAVE_MM} mm. Denna hustyp tillåter det uttryckligen; övriga hustyper cappar fortfarande 5000 mm.`,
      detailEn: `Concept needs west eave +${STUGAN_V4_HIGH_EAVE_MM} mm. This house type allows it; other types still cap at 5000 mm.`
    }
  ];
  return items;
}

export function stuganV4LoftAreaSqMeters(): number {
  return Math.round(((STUGAN_V4_LOFT_DEPTH_MM * STUGAN_V4_DEPTH_MM) / 1_000_000) * 10) / 10;
}

/** Proposed zones in SW-origin mm — bedroom partitions stay unlocked. */
export function stuganV4ProposedZones(locked = true) {
  return {
    loftStrip: { x0: 0, x1: STUGAN_V4_LOFT_DEPTH_MM, y0: 0, y1: STUGAN_V4_DEPTH_MM },
    masterNorth: {
      x0: 0,
      x1: STUGAN_V4_LOFT_DEPTH_MM,
      y0: STUGAN_V4_ZONE_Y_MM * 2,
      y1: STUGAN_V4_DEPTH_MM,
      locked
    },
    stairCentral: {
      x0: 0,
      x1: STUGAN_V4_LOFT_DEPTH_MM,
      y0: STUGAN_V4_ZONE_Y_MM,
      y1: STUGAN_V4_ZONE_Y_MM * 2,
      locked
    },
    guestSouth: {
      x0: 0,
      x1: STUGAN_V4_LOFT_DEPTH_MM,
      y0: 0,
      y1: STUGAN_V4_ZONE_Y_MM,
      locked
    },
    livingEast: {
      x0: STUGAN_V4_LOFT_DEPTH_MM,
      x1: STUGAN_V4_WIDTH_MM,
      y0: 0,
      y1: STUGAN_V4_DEPTH_MM
    }
  };
}

/** Standard clear stair width used on the loft edge (metres). */
export const STUGAN_V4_STAIR_WIDTH_M = 0.9;

/**
 * Rooms from planer.svg. Builder origin is plan centre; +Z is south (front), −X is west.
 * Ground y ≈ slab; loft y sits on the deck. Living stays open (no box).
 */
export function stuganV4PlacedRooms(): Record<
  string,
  { type: string; w: number; d: number; x: number; y: number; z: number; wallsVisible: boolean }
> {
  // Loft strip interior ≈ 3.2 m after shell; zones 2.2 m along depth with stair gap in the middle.
  const loftX = -1.25;
  const loftW = 3.2;
  const zoneD = 2.0;
  const loftY = 2.9;
  return {
    bathroom_1: {
      type: 'bathroom',
      w: 2.2,
      d: 2.2,
      x: -1.7,
      y: 0.3,
      z: -2.15,
      wallsVisible: true
    },
    kitchen_1: {
      type: 'kitchen',
      w: 3.2,
      d: 2.2,
      x: 1.2,
      y: 0.3,
      z: -2.15,
      wallsVisible: true
    },
    bedroom_1: {
      type: 'bedroom',
      w: loftW,
      d: zoneD,
      x: loftX,
      y: loftY,
      z: -2.15,
      wallsVisible: true
    },
    bedroom_2: {
      type: 'bedroom',
      w: loftW,
      d: zoneD,
      x: loftX,
      y: loftY,
      z: 2.15,
      wallsVisible: true
    }
  };
}

export function isStuganV4(sizeId: string | undefined | null): boolean {
  return sizeId === STUGAN_V4_SIZE_ID;
}
