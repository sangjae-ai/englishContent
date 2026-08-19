// levels/*.json (사람이 편집하는 원본) → contentHash 주입 + manifest.json 생성
//
// 앱은 manifest.json 만 먼저 받아서 레벨별 contentHash 를 비교하고,
// 바뀐 레벨 파일만 내려받는다. 버전 번호를 손으로 올릴 필요가 없다.
//
// 카드 원본은 짧게 쓰려고 배열로 적는다:
//   ["영어 문장", "한국어", "숙어|뜻|설명", "숙어2|뜻2|설명2", ...]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const LEVELS_DIR = path.join(ROOT, 'levels');

const sha = (v) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 16);

function expand(levelId, raw, index) {
  const [sentence, sentenceKo, ...idiomSpecs] = raw;
  return {
    id: `${levelId}-${String(index + 1).padStart(3, '0')}`,
    sentence,
    sentenceKo,
    idioms: idiomSpecs.filter(Boolean).map((spec) => {
      const [en, ko, note = ''] = spec.split('|');
      return { en: en.trim(), ko: (ko ?? '').trim(), note: note.trim() };
    }),
  };
}

const levels = [];
const files = fs.readdirSync(LEVELS_DIR).filter((f) => f.endsWith('.json')).sort();

for (const file of files) {
  const p = path.join(LEVELS_DIR, file);
  const src = JSON.parse(fs.readFileSync(p, 'utf8'));

  const cards = src.cards.map((c, i) =>
    Array.isArray(c) ? expand(src.id, c, i) : { ...c, id: c.id ?? `${src.id}-${String(i + 1).padStart(3, '0')}` }
  );

  const problems = [];
  const seen = new Set();
  cards.forEach((c, i) => {
    if (!c.sentence?.trim()) problems.push(`${i + 1}행: 영어 문장이 비었습니다`);
    if (!c.sentenceKo?.trim()) problems.push(`${i + 1}행: 한국어가 비었습니다`);
    if (!c.idioms?.length) problems.push(`${i + 1}행: 표현이 하나도 없습니다`);
    if (seen.has(c.sentence)) problems.push(`${i + 1}행: 문장이 중복입니다 — ${c.sentence}`);
    seen.add(c.sentence);
  });
  if (problems.length) {
    console.error(`✗ ${file}\n  ` + problems.join('\n  '));
    process.exitCode = 1;
    continue;
  }

  const body = { schema: 3, level: src.id, name: src.name, cards };
  const contentHash = sha(body);
  fs.mkdirSync(path.join(ROOT, 'dist', 'levels'), { recursive: true });
  fs.writeFileSync(
    path.join(ROOT, 'dist', 'levels', `${src.id}.json`),
    JSON.stringify({ ...body, contentHash }, null, 1)
  );

  levels.push({
    id: src.id,
    name: src.name,
    order: src.order,
    description: src.description ?? '',
    cards: cards.length,
    contentHash,
    path: `dist/levels/${src.id}.json`,
  });
}

levels.sort((a, b) => a.order - b.order);

const manifest = {
  schema: 3,
  generatedAt: new Date().toISOString().slice(0, 10),
  levels,
};
manifest.manifestHash = sha(levels);
fs.writeFileSync(path.join(ROOT, 'dist', 'manifest.json'), JSON.stringify(manifest, null, 1));

const total = levels.reduce((s, l) => s + l.cards, 0);
console.log(`레벨 ${levels.length}개 · 문장 ${total}개`);
for (const l of levels) console.log(`  ${String(l.order).padStart(2)} ${l.name.padEnd(20)} ${String(l.cards).padStart(3)}문장  ${l.contentHash}`);
console.log(`manifestHash ${manifest.manifestHash}`);
