import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { buildCatalog } from './catalog-seed';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILES = {
  catalog: path.join(DATA_DIR, 'catalog.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  events: path.join(DATA_DIR, 'gateway-events.json'),
};

const chains = new Map();

function queued(name, task) {
  const prev = chains.get(name) || Promise.resolve();
  const result = prev.then(task, task);
  chains.set(name, result.then(() => undefined, () => undefined));
  return result;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${file}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

function readCatalogUnlocked() {
  return readJson(FILES.catalog, null);
}

export function getCatalog() {
  return queued('catalog', async () => {
    const existing = await readCatalogUnlocked();
    if (existing && Array.isArray(existing.products) && existing.products.length) return existing;
    const seeded = buildCatalog();
    await writeJson(FILES.catalog, seeded);
    return seeded;
  });
}

export function mutateCatalog(fn) {
  return queued('catalog', async () => {
    const catalog = (await readCatalogUnlocked()) || buildCatalog();
    const result = await fn(catalog);
    await writeJson(FILES.catalog, catalog);
    return result;
  });
}

export function listOrders() {
  return queued('orders', () => readJson(FILES.orders, []));
}

export function findOrder(orderNo) {
  return listOrders().then((list) => list.find((o) => o.orderNo === orderNo) || null);
}

export function mutateOrders(fn) {
  return queued('orders', async () => {
    const list = await readJson(FILES.orders, []);
    const result = await fn(list);
    await writeJson(FILES.orders, list);
    return result;
  });
}

export function mutateGatewayEvents(fn) {
  return queued('events', async () => {
    const state = (await readJson(FILES.events, { processed: [] })) || { processed: [] };
    if (!Array.isArray(state.processed)) state.processed = [];
    const result = await fn(state);
    state.processed = state.processed.slice(-5000);
    await writeJson(FILES.events, state);
    return result;
  });
}

export async function searchCatalog({ q = '', category = '', sort = 'populer', min = 0, max = Number.MAX_SAFE_INTEGER, page = 1, perPage = 12 }) {
  const catalog = await getCatalog();
  const needle = q.trim().toLowerCase();
  let items = catalog.products.filter((p) => {
    if (category && p.categorySlug !== category) return false;
    if (p.price < min || p.price > max) return false;
    if (!needle) return true;
    return (`${p.name} ${p.categoryName} ${p.sellerName} ${p.city}`).toLowerCase().includes(needle);
  });

  const sorters = {
    populer: (a, b) => b.sold - a.sold,
    terbaru: (a, b) => b.id.localeCompare(a.id),
    termurah: (a, b) => a.price - b.price,
    termahal: (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
    diskon: (a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp,
  };
  items = items.sort(sorters[sort] || sorters.populer);

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), pages);
  return {
    items: items.slice((current - 1) * perPage, current * perPage),
    total,
    page: current,
    pages,
    perPage,
  };
}
