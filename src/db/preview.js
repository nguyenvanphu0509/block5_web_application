import { demoDishes, demoChefs, demoIngredients } from '../../data/demo.js';

// Explicit read-only sample client: never simulates a successful database write.
export function createPreviewClient() {
  const model = (rows) => ({
    async findMany({ where, take } = {}) {
      const q = where?.name?.contains?.toLocaleLowerCase('vi') ?? '';
      const matches = rows.filter(row => row.name.toLocaleLowerCase('vi').includes(q));
      return structuredClone(take == null ? matches : matches.slice(0, take));
    },
    async findUnique({ where }) { return structuredClone(rows.find(row => row.id === where.id) ?? null); },
  });
  return { dish: model(demoDishes), chef: model(demoChefs), ingredient: model(demoIngredients) };
}
