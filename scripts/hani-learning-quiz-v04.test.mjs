import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const client = readFileSync(new URL('../hani-study-v02984.js', import.meta.url), 'utf8');
const edge = readFileSync(new URL('../supabase/functions/hani-learning-quiz/index.ts', import.meta.url), 'utf8');

assert.equal(client.includes('allowedTypes=new Set'), false, '경제 문제 type 문자열 허용목록이 남아 있습니다.');
assert.equal(client.includes('distribution:{foundation:4'), false, '20문제 전용 고정 배분표가 남아 있습니다.');
assert.match(client, /recent_question_rotation:recentQuestionRotation\(project\.id\)/);
assert.match(client, /rotation_pools:\['경제 기초·금융 원리'/);
assert.match(client, /실제 기출문제를 복제하지 않고 기출 유형 기반 새 문제/);

assert.match(edge, /category === "economy" \? economy : category === "jlpt" \? jlpt : general/);
assert.match(edge, /검증된 Newsroom source가 없으므로 최신 사건인 것처럼 꾸미지 말고/);
assert.match(edge, /version:"0\.4\.1"/);
assert.equal(/\.from\s*\([^)]*\)\s*\.\s*(insert|update|delete|upsert)/.test(edge), false, '읽기 전용 Edge Function에 DB write가 있습니다.');
assert.equal(/localStorage\.(setItem|removeItem|clear)/.test(client), false, '학습 패치에 새 localStorage mutation이 있습니다.');

console.log('PASS: economy acceptance, dynamic category rotation, JLPT diversity, read-only Edge Function');
