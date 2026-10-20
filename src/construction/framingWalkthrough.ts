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
    titleSv: '3. Väggreglar & Nivåövergång',
    titleEn: '3. Wall Studs & Elevation Transition',
    subtitleSv: 'cc 600 mm anpassat för loftväggar på betong och fullhöjdsväggar i markplan',
    subtitleEn: 'cc 600 mm layout for loft walls on concrete and full-height studs in extension',
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
        valueSv: 'Loft: ~2,5 m / Tillbyggnad: upp till 5,0 m',
        valueEn: 'Loft: ~2.5 m / Extension: up to 5.0 m'
      },
      {
        labelSv: 'Skråspikning',
        labelEn: 'Toe-nailing',
        valueSv: '2 st 3,1×90 mm per sida',
        valueEn: '2x 3.1×90 mm framing nails per side'
      }
    ],
    proTipsSv:
      'Väggreglarna på långsidorna byter nivå: över betongväggarna är reglarna ca 2,0–2,5 m höga och vilar på murkrönets syll, medan de i den främre tillbyggnaden sträcker sig från markplattan upp till takets hammarband. Placera alltid virkets krökningsbåge (krona) utåt. Vid övergången mellan betongkrön och markplatta ska en förstärkt dubbel bärande regelpelare placeras för att ta upp taklasten där murkrönet slutar.',
    proTipsEn:
      'Side wall studs transition between two base elevations: above the concrete walls, studs are ~2.0–2.5 m tall resting on the crown sill, while in the front extension they span continuously from the ground plate up to the sloping roofline. Always orient stud crowns facing outwards. At the exact transition point where the concrete wall crown terminates, install a doubled post to carry roof loads cleanly into the foundation.',
    checklistSv: [
      'Märk upp cc 600 mm på både murkrönssyll och markplattesyll',
      'Kapa och montera korta reglar över betongväggarna och långa reglar i tillbyggnaden',
      'Montera förstärkta dubbelreglar vid skarven där betongväggen slutar'
    ],
    checklistEn: [
      'Mark cc 600 mm intervals on both crown sill and ground foundation plates',
      'Cut and fit upper studs over the concrete walls and full-height studs in the extension',
      'Install reinforced double studs at the transition junction where the concrete wall ends'
    ]
  },
  {
    step: 4,
    key: 'openings',
    titleSv: '4. Avväxlingar & Bärbalk över Öppning',
    titleEn: '4. Headers & Opening Transfer Beam',
    subtitleSv: 'Bärande limträ-/avväxlingsbalk över betongöppningen samt fönster- och dörravväxlingar',
    subtitleEn: 'Structural header beam across concrete opening and door/window lintels',
    specs: [
      {
        labelSv: 'Huvudbalk',
        labelEn: 'Transfer Beam',
        valueSv: 'Limträ / 45×195 mm C24 dubblerad',
        valueEn: 'Glulam / Doubled 45×195 mm C24'
      },
      {
        labelSv: 'Upplagslängd',
        labelEn: 'Bearing Length',
        valueSv: 'Minst 100 mm upplag på betong',
        valueEn: 'Min 100 mm direct bearing on concrete'
      },
      {
        labelSv: 'Fönsteravväxling',
        labelEn: 'Window Headers',
        valueSv: '45×195 mm C24 med jack studs',
        valueEn: '45×195 mm C24 with jack studs'
      },
      {
        labelSv: 'Ställmån',
        labelEn: 'Framing Gap',
        valueSv: '15–20 mm runtom korg',
        valueEn: '15–20 mm perimeter frame gap'
      }
    ],
    proTipsSv:
      'Där betonghusets gamla front öppnats upp mot tillbyggnaden måste en bärande tvärbalk (avväxlingsbalk) placeras i nivå med murkrönet. Denna balk bär upp både loftets golvbjälklag och eventuella taklaster. Balken ska ha minst 100 mm fast upplag på de kvarvarande betongsidoväggarna, vilande på tryckfördelande stålplåtar eller syllvirke med fuktspärr. På övervåningen fälls avväxlingar in för de tre övre fönsterpartierna i träfasaden.',
    proTipsEn:
      'Where the original concrete front wall has been opened up into the extension, a heavy transfer beam must span across at the concrete crown elevation (2.5 m). This beam carries both the loft floor joists and vertical roof loads. It requires a minimum 100 mm bearing seat directly atop the solid concrete side walls, resting on steel bearing plates and bituminous moisture barrier. On the upper floor, headers are framed in for the upper clerestory window panels.',
    checklistSv: [
      'Lägg upp och förankra bärande tvärbalk på murkrönet med minst 100 mm upplag',
      'Montera avväxlingsbalkar för dörrar och fönster med dubbla stödstolpar',
      'Kontrollera att det finns minst 15 mm ställmån runt alla fönster- och dörrhål'
    ],
    checklistEn: [
      'Seat and anchor structural transfer beam across wall crowns with min 100 mm bearing',
      'Frame window and door headers with dedicated jack studs for full load path',
      'Ensure 15–20 mm perimeter installation clearance around all planned openings'
    ]
  },
  {
    step: 5,
    key: 'plates_noggings',
    titleSv: '5. Hammarband & Mellanbjälklag',
    titleEn: '5. Top Plates & Loft Floor Joists',
    subtitleSv: 'Övre hammarband samt golvbjälklag för träloftet ovanpå betonghuset',
    subtitleEn: 'Top perimeter plates and structural loft floor joists over the concrete house',
    specs: [
      {
        labelSv: 'Loftbjälklag',
        labelEn: 'Floor Joists',
        valueSv: '45×220 mm C24 cc 600 mm',
        valueEn: '45×220 mm C24 cc 600 mm'
      },
      {
        labelSv: 'Balkskor',
        labelEn: 'Joist Hangers',
        valueSv: 'Kraftiga balkskor med ankarspik',
        valueEn: 'Heavy-duty galvanized joist hangers'
      },
      {
        labelSv: 'Hammarband',
        labelEn: 'Top Plate',
        valueSv: '45×145 mm C24 med överlapp i hörn',
        valueEn: '45×145 mm continuous C24 with corner lap'
      },
      {
        labelSv: 'Skivverkan',
        labelEn: 'Diaphragm Action',
        valueSv: '22 mm golvspånskiva limmad och skruvad',
        valueEn: '22 mm tongue-and-groove floor panels glued/screwed'
      }
    ],
    proTipsSv:
      'Loftets golvbjälklag (45×220 mm) spänner över betonghuset och vilar direkt på murkrönets syll samt den bärande tvärbalken. Detta bjälklag fyller en dubbel funktion: det utgör sovloftets bärande golv, och bildar samtidigt en kraftig horisontell skiva (skivverkan) som förhindrar att betongväggarna trycks utåt av vindlaster. Hammarbandet (toppsyllen) binder samman regeltopparna i takfallet (pulpettaket 12°).',
    proTipsEn:
      'The loft floor joists (45×220 mm) span across the concrete house, bearing directly on the wall crown sills and the transfer beam. This floor serves a dual role: providing the living floor deck for the loft, and functioning as a rigid structural diaphragm tying the tops of the heavy concrete walls together. The sloping top plates (hammarband) interlock at the corners to unify the 12° mono-pitch timber envelope.',
    checklistSv: [
      'Montera golvbjälkar cc 600 mm för loftet med fuktskydd mot murkrön',
      'Lägg och överlappa hammarbandet över alla hörn för maximal vridstyvhet',
      'Montera kortlingar mellan reglarna på 1200 mm höjd för knäck- och skivstöd'
    ],
    checklistEn: [
      'Position 45×220 mm loft floor joists cc 600 mm with moisture barrier beneath',
      'Install continuous top header plates with interlocking lap joints at all corners',
      'Fit staggered wall noggings at 1200 mm height for stud stabilization'
    ]
  },
  {
    step: 6,
    key: 'trusses',
    titleSv: '6. Takstolar & Vindförankring i Betong',
    titleEn: '6. Roof Rafters & Concrete Mass Anchoring',
    subtitleSv: 'Pulpettakstolar förankrade med genomgående dragband ner i betongstommen',
    subtitleEn: 'Mono-pitch rafters anchored with continuous tension straps into concrete mass',
    specs: [
      {
        labelSv: 'Takbalkar',
        labelEn: 'Rafters',
        valueSv: '45×220 mm C24 pulpettak cc 600 mm',
        valueEn: '45×220 mm C24 mono-pitch cc 600 mm'
      },
      {
        labelSv: 'Taklutning',
        labelEn: 'Roof Pitch',
        valueSv: '12° pulpettak (ensidigt fall)',
        valueEn: '12° mono-pitch slope'
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
      'Pulpettaket lyfter träpåbyggnaden upp till 5 meters totalhöjd. Vid stark vind utsätts det höga taket för enorma sugkrafter (vindlyft). På ett vanligt trähus förlitar man sig på plattans tyngd; här ska du dra nytta av det befintliga betonghusets enorma massa! Förankra takstolarna med förstärkta vinkelbeslag mot hammarbandet, och montera kontinuerliga stålhålband (dragband) som löper vertikalt från takstolarna och bultas direkt in i betongväggarna med kemankare. Detta förhindrar all risk för taklyft.',
    proTipsEn:
      'The mono-pitch roof raises the timber addition up to a total height of 5 meters. Under heavy storm winds, this tall facade experiences significant aerodynamic uplift forces. Instead of relying solely on wood fasteners, take advantage of the massive ballast provided by the concrete house! Fasten rafters to the top plates using reinforced angle clips, and install continuous vertical steel tension straps running from the rafters down into the concrete walls anchored with chemical bolts. This permanently resists wind uplift.',
    checklistSv: [
      'Montera pulpettakstolar cc 600 mm med 12° takfall från front mot baksida',
      'Spika vinkelbeslag med ankarspik på båda sidor om varje takstolsfot',
      'Montera dragband som förbinder takkonstruktionen med den tunga betongstommen'
    ],
    checklistEn: [
      'Install mono-pitch rafters cc 600 mm with 12° slope draining to the rear',
      'Fasten heavy angle brackets with anchor nails on both sides of every rafter seat',
      'Anchor continuous steel tie-down straps linking the roof structure to the concrete walls'
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
