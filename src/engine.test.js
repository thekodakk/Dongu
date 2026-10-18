import test from "node:test";
import assert from "node:assert/strict";
import {
  createSeed,
  getSuggestions,
  completeSuggestion,
  buildWeeklyPlan,
  validateImport,
  stats,
} from "./engine.js";

const item = (
  id,
  minutes = 10,
  kind = "task",
  due = "2026-10-06",
  zone = "Merkez",
) => ({
  id,
  title: id,
  kind,
  zone,
  minutes,
  value: 20,
  due,
  status: "active",
  quantity: "1 adet",
  notes: "",
});
const state = (items) => ({
  version: 1,
  profile: { name: "Ece", dailyMinutes: 65 },
  items,
  plan: [],
  history: [],
});

test("seed imports cleanly and provides tasks, food and belongings", () => {
  const seed = createSeed();
  assert.equal(validateImport(seed), true);
  assert.equal(seed.items.filter((i) => i.kind === "task").length, 6);
  assert.equal(seed.items.filter((i) => i.kind === "food").length, 3);
  assert.equal(seed.items.filter((i) => i.kind === "item").length, 3);
});

test("route selects affordable subset and computes shared travel savings", () => {
  const data = state([
    item("a", 10),
    item("b", 10),
    item("c", 100),
    item("home", 5, "task", "2026-10-06", "Ev"),
  ]);
  const routes = getSuggestions(data, 35).filter((s) => s.type === "route");
  assert.equal(routes.length, 1);
  assert.deepEqual(routes[0].itemIds, ["a", "b"]);
  assert.equal(routes[0].minutes, 35);
  assert.equal(routes[0].savedMinutes, 15);
  assert.equal(
    routes[0].steps.reduce((sum, s) => sum + s.minutes, 0),
    35,
  );
  assert.deepEqual(getSuggestions(data, 20), []);
});

test("suggestions do not mutate or consume resources and ignore completed items", () => {
  const data = state([
    item("food1", 5, "food", "2000-01-01", "Ev"),
    item("food2", 5, "food", "2000-01-02", "Ev"),
    item("care", 10, "item", "2000-01-01", "Ev"),
  ]);
  const before = structuredClone(data);
  const suggestions = getSuggestions(data);
  assert.equal(suggestions.filter((s) => s.type === "meal").length, 1);
  assert.equal(suggestions.filter((s) => s.type === "care").length, 1);
  assert.deepEqual(data, before);
  data.items[0].status = "done";
  assert.equal(getSuggestions(data).filter((s) => s.type === "meal").length, 0);
});

test("completion is immutable and prevents double counting overlapping cycles", () => {
  const data = state([item("a"), item("b")]);
  const suggestion = getSuggestions(data)[0];
  const result = completeSuggestion(data, suggestion);
  assert.equal(data.items[0].status, "active");
  assert.ok(result.items.every((i) => i.status === "done"));
  assert.equal(result.history.length, 1);
  assert.deepEqual(stats(result), {
    activeTasks: 0,
    urgentResources: 0,
    completedCycles: 1,
    savedMinutes: 15,
  });
  assert.deepEqual(completeSuggestion(result, suggestion), result);
  assert.equal(validateImport(result), true);
});

test("weekly plan stays within daily limits and schedules each item at most once", () => {
  const data = state([
    item("a"),
    item("b"),
    item("c", 40, "task", "2026-10-06", "Ev"),
    item("tooLong", 100),
  ]);
  const plan = buildWeeklyPlan(data, "2026-10-06");
  assert.ok(plan.length >= 2);
  assert.equal(plan[0].day, "2026-10-06");
  assert.equal(plan[0].minutes, 35);
  const ids = plan.flatMap((p) => p.itemIds);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal(ids.includes("tooLong"), false);
  for (const day of new Set(plan.map((p) => p.day)))
    assert.ok(
      plan.filter((p) => p.day === day).reduce((n, p) => n + p.minutes, 0) <=
        65,
    );
  assert.equal(validateImport({ ...data, plan }), true);
  assert.equal(data.plan.length, 0);
});

test("import rejects malformed dates, bounds, duplicates and detailed plan/history", () => {
  const seed = createSeed();
  for (const mutate of [
    (d) => {
      d.profile.dailyMinutes = 0;
    },
    (d) => {
      d.items[0].due = "2026-02-30";
    },
    (d) => {
      d.items[0].minutes = Infinity;
    },
    (d) => {
      d.items[0].value = -1;
    },
    (d) => {
      d.items[0].status = "unknown";
    },
    (d) => {
      d.items[1].id = d.items[0].id;
    },
    (d) => {
      d.plan = [
        {
          id: "p",
          day: "2026-10-06",
          title: "p",
          minutes: 20,
          itemIds: ["missing"],
        },
      ];
    },
    (d) => {
      d.history = [
        {
          id: "h",
          title: "h",
          date: "2026-10-06",
          minutes: 20,
          savedMinutes: -1,
          type: "route",
          itemIds: [],
        },
      ];
    },
  ]) {
    const data = structuredClone(seed);
    mutate(data);
    assert.equal(validateImport(data), false);
  }
  assert.equal(validateImport(null), false);
  assert.equal(validateImport({}), false);
});

test("distinct task groups cannot collide in completion identifiers", () => {
  const first = state([item("a-b"), item("c")]);
  const second = state([item("a"), item("b-c")]);
  const together = state([...first.items, ...second.items]);
  const result = completeSuggestion(
    completeSuggestion(together, getSuggestions(first)[0]),
    getSuggestions(second)[0],
  );
  assert.equal(result.history.length, 2);
});

test("completion rejects invalid durations instead of corrupting saved data", () => {
  const data = state([item("a"), item("b")]);
  const suggestion = getSuggestions(data)[0];
  assert.deepEqual(
    completeSuggestion(data, { ...suggestion, minutes: NaN }),
    data,
  );
  assert.deepEqual(
    completeSuggestion(data, { ...suggestion, savedMinutes: -20 }),
    data,
  );
});

test("reactivated inventory can complete another cycle without duplicating history IDs", () => {
  const initial = state([item("a"), item("b")]);
  const suggestion = getSuggestions(initial)[0];
  const first = completeSuggestion(initial, suggestion);
  const reactivated = {
    ...first,
    items: first.items.map((i) => ({ ...i, status: "active" })),
  };
  const second = completeSuggestion(
    reactivated,
    getSuggestions(reactivated)[0],
  );
  assert.equal(second.history.length, 2);
  assert.notEqual(second.history[0].id, second.history[1].id);
  assert.equal(second.history[1].title, suggestion.title);
  assert.equal(stats(second).savedMinutes, 30);
  assert.deepEqual(completeSuggestion(second, suggestion), second);
  assert.equal(validateImport(second), true);
});
