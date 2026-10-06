import { BUILDING_LIMITS, PULPET_PITCH_DEG, ROOF_COVERINGS } from '../store/useConfigStore';
import { addedResources } from './added';
import { PAGE_KEYWORDS, rankEntries } from './match.js';

export type KnowledgeLang = 'sv' | 'en';

export type KnowledgeFigure = 'height' | 'pitch' | 'belt' | 'cladding' | 'covering' | 'permit' | 'door' | 'layers' | 'pier' | 'section' | 'packs' | 'board' | 'note';

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
      keywords: PAGE_KEYWORDS.height,
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
      keywords: PAGE_KEYWORDS.pitch,
      title: text(`Pulpettak ${PULPET_PITCH_DEG}°`, `Mono-pitch ${PULPET_PITCH_DEG}°`),
      body: text(
        `Pulpettaket lutar ${PULPET_PITCH_DEG}°, mitt i spannet 10–15° så att den höga sidan fortfarande avvattnas. På huset som är 3 503 mm djupt och 5 000 mm högt blir bakväggen cirka 4 255 mm. Sadeltaket är 22°. Sadeltak med extra takhöjd är 14° och lyfter takfoten 400 mm. Det flacka taket är 2°.`,
        `The mono-pitch roof is ${PULPET_PITCH_DEG}°, in the middle of the 10–15° band, so the high eave still drains. On the house that is 3,503 mm deep and 5,000 mm high, the rear wall is about 4,255 mm. The gable roof is 22°. The extra-height gable is 14° and raises the eaves by 400 mm. The low roof is 2°.`
      ),
      figure: 'pitch',
      links: [],
      apply: 'pulpet'
    },
    {
      id: 'belt',
      keywords: PAGE_KEYWORDS.belt,
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
      keywords: PAGE_KEYWORDS.cladding,
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
      keywords: PAGE_KEYWORDS.covering,
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
      keywords: PAGE_KEYWORDS.permit,
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
      keywords: PAGE_KEYWORDS.loft,
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
      keywords: PAGE_KEYWORDS.door,
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
      keywords: PAGE_KEYWORDS['panel-air'],
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
      keywords: PAGE_KEYWORDS['panel-wood'],
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
      keywords: PAGE_KEYWORDS['panel-paint'],
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
      keywords: PAGE_KEYWORDS['attefall-shell'],
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
      keywords: PAGE_KEYWORDS['roof-deck'],
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
      keywords: PAGE_KEYWORDS.piers,
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
    },
    {
      id: 'shell-wall',
      keywords: PAGE_KEYWORDS['shell-wall'],
      title: text('Ytterväggens skikt', 'The outer wall layers'),
      body: text(
        'Svenska Skalhus beskriver ytterväggen inifrån och ut: OSB-skiva, plastfolie, 145 mm stenull mellan reglar 45×145, vindduk, läkt och grundmålad ytterpanel 22×145. Golvbjälkarna är 45×220 med 215 mm isolering och en trossbotten under. Takets isolering är 190 mm. En plastsyll ligger mot grunden. OSB-skivan kan levereras lös, så att elen dras bakom den.',
        'Svenska Skalhus describes the outer wall from the inside out: an OSB board, a vapour film, 145 mm of stone wool between 45×145 studs, a wind fabric, battens, and primed cladding 22×145. The floor joists are 45×220 with 215 mm of insulation and a soffit board underneath. The roof insulation is 190 mm. A plastic sole plate sits against the foundation. The OSB board can be delivered loose, so the wiring goes behind it.'
      ),
      figure: 'section',
      links: [
        {
          label: text('Attefallshus Modern, Svenska Skalhus', 'Attefall house Modern, Svenska Skalhus'),
          href: 'https://svenskaskalhus.se/attefallshus/modern-fullhojd/'
        },
        {
          label: text('Attefallshus, Svenska Skalhus', 'Attefall houses, Svenska Skalhus'),
          href: 'https://svenskaskalhus.se/attefallshus/'
        }
      ],
      apply: 'cladding'
    },
    {
      id: 'delivery',
      keywords: PAGE_KEYWORDS.delivery,
      title: text('Skalhus och nyckelfärdigt', 'Shell house and turnkey'),
      body: text(
        'Ett skalhus från Svenska Skalhus kommer färdigt på utsidan, med underlagspapp, grundmålad fasad, 3-glasfönster och ytterdörr. Inne finns isolering, OSB, vit innertaksskiva och elrör i taket. Kök och badrum görs på plats. Huset lyfts på i ett stycke, eller som väggelement om kranen inte når. Husverket använder nyckelfärdigt för ett hus som är klart inne, ute och i inkopplingarna. Deras elementhus är färdiga väggar och takkassetter, och insidan färdigställs sedan. De rekommenderar isolerad grund när nocken ska hålla sig inom 4 m från mark, och plint på berg. Under bottenbjälklaget sitter en Cembrit Windstopper Extreme. I deras beskrivning placeras huset minst 4,5 m från tomtgräns, närmare om grannen lämnar skriftligt medgivande.',
        'A shell house from Svenska Skalhus arrives finished on the outside, with underlay felt, a primed facade, triple glazing, and an entrance door. Inside there is insulation, OSB, a white ceiling board, and electrical conduits in the ceiling. The kitchen and bathroom are finished on site. The house is craned on in one piece, or as wall elements if the crane cannot reach. Husverket uses turnkey for a house that is finished inside, outside, and in its connections. Their element house is finished walls and roof cassettes, and the inside is completed afterwards. They recommend an insulated foundation when the ridge must stay within 4 m of the ground, and piers on rock. A Cembrit Windstopper Extreme sits under the ground floor. In their description the house is placed at least 4.5 m from the boundary, closer if the neighbour gives written consent.'
      ),
      figure: 'packs',
      links: [
        {
          label: text('Attefallshus, Svenska Skalhus', 'Attefall houses, Svenska Skalhus'),
          href: 'https://svenskaskalhus.se/attefallshus/'
        },
        {
          label: text('Attefallshus 25–50 m², Husverket', 'Attefall houses 25–50 m², Husverket'),
          href: 'https://husverket.se/hus/attefallshus/'
        }
      ]
    },
    {
      id: 'inner-board',
      keywords: PAGE_KEYWORDS['inner-board'],
      title: text('OSB bakom gipsen', 'OSB behind the plasterboard'),
      body: text(
        'För en vanlig torr innervägg bakom gips är OSB den billigare skivan. En jämförelse uppdaterad i augusti 2026 sätter 11–12 mm för normal upphängning och 15 mm när lasten är tyngre eller reglarna sitter glest. Plywood håller skruv bättre, särskilt i kanterna, och väljs ofta till köksskåp och vägghängd toalett. OSB räcker för normala laster i torra rum, sväller mer i kanten om den blir fuktig, och är inte en ångspärr. Gipsen utanpå behövs för brand och ljud. Recoma, som tillverkar en egen skiva av återvunnet förpackningsavfall, skriver samma sak om priset: OSB är billigare än plywood, och plywood har bättre skruvhåll.',
        'For an ordinary dry interior wall behind plasterboard, OSB is the cheaper board. A comparison updated in August 2026 uses 11–12 mm for ordinary fixing and 15 mm when the load is heavier or the studs are widely spaced. Plywood holds screws better, especially at the edges, and is often chosen for kitchen cabinets and a wall-hung toilet. OSB is enough for ordinary loads in dry rooms, swells more at the edge if it gets damp, and is not a vapour barrier. The plasterboard on the room side is there for fire and sound. Recoma, which makes its own board from recycled packaging, says the same about price: OSB is cheaper than plywood, and plywood holds screws better.'
      ),
      figure: 'board',
      links: [
        {
          label: text('OSB, plywood och alternativ, Recoma', 'OSB, plywood and alternatives, Recoma'),
          href: 'https://se.recoma.com/articles/alternativ-till-osb-och-plywood'
        },
        {
          label: text('OSB eller plywood i väggar', 'OSB or plywood in walls'),
          href: 'https://byggfirma-hagersten.se/blogg/osb-eller-plywood-i-vaggar-jamforelse-av-hallfasthet-och-pris/'
        }
      ]
    }
  ];
}

export interface KnowledgeHit {
  entry: KnowledgeEntry;
  related: KnowledgeEntry[];
}

export function allKnowledgeEntries(): KnowledgeEntry[] {
  return [...knowledgeEntries(), ...addedResources()];
}

/** Best matching page, or null when the hub has nothing for the question. */
export function askKnowledge(query: string): KnowledgeHit | null {
  const scored = rankEntries(allKnowledgeEntries(), query);
  const best = scored[0];
  if (!best) return null;
  return {
    entry: best.entry,
    related: scored.slice(1, 3).map((item) => item.entry)
  };
}
