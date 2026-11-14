// „Gefällt mir“ für Bilder im Kopf (Cloudflare Pages Function + KV).
// Gespeichert wird je Bild nur eine Zahl – keine IP-Adresse, kein Cookie, nichts über Besucher.
//
// GET  /api/likes?ids=a,b          → { "a": 3, "b": 0 }
// POST /api/likes {id, action}     → { "id": "a", "count": 4 }   (action: "like" | "unlike")
//
// Voraussetzung: KV-Namespace mit dem Binding-Namen LIKES im Pages-Projekt.
// Gültige Bilder stehen in /bilder-im-kopf/bilder.json.

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

async function knownIds(context) {
  const res = await context.env.ASSETS.fetch(new URL('/bilder-im-kopf/bilder.json', context.request.url));
  if (!res.ok) return new Set();
  const list = await res.json();
  return new Set(list.map(b => b.id));
}

async function count(kv, id) {
  return parseInt(await kv.get('like:' + id), 10) || 0;
}

export async function onRequestGet(context) {
  const kv = context.env.LIKES;
  if (!kv) return json({ error: 'not configured' }, 503);
  const valid = await knownIds(context);
  const ids = (new URL(context.request.url).searchParams.get('ids') || '')
    .split(',').filter(id => valid.has(id)).slice(0, 100);
  const out = {};
  await Promise.all(ids.map(async id => { out[id] = await count(kv, id); }));
  return json(out);
}

export async function onRequestPost(context) {
  const kv = context.env.LIKES;
  if (!kv) return json({ error: 'not configured' }, 503);
  let body;
  try { body = await context.request.json(); } catch (e) { return json({ error: 'bad request' }, 400); }
  const { id, action } = body || {};
  if (!['like', 'unlike'].includes(action)) return json({ error: 'bad request' }, 400);
  if (!(await knownIds(context)).has(id)) return json({ error: 'unknown' }, 404);
  const n = Math.max(0, (await count(kv, id)) + (action === 'like' ? 1 : -1));
  await kv.put('like:' + id, String(n));
  return json({ id, count: n });
}
