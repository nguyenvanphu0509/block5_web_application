// Strip only recognizable conversational framing, never individual stop words:
// "toi" can mean garlic, and "bo" is a meaningful part of a dish name.
const framing = [
  /^(?:(?:hom nay|bay gio|toi nay|trua nay|sang nay|nay)\s+)?(?:(?:toi|minh|to|em|anh|chi|ban)\s+)?(?:dang\s+)?(?:muon|thich|them|can)\s+(?:duoc\s+)?(?:tim mon an|tim mon|an|tim|thu)\s+/,
  /^(?:hay\s+)?(?:tim|kiem|goi y)\s+(?:cho|giup)\s+(?:toi|minh|to|em|anh|chi|ban)\s+(?:(?:mon an|mon)\s+)?/,
  /^cho\s+(?:toi|minh|to|em|anh|chi|ban)\s+(?:(?:tim|an|thu)\s+)(?:(?:mon an|mon)\s+)?/,
];

export function prepareFulltextQuery(query) {
  const folded = query.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').trim();
  for (const prefix of framing) {
    const match = folded.match(prefix);
    if (!match) continue;
    const keywords = folded.slice(match[0].length)
      .replace(/(?:^|\s+)(?:(?:voi|di)\s+)?(?:nhe|nha|a|voi|di)[.!?]*$/u, '').trim();
    // A sentence without a food keyword must not become an unfiltered listing.
    return /[\p{L}\p{N}]/u.test(keywords) ? keywords : query;
  }
  return query;
}
