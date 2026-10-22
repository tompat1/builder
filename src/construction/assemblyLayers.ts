/**
 * Wall / roof assembly layers — outside → inside peel for the framing guide.
 * Matches the modular build-up (cladding → membrane → insulation → studs → lining → roof).
 */

export interface AssemblyLayerDefinition {
  step: number;
  key: string;
  titleSv: string;
  titleEn: string;
  subtitleSv: string;
  subtitleEn: string;
  /** Short label for the step pill. */
  shortSv: string;
  shortEn: string;
  specs: { labelSv: string; labelEn: string; valueSv: string; valueEn: string }[];
  assemblySv: string[];
  assemblyEn: string[];
  tipsSv: string;
  tipsEn: string;
}

/** Outside → inside order. Step 1 is the outermost peel. */
export const ASSEMBLY_LAYERS: AssemblyLayerDefinition[] = [
  {
    step: 1,
    key: 'cladding',
    titleSv: '1. Ytterpanel',
    titleEn: '1. Exterior cladding',
    shortSv: 'Panel',
    shortEn: 'Cladding',
    subtitleSv: 'Yttersta skiktet — skyddar mot väder och ger huset sitt uttryck. Dras ut som på en monteringsritning.',
    subtitleEn: 'Outermost layer — weather face and expression. Slides out like an assembly drawing.',
    specs: [
      { labelSv: 'Panel', labelEn: 'Cladding', valueSv: '22×145 mm stående/liggande', valueEn: '22×145 mm vertical/horizontal' },
      { labelSv: 'Luftspalt', labelEn: 'Air gap', valueSv: '28 mm läkt bakom panel', valueEn: '28 mm battens behind cladding' },
      { labelSv: 'Hörn', labelEn: 'Corners', valueSv: 'Hörnbrädor / plåt', valueEn: 'Corner boards / flashings' }
    ],
    assemblySv: [
      '1. Montera vertikal läkt cc 600 på vindskyddet så luften kan gå från sockel till takfot.',
      '2. Spika/skruva panelen med rostfria fästen. Börja lodrätt från ett hörn.',
      '3. Lämna springa vid sockelbleck och under takfot så vatten och luft kan passera.',
      '4. Kapa öppningar i panelen efter karm — eller leverera färdiga fält med dörr/fönster.'
    ],
    assemblyEn: [
      '1. Fit vertical battens cc 600 on the wind barrier so air can run sill to eave.',
      '2. Fasten cladding with stainless fixings. Start plumb from a corner.',
      '3. Keep gaps at base flashing and under the eave for drainage and ventilation.',
      '4. Cut openings to the frames — or deliver bays with door/window already fitted.'
    ],
    tipsSv: 'Panelen är inte bärande. Den ska kunna demonteras utan att stommen rör sig — därför syns den utdragen i guiden.',
    tipsEn: 'Cladding is non-structural. It should come off without disturbing the frame — that is why the guide slides it out.'
  },
  {
    step: 2,
    key: 'membrane',
    titleSv: '2. Vindskydd',
    titleEn: '2. Wind barrier',
    shortSv: 'Vindduk',
    shortEn: 'Membrane',
    subtitleSv: 'Vindtät men ångöppen duk utanpå stommen — stoppar drag, släpper ut fukt.',
    subtitleEn: 'Wind-tight, vapour-open wrap outside the studs — stops draughts, lets moisture out.',
    specs: [
      { labelSv: 'Produkt', labelEn: 'Product', valueSv: 'Vindskyddsduk / utegips', valueEn: 'Wind membrane / exterior gypsum' },
      { labelSv: 'Skarv', labelEn: 'Joints', valueSv: 'Tejpade överlapp ≥100 mm', valueEn: 'Taped laps ≥100 mm' },
      { labelSv: 'Öppningar', labelEn: 'Openings', valueSv: 'Tejpa mot karm / syll', valueEn: 'Tape to frames / sill' }
    ],
    assemblySv: [
      '1. Rulla duken från syll upp mot takfot. Överlappa skarvar och tejpa enligt produktblad.',
      '2. Skär upp för fönster/dörr med flik in mot karmen — tejpa lufttätt.',
      '3. Täta mot sockelbleck och hörn so no cold air shorts into the cavity.',
      '4. Kontrollera att inga revor finns innan läkt och panel går på.'
    ],
    assemblyEn: [
      '1. Roll the membrane from sill to eave. Lap and tape joints per the product sheet.',
      '2. Cut openings with flaps into the frame — tape airtight.',
      '3. Seal to base flashing and corners so cold air cannot short into the cavity.',
      '4. Check for tears before battens and cladding go on.'
    ],
    tipsSv: 'Vindskyddet sitter utanpå isoleringen. Fel tejpning här ger kalla hörn även om stommen är rak.',
    tipsEn: 'The wind barrier sits outside the insulation. Bad taping here means cold corners even if the frame is true.'
  },
  {
    step: 3,
    key: 'insulation',
    titleSv: '3. Isolering',
    titleEn: '3. Insulation',
    shortSv: 'Isolering',
    shortEn: 'Insulation',
    subtitleSv: 'Mineralull i regelverket — fyller facken utan glipor så värmeläckage och köldbryggor minimeras.',
    subtitleEn: 'Mineral wool in the stud bays — fill without gaps to cut heat loss and cold bridges.',
    specs: [
      { labelSv: 'Tjocklek', labelEn: 'Thickness', valueSv: '145 mm (vägg) · 190–220 mm (tak)', valueEn: '145 mm (wall) · 190–220 mm (roof)' },
      { labelSv: 'cc', labelEn: 'cc', valueSv: 'Passar 600 mm modul', valueEn: 'Fits 600 mm module' },
      { labelSv: 'Montering', labelEn: 'Fit', valueSv: 'Skär +2–5 mm, tryck in utan komprimering', valueEn: 'Cut +2–5 mm, press in without crushing' }
    ],
    assemblySv: [
      '1. Skär skivor lite överbredd så de sitter friktionsbundet mellan reglarna.',
      '2. Fyll varje fack helt — inga luftspalter bakom eller vid hammarband.',
      '3. Vid öppningar: isolera jack/cripple-fack lika noga som hela väggfält.',
      '4. I tak: lägg isolering mellan takbjälkar; håll ventilerad spalt ovanför mot underlagstak.'
    ],
    assemblyEn: [
      '1. Cut batts slightly oversize so they friction-fit between studs.',
      '2. Fill every bay completely — no voids behind or at the top plate.',
      '3. At openings: insulate jack/cripple bays as carefully as full fields.',
      '4. In the roof: fit between rafters; keep a ventilated gap above toward the underlay.'
    ],
    tipsSv: 'Komprimera inte ullen “för att få plats” — då tappar den lambda-värde. Hellre kapa rätt.',
    tipsEn: 'Do not crush the wool “to make it fit” — that kills its lambda. Cut it right instead.'
  },
  {
    step: 4,
    key: 'frame',
    titleSv: '4. Regelstomme',
    titleEn: '4. Timber frame',
    shortSv: 'Stomme',
    shortEn: 'Frame',
    subtitleSv: 'Bärande C24-virke: syll, reglar cc 600, avväxlingar, hammarband — lastvägen du redan gått i stomguiden.',
    subtitleEn: 'Structural C24: sill, studs cc 600, headers, top plate — the load path from the framing steps.',
    specs: [
      { labelSv: 'Reglar', labelEn: 'Studs', valueSv: '45×145 mm C24 cc 600', valueEn: '45×145 mm C24 cc 600' },
      { labelSv: 'Avväxling', labelEn: 'Header', valueSv: '2× (45×195) C24', valueEn: '2× (45×195) C24' },
      { labelSv: 'Syll / hammarband', labelEn: 'Sill / top plate', valueSv: '45×145 mm C24', valueEn: '45×145 mm C24' }
    ],
    assemblySv: [
      '1. Följ stomguidens sju steg: syll → hörn → reglar → öppningar → hammarband → tak → kontroll.',
      '2. Varje vertikal last ska ner i syll/platta; varje lyftkraft ska tas av beslag.',
      '3. Öppningar får jack studs under balk — aldrig bara spik i kungsregel.',
      '4. Dokumentera förband innan isolering och skivor döljer dem.'
    ],
    assemblyEn: [
      '1. Follow the seven framing steps: sill → corners → studs → openings → plates → roof → check.',
      '2. Every gravity load must reach the sill/slab; every uplift must hit hardware.',
      '3. Openings need jack studs under headers — never nails into kings alone.',
      '4. Photo joints before insulation and sheets hide them.'
    ],
    tipsSv: 'Stommen är husets skelett. Isolering och panel hänger på den — inte tvärtom.',
    tipsEn: 'The frame is the skeleton. Insulation and cladding hang on it — not the other way around.'
  },
  {
    step: 5,
    key: 'lining',
    titleSv: '5. Innervägg',
    titleEn: '5. Interior lining',
    shortSv: 'Innervägg',
    shortEn: 'Lining',
    subtitleSv: 'Ångbroms/OSB och gips från rumssidan — lufttäthet inåt och yta att måla och skruva i.',
    subtitleEn: 'Vapour control/OSB and plasterboard from the room — airtightness inside and a finish face.',
    specs: [
      { labelSv: 'Skiva', labelEn: 'Board', valueSv: 'OSB 11–15 mm + gips 13 mm', valueEn: 'OSB 11–15 mm + 13 mm gypsum' },
      { labelSv: 'Ångbroms', labelEn: 'Vapour layer', valueSv: 'Tejpad folie/ångbroms', valueEn: 'Taped vapour control layer' },
      { labelSv: 'Infästning', labelEn: 'Fixings', valueSv: 'Skruv i reglar cc 600', valueEn: 'Screws into studs cc 600' }
    ],
    assemblySv: [
      '1. Montera ångbroms kontinuerligt på rumssidan; tejpa skarvar och anslutningar.',
      '2. Skruva OSB där upphängning behövs (kök, TV), annars rakt på gips mot reglar.',
      '3. Gipsa med förskjutna skarvar. Spärra hörnen med spackelhörn.',
      '4. Blås/täthetsprova om möjligt innan ytskikt — läckor syns bäst nu.'
    ],
    assemblyEn: [
      '1. Fit continuous vapour control on the room side; tape joints and abutments.',
      '2. Screw OSB where hanging loads need it (kitchen, TV), else gypsum to studs.',
      '3. Board with staggered joints. Reinforce corners.',
      '4. Air-test if you can before finishes — leaks show best now.'
    ],
    tipsSv: 'Innelagret stänger värmen inne. Glipor vid syll och takvinkel ger drag som känns som “kall isolering”.',
    tipsEn: 'The inner layer keeps heat in. Gaps at sill and eaves feel like “cold insulation”.'
  },
  {
    step: 6,
    key: 'roof',
    titleSv: '6. Takets lager',
    titleEn: '6. Roof build-up',
    shortSv: 'Tak',
    shortEn: 'Roof',
    subtitleSv: 'Takbjälkar, isolering mellan/bjälklag, underlag och tätskikt — samma lastväg uppåt som väggen utåt.',
    subtitleEn: 'Rafters, insulation between, underlay and covering — the same load logic upward as the wall outward.',
    specs: [
      { labelSv: 'Takbjälke', labelEn: 'Rafter', valueSv: '45×195–220 mm C24 cc 600', valueEn: '45×195–220 mm C24 cc 600' },
      { labelSv: 'Isolering', labelEn: 'Insulation', valueSv: '190–220 mm mineralull', valueEn: '190–220 mm mineral wool' },
      { labelSv: 'Tätskikt', labelEn: 'Covering', valueSv: 'Underlagspapp + plåt/papp', valueEn: 'Underlay + metal/membrane' }
    ],
    assemblySv: [
      '1. Förankra takbjälkar i hammarband med vinkelbeslag (lyft!).',
      '2. Isolera mellan bjälkar; håll ventilerad spalt mot kallt underlagstak där konstruktionen kräver det.',
      '3. Lägg underlag och tätskikt med rätt överlapp och läkt.',
      '4. Avsluta takfot med droppbleck så vatten leds bort från panel och syll.'
    ],
    assemblyEn: [
      '1. Tie rafters to the top plate with angle brackets (uplift!).',
      '2. Insulate between rafters; keep a ventilated gap to a cold deck where required.',
      '3. Fit underlay and covering with correct laps and battens.',
      '4. Finish the eave with drip so water clears cladding and sill.'
    ],
    tipsSv: 'Taket syns “lyft” i guiden så du ser bjälkar och isolering — precis som panelen dras ut på väggen.',
    tipsEn: 'The guide lifts the roof so you see rafters and insulation — the same idea as sliding the wall cladding out.'
  }
];

export const ASSEMBLY_LAYERS_TOTAL = ASSEMBLY_LAYERS.length;

export function getAssemblyLayer(step: number): AssemblyLayerDefinition {
  const clamped = Math.max(1, Math.min(ASSEMBLY_LAYERS.length, Math.round(step || 1)));
  return ASSEMBLY_LAYERS[clamped - 1]!;
}
