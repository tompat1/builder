/**
 * Stugan V4 — parametric concept from stugan_v4/builder_model.json.
 * Status: concept massing only, not construction drawings.
 * Units in the source brief are mm; helpers below use mm unless noted.
 */

export const STUGAN_V4_SIZE_ID = 'size-stugan-v4';

/** Exterior plan. X = east, Y/depth = north when front faces south. */
export const STUGAN_V4_WIDTH_MM = 6000;
export const STUGAN_V4_DEPTH_MM = 6600;
/** High east eave above finished ground (concept). Falls 10° toward west. */
export const STUGAN_V4_HIGH_EAVE_MM = 6000;
export const STUGAN_V4_ROOF_PITCH_DEG = 10;
export const STUGAN_V4_FOOTPRINT_M2 = 39.6;

/** South canopy over the terrace; east/west eaves flush with the wall line. */
export const STUGAN_V4_SOUTH_OVERHANG_MM = 3000;
export const STUGAN_V4_NORTH_OVERHANG_MM = 0;
export const STUGAN_V4_EAST_OVERHANG_MM = 0;
export const STUGAN_V4_WEST_OVERHANG_MM = 0;

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

/** Loft strip along the east (high) wall — used for stair/zone layout only. */
export const STUGAN_V4_LOFT_DEPTH_MM = 3500;
export const STUGAN_V4_ZONE_Y_MM = 2200;
/** Default loft area from the shared size-25 catalog (large sleeping loft). */
export const STUGAN_V4_DEFAULT_LOFT_M2 = 16.4;

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

/** Clear height under the high (east) eave above loft floor. */
export function stuganV4LoftClearEastMm(): number {
  return STUGAN_V4_HIGH_EAVE_MM - STUGAN_V4_ROOF_ASSEMBLY_MM - STUGAN_V4_LOFT_FLOOR_MM;
}

/** Clear height at the west edge of a loft strip measured from the east wall. */
export function stuganV4LoftClearAtWestEdgeMm(loftDepthMm = STUGAN_V4_LOFT_DEPTH_MM): number {
  const dropAtLoftEdge =
    loftDepthMm * Math.tan((STUGAN_V4_ROOF_PITCH_DEG * Math.PI) / 180);
  return Math.round(stuganV4LoftClearEastMm() - dropAtLoftEdge);
}

/** @deprecated Prefer stuganV4LoftClearEastMm — high wall is east. */
export function stuganV4LoftClearWestMm(): number {
  return stuganV4LoftClearEastMm();
}

