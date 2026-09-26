import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const client = readFileSync(new URL('../hani-study-v02984.js', import.meta.url), 'utf8');
const edge = readFileSync(new URL('../supabase/functions/hani-learning-quiz/index.ts', import.meta.url), 'utf8');

assert.match(client, /const VERSION = '2\.9\.134'/);
assert.match(client, /rejected_prompts:\[\.\.\.new Set\(rejectedPrompts\.filter\(Boolean\)\)\]/);
assert.match(client, /function replacementBatchSize\(remaining\) \{ return Math\.max\(1,Math\.min\(20,Number\(remaining\)\|\|1\)\); \}/);

for (const field of [
  'attempt',
  'requested_count',
  'accepted_prompts',
  'avoid_prompts',
  'rejected_prompts',
  'recent_learning_points',
  'weakness_review_priority',
  'instruction',
]) {
  assert.match(edge, new RegExp(`\\n\\s+${field}(?:,|\\s*:)`), `${field} must be forwarded to the model input`);
}

assert.match(edge, /version:"0\.3\.0"/);
assert.match(edge, /feedback_applied:true/);
assert.match(edge, /boundedInteger\(project\.quiz_size, 20, 1, 20\)/);
assert.match(edge, /같은 문법·어휘·학습 포인트 자체는 새 문장, 새 상황, 새 보기라면 복습 문제로 다시 출제할 수 있습니다/);
assert.doesNotMatch(edge, /\.from\(|\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
assert.doesNotMatch(edge, /SUPABASE_SERVICE_ROLE_KEY/);

console.log('PASS hani-learning-quiz v0.3 contract');
