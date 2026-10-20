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

export const FRAMING_STEPS_STANDARD: FramingStepDefinition[] = [
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

/**
 * Timber Framing Walkthrough for Timber/Concrete Combo House (Påbyggnad på betonghus)
 * Accounts for existing 50 cm concrete walls, dual sill elevations, chemical anchoring into murkrön,
 * transition joints with expanding foam tape, transfer beams, and continuous uplift tie-down.
 */
export const FRAMING_STEPS_CONCRETE_COMBO: FramingStepDefinition[] = [
  {
    step: 1,
    key: 'sill',
    titleSv: '1. Syll på Murkrön, Väggavslut & Markplatta',
    titleEn: '1. Sill Plates on Wall Crowns, Ends & Slab',
    subtitleSv: 'Kemankare i murkrön (2,5 m), vertikal syll på betongväggarnas ändar samt marksyll för utbyggnad',
    subtitleEn: 'Chemical anchoring into crowns (2.5 m), vertical sills on wall ends, and ground extension slab',
    specs: [
      {
        labelSv: 'Syll på murkrön',
        labelEn: 'Crown Sill Dimension',
        valueSv: '45×145 mm C24 konstruktionsvirke',
        valueEn: '45×145 mm C24 structural timber'
      },
      {
        labelSv: 'Infästning murkrön',
        labelEn: 'Crown Fasteners',
        valueSv: 'Kemankare M12 gängstång cc 800 mm',
        valueEn: 'M12 chemical injection anchors cc 800 mm'
      },
      {
        labelSv: 'Väggavslutssyll',
        labelEn: 'Wall End Sills',
        valueSv: 'Vertikal syll 45×145 med svällband',
        valueEn: 'Vertical 45×145 sill with foam tape'
      },
      {
        labelSv: 'Marksyll tillbyggnad',
        labelEn: 'Slab Extension Sill',
        valueSv: 'Expanderbult M10 cc 1000 mm',
        valueEn: 'M10 anchor bolts cc 1000 mm'
      }
    ],
    proTipsSv:
      'Vid påbyggnad på befintligt betonghus följer syllarna betongstommen exakt: horisontellt ovanpå de 50 cm tjocka betongväggarnas murkrön (2,5 m), viker sedan 90° ner och följer betongväggarnas främre gavelslut vertikalt ner till markplattan, och fortsätter därefter som marksyll runt tillbyggnaden. Ingen syll får någonsin hänga i luften över öppningen. På murkrönet används kemankare (injekteringsmassa) med gängstång M12 för att undvika sprickbildning i äldre betong. Längs murkrönet läggs dubbel EPDM-syllisolering, och mot de vertikala betongväggändarna monteras expanderande fogband (svällband).',
    proTipsEn:
      'When building on an existing concrete house, the sill plates strictly follow the concrete walls: horizontally atop the 50 cm wall crowns (2.5 m), turning 90° down to follow vertically on the front concrete wall ends to the foundation slab, and continuing along the slab around the ground extension. Sill plates never cantilever or hang in open air across the opening. Use M12 chemical injection studs in wall crowns to prevent edge spalling. Lay double EPDM sill barrier beneath crown sills, and pre-compressed expanding foam tape along the vertical concrete wall ends.',
    checklistSv: [
      'Lägg ut kontinuerlig EPDM-syllisolering längs murkrön och markplatta',
      'Förankra syllarna på murkrönet med kemankare M12 cc 800 mm',
      'Montera vertikala syllar på betongväggarnas gavelslut ner mot plattan med betongskruv och svällband',
      'Förankra marksyllen för tillbyggnaden med expanderbult'
    ],
    checklistEn: [
      'Roll out continuous EPDM sill sealer along the concrete wall crowns and ground slab',
      'Anchor crown sills with M12 chemical injection studs cc 800 mm',
      'Fasten vertical sill plates down the concrete wall ends to the slab with concrete screws and foam tape',
      'Anchor ground extension sills to foundation slab with expansion bolts'
    ]
  },
  {
    step: 2,
    key: 'corners',
    titleSv: '2. Hörnreglar & Fasadanslutning',
    titleEn: '2. Corner Studs & Concrete Interface Ties',
    subtitleSv: 'Ytterhörn samt elastisk anslutning mellan ny trästomme och befintliga betongväggar',
    subtitleEn: 'Outer corner posts and flexible interface sealing between new timber and existing concrete',
    specs: [
      {
        labelSv: 'Hörnkonstruktion',
        labelEn: 'Corner Framing',
        valueSv: 'Dubbla 45×145 C24 med gipsstöd',
        valueEn: 'Double 45×145 C24 with drywall backing'
      },
      {
        labelSv: 'Fasadinfästning',
        labelEn: 'Concrete Wall Ties',
        valueSv: 'Betongskruv 7,5×100 mm cc 400 mm',
        valueEn: '7.5×100 mm concrete screws cc 400 mm'
      },
      {
        labelSv: 'Fogtätning',
        labelEn: 'Interface Sealing',
        valueSv: 'Expanderande fogband (svällband)',
        valueEn: 'Pre-compressed expanding foam tape'
      },
      {
        labelSv: 'Lodkrav',
        labelEn: 'Plumb Standard',
        valueSv: 'Max 1 mm avvikelse per meter',
        valueEn: 'Max 1 mm deviation per meter'
      }
    ],
    proTipsSv:
      'De bakre hörnreglarna reses ovanpå murkrönet på 2,5 m höjd, medan de främre hörnreglarna reses i full höjd från markplattan. Där tillbyggnadens träväggar möter det befintliga betonghuset skapas en kritisk anslutningspunkt: montera en anslutningsregel med expanderande fogband (svällband) mot betongfasaden och fäst med betongskruv cc 400 mm. Eftersom det äldre betonghuset redan har satt sig medan ny stomme rör sig med årstiderna, ska fogen vara rörelseupptagande och diffusionsöppen utåt men lufttät inåt.',
    proTipsEn:
      'Rear corner studs stand atop the concrete wall crown at 2.5 m, while front corner studs stand full height from the ground slab. Where timber extension walls intersect the existing concrete house, an interface stud is secured directly against the concrete facade with 7.5×100 mm concrete screws cc 400 mm. Always apply pre-compressed expanding foam tape (svällband) along the interface. Because the aged concrete structure has completed all settlement while the new timber frame undergoes seasonal movement, this joint must accommodate movement while remaining airtight inside and weather-tight outside.',
    checklistSv: [
      'Res och loda in de bakre hörnreglarna på murkrönet och de främre på markplattan',
      'Applicera svällband och förankra anslutningsreglar i den befintliga betonggaveln med betongskruv',
      'Kontrollera att träkonstruktionen tar hänsyn till eventuell lutning i det befintliga betonghuset'
    ],
    checklistEn: [
      'Erect and plumb rear loft corners on the wall crown and front corners on the ground slab',
      'Apply expanding foam tape and anchor interface studs into existing concrete with concrete screws',
      'Verify that timber layout aligns plumb despite any minor irregularities in the existing concrete'
    ]
  },
  {
    step: 3,
    key: 'studs',
    titleSv: '3. Väggreglar & Hög Front (500 cm)',
    titleEn: '3. Wall Studs & 500 cm High Front Envelope',
    subtitleSv: 'cc 600 mm anpassat för fullhöjd upp till 500 cm i fronten där loftet ryms, samt 2,5 m över betongstommen',
    subtitleEn: 'cc 600 mm framing rising up to 500 cm at the front to house the big loft, and 2.5 m over existing concrete',
    specs: [
      {
        labelSv: 'cc-avstånd',
        labelEn: 'cc Spacing',
        valueSv: '600 mm centrum-till-centrum',
        valueEn: '600 mm center-to-center'
      },
      {
        labelSv: 'Regelvirke',
        labelEn: 'Stud Grade',
        valueSv: '45×145 mm C24 konstruktionsvirke',
        valueEn: '45×145 mm C24 structural timber'
      },
      {
        labelSv: 'Vägghöjder',
        labelEn: 'Wall Heights',
        valueSv: 'Front för loft (under 500 cm tak): upp till 5,0 m / Bakre betongväggar: 2,5 m',
        valueEn: 'Front for loft (under 500 cm roof): up to 5.0 m / Rear concrete walls: 2.5 m'
      },
      {
        labelSv: 'Takprofil för loft',
        labelEn: 'Roof Profile for Loft',
        valueSv: 'Pulpettak 12° – maximal takhöjd i fronten där loftet byggs',
        valueEn: '12° mono-pitch – peak ceiling height at front where loft is built'
      },
      {
        labelSv: 'Skråspikning',
        labelEn: 'Toe-nailing',
        valueSv: '2 st 3,1×90 mm per sida',
        valueEn: '2x 3.1×90 mm framing nails per side'
      }
    ],
    proTipsSv:
      'Ett helt centralt faktum i stomresningen är att loftet INTE placeras i husets bakkant – där taket har sin lägsta punkt (ca 2,4–2,5 m) finns det ingen takhöjd för ett loft! Loftet hör hemma på den andra sidan av huset: vid husets högsta punkt i den främre delen, under det 500 cm höga taket. Därför reses väggreglarna i frampartiet i full höjd upp till 5,0 meters taklinje för att skapa den generösa volym som krävs för ett stort loft. Längs sidorna faller väggreglarna från 5,0 m vid fronten ned till 2,5 m på betongmurkrönet i bakkant. Vid skarven mot de gamla betongväggarna monteras förstärkta bärande dubbelpelare som förbereder upplaget för loftets bärbalkar.',
    proTipsEn:
      'A crucial structural fact is that the loft is NOT placed at the rear of the house—where the roof reaches its lowest elevation (~2.4–2.5 m), there is no headroom for a loft! The loft belongs on the other side of the house: at the highest point in the front, directly under the 500 cm high roofing. Therefore, front envelope studs rise full height up to the 5.0 m roofline to create the generous volume needed for a big loft. Along the side walls, studs slope down from 5.0 m at the front to 2.5 m on the rear concrete wall crown. Reinforced double posts stand at the concrete junction to carry the loft beam bearing seats.',
    checklistSv: [
      'Märk upp cc 600 mm på både murkrönssyll och markplattesyll',
      'Res fullhöjdsreglar upp till 5,0 m i den främre zonen där det stora loftet ska byggas',
      'Kapa och montera korta reglar över de bakre betongväggarna (2,5 m)',
      'Montera förstärkta bärande dubbelreglar vid skarven där betongväggen möter tillbyggnaden'
    ],
    checklistEn: [
      'Mark cc 600 mm intervals on both crown sill and ground foundation plates',
      'Erect full-height studs up to 5.0 m in the front zone where the big loft is built',
      'Cut and fit upper studs over the rear concrete walls (2.5 m)',
      'Install reinforced double posts at the transition junction where concrete meets timber'
    ]
  },
  {
    step: 4,
    key: 'openings',
    titleSv: '4. Bärande Balkar & Upplag mot Betongvägg',
    titleEn: '4. Carrier Beams & Concrete Wall Bearing',
    subtitleSv: 'Kraftiga limträbalkar och bärlinor på 2,5 m nivå med delvis stöd på de gamla 50 cm betongväggarna',
    subtitleEn: 'Heavy glulam beams and ledger beams at 2.5 m elevation partially supported by the old 50 cm concrete walls',
    specs: [
      {
        labelSv: 'Huvudbalk (avväxling)',
        labelEn: 'Transfer Beam',
        valueSv: 'Limträ 90×220 mm GL28c på murkrön',
        valueEn: 'Glulam 90×220 mm GL28c on wall crown'
      },
      {
        labelSv: 'Främre bärlina',
        labelEn: 'Front Carrier Beam',
        valueSv: '90×220 mm GL28c under 500 cm-taket',
        valueEn: '90×220 mm GL28c under 500 cm roof'
      },
      {
        labelSv: 'Upplag mot betong',
        labelEn: 'Bearing Length',
        valueSv: 'Minst 100 mm fast upplag på 50 cm betongmurkrön',
        valueEn: 'Min 100 mm direct bearing on 50 cm concrete crowns'
      },
      {
        labelSv: 'Betongens stödfunktion',
        labelEn: 'Concrete Support Role',
        valueSv: 'Gamla betongväggarna ger orubbligt tillskottsstöd åt loftet',
        valueEn: 'Old concrete walls provide solid supplemental support for big loft'
      },
      {
        labelSv: 'Fönsteravväxling',
        labelEn: 'Window Headers',
        valueSv: '45×195 mm C24 med jack studs',
        valueEn: '45×195 mm C24 with jack studs'
      }
    ],
    proTipsSv:
      'För att bära upp det stora loftet under 500 cm-taket monteras ett kraftigt balksystem på 2,5 meters höjd. I bakkant av loftzonen läggs en bärande limträbalk (90×220 mm) tvärs över öppningen. Denna balk får minst 100 mm fast upplag direkt på de befintliga 50 cm tjocka betongsidoväggarnas murkrön, förankrad med kemankare M12 och tryckfördelande stålplåtar. I loftets framkant monteras en matchande främre bärlina som bärs av de bärande pelarna i frontväggen under det 500 cm höga taket. De gamla betongväggarna fungerar som ett massivt tillskottsstöd som avlastar träkonstruktionen, förhindrar nedböjning och ger ett helt stumt underlag för det stora loftet.',
    proTipsEn:
      'To support the big loft under the 500 cm roof, a heavy beam system is framed at the 2.5-meter level. At the rear boundary of the loft zone, a glulam transfer beam (90×220 mm) spans across the opening, resting with a minimum 100 mm bearing seat directly on the 50 cm solid concrete side wall crowns with M12 chemical studs and steel bearing plates. At the front edge of the loft, a matching front carrier beam spans between reinforced front posts under the 500 cm roof. The indestructible old concrete walls act as massive supplemental support, carrying substantial dead and live loads to keep the big loft completely deflection-free.',
    checklistSv: [
      'Lägg upp och förankra bärande tvärbalk på murkrönet med minst 100 mm upplag mot betongen',
      'Montera den främre bärlinan vid loftets framkant under det 500 cm höga taket',
      'Förankra balkupplagen med kemankare M12 och tryckfördelande stålbrickor',
      'Montera avväxlingar för frontens tre övre fönsterpartier med dubbla jack studs'
    ],
    checklistEn: [
      'Seat and anchor structural transfer beam across wall crowns with min 100 mm bearing on concrete',
      'Install the front carrier beam at the front edge of the loft under the 500 cm high roof',
      'Secure beam seats with M12 chemical injection studs and load-spreading steel plates',
      'Frame headers for the three upper clerestory windows with dedicated jack studs'
    ]
  },
  {
    step: 5,
    key: 'plates_noggings',
    titleSv: '5. Stort Loft under 500 cm Taket & Mellanbjälklag',
    titleEn: '5. Big Loft under 500 cm Roof & Floor Joists',
    subtitleSv: '45×220 mm bjälklag ovanpå bärbalkarna med delvis stöd på betongstommen och full ståhöjd',
    subtitleEn: '45×220 mm joists atop carrier beams with partial concrete support and generous headroom',
    specs: [
      {
        labelSv: 'Loftplacering',
        labelEn: 'Loft Location',
        valueSv: 'Husets främre del under 500 cm taket (INTE i bakkant)',
        valueEn: 'Front of house under 500 cm roof (NOT at low rear)'
      },
      {
        labelSv: 'Loftbjälklag',
        labelEn: 'Floor Joists',
        valueSv: '45×220 mm C24 cc 600 mm ovanpå balkarna',
        valueEn: '45×220 mm C24 cc 600 mm atop beams'
      },
      {
        labelSv: 'Understöd & Upplag',
        labelEn: 'Support & Bearing',
        valueSv: 'Bärbalkar fram + delvis stöd på de gamla betongväggarna',
        valueEn: 'Front carrier beams + partial support from old concrete walls'
      },
      {
        labelSv: 'Skivverkan',
        labelEn: 'Diaphragm Action',
        valueSv: '22 mm golvspånskiva limmad och skruvad',
        valueEn: '22 mm tongue-and-groove floor panels glued/screwed'
      },
      {
        labelSv: 'Takhöjd på loftet',
        labelEn: 'Loft Headroom',
        valueSv: 'Upp till 2,3 m ståhöjd mot det 500 cm höga taket',
        valueEn: 'Up to 2.3 m standing headroom under 500 cm roof'
      }
    ],
    proTipsSv:
      'Här monteras det stora loftet på sin rätta plats i huset: i den främre delen under det 500 cm höga taket! Genom att placera loftet under takets högsta punkt – istället för i bakkant där taket är som lägst – skapas full generös ståhöjd på loftet (upp till ca 2,2–2,3 m), medan markplanet under loftet har behagliga 2,5 m i rumshöjd. Loftbjälkarna (45×220 mm C24 cc 600 mm) monteras ovanpå de bärande balkarna. De spänner från frontväggen och sträcker sig bakåt så att de vilar med delvis upplag direkt på de gamla betongväggarnas murkrön för maximal stadga och bärkraft. Ovanpå bjälkarna limmas och skruvas 22 mm spontad golvspånskiva. Detta bildar en vridstyv horisontalskiva (skivverkan) som låser samman tillbyggnadens trästomme med det gamla betonghuset.',
    proTipsEn:
      'Here the big loft is assembled in its proper place: at the front of the house directly under the 500 cm high roofing! By placing the loft at the highest point of the house—rather than at the back where the roof is lowest—you gain generous standing headroom on the loft floor (up to ~2.2–2.3 m), while maintaining a comfortable 2.5 m ceiling clearance on the ground floor below. Floor joists (45×220 mm C24 cc 600 mm) sit directly on top of the carrier beams. They span from the front wall back across the transfer beam, bearing partially directly onto the old concrete wall crowns for supreme structural support. Glued and screwed 22 mm tongue-and-groove subfloor panels complete a rigid structural diaphragm locking the timber addition to the existing concrete walls.',
    checklistSv: [
      'Placera och rikta in 45×220 mm loftbjälkar cc 600 mm ovanpå bärbalkarna under 500 cm-taket',
      'Säkerställ att loftets bakre del vilar stadigt med delvis stöd på de gamla 50 cm betongväggarna',
      'Fäst bjälkarna med ankarspik i balkskor och bärlinor samt fuktskydd mot betong',
      'Lägg och överlappa hammarbandet över alla hörn för maximal vridstyvhet',
      'Limma och skruva 22 mm golvspånskivor med förskjutna skarvar för full skivverkan'
    ],
    checklistEn: [
      'Position and align 45×220 mm floor joists cc 600 mm atop carrier beams under the 500 cm roof',
      'Ensure the rear of the loft bears firmly with partial support onto the old 50 cm concrete walls',
      'Fasten joists with anchor nails into hangers and ledger beams with moisture barrier over concrete',
      'Install continuous top header plates with interlocking lap joints at all corners',
      'Glue and screw 22 mm subfloor panels with staggered seams for diaphragm action'
    ]
  },
  {
    step: 6,
    key: 'trusses',
    titleSv: '6. Takstolar, 500 cm Pulpettak & Betongförankring',
    titleEn: '6. Roof Rafters, 500 cm Mono-pitch & Concrete Anchors',
    subtitleSv: 'Takbalkar med 12° fall från 500 cm över loftet ned mot bakre betongväggen, förankrade med stålband',
    subtitleEn: 'Roof rafters sloping 12° from 500 cm over the loft down to rear concrete wall, tied with steel straps',
    specs: [
      {
        labelSv: 'Takbalkar',
        labelEn: 'Rafters',
        valueSv: '45×220 mm C24 pulpettak cc 600 mm',
        valueEn: '45×220 mm C24 mono-pitch cc 600 mm'
      },
      {
        labelSv: 'Takhöjder',
        labelEn: 'Roof Elevations',
        valueSv: '500 cm över loftet i fronten, faller till 2,4 m i bakkant',
        valueEn: '500 cm over the loft at front, falling to 2.4 m at rear'
      },
      {
        labelSv: 'Taklutning',
        labelEn: 'Roof Pitch',
        valueSv: '12° pulpettak (ensidigt fall från loft mot baksida)',
        valueEn: '12° mono-pitch (draining rearward away from loft)'
      },
      {
        labelSv: 'Vindförankring',
        labelEn: 'Uplift Straps',
        valueSv: 'Hålband / Dragband förankrade i betong',
        valueEn: 'Galvanized steel tension straps into concrete'
      },
      {
        labelSv: 'Infästning',
        labelEn: 'Clip Fasteners',
        valueSv: 'Vinkelbeslag 90×90 med 4,0×40 ankarspik',
        valueEn: '90×90 angle brackets with 4.0×40 anchor nails'
      }
    ],
    proTipsSv:
      'Pulpettaket lyfter träpåbyggnaden upp till 5 meters totalhöjd (500 cm) vid framkanten, vilket är själva grunden för att det stora loftet ryms med full rymd och luftighet. Takstolarna (45×220 mm C24) spänner med 12° fall från frontens hammarband (500 cm) hela vägen bakåt till murkrönet på betonghuset. Detta innebär att loftet badar i rymd och ljus från de tre övre fönsterpartierna i fronten, medan taket sluter tätt ned mot betongkanten i bakkant. För att säkra det höga taket och loftet mot stormkrafter monteras kraftiga stålhålband (dragband) som förbinder takstolarna och loftstommen direkt ner i det befintliga betonghusets massiva stomme med kemankare.',
    proTipsEn:
      'The mono-pitch roof elevates the timber addition up to a total height of 5 meters (500 cm) at the front edge, providing the ceiling height that makes the big loft bright and spacious. Rafters (45×220 mm C24) span at a 12° pitch from the front top plate (500 cm) back down to the rear concrete wall crown. This floods the loft with light from the three upper clerestory windows in the front. To secure the tall roof and loft structure against aerodynamic storm uplift, continuous heavy-gauge steel tension straps tie the rafters and loft frame directly into the massive concrete ballast using chemical anchor bolts.',
    checklistSv: [
      'Montera pulpettakstolar cc 600 mm med 12° takfall från front (500 cm över loft) mot baksida',
      'Spika vinkelbeslag med ankarspik på båda sidor om varje takstolsfot',
      'Montera genomgående dragband som förbinder tak- och loftkonstruktionen med den tunga betongstommen'
    ],
    checklistEn: [
      'Install mono-pitch rafters cc 600 mm with 12° slope from front (500 cm over loft) to rear',
      'Fasten heavy angle brackets with anchor nails on both sides of every rafter seat',
      'Anchor continuous steel tie-down straps linking roof and loft structure to the heavy concrete walls'
    ]
  },
  {
    step: 7,
    key: 'inspection',
    titleSv: '7. Slutkontroll & Fuktsäkerhet',
    titleEn: '7. Final Quality Audit & Interface Sealing',
    subtitleSv: 'Kvalitetskontroll av fuktspärrar, köldbryggor och lufttätning mot betong',
    subtitleEn: 'Comprehensive audit of capillary breaks, thermal isolation, and air barrier seals',
    specs: [
      {
        labelSv: 'Fuktkvot i virke',
        labelEn: 'Wood Moisture',
        valueSv: 'Max 16% fuktkvot före isolering',
        valueEn: 'Max 16% wood moisture content'
      },
      {
        labelSv: 'Lufttätning',
        labelEn: 'Air Barrier',
        valueSv: 'Tejpad ångbroms mot rengjord betong',
        valueEn: 'Taped vapor retarder to primed concrete'
      },
      {
        labelSv: 'Köldbryggor',
        labelEn: 'Thermal Break',
        valueSv: 'Isolering utanpå betongkrön',
        valueEn: 'Exterior insulation over concrete junction'
      },
      {
        labelSv: 'Vindstagning',
        labelEn: 'Wind Bracing',
        valueSv: 'Kryssband & utvändigt vindskydd',
        valueEn: 'Diagonal tension bracing & exterior wrap'
      }
    ],
    proTipsSv:
      'Innan isolering och panelering påbörjas ska gränssnittet mellan trä och betong besiktigas noga. Kontrollera att ingen trädel har direktkontakt med rå betong utan mellanliggande fuktspärr. Säkerställ att ångspärren/ångbromsen i trädelen ansluts och tejpas med godkänd åldringsbeständig tätmassa/tejp mot betongens insida för att undvika fuktkonvektion. Utvändigt ska övergången mellan betongsockel och träfasad förses med plåtbeslag (sockelbleck) med droppnäsa som leder bort regnvatten från betongväggen.',
    proTipsEn:
      'Before insulation and exterior cladding proceed, meticulously inspect the timber-to-concrete interface. Verify zero direct wood-to-concrete contact without a capillary moisture barrier. Ensure the interior air/vapor barrier membrane is sealed to the primed concrete wall face with approved acoustic sealant and tape to prevent warm indoor air convection into the wall joint. Externally, install continuous metal base flashing (sockelbleck) with drip edge to shed water clear of the concrete facade.',
    checklistSv: [
      'Inspektera alla syll- och murkrönsanslutningar för fullständig fuktspärr',
      'Täta luft- och ångspärr mot betongväggen med godkänd primer och fogmassa',
      'Kontrollera fuktkvoten i virket (< 16%) och montera utvändigt sockelbleck'
    ],
    checklistEn: [
      'Inspect all sill plate and crown interfaces for complete capillary isolation',
      'Seal air/vapor barrier membranes to primed concrete walls with acoustic sealant',
      'Verify wood moisture content (< 16%) and verify exterior drip flashing over concrete'
    ]
  }
];

export const FRAMING_STEPS = FRAMING_STEPS_STANDARD;
export const FRAMING_STEPS_TOTAL = FRAMING_STEPS_STANDARD.length;

export function getFramingSteps(isConcrete = false): FramingStepDefinition[] {
  return isConcrete ? FRAMING_STEPS_CONCRETE_COMBO : FRAMING_STEPS_STANDARD;
}

export function getFramingStep(step: number, isConcrete = false): FramingStepDefinition {
  const steps = getFramingSteps(isConcrete);
  const clamped = Math.max(1, Math.min(steps.length, Math.round(step || 1)));
  return steps[clamped - 1];
}
