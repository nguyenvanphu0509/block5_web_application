import { demoDishes, demoChefs, demoIngredients } from '../data/demo.js';
// Isolated test double for HTTP contracts. Real Prisma/PG tests are separate.
export function testDatabase() {
  const storage = { dish: structuredClone(demoDishes), chef: structuredClone(demoChefs), ingredient: structuredClone(demoIngredients) };
  const db = {};
  for (const [name, rows] of Object.entries(storage)) {
    db[name] = {
      async findMany({ where, take } = {}) {
        const q = where?.name?.contains?.toLocaleLowerCase('vi') ?? '';
        const result = rows.filter(row => row.name.toLocaleLowerCase('vi').includes(q)).sort((a, b) => a.id - b.id);
        return structuredClone(take == null ? result : result.slice(0, take));
      },
      async findUnique({ where }) { return structuredClone(rows.find(row => row.id === where.id) ?? null); },
      async create({ data }) {
        const record = { id: Math.max(0, ...rows.map(row => row.id)) + 1, createdAt: new Date(), ...data };
        rows.push(record); return structuredClone(record);
      },
      async update({ where, data }) {
        const record = rows.find(row => row.id === where.id);
        if (!record) throw Object.assign(new Error('Missing'), { code: 'P2025' });
        Object.assign(record, data); return structuredClone(record);
      },
      async delete({ where }) {
        const index = rows.findIndex(row => row.id === where.id);
        if (index < 0) throw Object.assign(new Error('Missing'), { code: 'P2025' });
        return rows.splice(index, 1)[0];
      },
    };
  }
  return { db, storage };
}
