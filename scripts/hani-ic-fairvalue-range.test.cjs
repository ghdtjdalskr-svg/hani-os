/* Synthetic fixtures only. No browser storage, network or production data. */
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../hani-investment-committee.js');
const fixture = require('./fixtures/investment-research-mock.json');

const fairKeys = ['fairValue', 'fairValueLow', 'fairValueHigh'];
const values = card => fairKeys.map(key => card[key]);
const blank = () => ({investmentResearchCards: [], investmentResearchHistory: [], investmentCommitteeSnapshots: [], ui: {icAccumulationAccountIds: []}});
const oldCard = extra => ({...C.normalizeCard(fixture.cards[0]), id: 'old', ...extra});
const sourceWith = card => ({...blank(), investmentResearchCards: [card]});
const options = () => {let id = 0; return {uid: () => 'fixture-' + ++id, now: '2026-11-07T00:00:00Z'};};
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
function immutableReview(input, source = blank()) {
  const rows = [input], before = structuredClone([rows, source]);
  freeze(rows); freeze(source);
  const item = C.reviewReport(rows, source)[0];
  assert.deepEqual([rows, source], before);
  return item;
}

test('null, empty and omitted Mid use the same range midpoint and existing note as omitted Mid', () => {
  for (const fixtureCard of [fixture.cards[0], fixture.cards[3]]) {
    const input = {...fixtureCard, fairValueLow: 100.25, fairValueHigh: 101.5, valuationNote: '원래 메모'};
    delete input.fairValue;
    const omitted = immutableReview(structuredClone(input));
    assert.equal(omitted.card.fairValue, (100.25 + 101.5) / 2);
    assert.match(omitted.card.valuationNote, /^원래 메모 · 입력된 적정가 구간의 중간값$/);
    for (const mid of [null, '', '   ', undefined]) {
      const reviewed = immutableReview({...input, fairValue: mid});
      assert.deepEqual(reviewed.card, omitted.card);
      assert.equal(reviewed.preservedFairValue, false);
      assert.equal(reviewed.missingFairValue, false);
    }
    const previous = oldCard({...fixtureCard, fairValue: 150, fairValueLow: 100, fairValueHigh: 200});
    const reviewed = immutableReview({...input, fairValue: null}, sourceWith(previous));
    assert.deepEqual(values(reviewed.card), [(100.25 + 101.5) / 2, 100.25, 101.5]);
    assert.equal(reviewed.preservedFairValue, false);
    assert.equal(reviewed.missingFairValue, false);
  }
});

test('existing nested and textual range adapters also calculate empty Mid without mutating input', () => {
  for (const fair of [
    {fairValue: {mid: null, low: '80,000원', high: '100,001원'}},
    {fairValue: {mid: '', low: 80000, high: 100001}},
    {fairValue: null, fairValueRange: '80,000 ~ 100,001'},
    {fairValue: '', fairValueLow: '80,000원', fairValueHigh: '100,001원'}
  ]) {
    const input = {...fixture.cards[0]};
    fairKeys.forEach(key => {delete input[key];});
    const item = immutableReview({...input, ...fair});
    assert.deepEqual(values(item.card), [90000.5, 80000, 100001]);
    assert.equal(item.missingFairValue, false);
  }
});

test('all null, empty or omitted valuation fields preserve the prior triplet through prepareBatch', () => {
  for (const low of [null, '', undefined]) for (const mid of [null, '', undefined]) for (const high of [null, '', undefined]) {
    const previous = oldCard(), source = sourceWith(previous), input = {...fixture.cards[0]};
    [mid, low, high].forEach((value, i) => {
      if (value === undefined) delete input[fairKeys[i]];
      else input[fairKeys[i]] = value;
    });
    const item = immutableReview(input, source);
    assert.deepEqual(values(item.card), values(previous));
    assert.equal(item.preservedFairValue, true);
    assert.equal(item.missingFairValue, false);
    const prepared = C.prepareBatch(source, [item], options());
    assert.deepEqual(values(prepared.cards[0]), values(previous));
    assert.equal(prepared.history.length, 0);
    assert.equal(Object.hasOwn(prepared.cards[0], 'preservedFairValue'), false);
    assert.deepEqual(values(source.investmentResearchCards[0]), values(previous));
  }
  const previous = oldCard({fairValue: null, fairValueHigh: null});
  const item = immutableReview({...fixture.cards[0], fairValue: null, fairValueLow: null, fairValueHigh: null}, sourceWith(previous));
  assert.deepEqual(values(item.card), values(previous));
  assert.equal(item.preservedFairValue, true);
});

