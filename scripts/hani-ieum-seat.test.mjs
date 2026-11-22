import './hani-building-phase2-preload.cjs'; // Exact Phase 2 inverse before the fixed 326-anchor reader.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const json = f => JSON.parse(read(f));

const assets = {
  canon: json('data/hani-building/spatial-contract.json'),
  art: json('data/hani-building/art-map-v1.json'),
  places: json('data/hani-building/office-places.json'),
  sprites: json('assets/sprites-v2/manifest.json'),
  spritesV3: json('assets/sprites-v3/manifest-v3.json')
};
const table216 = json('assets/data/office-actions-216.json');
const table221 = json('assets/data/office-actions-221.json');
const liveSource = read('hani-office-live.js');

function loadScene(table = table221) {
  const ctx = vm.createContext({
    HaniOfficeV2Assets: assets,
    HaniOfficeActions221: table === table221 ? table : null,
    HaniOfficeActions216: table === table216 ? table : null,
    window: {},
    document: { getElementById: () => null }
  });
  vm.runInContext(liveSource, ctx);
  return ctx.HaniBuildingScene;
}

const scene = loadScene(table221);
const at = (time, day = '2026-11-12') => new Date(`${day}T${time}+09:00`);

test('spatial-contract keeps exact 326 anchors and swaps ieum->desk_yuna(4F) and yuna->reception(1F)', () => {
  assert.equal(assets.canon.anchors.length, 326);
  assert.equal(scene.canon.anchors.length, assets.canon.anchors.length + assets.places.anchors.length);

  const ieum = assets.canon.people.find(p => p.id === 'ieum');
  const yuna = assets.canon.people.find(p => p.id === 'yuna');
  assert.equal(ieum.homeAnchor, 'desk_yuna');
  assert.equal(ieum.workAnchor, 'desk_yuna');
  assert.equal(yuna.homeAnchor, 'reception');
  assert.equal(yuna.workAnchor, 'reception');

  const deskYuna = assets.canon.anchors.find(a => a.id === 'desk_yuna');
  assert.equal(deskYuna.floor, '4f');
  assert.equal(deskYuna.room, 'secretariat');
  assert.equal(deskYuna.occupant, 'ieum');
  assert.equal(deskYuna.rendererSeat.owner, 'ieum');

  const reception = assets.canon.anchors.find(a => a.id === 'reception');
  assert.equal(reception.floor, '1f');
  assert.equal(reception.room, 'lobby');
  assert.equal(reception.occupant, 'yuna');
  assert.equal(reception.rendererSeat.owner, 'yuna');

  const secretariat = assets.canon.floors.find(f => f.id === '4f').rooms.find(r => r.id === 'secretariat');
  assert.match(secretariat.label, /이음/);
  assert.doesNotMatch(secretariat.label, /유나/);
});

test('desk_ieum remains in office-places as an empty spare seat with no new attributes', () => {
  const deskIeum = assets.places.anchors.find(a => a.id === 'desk_ieum');
  assert.ok(deskIeum);
  assert.equal(deskIeum.floor, '4f');
  assert.equal(deskIeum.room, 'hani_office');
  assert.equal(deskIeum.occupant, null);
  assert.equal(deskIeum.rendererSeat.owner, null);
  assert.equal(Object.hasOwn(deskIeum, 'runtimeAssignable'), false);
  assert.equal(deskIeum.label, '빈 자리');

  for (const id of ['desk_ieum', 'side_desk_ieum', 'approach_desk_ieum']) {
    assert.ok(scene.anchors.has(id));
    assert.ok(assets.places.edges.some(e => e.from === id || e.to === id));
  }
});

test('runtime homeSeat, floor residents, routes and assignSeats have zero overlap', () => {
  const ieumSeat = scene.homeSeat('ieum');
  const yunaSeat = scene.homeSeat('yuna');
  assert.equal(ieumSeat.anchor, 'desk_yuna');
  assert.equal(ieumSeat.owner, 'ieum');
  assert.equal(yunaSeat.anchor, 'reception');
  assert.equal(yunaSeat.owner, 'yuna');

  const f4 = scene.floors.find(f => f.id === '4f');
  const f1 = scene.floors.find(f => f.id === '1f');
  assert.ok([...f4.residents].includes('ieum'));
  assert.ok(![...f4.residents].includes('yuna'));
  assert.ok([...f1.residents].includes('yuna'));
  assert.ok(![...f1.residents].includes('ieum'));

  const allResidents = [...scene.floors.flatMap(f => [...f.residents])];
  assert.equal(allResidents.length, 20);
  assert.equal(new Set(allResidents).size, 20);

  const spots = new Set();
  for (const id of allResidents) {
    const seat = scene.homeSeat(id);
    assert.ok(seat, `${id} missing homeSeat`);
    const floor = scene.anchors.get(seat.anchor).floor;
    const key = `${floor}|${seat.anchor}|${seat.x},${seat.y}`;
    assert.equal(spots.has(key), false, `duplicate home spot: ${key}`);
    spots.add(key);
  }

  const route4f = [...scene.route('elevator_4f', 'desk_yuna')];
  assert.ok(route4f.length >= 2);
  assert.equal(route4f.at(-1).id, 'desk_yuna');

  const route1f = [...scene.route('elevator_1f', 'reception')];
  assert.ok(route1f.length >= 2);
  assert.equal(route1f.at(-1).id, 'reception');

  const assigned4f = [...scene.assignSeats('4f', [{ id: 'ieum', activity: 'work' }])];
  assert.equal(assigned4f[0].seat.anchor, 'desk_yuna');
  const assigned1f = [...scene.assignSeats('1f', [{ id: 'yuna', activity: 'work' }])];
  assert.equal(assigned1f[0].seat.anchor, 'reception');
});