/** @deprecated Prefer stuganV4LoftClearAtWestEdgeMm — fall is toward west. */
export function stuganV4LoftClearAtEastEdgeMm(): number {
  return stuganV4LoftClearAtWestEdgeMm();
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

  // Place opening in central zone of the east loft strip (SW origin).
  const zoneY0 = STUGAN_V4_ZONE_Y_MM;
  const gap = 100;
  const loftX0 = STUGAN_V4_WIDTH_MM - STUGAN_V4_LOFT_DEPTH_MM;
  // Flights run west (−X) inside the loft strip; two flights sit side by side in Y.
  const packAlongX = Math.max(lowerRun, upperRun) + landingMm;
  const packAlongY = flightWidthMm * 2 + gap;
  const fitsAlongX = packAlongX <= STUGAN_V4_LOFT_DEPTH_MM - 200;
  const fitsAlongY = packAlongY <= STUGAN_V4_ZONE_Y_MM - 100;
  const fitsInCentralZone = fitsAlongX && fitsAlongY;

  const openingW = Math.min(STUGAN_V4_LOFT_DEPTH_MM - 200, Math.max(packAlongX, lowerRun + landingMm));
  const openingD = Math.min(STUGAN_V4_ZONE_Y_MM - 100, Math.max(packAlongY, flightWidthMm * 2 + gap));
  const x0 = loftX0 + 200;
  const y0 = zoneY0 + Math.max(0, Math.round((STUGAN_V4_ZONE_Y_MM - packAlongY) / 2));
  const opening = {
    widthMm: openingW,
    depthMm: openingD,
    x0,
    y0,
    x1: x0 + openingW,
    y1: y0 + openingD
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
  const clearEast = stuganV4LoftClearEastMm();
  const clearWestEdge = stuganV4LoftClearAtWestEdgeMm();
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
      detailSv: `Preliminärt. Västra takfot ca +${lowEave} mm vid 10° fall öst→väst.`,
      detailEn: `Preliminary. West eave ≈ +${lowEave} mm at 10° fall east→west.`
    },
    {
      id: 'loft-headroom',
      severity: clearWestEdge < 1900 ? 'conflict' : 'uncertain',
      titleSv: 'Fri höjd på loft',
      titleEn: 'Loft clear height',
      detailSv: `Ca ${clearEast} mm vid öst (hög vägg), ca ${clearWestEdge} mm vid loftets västra kant. Lägg sängar och gång mot öst.`,
      detailEn: `About ${clearEast} mm at east (high wall), about ${clearWestEdge} mm at loft west edge. Keep beds and paths toward the east.`
    },
    {
      id: 'canopy-structure',
      severity: 'hold',
      titleSv: `Söderutsprång ${STUGAN_V4_SOUTH_OVERHANG_MM} mm`,
      titleEn: `South overhang ${STUGAN_V4_SOUTH_OVERHANG_MM} mm`,
      detailSv: 'Kant i vägglinjen öst/väst/norr. Bärsystemet beror på vald version; ver. 3 har djupa sidoväggar och takbjälkar öst→väst över terrassen — projektera bärning.',
      detailEn: 'Flush eaves east/west/north. The support system follows the selected version; v3 uses deep side walls with east→west roof beams over the terrace — design for loads.'
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
      detailSv: `Konceptet kräver östtakfot +${STUGAN_V4_HIGH_EAVE_MM} mm. Denna hustyp tillåter det uttryckligen; övriga hustyper cappar fortfarande 5000 mm.`,
      detailEn: `Concept needs east eave +${STUGAN_V4_HIGH_EAVE_MM} mm. This house type allows it; other types still cap at 5000 mm.`
    }
  ];
  return items;
}

/** @deprecated Full-strip loft removed — use STUGAN_V4_DEFAULT_LOFT_M2 / size catalog. */
export function stuganV4LoftAreaSqMeters(): number {
  return STUGAN_V4_DEFAULT_LOFT_M2;
}

/** Proposed zones in SW-origin mm — loft along the high east wall. */
export function stuganV4ProposedZones(locked = true) {
  const loftX0 = STUGAN_V4_WIDTH_MM - STUGAN_V4_LOFT_DEPTH_MM;
  return {
    loftStrip: { x0: loftX0, x1: STUGAN_V4_WIDTH_MM, y0: 0, y1: STUGAN_V4_DEPTH_MM },
    masterNorth: {
      x0: loftX0,
      x1: STUGAN_V4_WIDTH_MM,
      y0: STUGAN_V4_ZONE_Y_MM * 2,
      y1: STUGAN_V4_DEPTH_MM,
      locked
    },
    stairCentral: {
      x0: loftX0,
      x1: STUGAN_V4_WIDTH_MM,
      y0: STUGAN_V4_ZONE_Y_MM,
      y1: STUGAN_V4_ZONE_Y_MM * 2,
      locked
    },
    guestSouth: {
      x0: loftX0,
      x1: STUGAN_V4_WIDTH_MM,
      y0: 0,
      y1: STUGAN_V4_ZONE_Y_MM,
      locked
    },
    livingWest: {
      x0: 0,
      x1: loftX0,
      y0: 0,
      y1: STUGAN_V4_DEPTH_MM
    }
  };
}

/** Standard clear stair width used on the loft edge (metres). */
export const STUGAN_V4_STAIR_WIDTH_M = 0.9;

/**
 * Rooms from planer.svg. Builder origin is plan centre; +Z is south (front), +X is east.
 * Loft bedrooms sit under the high east wall (~16 m² strip). Living stays open (no box).
 */
export function stuganV4PlacedRooms(): Record<
  string,
  { type: string; w: number; d: number; x: number; y: number; z: number; wallsVisible: boolean }
> {
  // East loft strip for default 16.4 m²; zones along depth with stair gap in the middle.
  const loftX = 1.35;
  const loftW = 2.6;
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
