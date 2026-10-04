/**
 * Turns a Workers AI result into a known page id.
 * The model is not allowed to supply the sentence shown in the app.
 */

export function readPayload(result) {
  if (typeof result === 'string') return result;
  if (!result || typeof result !== 'object') return '';
  const choice = result.choices?.[0]?.message;
  if (choice && 'content' in choice) return choice.content;
  if (result.response !== undefined) return result.response;
  if ('entryId' in result) return result;
  return '';
}

export function parseEntryId(payload, known) {
  let data = payload;
  if (typeof data === 'string') {
    const cleaned = data.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    if (!cleaned) return null;
    try {
      data = JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const entryId = data.entryId;
  return typeof entryId === 'string' && known.has(entryId) ? entryId : null;
}
