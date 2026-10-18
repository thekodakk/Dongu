import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getStorage,
  loadState,
  saveState,
  STORAGE_KEY,
  undoCycle,
} from "./state.js";
import { createSeed, validateImport } from "./engine.js";
test("denied storage getter still opens a usable area and reports persistence failure", () => {
  const storage = getStorage(() => {
    throw new Error("SecurityError");
  });
  const result = loadState(storage, createSeed, validateImport);
  assert.equal(validateImport(result.state), true);
  assert.match(result.error, /okunamadı/);
  assert.match(saveState(storage, result.state), /Kayıt yapılamadı/);
});
test("undoing latest repeated cycle reopens resources while old-cycle undo preserves later completion", () => {
  const state = createSeed();
  state.items[0].status = "done";
  state.history = [
    { id: "first", itemIds: [state.items[0].id] },
    { id: "second", itemIds: [state.items[0].id] },
  ];
  const latest = undoCycle(state, "second");
  assert.equal(latest.items[0].status, "active");
  assert.equal(latest.history.length, 1);
  const earlier = undoCycle(state, "first");
  assert.equal(earlier.items[0].status, "done");
  assert.equal(earlier.history[0].id, "second");
  assert.equal(state.items[0].status, "done");
});
test("invalid saved content is preserved and reported instead of silently overwritten", () => {
  const data = new Map([[STORAGE_KEY, '{"version":99}']]);
  const storage = {
    getItem: (k) => data.get(k),
    setItem: (k, v) => data.set(k, v),
  };
  const result = loadState(storage, createSeed, validateImport);
  assert.match(result.error, /eski kaydınız değiştirilmedi/);
  assert.equal(data.get(STORAGE_KEY), '{"version":99}');
});
test("saved changes roundtrip through versioned storage", () => {
  const data = new Map(),
    storage = {
      getItem: (k) => data.get(k),
      setItem: (k, v) => data.set(k, v),
    };
  const seed = createSeed();
  seed.profile.name = "Test";
  assert.equal(saveState(storage, seed), "");
  assert.deepEqual(loadState(storage, createSeed, validateImport), {
    state: seed,
    error: "",
  });
});
