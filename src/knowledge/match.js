/** Keyword ranking for the knowledge pages. The worker does not use this. */

export const PAGE_KEYWORDS = {
  height: ['höjd', 'height', '5 meter', '5 m', '5000', 'högsta', 'high end', 'eave'],
  pitch: ['lutning', 'taklutning', 'pulpet', 'pitch', '12°', '12 grader', 'mono', 'sadeltak', 'gable', 'tak', 'roof'],
  belt: ['bleck', 'vattbräda', 'vattbrada', 'midjebleck', 'flashing', 'metal plate', 'vita plåten', 'white metal', 'belt'],
  cladding: ['panel', 'cladding', 'stående', 'staende', 'liggande', '22x145', '145', 'board', 'dimension', 'ytterpanel'],
  covering: ['shingel', 'shingle', 'takpapp', 'takbeklädnad', 'roof covering', 'betongpanna', 'papp', 'felt', 'tiles', 'plåttak'],
  permit: ['bygglov', 'attefall', 'friggebod', 'lov', 'permit', 'anmälan', 'anmalan', 'komplement', 'detail plan', 'detaljplan'],
  loft: ['loft', 'sovloft', 'sleeping loft', 'trappa'],
  door: ['dubbeldörr', 'svanshall', 'pardörr', 'double door', 'dörr', 'door'],
  'panel-air': ['luftspalt', 'tva steg', 'tvasteg', 'two-step', 'air gap', 'vindskydd', '300 mm', 'over mark', 'ovan mark'],
  'panel-wood': ['lockpanel', 'gran', 'g4-2', 'g4', 'spruce', '22x170', '170 mm', 'overlapp', 'overlap', 'falsad', 'spontad'],
  'panel-paint': ['grundmala', 'grundmalning', 'cmp', 'certifierad malad', 'fuktkvot', 'moisture', 'slamfarg', 'falu', 'paint', 'malning'],
  'attefall-shell': ['attefallshuset', 'c14', 'konstruktionsvirke', '22x120', 'angspärr', 'plastfolie', 'ac 350', 'gl30', 'limtra', 'glulam', 'year-round'],
  'roof-deck': ['underlagspont', 'underlagsspont', 'underlagspapp', 'raspönt', 'raspont', 'vindduk', 'takstol', '23x95', 'insektsnat', 'roof deck', 'sarking'],
  piers: ['plint', 'grundlaggning', 'tjale', 'frost', 'ntr/a', 'ntr/ab', 'syll', '500 mm', 'pier', 'foundation'],
  'shell-wall': ['ytterväggen', 'yttervagg', 'uppbyggd', 'osb', 'stenull', 'stone wool', '45x220', 'plastsyll', 'trossbotten', '215 mm', '190 mm', 'outer wall'],
  delivery: ['skalhus', 'nyckelfärdigt', 'nyckelfardigt', 'turnkey', 'shell house', 'elementhus', 'kranlyft', 'cembrit', 'windstopper', 'entreprenadpaket', 'prefab']
};

export function fold(value) {
  return value
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9° ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Longer keyword matches win. An empty question matches nothing. */
export function rankEntries(entries, query) {
  const folded = fold(query);
  if (!folded) return [];
  return entries
    .map((entry) => {
      const hits = entry.keywords.filter((keyword) => folded.includes(fold(keyword)));
      const score = hits.reduce((sum, keyword) => sum + fold(keyword).length, 0);
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
}
