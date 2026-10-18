const TYPES = ["route", "meal", "care"];
const ZONES = ["Merkez", "Ev", "Mahalle"];
const dateString = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const today = () => dateString(new Date());
const addDays = (date, days) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return dateString(d);
};
const daysUntil = (due, day) =>
  Math.round(
    (Date.parse(`${due}T12:00:00Z`) - Date.parse(`${day}T12:00:00Z`)) /
      86400000,
  );
const urgency = (item, day) =>
  120 - Math.max(-30, Math.min(100, daysUntil(item.due, day)));
const ordered = (items, day) =>
  [...items].sort(
    (a, b) => urgency(b, day) - urgency(a, day) || a.id.localeCompare(b.id),
  );

export function createSeed() {
  const day = today();
  const rows = [
    [
      "market",
      "Haftalık market alışverişi",
      "task",
      "Merkez",
      18,
      120,
      1,
      "1 liste",
      "Eksikleri tek seferde tamamla.",
    ],
    [
      "kargo",
      "Kargo iadesini bırak",
      "task",
      "Merkez",
      8,
      350,
      1,
      "1 paket",
      "İade kodunu ve paketi yanında götür.",
    ],
    [
      "recycle",
      "Camları geri dönüşüme götür",
      "task",
      "Merkez",
      6,
      15,
      2,
      "1 torba",
      "Camları güvenli biçimde taşı.",
    ],
    [
      "library",
      "Kütüphane kitabını teslim et",
      "task",
      "Mahalle",
      12,
      25,
      3,
      "1 kitap",
      "Dönüş yolunda uğrayabilirsin.",
    ],
    [
      "repair",
      "Terziye uğra",
      "task",
      "Mahalle",
      10,
      180,
      5,
      "1 pantolon",
      "Onarım fiyatını teslimden önce sor.",
    ],
    [
      "drawer",
      "Çekmeceyi düzenle",
      "task",
      "Ev",
      15,
      30,
      6,
      "1 çekmece",
      "Kullanmadıklarını ayrı bir kutuya koy.",
    ],
    [
      "spinach",
      "Ispanak",
      "food",
      "Ev",
      8,
      45,
      1,
      "1 demet",
      "Etiketi ve saklama koşullarını kontrol et.",
    ],
    [
      "chickpea",
      "Haşlanmış nohut",
      "food",
      "Ev",
      7,
      35,
      2,
      "1 kavanoz",
      "Açılış tarihini kontrol et.",
    ],
    [
      "tomato",
      "Domates",
      "food",
      "Ev",
      5,
      30,
      4,
      "4 adet",
      "Kullanmadan önce durumunu kontrol et.",
    ],
    [
      "filter",
      "Su filtresi",
      "item",
      "Ev",
      10,
      220,
      3,
      "1 filtre",
      "Üreticinin bakım talimatına göre kontrol et.",
    ],
    [
      "shoe",
      "Günlük ayakkabı",
      "item",
      "Ev",
      12,
      900,
      5,
      "1 çift",
      "Temizlik ve taban kontrolü yap.",
    ],
    [
      "plant",
      "Salon bitkisi",
      "item",
      "Ev",
      5,
      150,
      1,
      "1 saksı",
      "Sulamadan önce toprağı kontrol et.",
    ],
  ];
  return {
    version: 1,
    profile: { name: "Ece", dailyMinutes: 65 },
    items: rows.map(
      ([id, title, kind, zone, minutes, value, offset, quantity, notes]) => ({
        id,
        title,
        kind,
        zone,
        minutes,
        value,
        due: addDays(day, offset),
        status: "active",
        quantity,
        notes,
      }),
    ),
    plan: [],
    history: [],
  };
}

// Small bounded knapsack: choose a useful affordable group even when the full route exceeds the budget.
function routeSubset(items, budget, day) {
  const capacity = Math.min(240, Math.floor(budget - 15));
  if (capacity < 2) return [];
  const dp = Array.from({ length: capacity + 1 }, () => [null, null, null]);
  dp[0][0] = { items: [], score: 0 };
  for (const item of ordered(items, day)) {
    for (let n = capacity; n >= item.minutes; n--) {
      for (let count = 2; count >= 0; count--) {
        const previous = dp[n - item.minutes][count];
        if (!previous) continue;
        const nextCount = Math.min(2, count + 1);
        const candidate = {
          items: [...previous.items, item],
          score: previous.score + urgency(item, day),
        };
        if (!dp[n][nextCount] || candidate.score > dp[n][nextCount].score)
          dp[n][nextCount] = candidate;
      }
    }
  }
  return (
    dp.reduce(
      (best, row) =>
        row[2] && (!best || row[2].score > best.score) ? row[2] : best,
      null,
    )?.items ?? []
  );
}

