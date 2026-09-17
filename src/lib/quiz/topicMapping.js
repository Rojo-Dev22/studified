/**
 * Maps a question from an authoring bank to its authoritative topics.json
 * topic id — no topics are ever invented here.
 *
 * Primary signal (data-derived and verified against topics.json counts):
 *   the 3rd dash-segment of the question id is the topic ordinal, e.g.
 *   "BIO-09-01-001" -> topic 01 -> topics.grades["9"].biology[0].
 *
 * Secondary signal: normalized name containment against the registry names.
 */
export function normalizeTopicKey(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function resolveTopicId(question, topicsForSubject) {
  const parts = String(question?.id || '').split('-');
  const ordinalSeg = parts.length >= 3 ? parts[2] : '';
  const ordinal = /^\d+$/.test(ordinalSeg) ? parseInt(ordinalSeg, 10) : null;

  if (ordinal !== null && topicsForSubject?.length) {
    if (ordinal >= 1 && ordinal <= topicsForSubject.length) {
      return { topicId: topicsForSubject[ordinal - 1].id, via: 'id-ordinal' };
    }
    return { topicId: null, via: 'ordinal-out-of-range' };
  }

  if (topicsForSubject?.length) {
    const norm = normalizeTopicKey(question?.topic);
    const matches = topicsForSubject.filter((t) => {
      const name = normalizeTopicKey(t.name);
      return norm && (norm === name || norm.includes(name) || name.includes(norm));
    });
    if (matches.length === 1) return { topicId: matches[0].id, via: 'name-match' };
    if (matches.length > 1) return { topicId: null, via: 'ambiguous-name' };
  }
  return { topicId: null, via: 'unresolved' };
}
