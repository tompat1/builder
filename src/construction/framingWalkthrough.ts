/**
 * Timber Framing Walkthrough (Stomguide)
 *
 * Provides a sequential, step-by-step master builder guide for Swedish timber frame construction
 * (Trästomme enligt svensk standard SS-EN 1995-1-1 / Eurokod 5 & TräGuiden).
 */

export interface FramingStepSpec {
  labelSv: string;
  labelEn: string;
  valueSv: string;
  valueEn: string;
}

export interface FramingStepDefinition {
  step: number;
  key: string;
  titleSv: string;
  titleEn: string;
  subtitleSv: string;
  subtitleEn: string;
  specs: FramingStepSpec[];
  proTipsSv: string;
  proTipsEn: string;
  checklistSv: string[];
  checklistEn: string[];
}

export const FRAMING_STEPS: FramingStepDefinition[] = [
  {
    step: 1,
    key: 'sill',
    titleSv: '1. Grundsyll & Syllisolering',
    titleEn: '1. Bottom Sill Plates & Moisture Barrier',
    subtitleSv: 'Förankring mot betongplattan och fuktspärr',
    subtitleEn: 'Foundation anchoring and capillary moisture barrier',
    specs: [
      {
        labelSv: 'Virkesdimension',
        labelEn: 'Timber Dimension',
        valueSv: '45×145 mm C24',
        valueEn: '45×145 mm C24'
      },
      {
        labelSv: 'Infästning',
        labelEn: 'Fasteners',
        valueSv: 'Expanderbult M10 cc 1200 mm',
        valueEn: 'Anchor bolts M10 cc 1200 mm'
      },
      {
        labelSv: 'Fuktskydd',
        labelEn: 'Moisture Barrier',
        valueSv: 'EPDM-syllisolering 150 mm',
        valueEn: '150 mm EPDM sill sealer'
      },
      {
        labelSv: 'Tolerans',
        labelEn: 'Tolerance',
        valueSv: 'Kryssmätning ±2 mm',
        valueEn: 'Diagonal check ±2 mm'
      }
    ],
    proTipsSv:
      'Lägg alltid godkänd syllisolering (EPDM-gummi eller syllpapp med skumkant) mellan betongen och träsyllen för att stoppa kapillär fuktvandring. Mät alltid diagonalerna (kryssmätning) noggrant från hörn till hörn innan bultarna dras åt – diagonalerna ska vara millimeterlika så att huskroppen blir rätvinklig.',
    proTipsEn:
      'Always install approved EPDM sill sealer between the concrete slab and bottom timber plate to prevent capillary moisture migration. Measure both building diagonals corner-to-corner before torquing down anchor bolts – diagonals must be equal within 2 mm to ensure perfectly square corners.',
    checklistSv: [
      'Rulla ut och fäst EPDM-syllisolering runt hela sockeln',
      'Kontrollera diagonalmått (kryssmätning) för absolut 90° rätvinklighet',
      'Förankra syllen med expanderbultar cc 1200 mm och max 150 mm från hörn'
    ],
    checklistEn: [
      'Roll out EPDM sill sealer around the entire slab perimeter',
      'Verify diagonal cross-measurements for exact 90° squareness',
      'Torque anchor bolts cc 1200 mm and within 150 mm of corners'
    ]
  },
  {
    step: 2,
    key: 'corners',
    titleSv: '2. Hörnreglar & Lodning',
    titleEn: '2. Corner Stud Assemblies & Plumb Alignment',
    subtitleSv: 'Uppresning av ytterhörn och temporär snedsträvning',
    subtitleEn: 'Corner post erection and temporary diagonal bracing',
    specs: [
      {
        labelSv: 'Konstruktion',
        labelEn: 'Construction',
        valueSv: 'Dubbla hörnreglar 45×145 C24',
        valueEn: 'Double corner studs 45×145 C24'
      },
      {
        labelSv: 'Lodkrav',
        labelEn: 'Plumb Standard',
        valueSv: 'Max 1 mm avvikelse per meter',
        valueEn: 'Max 1 mm deviation per meter'
      },
      {
        labelSv: 'Infästning i syll',
        labelEn: 'Sill Fastening',
        valueSv: '2 st 5×90 mm skruv / tåspik 90 mm',
        valueEn: '2x 5×90 mm screws / 90 mm toe-nails'
      },
      {
        labelSv: 'Stagning',
        labelEn: 'Temporary Bracing',
        valueSv: 'Diagonalsträvor 22×95 mm',
        valueEn: '22×95 mm diagonal kickers'
      }
    ],
    proTipsSv:
      'Hörnreglarna sätter geometrin för hela huset. Bygg dem med invändigt spikstöd så att innerbeklädnaden (gipsen) har något att fästas mot i hörnet. Loda in hörnen i båda riktningarna med ett 2-meters vattenpass eller rotationslaser, och fixera med sneda trästrävor (22×95 mm) ned mot grunden innan mellanreglarna monteras.',
    proTipsEn:
      'Corner studs define the house geometry. Assemble double studs with an interior nailing flange for interior drywall backing. Check plumb in both directions using a 2-meter spirit level or rotary laser, and lock with diagonal 22×95 mm brace runners anchored to the slab before intermediate studs are placed.',
    checklistSv: [
      'Spika ihop dubbla hörnreglar med förskjuten spikning för innerhörnstöd',
      'Loda in hörnen i båda riktningarna med långpass eller laser',
      'Skruva fast temporära snedsträvor mot plattan för att låsa lodlinjen'
    ],
    checklistEn: [
      'Nail double corner studs together creating an interior drywall backing flange',
      'Plumb corners in both perpendicular planes using long level or laser',
      'Fasten temporary diagonal kickers to slab to lock plumb alignment'
    ]
  },
  {
    step: 3,
    key: 'studs',
    titleSv: '3. Väggreglar cc 600 mm',
    titleEn: '3. Wall Studs cc 600 mm',
    subtitleSv: 'Standardiserad modulstomme anpassad för isolering och skivor',
    subtitleEn: 'Standard modular stud layout optimized for insulation and sheet goods',
    specs: [
      {
        labelSv: 'cc-avstånd',
        labelEn: 'cc Spacing',
        valueSv: '600 mm centrum-till-centrum',
        valueEn: '600 mm center-to-center'
      },
      {
        labelSv: 'Kvalitet',
        labelEn: 'Timber Grade',
        valueSv: 'Konstruktionsvirke C24',
        valueEn: 'Structural timber C24'
      },
      {
        labelSv: 'Isolerdjup',
        labelEn: 'Insulation Depth',
        valueSv: '145 mm mineralull',
        valueEn: '145 mm mineral wool'
      },
      {
        labelSv: 'Spikning',
        labelEn: 'Fastening',
        valueSv: '2x 3,1×90 mm maskinspik per ände',
        valueEn: '2x 3.1×90 mm framing nails per end'
      }
    ],
    proTipsSv:
      'cc 600 mm är svensk standard för att 1200 mm breda isoleringsskivor och gipsskivor ska passa utan spill eller onödig tillkapning. Lägg alltid ut reglarnas "krona" (den lilla naturliga böjen i virket) åt samma håll (utåt mot fasaden) så att ytterväggen blir helt plan och plan utan buktningar.',
    proTipsEn:
      'cc 600 mm is the Scandinavian standard so 1200 mm mineral wool batts and drywall sheets fit seamlessly without waste. Always sight each stud for crown (the natural bend in the timber) and orient all crowns facing outward toward the facade for a completely flat exterior wall plane.',
    checklistSv: [
      'Märk upp cc 600 mm på syllen utgående från referenshörn',
      'Rikta reglarnas krökningsbåge (krona) utåt mot fasaden',
      'Tåspika eller skråspika fast varje regel i syllen med dubbla 90 mm spikar'
    ],
    checklistEn: [
      'Mark cc 600 mm intervals on bottom plate starting from benchmark corner',
      'Orient timber crown facing outwards toward exterior facade',
      'Toe-nail studs into sill plate with two 90 mm framing nails per side'
    ]
  },
  {
    step: 4,
    key: 'openings',
    titleSv: '4. Avväxlingar för Dörrar & Fönster',
    titleEn: '4. Headers, Trimmers & Opening Frames',
    subtitleSv: 'Lastöverföring runt öppningar med bärande balkar och stolpar',
    subtitleEn: 'Load redistribution around openings via headers and jack studs',
    specs: [
      {
        labelSv: 'Avväxlingsbalk',
        labelEn: 'Header Beam',
        valueSv: '45×195 mm C24 / Limträ',
        valueEn: '45×195 mm C24 / Glulam'
      },
      {
        labelSv: 'Stödregel (Jack stud)',
        labelEn: 'Trimmer Stud',
        valueSv: '45×145 mm under balk',
        valueEn: '45×145 mm full bearing under header'
      },
      {
        labelSv: 'Ställmån (Drevolån)',
        labelEn: 'Installation Gap',
        valueSv: '15–20 mm runtom karm',
        valueEn: '15–20 mm perimeter frame gap'
      },
      {
        labelSv: 'Kortreglar',
        labelEn: 'Cripple Studs',
        valueSv: 'cc 600 mm över balk & under bröstning',
        valueEn: 'cc 600 mm above header & below sill'
      }
    ],
    proTipsSv:
      'Öppningar bryter det kontinuerliga regelmönstret. Avväxlingsbalken fångar upp taklasten ovanför fönstret eller dörren och leder ner den via stödstolpar (jack studs) direkt till grunden. Lämna alltid 15–20 mm ställmån runt karmen för isoleringsdrevning och rörelsemån.',
    proTipsEn:
      'Openings interrupt the continuous stud rhythm. The structural header catches roof and gravity loads above the door or window, channeling them down jack studs directly to the foundation slab. Always preserve a 15–20 mm perimeter installation gap around frames for insulation and thermal movement.',
    checklistSv: [
      'Montera bärande stödstolpar (jack studs) från syll till avväxlingsbalkens underkant',
      'Lyft på plats och fixera avväxlingsbalken (45×195 mm) med spikplåtar/skruv',
      'Sätt kortreglar cc 600 mm ovanför balken för att föra ner takstolsbelastning'
    ],
    checklistEn: [
      'Install bearing jack studs from bottom plate to header underside',
      'Position and secure 45×195 mm structural header with framing fasteners',
      'Fit cripple studs cc 600 mm above header to carry roof truss loads'
    ]
  },
  {
    step: 5,
    key: 'plates_noggings',
    titleSv: '5. Hammarband & Kortlingar',
    titleEn: '5. Top Header Plates & Mid-wall Noggings',
    subtitleSv: 'Övre sammanknytning av väggelement och knäckningsstagning',
    subtitleEn: 'Top wall perimeter locking and mid-height stud stabilization',
    specs: [
      {
        labelSv: 'Hammarband',
        labelEn: 'Top Header Plate',
        valueSv: '45×145 mm C24 genomgående',
        valueEn: '45×145 mm continuous C24'
      },
      {
        labelSv: 'Hörnförband',
        labelEn: 'Corner Lap',
        valueSv: 'Minst 145 mm omlottförskjutning',
        valueEn: 'Min 145 mm interlocking lap joint'
      },
      {
        labelSv: 'Kortlingar',
        labelEn: 'Noggings (Kortlingar)',
        valueSv: '45×145 mm vid cc 1200 mm höjd',
        valueEn: '45×145 mm at cc 1200 mm height'
      },
      {
        labelSv: 'Funktion',
        labelEn: 'Structural Purpose',
        valueSv: 'Knäckningsförstyvning & skivunderstöd',
        valueEn: 'Buckling resistance & sheet support'
      }
    ],
    proTipsSv:
      'Hammarbandet (toppsyllen) binder samman alla väggar till en vridstyv låda. Låt alltid hammarbandet överlappa hörnen så att långvägg och gavelvägg låser varandra mekaniskt. Kortlingarna (horisontella reglar mellan väggreglarna) monteras med förskjutning mellan facken så att de kan spikas rakt igenom reglarna – de förhindrar knäckning och ger fäste för gipsskarvar.',
    proTipsEn:
      'The top header plate (hammarband) unifies individual walls into a torsion-resistant structural box. Always interlock top plates across corners so side and end walls tie together mechanically. Stagger horizontal noggings between bays to allow direct face-nailing through stud flanges; they prevent stud buckling under roof load and support sheet seams.',
    checklistSv: [
      'Montera hammarbandet med omlottläggning över hörnen för vridstyvhet',
      'Skruva/spika hammarbandet i varje stående regel med 2 st 90 mm spikar',
      'Fäll in kortlingar i förskjutna fack på 1200 mm höjd för skiv- och knäckstöd'
    ],
    checklistEn: [
      'Install continuous top plate with corner lap joints for box rigidity',
      'Fasten top plate to every vertical stud with two 90 mm nails',
      'Install staggered noggings at 1200 mm height for sheet seam support'
    ]
  },
  {
    step: 6,
    key: 'trusses',
    titleSv: '6. Takstolar & Takbjälklag',
    titleEn: '6. Roof Trusses & Structural Rafters',
    subtitleSv: 'Montering av bärande takkonstruktion med vinkelbeslag',
    subtitleEn: 'Structural roof framework and heavy-duty seismic/wind clips',
    specs: [
      {
        labelSv: 'Takstolsprofil',
        labelEn: 'Rafter Dimension',
        valueSv: '45×195 mm C24 / Fackverk cc 600',
        valueEn: '45×195 mm C24 / Truss cc 600'
      },
      {
        labelSv: 'Beslag',
        labelEn: 'Truss Clips',
        valueSv: 'Förstärkta vinkelbeslag 90×90×65',
        valueEn: 'Heavy reinforced angles 90×90×65'
      },
      {
        labelSv: 'Ankarspik',
        labelEn: 'Anchor Nails',
        valueSv: '4,0×40 mm ankarspik (min 6 st/beslag)',
        valueEn: '4.0×40 mm anchor nails (min 6/bracket)'
      },
      {
        labelSv: 'Nocklinje',
        labelEn: 'Ridge Line',
        valueSv: 'Snörslås för rak takrygg',
        valueEn: 'Chalked guide for straight ridge'
      }
    ],
    proTipsSv:
      'Montera först de två gaveltakstolarna och loda in dem exakt med snedsträvor. Slå ett snöre mellan takstolarnas nockar för att säkerställa att alla mellantakstolar hamnar på exakt samma höjd och i rak linje. Förankra varje takstol mot hammarbandet med förstärkta vinkelbeslag och ankarspik – detta motstår taklyftande vindkrafter.',
    proTipsEn:
      'Erect the two gable end trusses first, plumb them exactly, and secure with diagonal braces. Pull a taut stringline along the ridge apex to verify all intermediate trusses align to the same elevation and line. Secure each rafter to the top plate using reinforced framing clips with 4.0×40 mm anchor nails to resist wind uplift.',
    checklistSv: [
      'Res och förankra gaveltakstolar med sneda stödben',
      'Spänn riktsnöre längs nocken och montera mellantakstolar på cc 600 mm',
      'Spika fast vinkelbeslag med ankarspik 4,0×40 mm på båda sidor om varje takstol'
    ],
    checklistEn: [
      'Erect and brace both gable end trusses with diagonal kickers',
      'String a ridge line and position intermediate trusses at cc 600 mm',
      'Fasten truss tie-down brackets with 4.0×40 mm anchor nails on both sides'
    ]
  },
  {
    step: 7,
    key: 'inspection',
    titleSv: '7. Vindavstyvning & Färdig Stomme',
    titleEn: '7. Wind Bracing & Complete Frame Inspection',
    subtitleSv: 'Fullständig slutkontroll före vindskydd och takläggning',
    subtitleEn: 'Comprehensive quality audit prior to weather-barrier sheathing',
    specs: [
      {
        labelSv: 'Vindsträvor',
        labelEn: 'Wind Bracing',
        valueSv: '22×95 mm snedsträvor / Hålband 2 mm',
        valueEn: '22×95 mm diagonal braces / 2 mm steel strap'
      },
      {
        labelSv: 'Total krysstolerans',
        labelEn: 'Overall Tolerance',
        valueSv: '< 3 mm avvikelse över hela stommen',
        valueEn: '< 3 mm cross-building diagonal limit'
      },
      {
        labelSv: 'Fuktighet i virke',
        labelEn: 'Moisture Content',
        valueSv: 'Max 16% fuktkvot vid inbyggnad',
        valueEn: 'Max 16% wood moisture content'
      },
      {
        labelSv: 'Nästa steg',
        labelEn: 'Next Phase',
        valueSv: 'Utegipsskivor & vindskyddsduk',
        valueEn: 'Exterior wind barrier & roof underlay'
      }
    ],
    proTipsSv:
      'Grattis – trästommen är nu komplett! Innan tillfälliga stöttor demonteras måste permanent vindavstyvning (t.ex. diagonalt monterade stålhålband eller godkänd utvändig skivbeklädnad såsom utegips eller vindskyddsduk) vara installerad. Mät virkets fuktkvot med en fuktmätare före isolering; den får inte överstiga 16% för att undvika mögelrisk.',
    proTipsEn:
      'Congratulations – the structural timber frame is complete! Before removing temporary bracing, permanent wind bracing (diagonal steel tension straps or structural exterior sheathing such as gypsum board or plywood) must be securely fastened. Check timber moisture content with a pin meter before insulating; it must not exceed 16% to prevent moisture entrapment.',
    checklistSv: [
      'Slutkontrollera diagonalmått och lodlinjer på alla fyra hörn',
      'Verifiera att alla expanderbultar och vinkelbeslag är fullt åtdragna',
      'Fuktmät virket (fuktkvot < 16%) och gör redo för vindskyddsmontering'
    ],
    checklistEn: [
      'Perform final diagonal cross-check and plumb verification on all four corners',
      'Verify all sill anchor bolts and truss brackets are fully torqued and nailed',
      'Test wood moisture with pin meter (< 16%) and prepare for wind-barrier wrap'
    ]
  }
];

export const FRAMING_STEPS_TOTAL = FRAMING_STEPS.length;

export function getFramingStep(step: number): FramingStepDefinition {
  const clamped = Math.max(1, Math.min(FRAMING_STEPS_TOTAL, Math.round(step || 1)));
  return FRAMING_STEPS[clamped - 1];
}
