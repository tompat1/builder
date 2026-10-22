/**
 * Timber Framing Walkthrough (Stomguide)
 *
 * Sequential master-builder guide for Swedish timber framing
 * (SS-EN 1995-1-1 / Eurocode 5 & TräGuiden): load path, assembly order,
 * tools, pitfalls, and inspection checkpoints.
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
  /** Ordered on-site assembly sequence — how to build this step. */
  assemblySv: string[];
  assemblyEn: string[];
  /** Tools and consumables for the crew. */
  toolsSv: string[];
  toolsEn: string[];
  /** Typical mistakes that weaken the load path. */
  pitfallsSv: string[];
  pitfallsEn: string[];
  proTipsSv: string;
  proTipsEn: string;
  checklistSv: string[];
  checklistEn: string[];
}

export const FRAMING_STEPS_STANDARD: FramingStepDefinition[] = [
  {
    step: 1,
    key: "sill",
    titleSv: "1. Grundsyll & Syllisolering",
    titleEn: "1. Bottom Sill Plates & Moisture Barrier",
    subtitleSv: "Lastväg: husets hela tyngd och vindlyft går först genom syllen ner i betongplattan. Fel här syns i hela stommen.",
    subtitleEn: "Load path: the whole house weight and wind uplift pass through the sill into the slab. Mistakes here show up in the entire frame.",
    specs: [
      {
        labelSv: "Virkesdimension",
        labelEn: "Timber Dimension",
        valueSv: "45×145 mm C24",
        valueEn: "45×145 mm C24"
      },
      {
        labelSv: "Infästning",
        labelEn: "Fasteners",
        valueSv: "Expanderbult M10 cc 1200 mm · max 150 mm från hörn",
        valueEn: "Anchor bolts M10 cc 1200 mm · max 150 mm from corners"
      },
      {
        labelSv: "Fuktskydd",
        labelEn: "Moisture Barrier",
        valueSv: "EPDM-syllisolering 150 mm kontinuerlig",
        valueEn: "Continuous 150 mm EPDM sill sealer"
      },
      {
        labelSv: "Tolerans",
        labelEn: "Tolerance",
        valueSv: "Kryssmätning ±2 mm · vågrätt ±3 mm/10 m",
        valueEn: "Diagonal check ±2 mm · level ±3 mm/10 m"
      },
      {
        labelSv: "Lastväg",
        labelEn: "Load Path",
        valueSv: "Syll → expanderbult → betongplatta",
        valueEn: "Sill → anchor bolt → concrete slab"
      }
    ],
    assemblySv: [
      "1. Soprent och dammsug sockeln. Markera ytterkant för syllisolering.",
      "2. Rulla EPDM kontinuerligt runt hela plattan; skarva med ≥100 mm omlott och lim/tejp enligt produktblad.",
      "3. Lägg ut syllbitar torrt. Kryssmät hörn till hörn — justera tills diagonalerna skiljer ≤2 mm.",
      "4. Borra genom syll + EPDM in i betong (rätt djup för expander). Blås rent hålet.",
      "5. Sätt expanderbult M10, bricka och mutter. Börja i hörnen, dra växelvis till rätt moment.",
      "6. Kontrollera vågrätt med laser/långpass. Packa under med plastkilar + bruk om det behövs — aldrig trämot trä mot rå betong."
    ],
    assemblyEn: [
      "1. Sweep and vacuum the slab edge. Mark the outer line for sill sealer.",
      "2. Roll continuous EPDM around the perimeter; lap joints ≥100 mm and seal per product data.",
      "3. Dry-fit sill plates. Cross-measure corner to corner — adjust until diagonals differ by ≤2 mm.",
      "4. Drill through sill + EPDM into concrete (correct embedment). Blow the hole clean.",
      "5. Install M10 anchors, washers and nuts. Start at corners; tighten in a cross pattern to torque.",
      "6. Check level with laser/long level. Shim with plastic packers + grout if needed — never raw wood on raw concrete."
    ],
    toolsSv: [
      "Rotationslaser / 2 m vattenpass",
      "Måttband + snörslå",
      "Borrmaskin med betongborr",
      "Momentnyckel för M10",
      "Kniv till EPDM",
      "Plastkilar"
    ],
    toolsEn: [
      "Rotary laser / 2 m spirit level",
      "Tape + chalk line",
      "Hammer drill with masonry bit",
      "Torque wrench for M10",
      "Knife for EPDM",
      "Plastic packers"
    ],
    pitfallsSv: [
      "Glömd EPDM → kapillär fukt i syllen inom några säsonger.",
      "Bultar för långt från hörn → hörnet kan lyfta vid vind.",
      "Syll som “hänger” över fogar utan upplag → lokal sättning."
    ],
    pitfallsEn: [
      "Missing EPDM → capillary moisture into the sill within seasons.",
      "Anchors too far from corners → corner uplift in wind.",
      "Sill spanning unsupported joints → local settlement."
    ],
    proTipsSv:
      "Lägg alltid godkänd syllisolering mellan betong och trä. Kryssmät innan bultarna dras åt. Syllens uppgift är att föra ner både vertikal last och lyftkrafter — den är inte bara en “bottenlist”.",
    proTipsEn:
      "Always install approved sill sealer between concrete and timber. Cross-measure before torquing bolts. The sill transfers both gravity and uplift — it is not just a base trim.",
    checklistSv: [
      "EPDM runt hela sockeln utan avbrott",
      "Kryssmått ≤2 mm skillnad",
      "Expanderbult cc ≤1200 mm och ≤150 mm från varje hörn",
      "Syll vågrät inom tolerans",
      "Inget trä i direktkontakt med rå betong"
    ],
    checklistEn: [
      "Continuous EPDM around the full perimeter",
      "Diagonals within 2 mm",
      "Anchors cc ≤1200 mm and ≤150 mm from every corner",
      "Sill level within tolerance",
      "No timber in direct contact with raw concrete"
    ]
  },
  {
    step: 2,
    key: "corners",
    titleSv: "2. Hörnreglar & Lodning",
    titleEn: "2. Corner Stud Assemblies & Plumb Alignment",
    subtitleSv: "Hörnen låser husets geometri. Loda och sträva innan mellanreglar — annars “jagar” du fel genom hela väggen.",
    subtitleEn: "Corners lock the house geometry. Plumb and brace before intermediate studs — or you chase error through every wall.",
    specs: [
      {
        labelSv: "Konstruktion",
        labelEn: "Construction",
        valueSv: "Dubbla hörnreglar 45×145 C24 + invändigt spikstöd",
        valueEn: "Double corner studs 45×145 C24 + interior nailer"
      },
      {
        labelSv: "Lodkrav",
        labelEn: "Plumb Standard",
        valueSv: "Max 1 mm/m i båda riktningarna",
        valueEn: "Max 1 mm/m in both planes"
      },
      {
        labelSv: "Infästning i syll",
        labelEn: "Sill Fastening",
        valueSv: "2× 5×90 mm skruv eller tåspik 90 mm per fläns",
        valueEn: "2× 5×90 mm screws or 90 mm toe-nails per flange"
      },
      {
        labelSv: "Stagning",
        labelEn: "Temporary Bracing",
        valueSv: "Diagonalsträvor 22×95 mm till platta/syll",
        valueEn: "22×95 mm diagonal kickers to slab/sill"
      },
      {
        labelSv: "Lastväg",
        labelEn: "Load Path",
        valueSv: "Hörn → syll → platta; strävor tar vind tills skivor sitter",
        valueEn: "Corner → sill → slab; braces take wind until sheathing"
      }
    ],
    assemblySv: [
      "1. Spika ihop hörnpaket: två 45×145 + ev. 45×45/spikregel så gips får fäste i innerhörn.",
      "2. Res första hörnet. Tåspika/skruva i syllen. Loda i båda planen med 2 m pass eller laser.",
      "3. Sätt snedsträva 22×95 från hörntopp ner till syll/platta. Lås när lodet är rätt.",
      "4. Res övriga tre hörn på samma sätt. Spänn snöre mellan hörntoppar för referenslinje.",
      "5. Kontrollera att hörnen bildar rektangel (samma kryssmått som i steg 1)."
    ],
    assemblyEn: [
      "1. Assemble corner packs: two 45×145 plus a nailer so drywall has a corner flange.",
      "2. Stand the first corner. Toe-nail/screw to the sill. Plumb both planes with a 2 m level or laser.",
      "3. Fit a 22×95 diagonal from corner top down to sill/slab. Lock when plumb is true.",
      "4. Erect the other three corners the same way. Run stringlines between tops as a reference.",
      "5. Confirm the corners still form a rectangle (same diagonals as step 1)."
    ],
    toolsSv: [
      "2 m vattenpass / lodlaser",
      "Tvingar",
      "Spikpistol eller skruvdragare",
      "22×95 strävor",
      "Snöre"
    ],
    toolsEn: [
      "2 m level / plumb laser",
      "Clamps",
      "Nailer or impact driver",
      "22×95 braces",
      "Stringline"
    ],
    pitfallsSv: [
      "Enkelt hörn utan spikstöd → gips hörnskarv spricker.",
      "Ingen temporär sträva → hörnet tippar när nästa vägg reses.",
      "Lod bara i ett plan → väggen blir “propeller”."
    ],
    pitfallsEn: [
      "Single stud corner without nailer → drywall corner cracks.",
      "No temporary brace → corner tips when the next wall goes up.",
      "Plumbing in only one plane → twisted “propeller” wall."
    ],
    proTipsSv:
      "Hörnreglarna sätter geometrin. Bygg med invändigt spikstöd, loda i båda riktningarna och lås med snedsträvor innan mellanreglar monteras.",
    proTipsEn:
      "Corner studs set the geometry. Build with an interior nailer, plumb both ways, and lock with diagonal braces before intermediate studs go in.",
    checklistSv: [
      "Dubbla hörn med gipsstöd i innerhörn",
      "Lod ≤1 mm/m i båda planen",
      "Temporära snedsträvor fastskruvade",
      "Hörn förankrade i syll med minst två fästen per fläns",
      "Referenssnöre mellan hörntoppar"
    ],
    checklistEn: [
      "Double corners with interior drywall nailer",
      "Plumb ≤1 mm/m in both planes",
      "Temporary diagonals screwed home",
      "Corners anchored to sill with at least two fasteners per flange",
      "Reference string between corner tops"
    ]
  },
  {
    step: 3,
    key: "studs",
    titleSv: "3. Väggreglar cc 600 mm",
    titleEn: "3. Wall Studs cc 600 mm",
    subtitleSv: "Modulmått för isolering och skivor — och kontinuerlig lastväg från hammarband ner till syll.",
    subtitleEn: "Module spacing for insulation and sheets — and a continuous load path from top plate down to sill.",
    specs: [
      {
        labelSv: "cc-avstånd",
        labelEn: "cc Spacing",
        valueSv: "600 mm centrum-till-centrum",
        valueEn: "600 mm center-to-center"
      },
      {
        labelSv: "Kvalitet",
        labelEn: "Timber Grade",
        valueSv: "Konstruktionsvirke C24 45×145",
        valueEn: "Structural timber C24 45×145"
      },
      {
        labelSv: "Isolerdjup",
        labelEn: "Insulation Depth",
        valueSv: "145 mm mineralull",
        valueEn: "145 mm mineral wool"
      },
      {
        labelSv: "Spikning",
        labelEn: "Fastening",
        valueSv: "2× 3,1×90 mm maskinspik per ände (eller likvärdig skruv)",
        valueEn: "2× 3.1×90 mm framing nails per end (or equivalent screws)"
      },
      {
        labelSv: "Krona",
        labelEn: "Crown",
        valueSv: "Alla kronor utåt mot fasad",
        valueEn: "All crowns facing outward to facade"
      }
    ],
    assemblySv: [
      "1. Märk cc 600 från referenshörn på syll och (senare) hammarband. Markera öppningar så reglar inte hamnar i karmlinjen.",
      "2. Titta varje regel: lägg kronan (böjen) utåt. Kasta virke med stora kvistar i dragzonen.",
      "3. Kapa till längd (golv–tak minus spel enligt ritning). Torrpassa några fack.",
      "4. Res regel för regel. Tåspika/skråspika i syllen — två fästen per sida. Tillfälligt stöd vid långa väggar.",
      "5. Kontrollera att regelflänsarna ligger i samma plan (snöre eller lång rätskiva)."
    ],
    assemblyEn: [
      "1. Mark cc 600 from the benchmark corner on the sill (and later the top plate). Mark openings so studs miss the frame line.",
      "2. Sight each stud: crown out. Reject stock with large knots in the tension edge.",
      "3. Cut to length (floor–ceiling less drawing clearance). Dry-fit a few bays.",
      "4. Stand studs one by one. Toe-nail into the sill — two fasteners per side. Temporary support on long walls.",
      "5. Check that stud faces lie in one plane (stringline or long straightedge)."
    ],
    toolsSv: [
      "Kappsåg",
      "Snörslå",
      "Spikpistol",
      "Rätskiva 2–3 m",
      "Tuschmarkör"
    ],
    toolsEn: [
      "Chop saw",
      "Chalk line",
      "Framing nailer",
      "2–3 m straightedge",
      "Marker"
    ],
    pitfallsSv: [
      "Blandade kronor → vågig fasad och skivskarvar som “pratar”.",
      "cc som driver bort från 600 → isolering och gips måste kapas i onödan.",
      "För få spikar i syll → regel kan lyfta vid stomresning."
    ],
    pitfallsEn: [
      "Mixed crowns → wavy facade and noisy sheet joints.",
      "cc drifting off 600 → wasted cutting of batts and boards.",
      "Too few sill nails → studs lift during framing."
    ],
    proTipsSv:
      "cc 600 mm är svensk standard så 1200 mm isolering och gips passar. Rikta alla kronor utåt så ytterväggen blir plan.",
    proTipsEn:
      "cc 600 mm is Scandinavian standard so 1200 mm batts and boards fit. Face all crowns out for a flat exterior plane.",
    checklistSv: [
      "cc 600 märkt från samma referenshörn",
      "Alla kronor utåt",
      "Två fästen per regelände i syll",
      "Regelflänsar i samma plan",
      "Öppningszoner friade från felplacerade reglar"
    ],
    checklistEn: [
      "cc 600 marked from the same benchmark corner",
      "All crowns outward",
      "Two fasteners per stud end into sill",
      "Stud faces in one plane",
      "Opening zones clear of misplaced studs"
    ]
  },
  {
    step: 4,
    key: "openings",
    titleSv: "4. Avväxlingar för Dörrar & Fönster",
    titleEn: "4. Headers, Trimmers & Opening Frames",
    subtitleSv: "Öppningen får aldrig “hänga”. Lasten ovanför ska ner via balk → jack studs → syll → platta.",
    subtitleEn: "An opening must never hang. Load above must go header → jack studs → sill → slab.",
    specs: [
      {
        labelSv: "Avväxlingsbalk",
        labelEn: "Header Beam",
        valueSv: "45×195 mm C24 / limträ vid stora spann",
        valueEn: "45×195 mm C24 / glulam for larger spans"
      },
      {
        labelSv: "Stödregel (Jack)",
        labelEn: "Trimmer Stud",
        valueSv: "Fullt upplag under balkända",
        valueEn: "Full bearing under each header end"
      },
      {
        labelSv: "Kungregel (King)",
        labelEn: "King Stud",
        valueSv: "Helhöjd intill jack stud",
        valueEn: "Full-height beside each jack"
      },
      {
        labelSv: "Ställmån",
        labelEn: "Installation Gap",
        valueSv: "15–20 mm runtom karm",
        valueEn: "15–20 mm around frame"
      },
      {
        labelSv: "Kortreglar",
        labelEn: "Cripples",
        valueSv: "cc 600 över balk & under bröstning",
        valueEn: "cc 600 above header & below sill"
      }
    ],
    assemblySv: [
      "1. Markera fri öppning = karm + ställmån. Sätt kungreglar (helhöjd) på ömse sidor.",
      "2. Kapa jack studs till exakt höjd under balkens underkant. De ska bära — inte bara “stå bredvid”.",
      "3. Bygg/avväxla balken (dubbel 45×195 eller limträ). Lyft på plats, vila fullt på jack studs.",
      "4. Fäst balkändar med spikplåt/vinkelbeslag. Sätt kortreglar cc 600 ovanför ner mot hammarband/nocklinje.",
      "5. Under fönster: bröstningsyll + kortreglar till syll. Kontrollera att karmytan är lod och i liv med regelverk."
    ],
    assemblyEn: [
      "1. Mark clear opening = frame + gap. Set full-height king studs each side.",
      "2. Cut jack studs to exact height under the header soffit. They must bear — not just stand beside.",
      "3. Build the header (double 45×195 or glulam). Lift into place with full seat on the jacks.",
      "4. Fasten header ends with plates/angles. Fit cripples cc 600 above up to the top plate.",
      "5. At windows: rough sill + cripples down to bottom plate. Check the rough opening is plumb and in plane."
    ],
    toolsSv: [
      "Kappsåg",
      "Vinkelbeslag + ankarspik",
      "Tvingar",
      "Vattenpass",
      "Mått för karm"
    ],
    toolsEn: [
      "Chop saw",
      "Angle brackets + anchor nails",
      "Clamps",
      "Level",
      "Frame gauge"
    ],
    pitfallsSv: [
      "Balk som bara spikas i kungsregel utan jack → last ner i spik, inte i virke.",
      "För liten ställmån → karm klämmer, drevning omöjlig.",
      "Saknad kortregel ovanför → taklast “hoppar” till nästa fack ojämnt."
    ],
    pitfallsEn: [
      "Header only nailed to kings without jacks → load in nails, not timber.",
      "Too little gap → frame binds, no room to pack.",
      "Missing cripples above → roof load skips bays unevenly."
    ],
    proTipsSv:
      "Avväxlingsbalken fångar taklasten och leder den via jack studs till grunden. Lämna 15–20 mm ställmån för drevning och rörelse.",
    proTipsEn:
      "The header catches roof load and sends it down jack studs to the foundation. Leave 15–20 mm for packing and movement.",
    checklistSv: [
      "Jack studs med fullt upplag under varje balkända",
      "Kungreglar helhöjd på båda sidor",
      "Balk dimensionerad för spannet",
      "Kortreglar cc 600 ovanför (och under bröstning)",
      "Ställmån 15–20 mm runtom"
    ],
    checklistEn: [
      "Jacks with full bearing under each header end",
      "Full-height kings on both sides",
      "Header sized for the span",
      "Cripples cc 600 above (and below sill)",
      "15–20 mm perimeter gap"
    ]
  },
  {
    step: 5,
    key: "plates_noggings",
    titleSv: "5. Hammarband & Kortlingar",
    titleEn: "5. Top Header Plates & Mid-wall Noggings",
    subtitleSv: "Hammarbandet knyter väggarna till en låda. Kortlingar stoppar knäckning och ger skivfäste.",
    subtitleEn: "The top plate ties walls into a box. Noggings stop buckling and back sheet seams.",
    specs: [
      {
        labelSv: "Hammarband",
        labelEn: "Top Plate",
        valueSv: "45×145 mm C24 genomgående",
        valueEn: "45×145 mm continuous C24"
      },
      {
        labelSv: "Hörnförband",
        labelEn: "Corner Lap",
        valueSv: "≥145 mm omlott / förskjuten skarv",
        valueEn: "≥145 mm lap / staggered joint"
      },
      {
        labelSv: "Kortlingar",
        labelEn: "Noggings",
        valueSv: "45×145 vid ca 1200 mm höjd, förskjutna fack",
        valueEn: "45×145 at ~1200 mm height, staggered bays"
      },
      {
        labelSv: "Infästning",
        labelEn: "Fastening",
        valueSv: "2× 90 mm spik/skruv i varje regel",
        valueEn: "2× 90 mm nails/screws into every stud"
      },
      {
        labelSv: "Lastväg",
        labelEn: "Load Path",
        valueSv: "Takstol → hammarband → reglar → syll",
        valueEn: "Rafter → top plate → studs → sill"
      }
    ],
    assemblySv: [
      "1. Lägg hammarband torrt. Hörnskarvar med minst 145 mm omlott så lång- och gavelsida låser varandra.",
      "2. Skruva/spika ner i varje regel — två fästen. Dubbla hammarband där ritning kräver (t.ex. under takstolsupplag).",
      "3. Märk kortlingshöjd (~1200 mm). Montera förskjutna mellan facken så du kan spika rakt genom regeln.",
      "4. Vid öppningar: kortlingar får inte bryta lastväg — de kompletterar, ersätter inte avväxling.",
      "5. Kryssmät igen. Lås eventuella restfel med temporära strävor tills vindskydd sitter."
    ],
    assemblyEn: [
      "1. Dry-fit top plates. Corner joints with ≥145 mm lap so long and end walls lock.",
      "2. Fasten down into every stud — two fasteners. Double plates where the drawing requires (e.g. under truss seats).",
      "3. Mark nogging height (~1200 mm). Stagger between bays so you can face-nail through the stud.",
      "4. At openings: noggings must not replace headers — they supplement only.",
      "5. Cross-measure again. Hold residual error with temporary braces until wind barrier is on."
    ],
    toolsSv: [
      "Cirkelsåg",
      "Spikpistol",
      "Vinkelhake",
      "Tvingar",
      "Laser"
    ],
    toolsEn: [
      "Circular saw",
      "Framing nailer",
      "Square",
      "Clamps",
      "Laser"
    ],
    pitfallsSv: [
      "Stumskarv i hörn utan omlott → vridning i stomlådan.",
      "Kortlingar i linje genom hela väggen → omöjligt att spika igenom.",
      "Hammarband som inte träffar varje regel → punktlast ner i “tom luft”."
    ],
    pitfallsEn: [
      "Butt joint at corner without lap → racking of the box.",
      "Noggings in one continuous line → cannot face-nail through.",
      "Top plate missing studs → point loads into empty air."
    ],
    proTipsSv:
      "Hammarbandet binder väggarna till en vridstyv låda. Omlotta hörnen och förskjut kortlingarna så de kan spikas igenom.",
    proTipsEn:
      "The top plate makes a torsion box. Lap the corners and stagger noggings so you can nail through.",
    checklistSv: [
      "Kontinuerligt hammarband med hörnomlott",
      "Två fästen i varje regel",
      "Kortlingar förskjutna ~1200 mm",
      "Dubbla plattor där upplag kräver",
      "Kryssmått fortfarande inom tolerans"
    ],
    checklistEn: [
      "Continuous top plate with corner laps",
      "Two fasteners into every stud",
      "Staggered noggings ~1200 mm",
      "Double plates where bearing requires",
      "Diagonals still within tolerance"
    ]
  },
  {
    step: 6,
    key: "trusses",
    titleSv: "6. Takstolar & Takbjälklag",
    titleEn: "6. Roof Trusses & Structural Rafters",
    subtitleSv: "Taket är både last och lyft. Varje fot ska ner i hammarbandet med beslag — inte bara “ligga på”.",
    subtitleEn: "The roof is both load and uplift. Every seat must tie into the top plate with hardware — not just rest on it.",
    specs: [
      {
        labelSv: "Takstolsprofil",
        labelEn: "Rafter Dimension",
        valueSv: "45×195 mm C24 / fackverk cc 600",
        valueEn: "45×195 mm C24 / truss cc 600"
      },
      {
        labelSv: "Beslag",
        labelEn: "Truss Clips",
        valueSv: "Förstärkta vinkelbeslag 90×90×65 båda sidor",
        valueEn: "Heavy angles 90×90×65 both sides"
      },
      {
        labelSv: "Ankarspik",
        labelEn: "Anchor Nails",
        valueSv: "4,0×40 mm · minst 6 st/beslag",
        valueEn: "4.0×40 mm · min 6 per bracket"
      },
      {
        labelSv: "Nocklinje",
        labelEn: "Ridge Line",
        valueSv: "Snörslås för rak nock/rygg",
        valueEn: "Chalked line for straight ridge"
      },
      {
        labelSv: "Upplag",
        labelEn: "Bearing",
        valueSv: "Full anliggning mot hammarband · ej överkantsspik bara",
        valueEn: "Full seat on top plate · not toenails alone"
      }
    ],
    assemblySv: [
      "1. Res gaveltakstolar först. Loda och sträva. Spänn nocksnöre mellan dem.",
      "2. Lyft mellantakstolar cc 600. Justera till snöret. Tillfällig sträva i takfallet.",
      "3. Montera vinkelbeslag på båda sidor om varje fot mot hammarbandet. Ankarspik — inte vanliga trådspik.",
      "4. Vid pulpet/utsprång: samma princip — bärlina/stolpar tar vertikal last, beslag tar lyft.",
      "5. Kontrollera att inga fötter “rider” på kilar utan dokumenterat upplag. Ta bort tillfälliga lyftöglor/strävor enligt ordning."
    ],
    assemblyEn: [
      "1. Erect gable trusses first. Plumb and brace. Pull a ridge string between them.",
      "2. Set intermediates at cc 600. Align to the string. Temporary braces in the roof plane.",
      "3. Fit angle brackets both sides of every seat to the top plate. Anchor nails — not common wire nails.",
      "4. On mono-pitch/overhangs: same rule — beams/posts take gravity, hardware takes uplift.",
      "5. Confirm no foot “rides” on undocumented shims. Remove temporary lift gear in the right order."
    ],
    toolsSv: [
      "Lyft/ställning",
      "Vinkelbeslag + ankarspik",
      "Nocksnöre",
      "Skruvdragare",
      "Fallskydd"
    ],
    toolsEn: [
      "Lift/scaffold",
      "Angle brackets + anchor nails",
      "Ridge string",
      "Driver",
      "Fall protection"
    ],
    pitfallsSv: [
      "Bara tåspik i foten → taket lyfter i storm.",
      "Takstol utan sträva under montage → rasrisk.",
      "Ojämn nock → syns i hela tätskiktet."
    ],
    pitfallsEn: [
      "Toenails alone at the seat → roof lifts in a storm.",
      "Truss without brace during install → collapse risk.",
      "Uneven ridge → shows through the whole covering."
    ],
    proTipsSv:
      "Res gavlarna först, snöra nocken, och förankra varje fot med vinkelbeslag och ankarspik mot vindlyft.",
    proTipsEn:
      "Erect gables first, string the ridge, and tie every seat with angles and anchor nails against uplift.",
    checklistSv: [
      "Gaveltakstolar lodade och strävade",
      "Mellanliggare cc 600 mot nocksnöre",
      "Vinkelbeslag båda sidor med ankarspik",
      "Inga odokumenterade kilar under fötter",
      "Temporära strävor kvar tills vindavstyvning sitter"
    ],
    checklistEn: [
      "Gable trusses plumb and braced",
      "Intermediates cc 600 on ridge string",
      "Angles both sides with anchor nails",
      "No undocumented shims under seats",
      "Temporary braces stay until wind bracing is on"
    ]
  },
  {
    step: 7,
    key: "inspection",
    titleSv: "7. Vindavstyvning & Färdig Stomme",
    titleEn: "7. Wind Bracing & Complete Frame Inspection",
    subtitleSv: "Stommen är klar först när permanent vindavstyvning sitter och fuktkvoten är under gränsen.",
    subtitleEn: "The frame is complete only when permanent wind bracing is on and moisture is below the limit.",
    specs: [
      {
        labelSv: "Vindsträvor",
        labelEn: "Wind Bracing",
        valueSv: "22×95 snedsträvor / hålband 2 mm / skivor",
        valueEn: "22×95 diagonals / 2 mm steel strap / sheathing"
      },
      {
        labelSv: "Total krysstolerans",
        labelEn: "Overall Tolerance",
        valueSv: "< 3 mm över hela stommen",
        valueEn: "< 3 mm across the building"
      },
      {
        labelSv: "Fuktkvot",
        labelEn: "Moisture Content",
        valueSv: "Max 16% vid inbyggnad",
        valueEn: "Max 16% at enclosure"
      },
      {
        labelSv: "Nästa steg",
        labelEn: "Next Phase",
        valueSv: "Utegips/vindduk · underlagstak · stomskydd",
        valueEn: "Exterior sheathing/wrap · roof underlay · weather-in"
      },
      {
        labelSv: "Dokumentation",
        labelEn: "Records",
        valueSv: "Fotografera beslag och upplag före dolda skikt",
        valueEn: "Photo hardware and bearings before cover-up"
      }
    ],
    assemblySv: [
      "1. Montera permanent vindavstyvning (hålband i kryss eller godkänd skiva) enligt ritning — innan tillfälliga strävor tas bort.",
      "2. Gå systematisk rundvandring: syllbultar, jack/upplag, takfotsbeslag, hörnomlott.",
      "3. Fuktmät stickprov i syll, reglar och takstolar. Markera bitar >16% för tork/byte.",
      "4. Fotografera kritiska förband. Fyll checklistan. Först därefter vindskydd och taktäckning.",
      "5. Planera stomskydd (presenning) om väderhotar innan tätskikt."
    ],
    assemblyEn: [
      "1. Install permanent wind bracing (crossed straps or approved sheathing) per drawing — before temporary braces come off.",
      "2. Walk the frame: sill anchors, jack bearings, rafter clips, corner laps.",
      "3. Spot-check moisture in sill, studs and rafters. Flag pieces >16% for dry/replace.",
      "4. Photo critical joints. Complete the checklist. Only then wrap and roof.",
      "5. Stage weather protection if rain threatens before coverings."
    ],
    toolsSv: [
      "Fuktmätare",
      "Momentnyckel",
      "Kamera",
      "Hålband + ankarspik",
      "Checklistan i guiden"
    ],
    toolsEn: [
      "Moisture meter",
      "Torque wrench",
      "Camera",
      "Steel strap + anchor nails",
      "This guide’s checklist"
    ],
    pitfallsSv: [
      "Ta bort tillfälliga strävor för tidigt → stomme slår sig.",
      "Isolera fuktigt virke → mögel bakom ångbroms.",
      "Dölja beslag utan foto → omöjligt att felsöka senare."
    ],
    pitfallsEn: [
      "Removing temporary braces too early → frame drifts.",
      "Insulating wet timber → mould behind the vapour layer.",
      "Covering hardware without photos → hard to debug later."
    ],
    proTipsSv:
      "Permanent vindavstyvning före demontering av tillfälliga stöttor. Fuktkvot ≤16%. Dokumentera förbanden.",
    proTipsEn:
      "Permanent wind bracing before temporary props come off. Moisture ≤16%. Document the joints.",
    checklistSv: [
      "Permanent vindavstyvning monterad",
      "Alla expanderbultar och takbeslag åtdragna",
      "Kryss och lod inom sluttolerans",
      "Fuktkvot ≤16% stickprov",
      "Foto/dokumentation av dolda förband"
    ],
    checklistEn: [
      "Permanent wind bracing installed",
      "All sill anchors and roof clips torqued/nailed",
      "Diagonals and plumb within final tolerance",
      "Moisture ≤16% on spot checks",
      "Photos/records of hidden joints"
    ]
  }
];

