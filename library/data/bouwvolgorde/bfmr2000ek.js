/**
 * bfmr2000ek.js — Bouwvolgorde-sjabloon voor machinetype BFMR2000EK (Mix Recycler).
 * Registreert zich in het globale BFT_BOUWVOLGORDE-register. Eén bestand per
 * machinetype; de tool BFT_Bouwvolgordelijst.html kiest het sjabloon op
 * basis van project.machineType.
 *
 * Structuur:
 *   BFT_BOUWVOLGORDE['<machineType>'] = {
 *     titel, machineType,
 *     fasen: [{ id, titel, items:[{ id, desc, ref? }] }],
 *     referenties: { elektro:[], hydro:[], bouten:[], knoppen:[] }  // gevuld in stap 3
 *   }
 *
 * ref-waarden op een stap koppelen naar een referentieblok ('hydro'|'elektro'|'bouten'|'knoppen').
 */
(function (global) {
  var REG = global.BFT_BOUWVOLGORDE = global.BFT_BOUWVOLGORDE || {};

  REG['BFMR2000EK'] = {
    titel: 'Mix Recycler BFMR2000EK',
    machineType: 'BFMR2000EK',
    fasen: [
      { id: 1, titel: 'Bovenbak', items: [
        { id: '1-01', desc: '2x mcm centrifugaal pomp NEDOX GECOAT (2x 12" waaier)' },
        { id: '1-02', desc: 'Opbouw motor/pomp assembly 2x' },
        { id: '1-03', desc: 'Plaatsen van motorpomp assembly op bovenbakframe (bouten wel monteren maar nog niet aandraaien)' },
        { id: '1-04', desc: 'Aanzuigbochten buitenzijde / vlinderklep' },
        { id: '1-05', desc: 'Pomp / motor frame aansluiten op aanzuigbocht en dan de bouten van het frame vast zetten' },
        { id: '1-06', desc: '3 losse hydrauliek ventielen monteren', ref: 'hydro' },
        { id: '1-07', desc: 'Kabelgoot monteren (1,5 m lengte)' },
        { id: '1-08', desc: 'Gereed maken hydrauliekslangen in tank + 3 losse ventiel (op grond te monteren)', ref: 'hydro' },
        { id: '1-09', desc: '4x aanzuigleiding buigen volgens tekening + 3 retourleiding maken' },
        { id: '1-10', desc: 'Elektromotor van hydrauliek pompen demonteren van lantaarnstuk' },
        { id: '1-11', desc: 'Hydroliektank opbouwen (pompset, retourfilter, schotkoppelingen, vuldop, kijkglas)' },
        { id: '1-12', desc: 'Hydrauliektank op bovenframe plaatsen' },
        { id: '1-13', desc: 'Hydrauliekslangen van Gele / blauwe / groene hefcilinders monteren' },
        { id: '1-14', desc: 'Elektromotor van hydrauliek pompen weer monteren op lantaarnstuk' },
        { id: '1-15', desc: 'Geleide wielen in steunen assembleren' },
        { id: '1-16', desc: 'PE lassen aanzuig bocht en leiding in bovenbak' },
        { id: '1-17', desc: 'Monteren PE leidingen in bovenbak' },
        { id: '1-18', desc: 'Geleide wielen monteren' },
        { id: '1-19', desc: 'Hoekje van hefcilinder onderste montage beugel afslijpen — anders komt hij tegen de bak in de onderbak aan' },
        { id: '1-20', desc: 'Hefcilinders op bovenbak monteren (last ventiel naar buiten gericht)' },
        { id: '1-21', desc: 'RVS gezette hoek kitten op rand onder uitgang shakerdekken' },
        { id: '1-22', desc: 'RVS Strip maken/monteren t.b.v. kunststof kist 30x6' },
        { id: '1-23', desc: 'Kunststof kist monteren t.b.v. blokkeerpallen shakerdekken' }
      ]},
      { id: 2, titel: 'Onderbak', items: [
        { id: '2-01', desc: 'Aftapkraan aan onderkant in aanzuigbak monteren' },
        { id: '2-02', desc: 'Gespoten bouten uit onderbak halen, draad controleren en optappen' },
        { id: '2-03', desc: 'RVS blokkeerpinnen monteren voor verzonken koker' },
        { id: '2-04', desc: 'Bovenbak op onderbak plaatsen en op verzonken kokers laten zakken' },
        { id: '2-05', desc: 'Aftapkranen + bocht monteren in bovenbak' },
        { id: '2-06', desc: 'Niveausensor in onderbak monteren' },
        { id: '2-07', desc: 'Mcm centrifugaalpomp NEDOX gecoat 5x6x14 met 12" impeller monteren' },
        { id: '2-08', desc: 'Frequentieregelaar monteren' },
        { id: '2-09', desc: '75 kW elektromotor monteren op motor/pomp voet' },
        { id: '2-10', desc: 'Bandkoppeling monteren + beschermkap' },
        { id: '2-11', desc: 'Frequentieregelaar en motor bekabelen — let op EMC wartels en kabels, zowel in motor als frequentieregelaar!' },
        { id: '2-12', desc: 'Frequentieregelaar RVS beschermkap monteren op lucht in- en uitlaat zijde' },
        { id: '2-13', desc: 'Vlinderklep aanzuig pomp met flens naar victaulic monteren' },
        { id: '2-14', desc: 'Aanzuig T-stuk monteren en open zijde afdoppen met eindkap' },
        { id: '2-15', desc: 'Compressor kabel verlengen' },
        { id: '2-16', desc: 'Leiding in compressor vervangen voor luchtslang' },
        { id: '2-17', desc: 'Compressor met pijpklemmen ophangen' },
        { id: '2-18', desc: 'Luchtventielblok assembleren' },
        { id: '2-19', desc: 'Luchtventielblok + filter + sensor monteren' },
        { id: '2-20', desc: 'Besturingskast monteren' },
        { id: '2-21', desc: 'Steun voor powerlock kabels monteren' },
        { id: '2-22', desc: 'Powerlock kabels/stekkers monteren' },
        { id: '2-23', desc: 'Nozzelleiding PE-lassen (kan tussendoor met wachttijden)' },
        { id: '2-24', desc: 'Eductors monteren op nozzelleiding' },
        { id: '2-25', desc: 'Nozzle leiding in binnenzijde onderbak monteren' },
        { id: '2-26', desc: 'RVS slijt plaat monteren (… x …)' },
        { id: '2-27', desc: 'Persleiding PE-lassen (kan tussendoor met wachttijden)' },
        { id: '2-28', desc: 'Hogedrukspuit aanpassen — elektrokastje vervangen voor andere zonder knop' },
        { id: '2-29', desc: 'Hogedrukspuit monteren' },
        { id: '2-30', desc: 'Haspel van hogedrukspuit monteren' },
        { id: '2-31', desc: 'Slang tussen pomp en haspel zelf maken van hydrauliekslang' },
        { id: '2-32', desc: 'Werklamp kabel verlengen' },
        { id: '2-33', desc: 'Werklamp monteren' },
        { id: '2-34', desc: 'Waterfilter HD-spuit assembleren' },
        { id: '2-35', desc: 'Waterfilter HD-spuit monteren' },
        { id: '2-36', desc: 'T-stuk op perspomp monteren' },
        { id: '2-37', desc: 'Transferleiding met vlinderklep monteren' },
        { id: '2-38', desc: 'Recirculatieleiding incl. vlinderklep en 4" Perrot-aansluiting monteren' },
        { id: '2-39', desc: 'RVS buisjes hogedruk lans monteren' }
      ]},
      { id: 3, titel: 'Kraan & Powerpack', items: [
        { id: '3-01', desc: 'Scheepsdeur assembleren (opening rubber bovenzijde deur)' },
        { id: '3-02', desc: 'Scheepsdeur monteren / afstellen' },
        { id: '3-03', desc: 'Stootrubber aan zandkant op zijkant container maken (4x 680 mm)' },
        { id: '3-04', desc: 'Antislip mat op bovenkant kitten' },
        { id: '3-05', desc: 'Alle kabels in grote besturingskast aansluiten' },
        { id: '3-06', desc: 'Alle kabels in kleine besturingskast aansluiten' },
        { id: '3-07', desc: 'Hydrauliek powerpack monteren, kabels aansluiten' },
        { id: '3-08', desc: 'Ontluchtingsfilter van powerpack aanpassen — leiding 12 mm × 0,4 m + beluchtingsfilter' },
        { id: '3-09', desc: 'Hydrauliek filter onder handbediening van kraan monteren' },
        { id: '3-10', desc: 'Maxilift 330 kraan op kraanvoet monteren' },
        { id: '3-11', desc: 'Handbediening van kraan monteren, slangen aansluiten' },
        { id: '3-12', desc: 'Slangen van tussen powerpack en kraan persen en monteren' },
        { id: '3-13', desc: 'Slangen tussen handbediening en kraan goed leggen zodat er geen spanning in komt' },
        { id: '3-14', desc: 'Lamp kraan in bedrijf monteren' },
        { id: '3-15', desc: 'Maxilift kraan bekabelen voeding en lampen' },
        { id: '3-16', desc: 'Controleren werkdruk kraan en powerpack, testen of handbedieningsknop goed afgesteld is' },
        { id: '3-17', desc: 'RVS beschermkap monteren over hydraulische powerpack' },
        { id: '3-18', desc: 'PE slijtplaten op transportstand kraan monteren' },
        { id: '3-19', desc: 'Vlinderklep pneumatisch en PE leidingen watervullen monteren (6" Perrot-koppeling)' },
        { id: '3-20', desc: 'Waterfilter + steun monteren' },
        { id: '3-21', desc: 'Uitstortkap RVS monteren aan binnenzijde van de tank (watervullen)' },
        { id: '3-22', desc: 'PE leidingen monteren voor venturi leiding' },
        { id: '3-23', desc: 'Hoppertafel, Venturi en uitstroomstuk monteren' },
        { id: '3-24', desc: 'Uitstortkap RVS monteren aan binnenzijde van de tank' },
        { id: '3-25', desc: 'Vlinderklep tussen hoppertafel en venturi pneumatisch monteren, aanzuigslang hangen' },
        { id: '3-26', desc: 'Doorzichtige aanzuigslang 1½" monteren — 5 m met 1 zijde camlock, andere zijde open' },
        { id: '3-27', desc: 'Deksel voor vergroten hoppertafel monteren — 4 scharnieren, uitvulplaatjes van kunststof' },
        { id: '3-28', desc: 'Monteren scharnieren/kokers en ketting t.b.v. afscherming bigbags' },
        { id: '3-29', desc: 'Monteren van slagtrekker voor shakerdekken' }
      ]},
      { id: 4, titel: 'Bordessen & Trap', items: [
        { id: '4-01', desc: 'Bordessen assembleren (roostervloer, trapwielen en geleiding, steunen voor PE-leidingen)' },
        { id: '4-02', desc: 'Trap assembleren' },
        { id: '4-03', desc: 'Trap monteren' },
        { id: '4-04', desc: 'Zandvangkap aan bordes monteren' },
        { id: '4-05', desc: 'Bordessen monteren' },
        { id: '4-06', desc: 'Trap blokkering monteren op bordes' },
        { id: '4-07', desc: 'Hydrauliek-cilinders bordes monteren — let op! Harmonicahoes monteren', ref: 'hydro' },
        { id: '4-08', desc: 'Smeernippel aan scharnierende delen bordes' },
        { id: '4-09', desc: 'Smeren vetpunten' },
        { id: '4-10', desc: 'RVS sample tafel lassen/monteren' }
      ]},
      { id: 5, titel: 'Shaker bakken', items: [
        { id: '5-01', desc: 'Hydrauliekcilinder aan shakerframe monteren' },
        { id: '5-02', desc: 'Frame shakerdekken monteren op bovenbak' },
        { id: '5-03', desc: 'RVS kap monteren aan frame shale shaker' },
        { id: '5-04', desc: 'Hydrauliekslangen maken voor frame + bordes (grote ventielblok)', ref: 'hydro' },
        { id: '5-05', desc: 'Hydrauliekslangen shaker-frame monteren', ref: 'hydro' },
        { id: '5-06', desc: 'Trilmotoren afstellen (mud shakers 80%, shale shaker 85%)' },
        { id: '5-07', desc: 'Assemblage shakerdekken 3x (slijtframes, PE-achterplaat, trilmotors, zeefdekken)' },
        { id: '5-08', desc: 'Shakerdekken monteren op frames (veren eronder)' },
        { id: '5-09', desc: 'Rubber flap monteren met RVS-strip — rubber flap L = 50 cm' },
        { id: '5-10', desc: 'Blokeerpennen assembleren 12x — let op 3 verschillende lengtes' },
        { id: '5-11', desc: 'PE-leidingen persleiding recyclingpomp 1 lassen' },
        { id: '5-12', desc: 'PE-leidingen persleiding recyclingpomp 2 lassen' },
        { id: '5-13', desc: 'RVS uitstroombocht voor onder aan PE-leiding lassen/monteren' },
        { id: '5-14', desc: 'Zeefdekken pas monteren als machine afgemonteerd is en klaar is om te testen' },
        { id: '5-15', desc: 'Bij de MUD Cleaners (2x) een RVS hoeklijn frame 20×20×3 monteren vóórdat de wiggington wordt gemonteerd' }
      ]},
      { id: 6, titel: 'Bovenbalk & Besturingskast', items: [
        { id: '6-01', desc: 'Bovenbalk assembleren' },
        { id: '6-02', desc: 'Kabelgoot monteren (bovenbalk)' },
        { id: '6-03', desc: 'Kleine besturingskast monteren' },
        { id: '6-04', desc: 'Hydrauliek ventielenblok monteren + kabels naar kleine besturingskast aansluiten' },
        { id: '6-05', desc: 'Werklampen kabel verlengen', ref: 'elektro' },
        { id: '6-06', desc: 'Werklampen assembleren' },
        { id: '6-07', desc: 'Werklampen + houders monteren' },
        { id: '6-08', desc: 'Bovenbalk monteren op bovenbak' },
        { id: '6-09', desc: 'Trilmotoren bekabelen en aansluiten' },
        { id: '6-10', desc: 'Hydrauliekslangen naar bordes-cilinders monteren' },
        { id: '6-11', desc: 'Kabelrups monteren op boven/onderbak (met gesneden RVS plaatjes indien nodig)' },
        { id: '6-12', desc: 'Kabels van boven naar onderbak monteren' },
        { id: '6-13', desc: 'Kabels aansluiten' },
        { id: '6-14', desc: 'PE instortleiding lassen 2x' },
        { id: '6-15', desc: 'Aanboorzadel met aftapkraantje monteren in instortleiding van pitpomp' },
        { id: '6-16', desc: 'Instortbak assembleren (PE-platen, vlinderkleppen, deksel met vloeibare pakking)' },
        { id: '6-17', desc: 'Rubber flap voor uitgang van de instortbak monteren' },
        { id: '6-18', desc: 'Instortbak monteren aan bovenbalk' },
        { id: '6-19', desc: 'Pneumatiek aansluiten ventielblok naar vlinderkleppen' },
        { id: '6-20', desc: 'RVS kast monteren t.b.v. afstandsbediening Maxilift kraan' },
        { id: '6-21', desc: 'Kabel t.b.v. laden Maxilift afstandsbediening monteren/aansluiten' }
      ]},
      { id: 7, titel: 'Manifolds & Hydrocyclonen', items: [
        { id: '7-01', desc: 'Manifolds assembleren — 2x manifold PE lassen' },
        { id: '7-02', desc: '5" eindkap een 3/8 draadgat in boren/tappen' },
        { id: '7-03', desc: 'Let op: bij monteren op de grond vast rekening houden dat hydrocyclonen haaks op manifold zitten' },
        { id: '7-04', desc: 'Monteren 8x hydrocycloon + 5" eindkap' },
        { id: '7-05', desc: 'Manifolds op bovenbalk monteren' },
        { id: '7-06', desc: 'Manometer met slang op eindkap monteren' }
      ]},
      { id: 8, titel: 'Testfase & Afwerking', items: [
        { id: '8-01', desc: 'Voorbereiding testfase — controleren of alle onderdelen gemonteerd zijn' },
        { id: '8-02', desc: 'Hydrauliek afvullen / ontluchten' },
        { id: '8-03', desc: 'Elektrokast In/Out testen' },
        { id: '8-04', desc: 'Hydrauliek afstellen' },
        { id: '8-05', desc: 'Eindaanslag bordes in ingevouwen stand monteren' },
        { id: '8-06', desc: 'Beschermkap kabelrups monteren' },
        { id: '8-07', desc: 'Beschermkap elektromotor powerpack monteren' },
        { id: '8-08', desc: 'Beschermkap grote hydrauliekventiel monteren' },
        { id: '8-09', desc: 'Recycler test draaien' },
        { id: '8-10', desc: 'Losse werkzaamheden afhandelen' },
        { id: '8-11', desc: 'Inlaatstuk assembleren waar pitpomp binnenkomt' },
        { id: '8-12', desc: 'Bakje afstandsbediening vastkitten' },
        { id: '8-13', desc: 'Beugeltje kabel afstandsbediening vastkitten' },
        { id: '8-14', desc: 'Stickers en labels + typeplaatje monteren' }
      ]}
    ],
    referenties: {
      elektro: [
        {
          "benaming": "van kleine kast naar grote kast",
          "soort": "80x0,75",
          "lengte_m": 9,
          "kleur": "nummer codering",
          "artnr": "2573868",
          "aantal": "1x"
        },
        {
          "benaming": "van kleine kast naar grote kast",
          "soort": "36x1",
          "lengte_m": 9,
          "kleur": "nummer codering",
          "artnr": "2572251",
          "aantal": "1x"
        },
        {
          "benaming": "van kleine kast naar grote kast",
          "soort": "4x4",
          "lengte_m": 10,
          "kleur": "bruin, zwart, grijs en aarde",
          "artnr": "2578918",
          "aantal": "1x"
        },
        {
          "benaming": "van powerpack naar kleine kast",
          "soort": "4x4",
          "lengte_m": 10,
          "kleur": "bruin, zwart, grijs en aarde",
          "artnr": "2578918",
          "aantal": "1x"
        },
        {
          "benaming": "van powerpack kraan naar grote kast",
          "soort": "4x2,5",
          "lengte_m": 2,
          "kleur": "bruin, zwart, grijs en aarde",
          "artnr": "2572348",
          "aantal": "1x"
        },
        {
          "benaming": "van motor recycling 1 naar kleine kast",
          "soort": "5x25",
          "lengte_m": 4.5,
          "kleur": "bruin, zwart, grijs, blauw en aarde",
          "artnr": "4603378",
          "aantal": "1x"
        },
        {
          "benaming": "van motor recycling 2 naar kleine kast",
          "soort": "5x25",
          "lengte_m": 6.7,
          "kleur": "bruin, zwart, grijs, blauw en aarde",
          "artnr": "4603378",
          "aantal": "1x"
        },
        {
          "benaming": "van kleine kast naar grote kast",
          "soort": "5x25",
          "lengte_m": 7.2,
          "kleur": "bruin, zwart, grijs, blauw en aarde",
          "artnr": "4603378",
          "aantal": "2x"
        },
        {
          "benaming": "van transfer motor naar feqruentie regelaar",
          "soort": "3x35+3x6",
          "lengte_m": 1.75,
          "kleur": "3x35 bruin, zwart, grijs, 3x6 aarde",
          "artnr": "103901751 (eltink)",
          "aantal": "1x"
        },
        {
          "benaming": "van frequentie regelaar naar grote kast",
          "soort": "3x35+3x6",
          "lengte_m": 5.7,
          "kleur": "3x35 bruin, zwart, grijs, 3x6 aarde",
          "artnr": "4603378",
          "aantal": "1x"
        },
        {
          "benaming": "van frequentie regelaar naar grote kast",
          "soort": "12x0,75",
          "lengte_m": 6,
          "kleur": "nummer codering",
          "artnr": "9003707",
          "aantal": "1x"
        },
        {
          "benaming": "werklamp bij shale shaker",
          "soort": "3x0,75",
          "lengte_m": 5,
          "kleur": "bruin, blauw, aarde",
          "artnr": "8719765",
          "aantal": "1x"
        },
        {
          "benaming": "werklamp bij mud shaker 1",
          "soort": "3x0,75",
          "lengte_m": 7.5,
          "kleur": "bruin, blauw, aarde",
          "artnr": "8719765",
          "aantal": "1x"
        },
        {
          "benaming": "werklamp bij mud shaker 2",
          "soort": "3x0,75",
          "lengte_m": 9.5,
          "kleur": "bruin, blauw, aarde",
          "artnr": "8719765",
          "aantal": "1x"
        },
        {
          "benaming": "powerpack niveau/warmte sensor",
          "soort": "4x0,5",
          "lengte_m": 10,
          "kleur": "nummer codering",
          "artnr": "9002895",
          "aantal": "1x"
        },
        {
          "benaming": "lamp op de onderbak",
          "soort": "3x0,75",
          "lengte_m": 4,
          "kleur": "bruin, blauw, aarde",
          "artnr": "8719765",
          "aantal": "1x"
        },
        {
          "benaming": "shale shaker trilmotoren",
          "soort": "4x1",
          "lengte_m": 5.5,
          "kleur": "bruin, zwart, grijs en aarde",
          "artnr": "6328017",
          "aantal": "2x"
        },
        {
          "benaming": "mud shaker 1 trilmotoren",
          "soort": "4x1",
          "lengte_m": 7,
          "kleur": "bruin, zwart, grijs en aarde",
          "artnr": "6328017",
          "aantal": "2x"
        },
        {
          "benaming": "mud shaker 2 trilmotoren",
          "soort": "4x1",
          "lengte_m": 8.5,
          "kleur": "bruin, zwart, grijs en aarde",
          "artnr": "6328017",
          "aantal": "2x"
        },
        {
          "benaming": "powerlock kabel L1",
          "soort": "1x120",
          "lengte_m": 4.1,
          "kleur": "",
          "artnr": "A2210-100 (powerreel)",
          "aantal": "1x"
        },
        {
          "benaming": "powerlock kabel L2",
          "soort": "1x120",
          "lengte_m": 3.9,
          "kleur": "",
          "artnr": "A2210-100 (powerreel)",
          "aantal": "1x"
        },
        {
          "benaming": "powerlock kabel L3",
          "soort": "1x120",
          "lengte_m": 3.7,
          "kleur": "",
          "artnr": "A2210-100 (powerreel)",
          "aantal": "1x"
        },
        {
          "benaming": "powerlock kabel N",
          "soort": "1x120",
          "lengte_m": 3.5,
          "kleur": "",
          "artnr": "A2210-100 (powerreel)",
          "aantal": "1x"
        },
        {
          "benaming": "powerlock kabel aarde",
          "soort": "1x120",
          "lengte_m": 3.3,
          "kleur": "",
          "artnr": "A2210-100 (powerreel)",
          "aantal": "1x"
        },
        {
          "benaming": "tbv kraan",
          "soort": "7x1,5",
          "lengte_m": 7,
          "kleur": "nummer codering",
          "artnr": "3776036",
          "aantal": "1x"
        },
        {
          "benaming": "compressor",
          "soort": "3x1,5",
          "lengte_m": 7,
          "kleur": "bruin, blauw, aarde",
          "artnr": "3776168",
          "aantal": "1x"
        },
        {
          "benaming": "hogedruk reiniger",
          "soort": "4x2,5",
          "lengte_m": 7,
          "kleur": "bruin, zwart, grijs, en aarde",
          "artnr": "2572348",
          "aantal": "1x"
        },
        {
          "benaming": "hogedruk reiniger sensor",
          "soort": "3x0,75",
          "lengte_m": 8,
          "kleur": "bruin, blauw, aarde",
          "artnr": "8719765",
          "aantal": "1x"
        }
      ],
      hydro: [
        {
          "nr": 1,
          "loc": "Persslangen in hydrauliektank",
          "aantal": "4x",
          "slang": "1/2\"",
          "koppeling": "15L 180°+ 180°",
          "lengte_mm": 550,
          "extra": ""
        },
        {
          "nr": 2,
          "loc": "Persslang van schotkoppeling tank naar ventielblok",
          "aantal": "1x",
          "slang": "1/2\"",
          "koppeling": "15L 180°+ 90°",
          "lengte_mm": 3500,
          "extra": ""
        },
        {
          "nr": 3,
          "loc": "Persslang van schotkoppeling tank naar ventiel Geel",
          "aantal": "1x",
          "slang": "1/2\"",
          "koppeling": "15L 180°+ 90°",
          "lengte_mm": 3465,
          "extra": ""
        },
        {
          "nr": 4,
          "loc": "persslang van schotkoppeling tank naar ventiel Blauw",
          "aantal": "1x",
          "slang": "1/2\"",
          "koppeling": "15L 180°+ 90°",
          "lengte_mm": 3330,
          "extra": ""
        },
        {
          "nr": 5,
          "loc": "persslang van schotkoppeling tank naar ventiel Groen",
          "aantal": "1x",
          "slang": "1/2\"",
          "koppeling": "15L 180°+ 90°",
          "lengte_mm": 3330,
          "extra": ""
        },
        {
          "nr": 6,
          "loc": "Retourslang van ventielblok naar T-stuk",
          "aantal": "1x",
          "slang": "5/8\"",
          "koppeling": "18L 180°+ 90°",
          "lengte_mm": 1120,
          "extra": ""
        },
        {
          "nr": 7,
          "loc": "Retourslang van T-stuk naar retourfilter in tank",
          "aantal": "1x",
          "slang": "3/4\"",
          "koppeling": "22L 180°+ 45°",
          "lengte_mm": 2080,
          "extra": ""
        },
        {
          "nr": 8,
          "loc": "A op ventiel Geel naar bovenste aansluiting Cilinder Geel",
          "aantal": "1x",
          "slang": "1/2\"",
          "koppeling": "15L 180°+ 90°",
          "lengte_mm": 860,
          "extra": ""
        },
        {
          "nr": 9,
          "loc": "B op ventiel Geel naar onderste aansluiting Cilinder Geel",
          "aantal": "1x",
          "slang": "1/2\"",
          "koppeling": "15L 180°+ 90°",
          "lengte_mm": 750,
          "extra": ""
        },
        {
          "nr": 10,
          "loc": "A op ventiel Groen naar bovenste aansluiting Cilinder Groen",
          "aantal": "1x",
          "slang": "1/2\"",
          "koppeling": "15L 180°+ 90°",
          "lengte_mm": 6000,
          "extra": ""
        },
        {
          "nr": 11,
          "loc": "B op ventiel Groen naar onderste aansluiting Cilinder Groen",
          "aantal": "1x",
          "slang": "1/2\"",
          "koppeling": "15L 180°+ 90°",
          "lengte_mm": 5900,
          "extra": ""
        },
        {
          "nr": 12,
          "loc": "A op ventiel Blauw naar bovenste aansluiting Cilinder Blauw",
          "aantal": "1x",
          "slang": "1/2\"",
          "koppeling": "15L 180°+ 90°",
          "lengte_mm": 7400,
          "extra": ""
        },
        {
          "nr": 13,
          "loc": "B op ventiel Blauw naar onderste aansluiting Cilinder Blauw",
          "aantal": "1x",
          "slang": "1/2\"",
          "koppeling": "15L 180°+ 90°",
          "lengte_mm": 7300,
          "extra": ""
        },
        {
          "nr": 14,
          "loc": "A op ventiel Rood naar bovenste aansluiting Cilinder Rood",
          "aantal": "1x",
          "slang": "1/2\"",
          "koppeling": "15L 180°+ 90°",
          "lengte_mm": 3100,
          "extra": ""
        },
        {
          "nr": 15,
          "loc": "B op ventiel Rood naar onderste aansluiting Cilinder Rood",
          "aantal": "1x",
          "slang": "1/2\"",
          "koppeling": "15L 180°+ 90°",
          "lengte_mm": 2990,
          "extra": ""
        },
        {
          "nr": 16,
          "loc": "Shale shaker ventiel  A & B naar T-stuk",
          "aantal": "2x",
          "slang": "5/16\"",
          "koppeling": "10L 180°+ 180°",
          "lengte_mm": 6400,
          "extra": "1 mm gesmoord bij uitgang ventiel"
        },
        {
          "nr": 17,
          "loc": "Shale shaker T-stuk naar Cilinder 1",
          "aantal": "2x",
          "slang": "5/16\"",
          "koppeling": "10L 180°+ 90°",
          "lengte_mm": 600,
          "extra": ""
        },
        {
          "nr": 18,
          "loc": "Shale shaker T-stuk naar Cilinder 2",
          "aantal": "2x",
          "slang": "5/16\"",
          "koppeling": "10L 180°+ 90°",
          "lengte_mm": 1550,
          "extra": ""
        },
        {
          "nr": 19,
          "loc": "Mud shaker 1 ventiel  A & B naar T-stuk",
          "aantal": "2x",
          "slang": "5/16\"",
          "koppeling": "10L 180°+ 180°",
          "lengte_mm": 4570,
          "extra": "1 mm gesmoord bij uitgang ventiel"
        },
        {
          "nr": 20,
          "loc": "Mud shaker 1 T-stuk naar Cilinder 1",
          "aantal": "2x",
          "slang": "5/16\"",
          "koppeling": "10L 180°+ 90°",
          "lengte_mm": 600,
          "extra": ""
        },
        {
          "nr": 21,
          "loc": "Mud shaker 1 T-stuk naar Cilinder 2",
          "aantal": "2x",
          "slang": "5/16\"",
          "koppeling": "10L 180°+ 90°",
          "lengte_mm": 2200,
          "extra": ""
        },
        {
          "nr": 22,
          "loc": "Mud shaker 2 ventiel  A & B naar T-stuk",
          "aantal": "2x",
          "slang": "5/16\"",
          "koppeling": "10L 180°+ 180°",
          "lengte_mm": 2850,
          "extra": "1 mm gesmoord bij uitgang ventiel"
        },
        {
          "nr": 23,
          "loc": "Mud shaker 2 T-stuk naar Cilinder 1",
          "aantal": "2x",
          "slang": "5/16\"",
          "koppeling": "10L 180°+ 90°",
          "lengte_mm": 600,
          "extra": ""
        },
        {
          "nr": 24,
          "loc": "Mud shaker 2 T-stuk naar Cilinder 2",
          "aantal": "2x",
          "slang": "5/16\"",
          "koppeling": "10L 180°+ 90°",
          "lengte_mm": 2200,
          "extra": ""
        },
        {
          "nr": 25,
          "loc": "Bordes ventiel A&B naar T-stuk",
          "aantal": "2x",
          "slang": "3/8\"",
          "koppeling": "12L 180°+ 180°",
          "lengte_mm": 3350,
          "extra": "0,75 mm gesmoord bij uitgang ventiel"
        },
        {
          "nr": 26,
          "loc": "Bordes T-stuk naar cilinder 1 A",
          "aantal": "1x",
          "slang": "3/8\"",
          "koppeling": "12L 180°+ 90°",
          "lengte_mm": 230,
          "extra": ""
        },
        {
          "nr": 27,
          "loc": "Bordes T-stuk naar cilinder 1 B",
          "aantal": "1x",
          "slang": "3/8\"",
          "koppeling": "12L 180°+ 90°",
          "lengte_mm": 570,
          "extra": ""
        },
        {
          "nr": 28,
          "loc": "Bordes T-stuk naar cilinder 2 A",
          "aantal": "1x",
          "slang": "3/8\"",
          "koppeling": "12L 180°+ 90°",
          "lengte_mm": 635,
          "extra": ""
        },
        {
          "nr": 29,
          "loc": "Bordes T-stuk naar cilinder 2 B",
          "aantal": "1x",
          "slang": "3/8\"",
          "koppeling": "12L 180°+ 90°",
          "lengte_mm": 940,
          "extra": ""
        },
        {
          "nr": 30,
          "loc": "Manifold einkap naar manometer",
          "aantal": "2x",
          "slang": "5/16\"",
          "koppeling": "10L 180°+ 90°",
          "lengte_mm": 500,
          "extra": ""
        },
        {
          "nr": 31,
          "loc": "Powerpack naar kraan retourzijde",
          "aantal": "1x",
          "slang": "3/8\"",
          "koppeling": "12L 180°+ 90°",
          "lengte_mm": 5200,
          "extra": ""
        },
        {
          "nr": 32,
          "loc": "Powerpack naar kraan perszijde",
          "aantal": "1x",
          "slang": "3/8\"",
          "koppeling": "12L 180°+ 180°",
          "lengte_mm": 4450,
          "extra": ""
        },
        {
          "nr": 33,
          "loc": "Hogedrukspuit naar haspel",
          "aantal": "1x",
          "slang": "1/2\"",
          "koppeling": "1/2\" bsp 180°+ 90°",
          "lengte_mm": 3400,
          "extra": "LET OP BSP KOPPELING",
          "section": "Water leiding"
        }
      ],
      bouten: [
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Grote hef cilinders",
          "beschrijving": "M16 x 25 10.9 (en bij de gele cillinder hoekje afhalen)",
          "aantal": "16x",
          "ring_borg": "M16 ring 16x + M16 veerring 16x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Motor frames 2x voor de bovenbak",
          "beschrijving": "45 KW motor",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Motor frames 2x voor de bovenbak",
          "beschrijving": "pomp 12'' waaier nedox coating met een flens met 8 bout gaten",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Motor frames 2x voor de bovenbak",
          "beschrijving": "M16 x 70. (motor) (bouten vast maken als pomp/motor uitgelijnd zijn)",
          "aantal": "8x",
          "ring_borg": "M16 ring 8x + M16 veerring 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Motor frames 2x voor de bovenbak",
          "beschrijving": "M16 x 50  (pomp) (bouten vast maken als pomp/motor uitgelijnd zijn)",
          "aantal": "8x",
          "ring_borg": "M16 ring 8x + M16 veerring 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Motor frames 2x voor de bovenbak",
          "beschrijving": "M16 x 35 (bouten los laten zitten tot je de bocht erin hebt hangen)",
          "aantal": "8x",
          "ring_borg": "M16 ring 8x + M16 veerring 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Motor frames 2x voor de bovenbak",
          "beschrijving": "M20x75 (aanzuigleidingen binnen zijde)",
          "aantal": "16x",
          "ring_borg": "M20 ring 16x + M20 veerring 16x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "beschermkap bandkoppeling 2x",
          "beschrijving": "M6x20 zeskant",
          "aantal": "36x",
          "ring_borg": "M6 ring 72x + M6 borgmoer 36x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "beschermkap bandkoppeling 2x",
          "beschrijving": "Bolkop M8 x 20 (voor op de motor frame monteren)",
          "aantal": "8x",
          "ring_borg": "M8 carroring 8x + veerring 8x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Vlinderkleppen/bocht aan pomp 2x voor de bovenbak",
          "beschrijving": "M20 x 60 (vlinderkleppen)",
          "aantal": "8x",
          "ring_borg": "M20 ring 8x + M20 veerring 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Vlinderkleppen/bocht aan pomp 2x voor de bovenbak",
          "beschrijving": "M18 x 80.",
          "aantal": "16x",
          "ring_borg": "M18 ring 32x + M18 veerring 16x + m18 moer 16x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Vlinderkleppen/bocht aan pomp 2x voor de bovenbak",
          "beschrijving": "M20 x 100.",
          "aantal": "8x",
          "ring_borg": "M20 ring 8x + M20 veerring 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "kabelgoot boven de motoren",
          "beschrijving": "M8 x 12 (met blauwe loctite vastzetten)",
          "aantal": "16x",
          "ring_borg": "M8 ring 24x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Geleide wielen 16x",
          "beschrijving": "gedraaide as",
          "aantal": "16x",
          "ring_borg": "seegeerring 32x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Geleide wielen 16x",
          "beschrijving": "M10 x 30  (bouten eerst inzetten voor dat je het wiel erin zet)",
          "aantal": "32x",
          "ring_borg": "M10 ring 32x + M10 borgmoer 32x + M10 carro 32x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Hydrauliek tank",
          "beschrijving": "M12 x 30 zeskant lantaarn aan motor",
          "aantal": "4x",
          "ring_borg": "M12 ring 4x +  M12 veerring 4x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Hydrauliek tank",
          "beschrijving": "M5 x 20 zeskant tankdop",
          "aantal": "6x",
          "ring_borg": "M5 ring 6x + M5 veerring 6x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Hydrauliek tank",
          "beschrijving": "m8 x 20 zeskant deksel",
          "aantal": "14x",
          "ring_borg": "M8 ring 14x + M8 veerring 14x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Hydrauliek tank",
          "beschrijving": "m10 x 30 zeskant filter",
          "aantal": "4x",
          "ring_borg": "M10 ring 4x + M10 veerring 4x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "Hydrauliek tank",
          "beschrijving": "m12 x 20 cillindrische kop tank op frame",
          "aantal": "4x",
          "ring_borg": "M12 ring 4x +  M12 veerring 4x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "bovenbakaanzuig leiding",
          "beschrijving": "M20x75 zeskant allebei de aanzuig pe-leidingen",
          "aantal": "16x",
          "ring_borg": "M16 ring 16x + M16 veerring 16x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "bovenbakaanzuig leiding",
          "beschrijving": "M8x30   Voor de klem aan de beugel te maken",
          "aantal": "1x",
          "ring_borg": "M8 carroring 1x + M8 borgmoer 1x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "bovenbakaanzuig leiding",
          "beschrijving": "M10x30   Voor beugel op te hangen",
          "aantal": "2x",
          "ring_borg": "M10 ring 2x + M10 carroring 2x + M10 borgmoer 2x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBAK",
          "subsectie": "3 losse hydrauliek ventielen",
          "beschrijving": "m6x60 cilindrische kopbout",
          "aantal": "6x",
          "ring_borg": "M6 ring 6x + M6 borgmoer 6x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "VOOR DAT JE DE ONDERBAK ER ONDER ZET DE POMP/MOTOR ERIN ZETTEN",
          "subsectie": "pomp/motor onderbak",
          "beschrijving": "75 KW motor (as 70 mm inkorten)",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "VOOR DAT JE DE ONDERBAK ER ONDER ZET DE POMP/MOTOR ERIN ZETTEN",
          "subsectie": "pomp/motor onderbak",
          "beschrijving": "pomp 12'' waaier nedox coating (as 18 mm inkorten)",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "VOOR DAT JE DE ONDERBAK ER ONDER ZET DE POMP/MOTOR ERIN ZETTEN",
          "subsectie": "pomp/motor onderbak",
          "beschrijving": "M20x90  (motor)  (bouten vast maken als pomp/motor uitgelijnd zijn)",
          "aantal": "4x",
          "ring_borg": "M20 ring 4x + M20 veerring 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "VOOR DAT JE DE ONDERBAK ER ONDER ZET DE POMP/MOTOR ERIN ZETTEN",
          "subsectie": "pomp/motor onderbak",
          "beschrijving": "M16x100 (pomp)  (bouten vast maken als pomp/motor uitgelijnd zijn)",
          "aantal": "4x",
          "ring_borg": "M16 ring 4x + M16 veerring 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "VOOR DAT JE DE ONDERBAK ER ONDER ZET DE POMP/MOTOR ERIN ZETTEN",
          "subsectie": "beschermkap bandkoppeling 2x",
          "beschrijving": "M6x20",
          "aantal": "12x",
          "ring_borg": "M6 ring 24x + M6 borgmoer 12x",
          "type": ""
        },
        {
          "hoofdsectie": "VOOR DAT JE DE ONDERBAK ER ONDER ZET DE POMP/MOTOR ERIN ZETTEN",
          "subsectie": "beschermkap bandkoppeling 2x",
          "beschrijving": "Bolkop M8 x 20 (voor op de motor frame monteren)",
          "aantal": "8x",
          "ring_borg": "M8 carroring 8x + veerring 8x",
          "type": ""
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Bordes trap zijde",
          "beschrijving": "M16x50",
          "aantal": "6x",
          "ring_borg": "M16 ring 6x + M16 veerring 6x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Bordes trap zijde",
          "beschrijving": "M12 x 70  (schanierblokkeering)",
          "aantal": "2x",
          "ring_borg": "M12 moer 4x met blauwe loctite",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Bordes trap zijde",
          "beschrijving": "Cilindrische kop M8 x 30  (tbv leidingbeugel)",
          "aantal": "2x",
          "ring_borg": "M8 ring 2x + M8 borgmoer",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Bordes trap zijde",
          "beschrijving": "M8 x 45 + roosterbeugel   (roosters)",
          "aantal": "28x",
          "ring_borg": "M8 ring 28x + M8 carroring 28x M8 borgmoer 28x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Roosters + opgebouwde trap",
          "beschrijving": "M8x40 (trapgeleiding)",
          "aantal": "8x",
          "ring_borg": "M8 ring 8x + M8 carroring 8x + M8 borgmoer 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Roosters + opgebouwde trap",
          "beschrijving": "M12x60 (kunststofwiel)",
          "aantal": "1x",
          "ring_borg": "M12 ring 1x + M12 carroring 1x + M12 borgmoer 1x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Roosters + opgebouwde trap",
          "beschrijving": "M12x70 (kunststofwiel)",
          "aantal": "1x",
          "ring_borg": "M12 ring 1x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "inbusbouten",
          "beschrijving": "M12 x 25 traptredes",
          "aantal": "36x",
          "ring_borg": "M12 ring 36x + M12 borgmoer 36x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Verzonkenkop bouten",
          "beschrijving": "M6 x 12 kunststofplaatje",
          "aantal": "12x",
          "ring_borg": "",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Verzonkenkop bouten",
          "beschrijving": "M6 x 16 kunststofplaatje",
          "aantal": "12x",
          "ring_borg": "",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Verzonkenkop bouten",
          "beschrijving": "M6 x 30 kunststofplaatje",
          "aantal": "6x",
          "ring_borg": "M6 ring 6x + M6 borgmoer 6x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Bolkop bouten",
          "beschrijving": "M8 x 12 voor de assjes",
          "aantal": "18x",
          "ring_borg": "",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Bordes zonder trap",
          "beschrijving": "M8x45 + roosterbeugel   (roosters)",
          "aantal": "32x",
          "ring_borg": "M8 ring 32x + M8 carroring 32x + M8 borgmoer 32x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Roosters",
          "beschrijving": "M12 x 25.",
          "aantal": "3x",
          "ring_borg": "M12 ring 3x + M12 veerring 3x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "rvs zandkappen kappen",
          "beschrijving": "M6x16 bolkop (onderste kap)",
          "aantal": "22x",
          "ring_borg": "M6 carroring 22x + M6 borgmoer 22x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "rvs zandkappen kappen",
          "beschrijving": "M6x16 bolkop (bovenste kap)",
          "aantal": "20x",
          "ring_borg": "M6 carroring 20x + M6 borgmoer 20x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "rvs zandkappen kappen",
          "beschrijving": "M10x20 bolkop (rvs kap aan bordess)",
          "aantal": "20x",
          "ring_borg": "M10 carroring 20x + M10 borgmoer 20x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "rvs zandkappen kappen",
          "beschrijving": "M10x30 bolkop (rvs kap aan bordess)",
          "aantal": "18x",
          "ring_borg": "M10 carroring 18x + M10 borgmoer 18x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "rvs zandkappen kappen",
          "beschrijving": "M6x25 (strip voor de rubbere hoeklijn onder op de bovenste kap)",
          "aantal": "24x",
          "ring_borg": "M6 carroring 24x + M6 borgmoer 24x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BORDES OPBOUWEN/OPHANGEN",
          "subsectie": "Kunstof trap blokkeringen",
          "beschrijving": "M8 x 40 (voor alle kuststof blokkeeringen/geleidingen van de trap)",
          "aantal": "14x",
          "ring_borg": "M8 ring 28x + M8 veerring 14X",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "Shaker frames",
          "beschrijving": "M20 x 120.  (cillinder bovenzijde)",
          "aantal": "6 x",
          "ring_borg": "M20 ring 12x + M20 borgmoer 6x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "Shaker frames",
          "beschrijving": "M16 x 60. (cillinder aan bovenbak)",
          "aantal": "6 x",
          "ring_borg": "M16 ring 12x + M16 borgmoer 6x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "rvs kap in de shale monteren",
          "beschrijving": "m10x20  (zeskant) rvs kap aan het shakerframe",
          "aantal": "6x",
          "ring_borg": "M10 ring 6x + M10 veerring 6x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "rvs kap in de shale monteren",
          "beschrijving": "M10x25    (zeskant)rvs kap aan het shakerframe rvs kappen aan elkaar",
          "aantal": "3x",
          "ring_borg": "M10 ring 3x + M10 veerring 3x + M10 borgmoer 3x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "rvs kap in de shale monteren",
          "beschrijving": "Shakers 2x brede",
          "aantal": "",
          "ring_borg": "benodigdheden",
          "type": "materiaal"
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "rvs kap in de shale monteren",
          "beschrijving": "Slijt frames",
          "aantal": "6 x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "rvs kap in de shale monteren",
          "beschrijving": "m8 x 25. verzonkenkop",
          "aantal": "96x",
          "ring_borg": "M8 ring 96x + M8 borgmoer 96x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "rvs kap in de shale monteren",
          "beschrijving": "Tril Motoren  80%",
          "aantal": "4x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "rvs kap in de shale monteren",
          "beschrijving": "M20 x 80. zeskant",
          "aantal": "16x",
          "ring_borg": "M20 ring 24x + M20 borgmoer 8x + M20 veerring 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "rvs kap in de shale monteren",
          "beschrijving": "Pe voor plaat achterzijde",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "rvs kap in de shale monteren",
          "beschrijving": "M10 x 25 rvs Bolkop inbus",
          "aantal": "30x",
          "ring_borg": "M10 ring 8x + M10 borgmoer 8x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "rvs kap in de shale monteren",
          "beschrijving": "M20x60",
          "aantal": "4x",
          "ring_borg": "M20 usitring 4x + gele loctite",
          "type": "vezonken"
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "rvs kap in de shale monteren",
          "beschrijving": "M12x40 bolkop inbus rubbere mat",
          "aantal": "12x",
          "ring_borg": "M12 ring 12x + M12 borgmoer 12x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "Kleine shaker",
          "beschrijving": "Trilmotoren 70%",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "Kleine shaker",
          "beschrijving": "M20 x 80",
          "aantal": "8x",
          "ring_borg": "M20 ring 12x + M10 borgmoer 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "Kleine shaker",
          "beschrijving": "Pe slijtplaat",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "Kleine shaker",
          "beschrijving": "Bolkop M10 x 25 rvs",
          "aantal": "16x",
          "ring_borg": "M10 ring 16x + M10 borgmoer 16x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "SHAKERFRAMES EN DE SHAKERS",
          "subsectie": "Kleine shaker",
          "beschrijving": "M12x40",
          "aantal": "6x",
          "ring_borg": "M12 ring 6x + M12 borgmoer 6x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "rvs elektro kast boven",
          "beschrijving": "trillingsdempers 50x30",
          "aantal": "4x",
          "ring_borg": "",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "rvs elektro kast boven",
          "beschrijving": "m10x16 (binne in de kast in de rubber)",
          "aantal": "4x",
          "ring_borg": "M10 ring 4x + M10 veerring 4x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "rvs elektro kast boven",
          "beschrijving": "m10x20 (buiten kant van de kast in de rubber)",
          "aantal": "4x",
          "ring_borg": "M10 ring 4x + M10 veerring 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "rvs kastje voor kraan afstandbediening",
          "beschrijving": "M8x20",
          "aantal": "2x",
          "ring_borg": "M8 ring 2x + M8 veerring 2x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "rvs kastje voor kraan afstandbediening",
          "beschrijving": "M12 kabelwartel",
          "aantal": "1x",
          "ring_borg": "",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Boven balk",
          "beschrijving": "M6 x 16. (klemen kabelgoot)",
          "aantal": "16x",
          "ring_borg": "M6 ring 16X + M6 veerring 16x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Instortbak",
          "beschrijving": "M12 x 25. bolkop (voor gele ruberen flapen en pe achterplaat)",
          "aantal": "14x",
          "ring_borg": "M12 ring 14x + M12 borgmoer 14x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Instortbak",
          "beschrijving": "M10 x 25. voor deksel",
          "aantal": "10x",
          "ring_borg": "M10 ring 10x + M10 veerring 10x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Instortbak",
          "beschrijving": "M12 x 25",
          "aantal": "8x",
          "ring_borg": "M12 ring 8x + M12 veerring 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Instortbak",
          "beschrijving": "M12 x 40.",
          "aantal": "8x",
          "ring_borg": "M12 ring 16x + M12 borgmoer 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Instortbak",
          "beschrijving": "Vlinderklep.",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Instortbak",
          "beschrijving": "Lucht actuator.",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Instortbak",
          "beschrijving": "M16 x 100.",
          "aantal": "16x",
          "ring_borg": "M16 ring 16x + M16 veerringr 16x + M16 moer 16x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Lampen",
          "beschrijving": "M6 x 20 cillinderischekop",
          "aantal": "12x",
          "ring_borg": "M6 carroring 24x +  M6 ring 12x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Lampen",
          "beschrijving": "Wartels m20 x 1,5.",
          "aantal": "3x",
          "ring_borg": "",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Lampen",
          "beschrijving": "M10 x 16. (lampen steunen)",
          "aantal": "6x",
          "ring_borg": "M10 ring 6x + veerring 6x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Lampen",
          "beschrijving": "Sterknop m12.",
          "aantal": "3x",
          "ring_borg": "",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Kabels verlengen       3 X 0,75",
          "beschrijving": "5 meter",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Kabels verlengen       3 X 0,75",
          "beschrijving": "7,5 meter",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Kabels verlengen       3 X 0,75",
          "beschrijving": "9.5 meter",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "hydrauliek ventieleiland groot",
          "beschrijving": "M8x20 zeskant",
          "aantal": "4x",
          "ring_borg": "M8 ring 4x + M8 veerring 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "monteren van bovenbalk op bovenbak",
          "beschrijving": "M16 x 40 (monteren op bovenbak)",
          "aantal": "4x",
          "ring_borg": "M16 ring 4x + M16 veerring 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Manifolds 2x",
          "beschrijving": "M16 x 50.",
          "aantal": "8x",
          "ring_borg": "M16 ring 16x + M16 borgmoer 8x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Manifolds 2x",
          "beschrijving": "Bochten",
          "aantal": "16x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Manifolds 2x",
          "beschrijving": "Cyclonen",
          "aantal": "16x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Manifolds 2x",
          "beschrijving": "4” vitaukic klem",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Manifolds 2x",
          "beschrijving": "4” stoppen met getapte gat er in 3/8 draad 15 voor boren",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Manifolds 2x",
          "beschrijving": "6” vitaulic klem (alleen bij de stalen manifolds van michels)",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Manifolds 2x",
          "beschrijving": "6” stoppen (alleen bij de stalen manifolds van michels)",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Manifolds 2x",
          "beschrijving": "2”  vitaulic klem (alleen bij de stalen manifolds van michels)",
          "aantal": "48x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Manifolds 2x",
          "beschrijving": "Rubber buis 95cm (alleen bij de stalen manifolds van michels)",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Manifolds 2x",
          "beschrijving": "Slangklem. (alleen bij de stalen manifolds van michels)",
          "aantal": "4x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Manifolds 2x",
          "beschrijving": "vitaulic 6'' voor rvs 45 graden bocht (alleen voor pe manifolds)",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Leiding van pomp 1 naar manifold",
          "beschrijving": "M18 x 100",
          "aantal": "6x",
          "ring_borg": "M18 ring 12x + M18 veerring 6x + M18 moer 6x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Leiding van pomp 1 naar manifold",
          "beschrijving": "Unc 3/4x2 1/2 .",
          "aantal": "2x",
          "ring_borg": "M20 ring 2x + M20 veerring",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Leiding van pomp 2 naar manifold",
          "beschrijving": "M18 x 100.",
          "aantal": "6x",
          "ring_borg": "M18 ring 12x + M18 veerring 6x + M18 moer 6x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Leiding van pomp 2 naar manifold",
          "beschrijving": "Unc 3/4x2 1/2 .",
          "aantal": "2x",
          "ring_borg": "M20 ring 2x + M20 veerring",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "BOVENBALK ASSEMBLEREN",
          "subsectie": "Leiding van pomp 2 naar manifold",
          "beschrijving": "Vitaulic 5”.",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "trilldemper 70x35 (beide inwendig schroefdraad)",
          "beschrijving": "m10x20",
          "aantal": "8x",
          "ring_borg": "M10 carroring 8x + M10 veerring 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "rvs steuntje voor parrot + waterfilter",
          "beschrijving": "M10x30 zeskant",
          "aantal": "2x",
          "ring_borg": "M10 carroring 4x + borgmoer 2x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "rvs steuntje voor parrot + waterfilter",
          "beschrijving": "M12x 30 zeskant steutje voor beide parrots",
          "aantal": "2x",
          "ring_borg": "M12 carroring 2x + borgmoer 2x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "transferparrot",
          "beschrijving": "M16x90 zeskant naar vlinderklep",
          "aantal": "4x",
          "ring_borg": "M16 ring 8x + M16 veerring 4x + M16 moer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "transferparrot",
          "beschrijving": "M16x150 zeskant naar peleiding",
          "aantal": "4x",
          "ring_borg": "M16 ring 8x + M16 veerring 4x + M16 moer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "transferparrot",
          "beschrijving": "vitaulic 5\"",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "waterinlet parrot + waterfilter",
          "beschrijving": "M16x90 zeskant door parrot steuntje heen",
          "aantal": "2x",
          "ring_borg": "M16 ring 4x + M16 veerring 2x + M16 moer 2x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "waterinlet parrot + waterfilter",
          "beschrijving": "M16x70 zeskant flens op flens",
          "aantal": "6x",
          "ring_borg": "M16 ring 12x + M16 veerring 6x + M16 moer 6x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "waterinlet parrot + waterfilter",
          "beschrijving": "M16x90 zeskant flens op pe flens",
          "aantal": "8x",
          "ring_borg": "M16 ring 16x + M16 veerring 8x + M16 moer 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "waterinlet parrot + waterfilter",
          "beschrijving": "M16x50 zeskant vlinderklep tegen bak",
          "aantal": "4x",
          "ring_borg": "M16 ring 8x + M16 veerring 4x + M16 moer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "waterinlet parrot + waterfilter",
          "beschrijving": "M16x120 zeskant pe flens tegen de bak",
          "aantal": "4x",
          "ring_borg": "M16 ring 8x + M16 veerring 4x + M16 moer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "waterinlet parrot + waterfilter",
          "beschrijving": "M10 oog moer filter deksel",
          "aantal": "4x",
          "ring_borg": "met locetite 2400 blauw",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "waterinlet parrot + waterfilter",
          "beschrijving": "tapbout m10x20",
          "aantal": "4x",
          "ring_borg": "",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "mixnozle leiding na pomp",
          "beschrijving": "M16 x 50 voor de vlinderklep dn100",
          "aantal": "4x",
          "ring_borg": "M16 ring 8x + M16 veerring 4x + M16 moer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "mixnozle leiding na pomp",
          "beschrijving": "M16 x 110 pe flens naar de bak",
          "aantal": "4x",
          "ring_borg": "M16 ring 8x + M16 veerring 4x + M16 moer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "pe leiding op pomp onder",
          "beschrijving": "M18x110 pe flens op flens pomp",
          "aantal": "6x",
          "ring_borg": "M16 ring 12x + M16 veerring 6x + M16 moer 6x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "hopper naar venturi",
          "beschrijving": "M16 draadeind L= 140",
          "aantal": "2x",
          "ring_borg": "M16 ring 4x + M16 veerring 4x + M16 moer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "hopper naar venturi",
          "beschrijving": "M16x80 hopper naar vlinderklep",
          "aantal": "4x",
          "ring_borg": "M16 ring 8x + M16 veerring 4x + M16 moer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "hopper naar venturi",
          "beschrijving": "M16x110 hopper naar t-stuk",
          "aantal": "2x",
          "ring_borg": "M16 ring 8x + M16 veerring 4x + M16 moer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "hopper naar venturi",
          "beschrijving": "M10x30 hopper vast te zetten boven",
          "aantal": "8x",
          "ring_borg": "M10 ring 8x + M10 borgmoer 8x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "hopper naar venturi",
          "beschrijving": "vlinderklep DN80 met actuator",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "venturi naar rvs uitstroom",
          "beschrijving": "M16x80 hopper naar t-stuk venturi",
          "aantal": "8x",
          "ring_borg": "M16 ring 16x + M16 veerring 8x + M16 moer 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "venturi naar rvs uitstroom",
          "beschrijving": "vitaulic 4''",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "venturi naaar pe leiding (u vorm)",
          "beschrijving": "M16x80 van pe leiding naar vlinderklep",
          "aantal": "4x",
          "ring_borg": "M16 ring 8x + M16 veerring 4x + M16 moer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "venturi naaar pe leiding (u vorm)",
          "beschrijving": "M16x 140",
          "aantal": "4x",
          "ring_borg": "M16 ring 8x + M16 veerring 4x + M16 moer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "venturi naaar pe leiding (u vorm)",
          "beschrijving": "vlinderklep DN80 met actuator",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "venturi naaar pe leiding (u vorm)",
          "beschrijving": "vitaulic 3''",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "T-stuk aanzuig pomp op bak met parrot",
          "beschrijving": "M20 x 60.    vlinderklep",
          "aantal": "4x",
          "ring_borg": "M20 ring 8x + M20 veerring 4x + M20 moer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "T-stuk aanzuig pomp op bak met parrot",
          "beschrijving": "M20 x 100.  vitaulic flens op bak",
          "aantal": "4x",
          "ring_borg": "M20 ring 8x + M20 veerring 4x + M20 moer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "T-stuk aanzuig pomp op bak met parrot",
          "beschrijving": "M18 x 80.     T-stuk flens op pomp",
          "aantal": "8x",
          "ring_borg": "M18 ring 16x + M18 veerring 8x + M18 moer 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "T-stuk aanzuig pomp op bak met parrot",
          "beschrijving": "M120 x 140.   parrot op flens T-stuk met vlinderklep ertussen",
          "aantal": "8x",
          "ring_borg": "M20 ring 16x + M20 veerring 8x + M20 moer 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "T-stuk aanzuig pomp op bak met parrot",
          "beschrijving": "6” vitaulic klem",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "T-stuk aanzuig pomp op bak met parrot",
          "beschrijving": "6” stop (alleen voor michels)",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "Hopper leiding",
          "beschrijving": "M16 x 70.",
          "aantal": "12x",
          "ring_borg": "M16 ring 24x + M16 veerring 12x + moer 12x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "klapgedeelte hopper eiland",
          "beschrijving": "plastic strip 1250x100x5",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "klapgedeelte hopper eiland",
          "beschrijving": "M12x30 bolkop (schanieren)",
          "aantal": "12x",
          "ring_borg": "M12 ring 12x + M12 borgmoer 12x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "klapgedeelte hopper eiland",
          "beschrijving": "M6x25 verzonken kop (plastic plaat vast maken)",
          "aantal": "10x",
          "ring_borg": "M6 ring 10x + M6 Borgmoer 10x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "grote elektrokast onder ophangen",
          "beschrijving": "M10x20",
          "aantal": "4x",
          "ring_borg": "M10 carroring 4x + M10 veerring 4x",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "grote elektrokast onder ophangen",
          "beschrijving": "M10x25",
          "aantal": "4x",
          "ring_borg": "M10 carroring 4x + M10 veerring 4x",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "Kabel rups",
          "beschrijving": "M6 x 25 boven",
          "aantal": "4x",
          "ring_borg": "M6 ring 4x + M6 borgmoer 4x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "Kabel rups",
          "beschrijving": "M6 x 25 onder.",
          "aantal": "4x",
          "ring_borg": "M6 ring 4x + M6 borgmoer 4x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "680mm lang",
          "beschrijving": "M10 x 25 rvs bolkop",
          "aantal": "16x",
          "ring_borg": "Loctite 2400 blauwe",
          "type": "rvs"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "hydrauliek slangen cillinders bordess",
          "beschrijving": "Pijpklem 18x18",
          "aantal": "1x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "hydrauliek slangen cillinders bordess",
          "beschrijving": "M6/8 x 50",
          "aantal": "1x",
          "ring_borg": "M6/8 ring 2x M6/8 borgmoer",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "luchtslangklem actuatoren stortbak",
          "beschrijving": "M6 x 20.",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "rvs plaat eronder kitten …….x……..",
          "beschrijving": "m16x60 zeskant",
          "aantal": "8x",
          "ring_borg": "M16 ring 8x + M16 veerring 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "afzuigpunt voorzijde",
          "beschrijving": "M20x60",
          "aantal": "4x",
          "ring_borg": "M20 ring  4x + M20 veerring 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "afzuigpunt voorzijde",
          "beschrijving": "M20x100",
          "aantal": "4x",
          "ring_borg": "M20 ring  4x + M20 veerring 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "Compressor",
          "beschrijving": "M6 x 60.",
          "aantal": "8x",
          "ring_borg": "M6 ring 16x + M6 borgmoer 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "luchtfilter + ventieleiland",
          "beschrijving": "M6x25 (Luchtfilter)",
          "aantal": "2x",
          "ring_borg": "M6 ring 2x + M6 carroring 2x + M6 borgmoer 2x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "luchtfilter + ventieleiland",
          "beschrijving": "M5x35 cillindrische kop (ventieleiland)",
          "aantal": "2x",
          "ring_borg": "M6 carroring 4x + M6 borgmoer 2x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "Hogedruk spuit",
          "beschrijving": "M8 x 25",
          "aantal": "4x",
          "ring_borg": "M8 carroring 8x + M8 veerring 4x M8 borgmoer 4x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "Hogedruk spuit",
          "beschrijving": "trildempers",
          "aantal": "4x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "Waterfilter",
          "beschrijving": "M6 x 80",
          "aantal": "4x",
          "ring_borg": "M6 ring 8x + M6 borgmoer 4x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "hopper klapleuning",
          "beschrijving": "M12x100",
          "aantal": "5x",
          "ring_borg": "M10 carroring 10x + M10 borgmoer 5x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "hopper klapleuning",
          "beschrijving": "ketting van 53 schakels",
          "aantal": "2x",
          "ring_borg": "",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "hopper klapleuning",
          "beschrijving": "hoes lengte = 1250",
          "aantal": "2x",
          "ring_borg": "",
          "type": ""
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "Y-stuk",
          "beschrijving": "M12 x 45.",
          "aantal": "8x",
          "ring_borg": "M12 carroring 16x + M12 borgmoer 8x",
          "type": "verzonken"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "blokkeer pallen",
          "beschrijving": "m6x 20 bolkop",
          "aantal": "24x",
          "ring_borg": "loctite 2400 blauw",
          "type": "rvs"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "blokkeer pallen",
          "beschrijving": "m8x60",
          "aantal": "12x",
          "ring_borg": "M8 carroring 24x + M8 borgmoer 12x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "blokkeer pallen",
          "beschrijving": "m8 kunststof ringen",
          "aantal": "48x",
          "ring_borg": "",
          "type": "kunststof"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "rvs bescherm kappen powerpack motor en ventielen eiland hydrauliek",
          "beschrijving": "M10x20",
          "aantal": "4x",
          "ring_borg": "M10 carroring 4x + blauwe loctite",
          "type": "rvs"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "beschermkap kabelrups",
          "beschrijving": "M10x25 bolkop",
          "aantal": "4x",
          "ring_borg": "M10 ring 4x + M10 borgmoer 4x",
          "type": "rvs"
        },
        {
          "hoofdsectie": "ONDERBAK",
          "subsectie": "haspel HD spuit",
          "beschrijving": "M12x35  verzonken inbus",
          "aantal": "4x",
          "ring_borg": "M12 ring 4x + M12 borgmoer 4x",
          "type": "verzonken"
        }
      ],
      knoppen: [
        {
          "regel1": "",
          "regel2": "ALARM",
          "regel3": "",
          "group": 1
        },
        {
          "regel1": "MIX",
          "regel2": "PUMP",
          "regel3": "",
          "group": 1
        },
        {
          "regel1": "RECYCLING",
          "regel2": "PUMP 1",
          "regel3": "",
          "group": 1
        },
        {
          "regel1": "RECYCLING",
          "regel2": "PUMP 2",
          "regel3": "",
          "group": 1
        },
        {
          "regel1": "OPEN/CLOSE",
          "regel2": "RECYCLING",
          "regel3": "VALVE",
          "group": 1
        },
        {
          "regel1": "OPEN/CLOSE",
          "regel2": "PITPUMP",
          "regel3": "VALVE",
          "group": 1
        },
        {
          "regel1": "OPEN/CLOSE",
          "regel2": "VENTURI",
          "regel3": "VALVE",
          "group": 1
        },
        {
          "regel1": "OPEN/CLOSE",
          "regel2": "HOPPER",
          "regel3": "VALVE",
          "group": 1
        },
        {
          "regel1": "OPEN/CLOSE",
          "regel2": "WATER INLET",
          "regel3": "VALVE",
          "group": 1
        },
        {
          "regel1": "WORK",
          "regel2": "LIGHTS",
          "regel3": "",
          "group": 1
        },
        {
          "regel1": "START/STOP",
          "regel2": "SHALE",
          "regel3": "SHAKER",
          "group": 1
        },
        {
          "regel1": "START/STOP",
          "regel2": "MUD",
          "regel3": "SHAKER 1",
          "group": 1
        },
        {
          "regel1": "START/STOP",
          "regel2": "MUD",
          "regel3": "SHAKER 2",
          "group": 1
        },
        {
          "regel1": "UP/DOWN",
          "regel2": "SHALE",
          "regel3": "SHAKER",
          "group": 1
        },
        {
          "regel1": "UP/DOWN",
          "regel2": "MUD",
          "regel3": "SHAKER 1",
          "group": 1
        },
        {
          "regel1": "UP/DOWN",
          "regel2": "MUD",
          "regel3": "SHAKER 2",
          "group": 1
        },
        {
          "regel1": "",
          "regel2": "ALARM",
          "regel3": "",
          "group": 2
        },
        {
          "regel1": "PHASE",
          "regel2": "SEQUENCE",
          "regel3": "",
          "group": 2
        },
        {
          "regel1": "",
          "regel2": "RESET",
          "regel3": "",
          "group": 2
        },
        {
          "regel1": "HIGH",
          "regel2": "PRESSURE",
          "regel3": "WASHER",
          "group": 2
        },
        {
          "regel1": "HAND",
          "regel2": "HELD",
          "regel3": "",
          "group": 2
        },
        {
          "regel1": "HYDRAULIC",
          "regel2": "POWERPACK",
          "regel3": "",
          "group": 2
        },
        {
          "regel1": "MIX PUMP",
          "regel2": "SPEED",
          "regel3": "1/2",
          "group": 2
        },
        {
          "regel1": "OPEN/CLOSE",
          "regel2": "RECYCLING",
          "regel3": "VALVE",
          "group": 2
        },
        {
          "regel1": "OPEN/CLOSE",
          "regel2": "PITPUMP",
          "regel3": "VALVE",
          "group": 2
        },
        {
          "regel1": "OPEN/CLOSE",
          "regel2": "VENTURI",
          "regel3": "VALVE",
          "group": 2
        },
        {
          "regel1": "OPEN/CLOSE",
          "regel2": "HOPPER",
          "regel3": "VALVE",
          "group": 2
        },
        {
          "regel1": "OPEN/CLOSE",
          "regel2": "WATER INLET",
          "regel3": "VALVE",
          "group": 2
        },
        {
          "regel1": "MANUAL/AUTO",
          "regel2": "PITPUMP",
          "regel3": "VALVE",
          "group": 2
        },
        {
          "regel1": "MIX",
          "regel2": "PUMP",
          "regel3": "",
          "group": 2
        },
        {
          "regel1": "RECYCLING",
          "regel2": "PUMP 1",
          "regel3": "",
          "group": 2
        },
        {
          "regel1": "RECYCLING",
          "regel2": "PUMP 2",
          "regel3": "",
          "group": 2
        },
        {
          "regel1": "START/STOP",
          "regel2": "SHALE",
          "regel3": "SHAKER",
          "group": 2
        },
        {
          "regel1": "START/STOP",
          "regel2": "MUD",
          "regel3": "SHAKER 1",
          "group": 2
        },
        {
          "regel1": "START/STOP",
          "regel2": "MUD",
          "regel3": "SHAKER 2",
          "group": 2
        },
        {
          "regel1": "WORK",
          "regel2": "LIGHTS",
          "regel3": "",
          "group": 2
        },
        {
          "regel1": "UP/DOWN",
          "regel2": "SHALE",
          "regel3": "SHAKER",
          "group": 2
        },
        {
          "regel1": "UP/DOWN",
          "regel2": "MUD",
          "regel3": "SHAKER 1",
          "group": 2
        },
        {
          "regel1": "UP/DOWN",
          "regel2": "MUD",
          "regel3": "SHAKER 2",
          "group": 2
        },
        {
          "regel1": "",
          "regel2": "PLATFORM",
          "regel3": "",
          "group": 2
        },
        {
          "regel1": "RECYCLING",
          "regel2": "UNIT",
          "regel3": "",
          "group": 2
        },
        {
          "regel1": "EMERGENCY",
          "regel2": "STOP",
          "regel3": "",
          "group": 3
        },
        {
          "regel1": "",
          "regel2": "PLATFORM",
          "regel3": "",
          "group": 3
        },
        {
          "regel1": "RECYCLING",
          "regel2": "UNIT",
          "regel3": "",
          "group": 3
        }
      ]
    }
  };
})(typeof self !== 'undefined' ? self : this);