test('office-actions 216 and 221 match new home anchors and route targets cleanly', () => {
  for (const [label, table] of [['216', table216], ['221', table221]]) {
    const yunaPerson = table.people.find(p => p.id === 'yuna');
    const ieumPerson = table.people.find(p => p.id === 'ieum');
    assert.deepEqual({ ...yunaPerson.home }, { floor: '1f', room: 'lobby', anchorId: 'reception' }, label);
    assert.deepEqual({ ...ieumPerson.home }, { floor: '4f', room: 'secretariat', anchorId: 'desk_yuna' }, label);

    for (const id of ['base-work', 'base-read', 'base-phone', 'base-organize', 'base-think']) {
      const a = table.actions.find(x => x.id === id);
      const yIdx = a.participants.indexOf('yuna');
      const iIdx = a.participants.indexOf('ieum');
      assert.deepEqual({ ...a.places[yIdx] }, { floor: '1f', room: 'lobby', anchorId: 'reception' }, `${label}:${id}:yuna`);
      assert.deepEqual({ ...a.places[iIdx] }, { floor: '4f', room: 'secretariat', anchorId: 'desk_yuna' }, `${label}:${id}:ieum`);
    }

    for (const id of ['sig-yuna-2', 'sig-yuna-3', 'sig-yuna-4', 'base-desk-note', 'scene-paper-delivery', 'scene-secretary-tabs']) {
      const a = table.actions.find(x => x.id === id);
      const p = a.places.find(x => x.personId === 'yuna');
      assert.deepEqual({ ...p }, { floor: '1f', room: 'lobby', anchorId: 'reception', personId: 'yuna' }, `${label}:${id}`);
    }

    const umbrella = table.actions.find(x => x.id === 'base-lobby-umbrella');
    assert.equal(umbrella.places[0].anchorId, 'approach_reception', `${label}:umbrella`);
  }

  for (const id of ['night-exec-starlight', 'night-exec-page', 'night-exec-connection']) {
    const a = table221.actions.find(x => x.id === id);
    assert.ok(a.participants.includes('ieum'));
    assert.equal(a.participants.includes('yuna'), false);
    assert.equal(a.places.find(p => p.personId === 'ieum').anchorId, 'desk_yuna');
  }

  const win = table221.actions.find(x => x.id === 'night-window-view');
  assert.deepEqual({ ...win.places.find(p => p.personId === 'yuna') }, { personId: 'yuna', floor: '1f', anchorId: 'window_1f_1' });
});

test('scheduler day/evening/late snapshots preserve unique seats, evening lounge moves, and updated dialogue', () => {
  const s = scene.scheduler;
  assert.equal(s.homeAt({ id: 'yuna', home: { floor: '1f', room: 'lobby', anchorId: 'reception' } }, 11 * 3600).anchorId, 'reception');
  assert.equal(s.homeAt({ id: 'yuna', home: { floor: '1f', room: 'lobby', anchorId: 'reception' } }, 21 * 3600).anchorId, 'lobby-nw');
  assert.equal(s.homeAt({ id: 'minji', home: { floor: '2f', room: 'life', anchorId: 'life-c' } }, 21 * 3600).anchorId, 'lobby-ne');

  for (const time of ['09:30', '12:15', '15:00', '19:30', '02:00']) {
    const snap = scene.snapshot(at(time));
    const entries = [...snap.entries];
    const settled = entries.filter(e => !e.walking);
    const anchors = settled.map(e => e.seat.anchor);
    assert.equal(new Set(anchors).size, anchors.length, `seat collision at ${time}`);

    if (time === '09:30') {
      const ieumEntry = entries.find(e => e.id === 'ieum');
      const yunaEntry = entries.find(e => e.id === 'yuna');
      assert.ok(ieumEntry && yunaEntry);
      assert.equal(ieumEntry.home, '4f');
      assert.equal(yunaEntry.home, '1f');
    }
  }

  assert.doesNotMatch(liveSource, /하니 전무님 옆에서 열심히 배울게요/);
  assert.match(liveSource, /4층 비서실 자리에서 열심히 배울게요/);
});