function suggestionsForDay(state, availableMinutes, day) {
  const budget = Math.max(0, Math.min(240, Number(availableMinutes) || 0));
  const active = state.items.filter((i) => i.status === "active");
  const suggestions = [];
  const make = (type, selected, title, description, reason, overhead = 0) => {
    const minutes = selected.reduce((n, item) => n + item.minutes, overhead);
    if (!selected.length || minutes > budget) return;
    suggestions.push({
      id: `${type}:${selected.map((i) => encodeURIComponent(i.id)).join("|")}`,
      type,
      title,
      description,
      reason,
      minutes,
      savedMinutes: type === "route" ? 15 * (selected.length - 1) : 0,
      itemIds: selected.map((i) => i.id),
      steps: [
        ...(overhead
          ? [{ title: "Ortak gidiş ve dönüş", minutes: overhead }]
          : []),
        ...selected.map((i) => ({ title: i.title, minutes: i.minutes })),
      ],
      score:
        Math.max(...selected.map((i) => urgency(i, day))) +
        (type === "route" ? 3 : 0),
    });
  };
  for (const zone of ZONES.filter((z) => z !== "Ev")) {
    const selected = routeSubset(
      active.filter((i) => i.kind === "task" && i.zone === zone),
      budget,
      day,
    );
    if (selected.length >= 2)
      make(
        "route",
        selected,
        `${zone} turu`,
        `${selected.length} işi tek çıkışta tamamla.`,
        `Aynı bölgedeki işler birleştirilince ${15 * (selected.length - 1)} dakika tahmini yol süresi kazanılır.`,
        15,
      );
  }
  const foods = ordered(
    active.filter((i) => i.kind === "food" && daysUntil(i.due, day) <= 3),
    day,
  );
  for (let a = 0; a < foods.length; a++) {
    const partner = foods
      .slice(a + 1)
      .find((i) => i.minutes + foods[a].minutes <= budget);
    if (partner) {
      make(
        "meal",
        [foods[a], partner],
        "Mutfakta bir döngü kapat",
        `${foods[a].title} ve ${partner.title} için birlikte hazırlık planla.`,
        "Kayıtlı tarihler yaklaşıyor. Önce etiketi, saklama koşullarını ve ürünlerin durumunu kontrol et; tarih güvenli tüketim garantisi değildir.",
      );
      break;
    }
  }
  for (const item of ordered(
    active.filter((i) => i.kind === "item" && daysUntil(i.due, day) <= 7),
    day,
  ))
    make(
      "care",
      [item],
      `${item.title} bakım zamanı`,
      item.notes || "Kısa bir kontrol ve bakım için zaman ayır.",
      "Kaydettiğin bakım tarihi yaklaşıyor; ürüne uygun bakım talimatını kontrol et.",
    );
  return suggestions.sort(
    (a, b) => b.score - a.score || a.id.localeCompare(b.id),
  );
}

export function getSuggestions(
  state,
  availableMinutes = state.profile.dailyMinutes,
) {
  return suggestionsForDay(state, availableMinutes, today());
}

export function completeSuggestion(state, suggestion) {
  if (
    !suggestion ||
    !text(suggestion.id, 100000) ||
    !text(suggestion.title, 500) ||
    !Number.isInteger(suggestion.minutes) ||
    !number(suggestion.minutes, 1, 240) ||
    !Number.isInteger(suggestion.savedMinutes) ||
    !number(suggestion.savedMinutes, 0, 15000) ||
    !TYPES.includes(suggestion.type) ||
    !Array.isArray(suggestion.itemIds) ||
    !suggestion.itemIds.length ||
    new Set(suggestion.itemIds).size !== suggestion.itemIds.length
  )
    return state;
  const ids = new Set(suggestion.itemIds);
  if (
    suggestion.itemIds.some(
      (id) => !state.items.some((i) => i.id === id && i.status === "active"),
    )
  )
    return state;
  const historyIds = new Set(state.history.map((h) => h.id));
  let historyId = suggestion.id;
  let occurrence = 2;
  while (historyIds.has(historyId))
    historyId = `${suggestion.id}#${occurrence++}`;
  return {
    ...state,
    items: state.items.map((i) =>
      ids.has(i.id) ? { ...i, status: "done" } : i,
    ),
    plan: state.plan.filter((p) => !p.itemIds.some((id) => ids.has(id))),
    history: [
      ...state.history,
      {
        id: historyId,
        title: suggestion.title,
        date: today(),
        minutes: suggestion.minutes,
        savedMinutes: suggestion.savedMinutes,
        type: suggestion.type,
        itemIds: [...suggestion.itemIds],
      },
    ],
  };
}

