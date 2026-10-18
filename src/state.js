export const STORAGE_KEY = "dongu.local.v1";
export function undoCycle(state, historyId) {
  const index = state.history.findIndex((h) => h.id === historyId);
  if (index < 0) return state;
  const entry = state.history[index];
  const later = state.history.slice(index + 1);
  return {
    ...state,
    history: state.history.filter((h) => h.id !== historyId),
    items: state.items.map((i) =>
      entry.itemIds.includes(i.id) &&
      !later.some((h) => h.itemIds.includes(i.id))
        ? { ...i, status: "active" }
        : i,
    ),
  };
}
export function getStorage(accessor = () => window.localStorage) {
  try {
    return accessor();
  } catch {
    return {
      getItem() {
        throw new Error("Storage unavailable");
      },
      setItem() {
        throw new Error("Storage unavailable");
      },
    };
  }
}
export function loadState(storage, seed, validate) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { state: seed(), error: "" };
    const data = JSON.parse(raw);
    if (!validate(data))
      return {
        state: seed(),
        error:
          "Kayıtlı veri okunamadı. Örnek alan açıldı; eski kaydınız değiştirilmedi.",
      };
    return { state: data, error: "" };
  } catch {
    return {
      state: seed(),
      error: "Tarayıcı kaydı okunamadı. Yedek almadan sayfayı kapatmayın.",
    };
  }
}
export function saveState(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return "";
  } catch {
    return "Kayıt yapılamadı. Verilerinizi Ayarlar ekranından dışa aktarın.";
  }
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dateLabel(day) {
  return new Date(day + "T12:00:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}
export function downloadJSON(state) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `dongu-yedek-${localDate()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
