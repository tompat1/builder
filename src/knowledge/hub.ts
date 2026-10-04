import { BUILDING_LIMITS, PULPET_PITCH_DEG, ROOF_COVERINGS } from '../store/useConfigStore';

export type KnowledgeLang = 'sv' | 'en';

export type KnowledgeFigure = 'height' | 'pitch' | 'belt' | 'cladding' | 'covering' | 'permit' | 'door' | 'layers' | 'pier';

export type KnowledgeApply = 'size' | 'pulpet' | 'cladding' | 'roof' | 'shingles' | 'loft' | 'door';

export interface KnowledgeLink {
  label: Record<KnowledgeLang, string>;
  href: string;
}

export interface KnowledgeEntry {
  id: string;
  keywords: string[];
  title: Record<KnowledgeLang, string>;
  body: Record<KnowledgeLang, string>;
  figure: KnowledgeFigure;
  links: KnowledgeLink[];
  apply?: KnowledgeApply;
}

const text = (sv: string, en: string): Record<KnowledgeLang, string> => ({ sv, en });

function price(id: 'felt' | 'metal' | 'tiles' | 'shingles') {
  return ROOF_COVERINGS.find((item) => item.id === id)?.priceDelta ?? 0;
}

function kr(amount: number, lang: KnowledgeLang) {
  const formatted = amount.toLocaleString(lang === 'en' ? 'en-GB' : 'sv-SE');
  return `${formatted} kr`;
}

/**
 * Pages the concierge can show. Add a source by appending an entry:
 * keywords in both languages, a short answer, a figure, and the link
 * the sentence comes from. Legal lines stay tied to the page they cite.
 */