/**
 * Timber Framing Walkthrough for Timber/Concrete Combo House (Påbyggnad på betonghus)
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
    assemblySv: [
      "1. Kartlägg murkrön, väggavslut och markplatta — syllen ska följa betongen, aldrig hänga i luften.",
      "2. Rulla EPDM på murkrön och markplatta. Svällband mot vertikala betongändar.",
      "3. Borra för kemankare M12 i murkrön (rätt djup). Rengör hål, injicera massa, sätt gängstång.",
      "4. Montera syll på murkrön, vik vertikal syll på gavelslut, fortsätt marksyll runt tillbyggnad.",
      "5. Dra muttrar med bricka. Kontrollera kontinuitet — ingen avbruten lastväg över öppningen."
    ],
    assemblyEn: [
      "1. Map crowns, wall ends and slab — the sill must follow concrete, never hang in open air.",
      "2. Roll EPDM on crowns and slab. Foam tape on vertical concrete ends.",
      "3. Drill for M12 chemical anchors in the crown. Clean, inject, set studs.",
      "4. Set crown sill, turn vertical sill down the wall ends, continue slab sill around the addition.",
      "5. Torque nuts with washers. Verify continuity — no broken load path across the opening."
    ],
    toolsSv: [
      "Kemankarsats M12",
      "Betongborr",
      "EPDM + svällband",
      "Momentnyckel",
      "Laser"
    ],
    toolsEn: [
      "M12 chemical anchor kit",
      "Masonry drill",
      "EPDM + foam tape",
      "Torque wrench",
      "Laser"
    ],
    pitfallsSv: [
      "Syll som cantileverar över öppning",
      "Kemankare i smutsiga hål",
      "Glömt svällband mot betongände"
    ],
    pitfallsEn: [
      "Sill cantilevering over the opening",
      "Chemical anchors in dirty holes",
      "Missing foam tape on wall ends"
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
    assemblySv: [
      "1. Res bakre hörn på murkrön (2,5 m) och främre hörn från markplatta.",
      "2. Loda. Sätt temporära strävor.",
      "3. Montera anslutningsregel mot betongfasad med svällband och betongskruv cc 400 mm.",
      "4. Kontrollera att träet kan röra sig säsongsvis utan att knäcka fogen."
    ],
    assemblyEn: [
      "1. Erect rear corners on the crown (2.5 m) and front corners from the slab.",
      "2. Plumb. Fit temporary braces.",
      "3. Fit interface studs to the concrete facade with foam tape and concrete screws cc 400 mm.",
      "4. Confirm the joint can move seasonally without cracking the seal."
    ],
    toolsSv: [
      "Betongskruv 7,5×100",
      "Svällband",
      "2 m pass",
      "Strävor"
    ],
    toolsEn: [
      "7.5×100 concrete screws",
      "Foam tape",
      "2 m level",
      "Braces"
    ],
    pitfallsSv: [
      "Stum tätning som inte tål rörelse",
      "Hörn som inte lödats mot lutande betong"
    ],
    pitfallsEn: [
      "Rigid seal that cannot move",
      "Corners not plumbed against sloping concrete"
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
    assemblySv: [
      "1. Märk cc 600 på murkrönssyll och marksyll.",
      "2. Res fullhöjd i fronten under 500 cm-taket (loftzonen).",
      "3. Kapa fallande sidoreg lar från 5,0 m till 2,5 m bakåt.",
      "4. Dubbelreglar vid betongskarv som upplag för loftbalkar."
    ],
    assemblyEn: [
      "1. Mark cc 600 on crown and slab sills.",
      "2. Erect full height at the front under the 500 cm roof (loft zone).",
      "3. Cut sloping side studs from 5.0 m down to 2.5 m at the rear.",
      "4. Double posts at the concrete junction for loft beam seats."
    ],
    toolsSv: [
      "Kappsåg",
      "Laser",
      "Spikpistol",
      "Märksnöre"
    ],
    toolsEn: [
      "Chop saw",
      "Laser",
      "Nailer",
      "Chalk line"
    ],
    pitfallsSv: [
      "Loft tänkt i bakkant där taket är lägst",
      "Saknad dubbelpelare vid balkupplag"
    ],
    pitfallsEn: [
      "Loft planned at the low rear",
      "Missing double posts at beam seats"
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
    assemblySv: [
      "1. Förbered ≥100 mm upplag på 50 cm betongmurkrön med stålplåt.",
      "2. Lyft limträ 90×220 som tvärbalk. Kemankare M12 i upplagen.",
      "3. Montera främre bärlina under 500 cm-taket på bärande frontereglar.",
      "4. Avväxla övre fönster med jack studs — lasten ska ner i bärlinan/stommen."
    ],
    assemblyEn: [
      "1. Prep ≥100 mm bearing on 50 cm concrete crowns with steel plates.",
      "2. Set 90×220 glulam transfer beam. M12 chemical anchors at seats.",
      "3. Install front carrier beam under the 500 cm roof on bearing posts.",
      "4. Header upper windows with jack studs — load must reach the carrier/frame."
    ],
    toolsSv: [
      "Lyft",
      "Kemankare",
      "Stålplåtar",
      "Vinkelbeslag"
    ],
    toolsEn: [
      "Lift",
      "Chemical anchors",
      "Steel plates",
      "Angle brackets"
    ],
    pitfallsSv: [
      "För kort upplag på betong",
      "Balk utan kemankare",
      "Fönsteravväxling som inte når bärlinan"
    ],
    pitfallsEn: [
      "Too little bearing on concrete",
      "Beam without chemical anchors",
      "Window headers that miss the carrier"
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
    assemblySv: [
      "1. Placera 45×220 loftbjälkar cc 600 på bärbalkarna under 500 cm-taket.",
      "2. Säkerställ delvis upplag bakåt på betongmurkrön.",
      "3. Balkskor/ankarspik. Fuktskydd mot betong.",
      "4. Limma/skruva 22 mm golvspån för skivverkan. Omlotta hammarband i hörn."
    ],
    assemblyEn: [
      "1. Set 45×220 loft joists cc 600 on carriers under the 500 cm roof.",
      "2. Ensure partial rear bearing on concrete crowns.",
      "3. Hangers/anchor nails. Moisture break over concrete.",
      "4. Glue/screw 22 mm subfloor for diaphragm. Lap top plates at corners."
    ],
    toolsSv: [
      "Balkskor",
      "Skruvdragare",
      "Golvlim",
      "Fuktskydd"
    ],
    toolsEn: [
      "Joist hangers",
      "Driver",
      "Floor adhesive",
      "Moisture barrier"
    ],
    pitfallsSv: [
      "Loft i bakkant",
      "Skivor utan lim → svag skivverkan"
    ],
    pitfallsEn: [
      "Loft at the rear",
      "Sheets without glue → weak diaphragm"
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
    assemblySv: [
      "1. Montera pulpettakstolar cc 600 från 500 cm front ner mot bakre murkrön.",
      "2. Vinkelbeslag med ankarspik på varje fot.",
      "3. Dragband från tak/loft ner i betongstomme med kemankare.",
      "4. Tillfällig sträva tills vindskydd sitter."
    ],
    assemblyEn: [
      "1. Set mono-pitch rafters cc 600 from 500 cm front down to rear crown.",
      "2. Angle brackets with anchor nails at every seat.",
      "3. Tension straps from roof/loft into concrete with chemical anchors.",
      "4. Temporary bracing until wind wrap is on."
    ],
    toolsSv: [
      "Vinkelbeslag",
      "Dragband",
      "Kemankare",
      "Fallskydd"
    ],
    toolsEn: [
      "Angle brackets",
      "Tension straps",
      "Chemical anchors",
      "Fall protection"
    ],
    pitfallsSv: [
      "Saknade dragband till betong",
      "Bara tåspik i takfot"
    ],
    pitfallsEn: [
      "Missing straps into concrete",
      "Toenails alone at rafter seats"
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
    assemblySv: [
      "1. Inspektera alla trä–betongkontakter: EPDM/svällband måste sitta.",
      "2. Tejpa ångbroms mot rengjord/primad betong.",
      "3. Fuktmät ≤16%. Montera sockelbleck med droppnäsa.",
      "4. Permanent vindstagning innan tillfälliga strävor lossas."
    ],
    assemblyEn: [
      "1. Inspect all timber–concrete contacts: EPDM/foam tape must be present.",
      "2. Tape vapour control to cleaned/primed concrete.",
      "3. Moisture ≤16%. Fit base flashing with drip.",
      "4. Permanent wind bracing before temporary braces come off."
    ],
    toolsSv: [
      "Fuktmätare",
      "Primer/tejp",
      "Sockelbleck",
      "Kamera"
    ],
    toolsEn: [
      "Moisture meter",
      "Primer/tape",
      "Base flashing",
      "Camera"
    ],
    pitfallsSv: [
      "Trä mot rå betong",
      "Isolering före fuktkontroll"
    ],
    pitfallsEn: [
      "Timber on raw concrete",
      "Insulation before moisture check"
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
