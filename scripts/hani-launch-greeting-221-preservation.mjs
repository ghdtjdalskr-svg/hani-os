// Only the four approved launch connections are removed for legacy whole-index checks.
import assert from 'node:assert/strict';
export function withoutLaunchGreeting(html) {
  for (const line of [
    '<link rel="stylesheet" href="./hani-launch-greeting.css">',
    '          <label class="launch-greeting-setting"><input id="launchGreetingEnabled" type="checkbox" role="switch" checked>앱 시작 인사 (치비툰)</label>',
    '<template id="launchGreetingAssets"><img data-launch-day src="./assets/launch/chibi-launch-v1-day.webp" alt=""><img data-launch-night src="./assets/launch/chibi-launch-v1-night.webp" alt=""></template>',
    '<script src="./hani-launch-greeting.js"></script>'
  ]) {
    assert.equal(html.split(line).length - 1, 1, 'one canonical connection: ' + line);
    html = html.replace(new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\r?\\n'), '');
  }
  return html;
}
