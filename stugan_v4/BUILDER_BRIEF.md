# STUGAN V4 — 3D Builder brief

**Status:** måttsatt konceptmodell, inte bygghandling. **Enhet:** mm. Importera `builder_model.json` som geometrisk källa.

## Koordinatsystem
Origo vid husets sydvästra ytterhörn på marknivå. X österut (0–6000), Y norrut (0–6600), Z uppåt. Södra trädäcket ligger Y = −3000 till 0.

## Låsta önskemål
- Byggnad 6000 × 6600; footprint 39,6 m².
- Träregelstomme och **liggande mossgrön träpanel**, inspiration Nordsjö H7.15.53. Röda fönsterbågar, varmvita foder; indragen entré med naturträ.
- Pulpettak **10° från hög västvägg till låg östvägg**, alltså lutning över 6000 mm bredd. Taket skjuter 2000 mm ut söderut över terrassen.
- Glasad öppningsbar vägg mot söder, separat entrédörr, trädäck framför.
- Loft längs västra sidan, privat stängt sovrum norr, öppen gästdel med två bäddar söder; trappa centralt mellan dem med förvaring under.
- Öppet vardagsrum mot öst; kök/badrum i norr.

## Mått och höjdantaganden
| Element | Modellmått | Kommentar |
|---|---:|---|
| Ytterbredd × ytterlängd | 6000 × 6600 | Exklusive utsprång |
| Sydligt takutsprång | 2000 | Projektera balk/stolpar; inte okontrollerad konsol |
| Trädäck | 6000 × 3000 | 1000 mm utanför takutsprånget |
| Taklutning | 10° | Fall över X-axeln |
| Västra takfotens Z | 6400 | Preliminär från mark |
| Östra takfotens Z | ca 5342 | 6400 − 6000 tan(10°) |
| Takuppbyggnad | 400 | Preliminärt |
| Befintlig plattas ovansida | +200 | **Antagande – mät på plats** |
| Luftutrymme | 400 | **Endast geometri, fuktsäkring ej löst** |
| Färdigt golv | +950 | Preliminärt; höjd kan behöva ändras |
| Loftgolv | +3650 | Våningshöjd 2700 från färdigt bottenplan |
| Loftbjälklag | 300 | Preliminärt |
| Loftzon brutto | 3500 × 6600 | 23,1 m² före trapphål/väggar |
| Master-zon | 3500 × 2200 | Norr, brutto |
| Trappzon | 3500 × 2200 | Mitten; ej färdig trappgeometri |
| Gästzon | 3500 × 2200 | Söder, brutto |

**Viktig höjdkontroll:** Vid västtakfoten +6400 och preliminär takkonstruktion 400 fås invändig undersida ca +6000 vid väst. Över loftgolv +3650 är det då ca 2350 mm fri höjd vid väst, fallande till ca 1730 mm vid loftzonens östra kant (x=3500). Det är därför viktigt att lägga sängar och gångstråk mot väst. Exakta invändiga mått varierar med takdetaljer.

## Trappa: designuppdrag till Builder
Lös en verklig trappa med ankomst i loftets mittzon, **inte en symbolisk stege**. Våningshöjd 2700 mm ger som räkneexempel 16 sättsteg × 168,75 mm. Vid 250 mm plansteg behövs ca 3750 mm horisontell gånglinje för en rak trappa (15 plansteg), vilket inte ryms i den föreslagna mittzonen på 2200 mm utan att ändra planlösningen. Testa L- eller U-trappa med korrekt vilplan, fri höjd, räcke och öppning; om det inte ryms, omfördela master/gästytor eller loftdjup. Prioritera säker, bekväm trappa framför maximal loftyta.

## Sydfasad
Separat dörr preliminärt x=350–1250, stort öppningsbart glasparti x=1550–5550, båda från bottenvåningens färdiga golv. Behåll bärande sidopartier och projektera balk över öppningar. Indragen entré ska modelleras som ett särskilt väderskyddat naturträparti, inte automatiskt som indragning av hela glasfasaden.

## Grund
Befintlig betongplatta med äldre fuktskadad byggnad. Modellera platta, upphöjt isolerat träbjälklag och luftutrymme separat, men märk som **icke verifierad konstruktion**. Ingen slutsats att stillastående luft håller fukt borta. Kräver skadeutredning, konstruktionskontroll och fuktsäkerhetsprojektering.

## Builder-agentens arbetsordning
1. Skapa massmodell, korrekt kompass och takfall väst→öst.
2. Skapa tak med 2000 mm utsprång över söderterrassen; testa stolpburet alternativ.
3. Lägg in platta, luftutrymme och isolerat golv som separata lager.
4. Lägg in öppningsbart söderglas, separat entré och naturträ i entrén.
5. Modellera loftet och lös trappans riktiga geometri före fasta sovrumsväggar.
6. Placera master i norr och två gästsängar i söder, med säkert räcke mot öppet vardagsrum.
7. Generera bottenplan, loftplan, tvärsnitt väst–öst, längdsnitt syd–nord och fyra fasader.
8. Markera alla okända och konstruktionskritiska mått i modellen; presentera dem aldrig som verifierade.

## Referensbilder
Använd användarens uppladdade bilder som stilreferenser: svart trästuga för den indragna naturträentrén och det generösa taksprånget; grön stuga för mossgrön kulör och röda/ljusa snickerier. **Den slutliga modellen ska ha liggande panel**, inte den stående panelen i svart referensbild.
