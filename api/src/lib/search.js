export function normalizeSearch(value) {
  return value.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd').replace(/\bq\.?\s*(\d+)\b/g, 'quan $1')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
export function searchWhere(query) {
  return { AND: normalizeSearch(query).split(' ').filter(Boolean).map(token => ({ searchText: { contains: token } })) };
}