test('Low only or High only never invents a Mid; an entirely empty new card still warns', () => {
  for (const key of ['fairValueLow', 'fairValueHigh']) {
    for (const source of [blank(), sourceWith(oldCard())]) {
      const input = {...fixture.cards[0], fairValue: null, fairValueLow: null, fairValueHigh: null, [key]: 90000};
      const item = immutableReview(input, source);
      assert.deepEqual(values(item.card), fairKeys.map(k => k === key ? 90000 : null));
      assert.equal(item.preservedFairValue, false);
      assert.equal(item.missingFairValue, true);
    }
  }
  const item = immutableReview({...fixture.cards[0], fairValue: null, fairValueLow: null, fairValueHigh: null});
  assert.deepEqual(values(item.card), [null, null, null]);
  assert.equal(item.preservedFairValue, false);
  assert.equal(item.missingFairValue, true);
});

test('Low greater than High keeps the original error and does not mutate report or stored card', () => {
  for (const mid of [null, '', undefined]) {
    const input = {...fixture.cards[0], fairValue: mid, fairValueLow: 100000, fairValueHigh: 80000};
    if (mid === undefined) delete input.fairValue;
    const rows = freeze([input]), source = freeze(sourceWith(oldCard()));
    const before = structuredClone([rows, source]);
    assert.throws(() => C.reviewReport(rows, source), {message: 'Fair Value는 Low ≤ Mid ≤ High 순서로 입력하세요.'});
    assert.deepEqual([rows, source], before);
  }
});

test('explicit Mid and validation of invalid values retain their existing behavior', () => {
  const input = {...fixture.cards[0], fairValue: 85000, fairValueLow: 80000, fairValueHigh: 100000};
  const item = immutableReview(input);
  assert.deepEqual(values(item.card), [85000, 80000, 100000]);
  assert.equal(item.card.valuationNote, '');
  for (const mid of [0, -1, NaN, Infinity, 'invalid']) {
    assert.throws(() => immutableReview({...input, fairValue: mid}));
  }
});

test('range import uses existing applyBatch persistence and restores original arrays on failure', () => {
  for (const outcome of ['success', 'false', 'throw']) {
    const source = sourceWith(oldCard()), cardsBefore = source.investmentResearchCards, historyBefore = source.investmentResearchHistory;
    const input = {...fixture.cards[0], fairValue: null, fairValueLow: 80000, fairValueHigh: 100001};
    const inputBefore = structuredClone(input), sourceBefore = structuredClone(source);
    const item = C.reviewReport([input], source);
    let calls = 0;
    const persist = () => {
      calls++;
      assert.deepEqual(values(source.investmentResearchCards[0]), [90000.5, 80000, 100001]);
      if (outcome === 'throw') throw Error('fixture save failed');
      return outcome === 'success';
    };
    if (outcome === 'success') {
      C.applyBatch(source, item, persist, options());
      assert.deepEqual(values(source.investmentResearchCards[0]), [90000.5, 80000, 100001]);
      assert.deepEqual(values(cardsBefore[0]), values(sourceBefore.investmentResearchCards[0]));
      assert.equal(Object.hasOwn(source.investmentResearchCards[0], 'preservedFairValue'), false);
    } else {
      assert.throws(() => C.applyBatch(source, item, persist, options()));
      assert.equal(source.investmentResearchCards, cardsBefore);
      assert.equal(source.investmentResearchHistory, historyBefore);
      assert.deepEqual(source, sourceBefore);
    }
    assert.equal(calls, 1);
    assert.deepEqual(input, inputBefore);
  }
});