export function knowledgeEntries(): KnowledgeEntry[] {
  const maxHeight = BUILDING_LIMITS.height.max;
  const shingles = kr(price('shingles'), 'sv');
  const shinglesEn = kr(price('shingles'), 'en');
  const metal = kr(price('metal'), 'sv');
  const metalEn = kr(price('metal'), 'en');
  const tiles = kr(price('tiles'), 'sv');
  const tilesEn = kr(price('tiles'), 'en');

  return [
    {
      id: 'height',
      keywords: ['höjd', 'height', '5 meter', '5 m', '5000', 'högsta', 'high end', 'eave'],
      title: text('Höjd, högst 5 meter', 'Height, 5 metres at most'),
      body: text(
        `Höjden i det här huset är den höga sidan, och den stannar vid ${maxHeight.toLocaleString('sv-SE')} mm. Fältet går inte högre. På ett pulpettak är framväggen den höga sidan och bakväggen följer takfallet.`,
        `Height on this house is the high side, and it stops at ${maxHeight.toLocaleString('en-GB')} mm. The field will not go higher. On a mono-pitch roof the front wall is the high side and the rear wall follows the slope.`
      ),
      figure: 'height',
      links: [],
      apply: 'size'
    },
    {
      id: 'pitch',
      keywords: ['lutning', 'taklutning', 'pulpet', 'pitch', '12°', '12 grader', 'mono', 'sadeltak', 'gable', 'tak', 'roof'],
      title: text(`Pulpettak ${PULPET_PITCH_DEG}°`, `Mono-pitch ${PULPET_PITCH_DEG}°`),
      body: text(
        `Pulpettaket lutar ${PULPET_PITCH_DEG}°, mitt i spannet 10–15° så att den höga sidan fortfarande avvattnas. På huset som är 3 503 mm djupt och 5 000 mm högt blir bakväggen cirka 4 255 mm. Sadeltaket är 22° och det flacka taket 2°.`,
        `The mono-pitch roof is ${PULPET_PITCH_DEG}°, in the middle of the 10–15° band, so the high eave still drains. On the house that is 3,503 mm deep and 5,000 mm high, the rear wall is about 4,255 mm. The gable roof is 22° and the low roof is 2°.`
      ),
      figure: 'pitch',
      links: [],
      apply: 'pulpet'
    },
    {
      id: 'belt',
      keywords: ['bleck', 'vattbräda', 'vattbrada', 'midjebleck', 'flashing', 'metal plate', 'vita plåten', 'white metal', 'belt'],
      title: text('Det vita blecket', 'The white metal belt'),
      body: text(
        'På en fasad som är 4,5 m eller högre sitter det vita blecket 2,70 m över marken, i linje med bjälklaget mellan våningarna. Spannet är 2,4–3,0 m. Blecket stannar mot hörnbrädorna, står ut från panelen och har en droppkant under.',
        'On a facade 4.5 m or taller, the white metal sits 2.70 m above the ground, in line with the floor between the storeys. The band is 2.4–3.0 m. It stops at the corner boards, stands off the cladding, and has a drip underneath.'
      ),
      figure: 'belt',
      links: [],
      apply: 'size'
    },
    {
      id: 'cladding',
      keywords: ['panel', 'cladding', 'stående', 'staende', 'liggande', '22x145', '145', 'board', 'dimension', 'ytterpanel'],
      title: text('Panel, standard 22×145', 'Cladding, standard 22×145'),
      body: text(
        'Standard är stående ytterpanel 22×145 mm. Du kan också välja 22×95, 22×120 eller 22×170 mm, stående eller liggande. Brädorna i 3D-vyn följer valet.',
        'The standard board is vertical cladding, 22×145 mm. You can also choose 22×95, 22×120 or 22×170 mm, vertical or horizontal. The boards in the 3D view follow that choice.'
      ),
      figure: 'cladding',
      links: [],
      apply: 'cladding'
    },
    {
      id: 'covering',
      keywords: ['shingel', 'shingle', 'takpapp', 'takbeklädnad', 'roof covering', 'betongpanna', 'papp', 'felt', 'tiles', 'plåttak'],
      title: text('Takbeklädnad', 'Roof covering'),
      body: text(
        `Takpapp ingår. Takshingel är överlappande asfalt, ${shingles}. Plåt med stående fals är ${metal}. Betongpannor är ${tiles}.`,
        `Felt is included. Shingles are overlapping asphalt, ${shinglesEn}. Standing-seam metal is ${metalEn}. Concrete tiles are ${tilesEn}.`
      ),
      figure: 'covering',
      links: [],
      apply: 'roof'
    },
    {
      id: 'permit',
      keywords: ['bygglov', 'attefall', 'friggebod', 'lov', 'permit', 'anmälan', 'anmalan', 'komplement', 'detail plan', 'detaljplan'],
      title: text('Bygglov och storlek', 'Permit and size'),
      body: text(
        'Korten i katalogen använder fortfarande de äldre namnen friggebod och attefallshus. Sedan 1 december 2025 beskriver Boverket i stället lovfri komplementbyggnad och komplementbostadshus. Inom detaljplan är en lovfri komplementbyggnad högst 30,0 m² och taknocken högst 4,0 m. Utanför detaljplan är gränserna 50,0 m² och 4,5 m. Det här huset kan ritas 5 m högt, vilket är över den lovfria nockhöjden. Kommunen avgör tomten.',
        'The size cards still use the older names friggebod and Attefall house. Since 1 December 2025, Boverket describes a permit-free complement building and complement dwelling instead. Inside a detailed plan that building is at most 30.0 m², with a ridge of at most 4.0 m. Outside a detailed plan the limits are 50.0 m² and 4.5 m. This house can be drawn 5 m high, which is above that permit-free ridge. The municipality decides for the site.'
      ),
      figure: 'permit',
      links: [
        {
          label: text('Komplementbyggnad, PBL kunskapsbanken', 'Complement building, PBL knowledge bank'),
          href: 'https://www.boverket.se/sv/PBL-kunskapsbanken/lov--byggande/anmalningsplikt/byggnader/nybyggnad/komplementbyggnad/'
        },
        {
          label: text('Ändringarna i PBL', 'The changes to the Planning and Building Act'),
          href: 'https://www.boverket.se/sv/om-boverket/boverkets-uppdrag-och-styrning/aktuella-uppdrag/avslutade-uppdrag/nytt-regelverk-for-bygglov/lista-pbl--andringar/'
        }
      ],
      apply: 'size'
    },
    {
      id: 'loft',
      keywords: ['loft', 'sovloft', 'sleeping loft', 'trappa'],
      title: text('Sovloft', 'Sleeping loft'),
      body: text(
        'Ett sovloft slås på under Loft. Det lägger till en trappa i furu och ett räcke. Sadeltak är det tak som brukar paras med loft.',
        'A sleeping loft is turned on under Loft. It adds a pine stair and a guard rail. The gable roof is the roof usually paired with a loft.'
      ),
      figure: 'pitch',
      links: [],
      apply: 'loft'
    },
    {
      id: 'door',
      keywords: ['dubbeldörr', 'svanshall', 'pardörr', 'double door', 'dörr', 'door'],
      title: text('Pardörren SVANSHALL', 'The SVANSHALL double door'),
      body: text(
        'SVANSHALL är pardörren i katalogen. Öppna Dörrar och klicka på en väggpanel i 3D-vyn för att placera den.',
        'SVANSHALL is the double door in the catalogue. Open Doors and click a wall panel in the 3D view to place it.'
      ),
      figure: 'door',
      links: [],
      apply: 'door'
    },
    {
      id: 'panel-air',
      keywords: ['luftspalt', 'tva steg', 'tvasteg', 'two-step', 'air gap', 'vindskydd', '300 mm', 'over mark', 'ovan mark'],
      title: text('Luftspalt bakom panelen', 'Air gap behind the cladding'),
      body: text(
        'Svenskt Trä bygger ytterpanelen med en luftad baksida. Spalten mot det vattenavvisande vindskyddet ska vara minst 25 mm, och spik eller skruv får inte gå igenom vindskyddet. Panelen avslutas 300 mm över mark. Stående brädor som måste skarvas görs det över ett droppbleck, med minst 25 mm mellan bleck och brädände.',
        'Svenskt Trä builds exterior cladding with a ventilated back. The gap to the water-shedding wind barrier is at least 25 mm, and nails or screws must not pierce that barrier. The cladding stops 300 mm above the ground. Standing boards that have to be joined are joined over a drip flashing, with at least 25 mm between the flashing and the board end.'
      ),
      figure: 'layers',
      links: [
        {
          label: text('Utvändiga träpaneler, Svenskt Trä', 'Exterior timber cladding, Svenskt Trä'),
          href: 'https://www.byggbeskrivningar.se/utvandigt/utvandiga-trapaneler/'
        },
        {
          label: text('Stående utvändig panel, TräGuiden', 'Vertical exterior cladding, TräGuiden'),
          href: 'https://www.traguiden.se/konstruktion/konstruktiv-utformning/stomkomplettering/utvandig-bekladnad/staende-utvandig-panel'
        }
      ],
      apply: 'cladding'
    },
    {
      id: 'panel-wood',
      keywords: ['lockpanel', 'gran', 'g4-2', 'g4', 'spruce', '22x170', '170 mm', 'overlapp', 'overlap', 'falsad', 'spontad'],
      title: text('Panelvirke och profiler', 'Cladding timber and profiles'),
      body: text(
        'Utvändig panel är i regel gran, sort G4-2 eller bättre, med målfuktkvot högst 16 %. Lockpanel är den vanligaste stående typen. Bottenbrädor i den beskrivningen är 22×145–170 och lockbrädor 22×120–145, med minst 20 mm överlapp, och lockbrädan spikas inte genom bottenbrädan. Spontad, falsad och liggande profilerad panel hålls högst 145 mm bred och minst 22 mm tjock.',
        'Exterior cladding is normally spruce, grade G4-2 or better, dried to at most 16% moisture content. Lock panel is the most common vertical type. In that guide the inner boards are 22×145–170 and the cover boards 22×120–145, with at least 20 mm of overlap, and the cover board is not nailed through the inner board. Tongued, rebated and horizontal profiled boards stay at most 145 mm wide and at least 22 mm thick.'
      ),
      figure: 'cladding',
      links: [
        {
          label: text('Utvändiga träpaneler, Svenskt Trä', 'Exterior timber cladding, Svenskt Trä'),
          href: 'https://www.byggbeskrivningar.se/utvandigt/utvandiga-trapaneler/'
        },
        {
          label: text('Paneltyper, TräGuiden', 'Cladding types, TräGuiden'),
          href: 'https://www.traguiden.se/konstruktion/konstruktiv-utformning/stomkomplettering/utvandig-bekladnad/generellt-om-olika-typer-av-utvandig-panel/'
        }
      ],
      apply: 'cladding'
    },
    {
      id: 'panel-paint',
      keywords: ['grundmala', 'grundmalning', 'cmp', 'certifierad malad', 'fuktkvot', 'moisture', 'slamfarg', 'falu', 'paint', 'malning'],
      title: text('Grundmålning och CMP', 'Priming and certified painted cladding'),
      body: text(
        'Brädor som ska täckmålas eller laseras grundmålas innan de sätts upp, så att omålade springor inte syns när träet krymper. Måla inte när fuktkvoten är över 16 %. Certifierad Målad Panel i klass CMP-G behöver två strykningar till, och CMP-G/M behöver en.',
        'Boards that will be painted or stained are primed before they go up, so bare gaps do not show when the timber shrinks. Do not paint when the moisture content is above 16%. Certified painted cladding in class CMP-G needs two more coats, and CMP-G/M needs one.'
      ),
      figure: 'cladding',
      links: [
        {
          label: text('Utvändiga träpaneler, Svenskt Trä', 'Exterior timber cladding, Svenskt Trä'),
          href: 'https://www.byggbeskrivningar.se/utvandigt/utvandiga-trapaneler/'
        },
        {
          label: text('Nymålning av utvändigt trä', 'Painting exterior timber'),
          href: 'https://www.byggbeskrivningar.se/allmant/nymalning-av-utvandigt-tra/'
        }
      ],
      apply: 'cladding'
    },
    {
      id: 'attefall-shell',
      keywords: ['attefallshuset', 'c14', 'konstruktionsvirke', '22x120', 'angspärr', 'plastfolie', 'ac 350', 'gl30', 'limtra', 'glulam', 'year-round'],
      title: text('Attefallshusets stomme', 'The Attefall house shell'),
      body: text(
        'Svenskt Träs Attefallshus, uppdaterat 24 januari 2022, är ritat av Tyréns som ett isolerat hus med loft. Konstruktionsvirket är C14 där inget annat anges. Fasadexemplet är stående spontad panel 22×120 på liggande spikläkt 34×70, c 600. Åldersbeständig plastfolie används när huset värms till cirka 18 °C året runt. Annars räcker vindpapp AC 350. Loftbjälklaget i ritningen är limträ 90×405 GL30c. Guidens bygglovsregler är de äldre attefallsreglerna. Aktuella gränser står på Boverkets sida.',
        'Svenskt Trä’s Attefall house, updated 24 January 2022, was drawn by Tyréns as an insulated house with a loft. The structural timber is C14 unless the drawing says otherwise. The facade example is vertical tongued cladding, 22×120, on horizontal battens 34×70 at 600 mm centres. An ageing-resistant vapour barrier is used when the house is heated to about 18 °C all year. Otherwise wind paper AC 350 is enough. The loft joists in the drawing are glulam 90×405 GL30c. The permit rules in that guide are the older Attefall rules. Current limits are on the Boverket page.'
      ),
      figure: 'pitch',
      links: [
        {
          label: text('Attefallshuset, Svenskt Trä', 'The Attefall house, Svenskt Trä'),
          href: 'https://www.byggbeskrivningar.se/utvandigt/attefallshuset/'
        },
        {
          label: text('Utvändigt, byggbeskrivningar', 'Exterior guides'),
          href: 'https://www.byggbeskrivningar.se/utvandigt/'
        }
      ],
      apply: 'size'
    },
    {
      id: 'roof-deck',
      keywords: ['underlagspont', 'underlagsspont', 'underlagspapp', 'raspönt', 'raspont', 'vindduk', 'takstol', '23x95', 'insektsnat', 'roof deck', 'sarking'],
      title: text('Yttertakets underlag', 'The roof deck'),
      body: text(
        'I Attefallshusets tak läggs vindduk klass W1 på takstolarna, sedan luftningsreglar 45×45 och underlagsspont 23×95 med den rillade sidan ner. Första brädan sticker ner 20 mm utanför luftningsreglarna. Underlagspappen läggs så snart inbrädningen är klar, och ett insektsnät täcker den 45 mm höga luftspalten ovanför ytterväggen.',
        'On the Attefall house roof, a class W1 breather membrane goes on the rafters, then 45×45 ventilation battens and 23×95 roof boarding with the grooved face down. The first board projects 20 mm past the battens. The underlay felt goes on as soon as the boarding is done, and insect mesh covers the 45 mm air gap above the outer wall.'
      ),
      figure: 'covering',
      links: [
        {
          label: text('Attefallshuset, tak, Svenskt Trä', 'The Attefall house, roof, Svenskt Trä'),
          href: 'https://www.byggbeskrivningar.se/utvandigt/attefallshuset/'
        }
      ],
      apply: 'roof'
    },
    {
      id: 'piers',
      keywords: ['plint', 'grundlaggning', 'tjale', 'frost', 'ntr/a', 'ntr/ab', 'syll', '500 mm', 'pier', 'foundation'],
      title: text('Plintgrund och träskydd', 'Pier foundation and timber treatment'),
      body: text(
        'I Attefallshusets plintplan räcker cirka 500 mm djup i sand och grus. I lera och matjord ökas djupet mot tjäle. Bjälklagets underkant ligger 100 mm över mark i den detaljen. Tryckimpregnerat trä i klass NTR/A används i mark och i syll på plint. Oskyddat trä ovan mark är NTR/AB.',
        'In the Attefall house pier plan, about 500 mm of depth is enough in sand and gravel. In clay and topsoil the depth is increased against frost. The underside of the floor sits 100 mm above the ground in that detail. Pressure-treated timber in class NTR/A is used in the ground and for sole plates on piers. Unprotected timber above ground is NTR/AB.'
      ),
      figure: 'pier',
      links: [
        {
          label: text('Attefallshuset, grund, Svenskt Trä', 'The Attefall house, foundation, Svenskt Trä'),
          href: 'https://www.byggbeskrivningar.se/utvandigt/attefallshuset/'
        },
        {
          label: text('Utvändigt, byggbeskrivningar', 'Exterior guides'),
          href: 'https://www.byggbeskrivningar.se/utvandigt/'
        }
      ],
      apply: 'size'
    }
  ];
}

function fold(value: string) {
  return value
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9° ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface KnowledgeHit {
  entry: KnowledgeEntry;
  related: KnowledgeEntry[];
}

/** Best matching page, or null when the hub has nothing for the question. */
export function askKnowledge(query: string): KnowledgeHit | null {
  const folded = fold(query);
  if (!folded) return null;

  const scored = knowledgeEntries()
    .map((entry) => {
      const hits = entry.keywords.filter((keyword) => folded.includes(fold(keyword)));
      const score = hits.reduce((sum, keyword) => sum + fold(keyword).length, 0);
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) return null;
  return {
    entry: best.entry,
    related: scored.slice(1, 3).map((item) => item.entry)
  };
}