export function buildWeeklyPlan(state, startDate = today()) {
  if (!validDate(startDate)) return [];
  const used = new Set();
  const plan = [];
  for (let index = 0; index < 7; index++) {
    const day = addDays(startDate, index);
    let remaining = state.profile.dailyMinutes;
    const remainingState = () => ({
      ...state,
      items: state.items.filter((i) => !used.has(i.id)),
    });
    for (const suggestion of suggestionsForDay(
      remainingState(),
      remaining,
      day,
    )) {
      if (
        suggestion.minutes > remaining ||
        suggestion.itemIds.some((id) => used.has(id))
      )
        continue;
      plan.push({
        id: `plan-${day}-${suggestion.id}`,
        day,
        title: suggestion.title,
        minutes: suggestion.minutes,
        itemIds: [...suggestion.itemIds],
      });
      suggestion.itemIds.forEach((id) => used.add(id));
      remaining -= suggestion.minutes;
    }
    for (const item of ordered(
      remainingState().items.filter(
        (i) => i.kind === "task" && i.status === "active",
      ),
      day,
    )) {
      const minutes = item.minutes + (item.zone === "Ev" ? 0 : 15);
      if (minutes > remaining) continue;
      plan.push({
        id: `plan-${day}-${item.id}`,
        day,
        title: item.title,
        minutes,
        itemIds: [item.id],
      });
      used.add(item.id);
      remaining -= minutes;
    }
  }
  return plan;
}

const record = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value, max = 500) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
const number = (value, min, max) =>
  Number.isFinite(value) && value >= min && value <= max;
function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value >= "1900-01-01" &&
    value <= "2200-12-31"
  );
}

export function validateImport(data) {
  try {
    if (
      !record(data) ||
      data.version !== 1 ||
      !record(data.profile) ||
      !text(data.profile.name, 80) ||
      !Number.isInteger(data.profile.dailyMinutes) ||
      !number(data.profile.dailyMinutes, 5, 240)
    )
      return false;
    if (
      ![data.items, data.plan, data.history].every(
        (a) => Array.isArray(a) && a.length <= 1000,
      )
    )
      return false;
    const ids = new Set();
    for (const i of data.items) {
      if (
        !record(i) ||
        !text(i.id, 100) ||
        ids.has(i.id) ||
        !text(i.title, 200) ||
        !["task", "food", "item"].includes(i.kind) ||
        !ZONES.includes(i.zone) ||
        !Number.isInteger(i.minutes) ||
        !number(i.minutes, 1, 240) ||
        !number(i.value, 0, 10000000) ||
        !validDate(i.due) ||
        !["active", "done"].includes(i.status) ||
        typeof i.quantity !== "string" ||
        i.quantity.length > 100 ||
        typeof i.notes !== "string" ||
        i.notes.length > 2000
      )
        return false;
      ids.add(i.id);
    }
    const refs = (values) =>
      Array.isArray(values) &&
      values.length > 0 &&
      values.length <= 1000 &&
      new Set(values).size === values.length &&
      values.every((id) => ids.has(id));
    const seenPlan = new Set(),
      plannedItems = new Set(),
      dailyTotals = new Map();
    for (const p of data.plan) {
      if (
        !record(p) ||
        !text(p.id, 100000) ||
        seenPlan.has(p.id) ||
        !text(p.title, 500) ||
        !validDate(p.day) ||
        !Number.isInteger(p.minutes) ||
        !number(p.minutes, 1, 240) ||
        !refs(p.itemIds) ||
        p.itemIds.some((id) => plannedItems.has(id))
      )
        return false;
      seenPlan.add(p.id);
      p.itemIds.forEach((id) => plannedItems.add(id));
      dailyTotals.set(p.day, (dailyTotals.get(p.day) || 0) + p.minutes);
      if (dailyTotals.get(p.day) > data.profile.dailyMinutes) return false;
    }
    const historyIds = new Set();
    for (const h of data.history) {
      if (
        !record(h) ||
        !text(h.id, 100000) ||
        historyIds.has(h.id) ||
        !text(h.title, 500) ||
        !validDate(h.date) ||
        !Number.isInteger(h.minutes) ||
        !number(h.minutes, 1, 240) ||
        !Number.isInteger(h.savedMinutes) ||
        !number(h.savedMinutes, 0, 15000) ||
        !TYPES.includes(h.type) ||
        !refs(h.itemIds)
      )
        return false;
      historyIds.add(h.id);
    }
    return true;
  } catch {
    return false;
  }
}

export function stats(state) {
  return {
    activeTasks: state.items.filter(
      (i) => i.kind === "task" && i.status === "active",
    ).length,
    urgentResources: state.items.filter(
      (i) =>
        i.kind !== "task" &&
        i.status === "active" &&
        daysUntil(i.due, today()) <= 3,
    ).length,
    completedCycles: state.history.length,
    savedMinutes: state.history.reduce((sum, h) => sum + h.savedMinutes, 0),
  };
}
