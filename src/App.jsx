import { useState, useMemo, useRef, useEffect } from "react";
import {
  icons,
  Button,
  Plus,
  Search,
  Menu,
  Modal,
  SuggestionDetail,
  Check,
  X,
} from "./components.jsx";
import Dashboard from "./Dashboard.jsx";
import Inventory, { ItemForm } from "./Inventory.jsx";
import { Routes, WeeklyPlan, PlanAdd } from "./Planning.jsx";
import Insights from "./Insights.jsx";
import Settings from "./Settings.jsx";
import {
  createSeed,
  getSuggestions,
  completeSuggestion,
  buildWeeklyPlan,
  validateImport,
} from "./engine.js";
import {
  loadState,
  saveState,
  localDate,
  getStorage,
  undoCycle,
} from "./state.js";
const nav = {
  overview: "Genel bakış",
  inventory: "Yaşam envanteri",
  routes: "Akıllı rotalar",
  plan: "Haftalık plan",
  insights: "Etki raporu",
  settings: "Ayarlar",
};
export default function App() {
  const storage = useMemo(() => getStorage(), []);
  const loaded = useMemo(
    () => loadState(storage, createSeed, validateImport),
    [storage],
  );
  const [state, setState] = useState(loaded.state),
    [page, setPage] = useState("overview"),
    [search, setSearch] = useState(""),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [storageError, setStorageError] = useState(loaded.error),
    [mobile, setMobile] = useState(false),
    [undo, setUndo] = useState(null);
  const blocked = useRef(Boolean(loaded.error)),
    timer = useRef();
  const notify = (message) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 5000);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  const update = (next) => {
    if (!validateImport(next)) {
      notify(
        "Bu değişiklik uygulanamadı. Tarih ve süre değerlerini kontrol et.",
      );
      return;
    }
    setUndo(state);
    setState(next);
    if (!blocked.current) {
      const error = saveState(storage, next);
      setStorageError(error);
    }
  };
  const navigate = (p) => {
    setPage(p);
    setMobile(false);
    setSearch("");
  };
  const setBudget = (minutes) => {
    update({
      ...state,
      profile: { ...state.profile, dailyMinutes: minutes },
      plan: state.plan.filter(
        (p) =>
          state.plan
            .filter((q) => q.day === p.day)
            .reduce((n, q) => n + q.minutes, 0) <= minutes,
      ),
    });
  };
  const suggestions = useMemo(() => getSuggestions(state), [state]);
  const onComplete = (s) => {
    const next = completeSuggestion(state, s);
    if (next === state)
      return notify(
        "Bu bağlantı artık etkin değil. Güncel bağlantıları kontrol et.",
      );
    update(next);
    setModal(null);
    notify("Döngü tamamlandı. Gününe biraz daha yer açtın.");
  };
  const saveItem = (item) => {
    if (
      !state.items.some((i) => i.id === item.id) &&
      state.items.length >= 1000
    )
      return notify("1000 kayıt sınırına ulaştın.");
    const exists = state.items.some((i) => i.id === item.id);
    update({
      ...state,
      items: exists
        ? state.items.map((i) => (i.id === item.id ? item : i))
        : [...state.items, item],
      plan: state.plan.filter((p) => !p.itemIds.includes(item.id)),
    });
    setModal(null);
    notify(
      exists
        ? "Kayıt güncellendi. İlgili planı yeniden ekleyebilirsin."
        : "Yeni kayıt envanterine eklendi.",
    );
  };
  const archive = (item) => {
    update({
      ...state,
      items: state.items.map((i) =>
        i.id === item.id ? { ...i, status: "done" } : i,
      ),
      plan: state.plan.filter((p) => !p.itemIds.includes(item.id)),
    });
    setModal(null);
    notify("Kayıt tamamlandı ve arşive taşındı.");
  };
  const newItem = () => setModal({ type: "item" });
  const showSuggestion = (s) => setModal({ type: "suggestion", data: s });
  const restoreHistory = (h) => {
    update(undoCycle(state, h.id));
    notify("Döngü geri alındı. Kayıtlar tekrar etkin.");
  };
  const completePlan = (p) => {
    const current = state.items.filter(
      (i) => p.itemIds.includes(i.id) && i.status === "active",
    );
    if (current.length !== p.itemIds.length)
      return notify(
        "Bu planın kayıtları artık etkin değil. Planı yeniden oluştur.",
      );
    const route =
      current.length >= 2 &&
      current.every(
        (i) =>
          i.kind === "task" && i.zone !== "Ev" && i.zone === current[0].zone,
      );
    const type = route
      ? "route"
      : current.some((i) => i.kind === "food")
        ? "meal"
        : "care";
    setModal({
      type: "suggestion",
      data: {
        ...p,
        type,
        id: `completed-${p.id}`,
        description: "Planladığın döngüyü tamamla.",
        reason: "Bu bağlantı, haftalık planından seçildi.",
        savedMinutes: route ? 15 * (current.length - 1) : 0,
        steps: current.map((i) => ({ title: i.title, minutes: i.minutes })),
      },
    });
  };
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <button
          className="brand"
          onClick={() => navigate("overview")}
          aria-label="Döngü genel bakış"
        >
          döngü<span>•</span>
        </button>
        <nav aria-label="Ana gezinme">
          {Object.entries(nav).map(([key, label]) => {
            const Icon = icons[key];
            return (
              <button
                key={key}
                className={page === key ? "active" : ""}
                onClick={() => navigate(key)}
              >
                <Icon size={23} strokeWidth={1.6} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-line" />
          <p>
            Daha dengeli
            <br />
            bir hayat,
            <br />
            mümkün.
          </p>
          <span>
            küçük adımlar
            <br />
            büyük uyum
          </span>
        </div>
        <div className="sidebar-profile">
          <span className="avatar">
            {state.profile.name.charAt(0).toLocaleUpperCase("tr")}
          </span>
          <div>
            <strong>{state.profile.name}</strong>
            <small>Kişisel alan</small>
          </div>
          <button
            className="icon-button"
            aria-label="Profil ayarları"
            onClick={() => navigate("settings")}
          >
            <icons.settings size={18} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            onClick={() => setMobile((v) => !v)}
            aria-expanded={mobile}
            aria-label="Menüyü aç"
          >
            <Menu size={23} />
          </button>
          <div className="breadcrumb">
            Kişisel alan <span>/</span> {nav[page]}
          </div>
          <div className="topbar-actions">
            <label className="search">
              <Search size={19} />
              <input
                aria-label="Envanterde ara"
                placeholder="Arama yap..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage("inventory");
                }}
              />
              <span>/</span>
            </label>
            <Button onClick={newItem}>
              <Plus size={18} />
              <span>Yeni ekle</span>
            </Button>
            <button
              className="avatar"
              onClick={() => navigate("settings")}
              aria-label="Profilini aç"
            >
              {state.profile.name.charAt(0).toLocaleUpperCase("tr")}
            </button>
          </div>
        </header>
        {storageError && (
          <div className="storage-warning" role="alert">
            {storageError}
            <Button variant="secondary" onClick={() => navigate("settings")}>
              Yedek al
            </Button>
            <button
              onClick={() => {
                blocked.current = false;
                setStorageError(saveState(storage, state));
              }}
            >
              Bu alanı kaydet
            </button>
          </div>
        )}
        <main>
          {page === "overview" && (
            <Dashboard
              state={state}
              suggestions={suggestions}
              setBudget={setBudget}
              navigate={navigate}
              onSuggestion={showSuggestion}
            />
          )}{" "}
          {page === "inventory" && (
            <Inventory
              state={state}
              search={search}
              onEdit={(i) => setModal({ type: "item", data: i })}
              onNew={newItem}
              onArchive={(i) => setModal({ type: "archive", data: i })}
              onToggle={(i) => {
                update({
                  ...state,
                  items: state.items.map((x) =>
                    x.id === i.id ? { ...x, status: "active" } : x,
                  ),
                });
                notify("Kayıt yeniden etkinleştirildi.");
              }}
            />
          )}
          {page === "routes" && (
            <Routes
              state={state}
              suggestions={suggestions}
              onSuggestion={showSuggestion}
              setBudget={setBudget}
            />
          )}{" "}
          {page === "plan" && (
            <WeeklyPlan
              state={state}
              navigate={navigate}
              onComplete={completePlan}
              onGenerate={(start) => {
                update({ ...state, plan: buildWeeklyPlan(state, start) });
                notify("Haftalık planın zaman bütçene göre hazırlandı.");
              }}
              onRemove={(id) =>
                update({
                  ...state,
                  plan: state.plan.filter((p) => p.id !== id),
                })
              }
            />
          )}{" "}
          {page === "insights" && (
            <Insights
              state={state}
              navigate={navigate}
              onUndoHistory={restoreHistory}
            />
          )}{" "}
          {page === "settings" && (
            <Settings
              state={state}
              notify={notify}
              onProfile={(profile) =>
                update({ ...state, profile: { ...state.profile, ...profile } })
              }
              onImport={(data) => {
                blocked.current = false;
                update(data);
              }}
            />
          )}
        </main>
        <footer>
          <span>döngü</span>
          <p>Hayatın, daha uyumlu.</p>
          <span className="local-status">
            <span className="status-dot" />
            Cihazında saklanır
          </span>
        </footer>
      </div>
      {modal?.type === "item" && (
        <ItemForm
          item={modal.data}
          onSave={saveItem}
          onClose={() => setModal(null)}
        />
      )}{" "}
      {modal?.type === "suggestion" && (
        <SuggestionDetail
          suggestion={modal.data}
          onClose={() => setModal(null)}
          onComplete={onComplete}
          onPlan={(s) => setModal({ type: "planadd", data: s })}
        />
      )}{" "}
      {modal?.type === "planadd" && (
        <PlanAdd
          state={state}
          suggestion={modal.data}
          onClose={() => setModal(null)}
          onSave={(p) => {
            update({ ...state, plan: [...state.plan, p] });
            setModal(null);
            notify("Döngü planına eklendi.");
          }}
        />
      )}{" "}
      {modal?.type === "archive" && (
        <Modal title="Bu kayıt tamamlandı mı?" onClose={() => setModal(null)}>
          <p className="modal-description">
            “{modal.data.title}” arşive taşınacak ve ilgili plan kaydı
            kaldırılacak. Arşivden yeniden etkinleştirebilirsin.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setModal(null)}>
              Vazgeç
            </Button>
            <Button onClick={() => archive(modal.data)}>
              <Check size={17} />
              Tamamla
            </Button>
          </div>
        </Modal>
      )}
      {(toast || undo) && (
        <div className="toast" role="status">
          <span className="toast-icon">
            <Check size={17} />
          </span>
          <span>{toast || "Değişiklik kaydedildi."}</span>
          {undo && (
            <button
              onClick={() => {
                const previous = undo;
                setState(previous);
                setUndo(null);
                if (!blocked.current)
                  setStorageError(saveState(storage, previous));
                notify("Son değişiklik geri alındı.");
              }}
            >
              Geri al
            </button>
          )}
          <button
            className="toast-close"
            aria-label="Bildirimi kapat"
            onClick={() => {
              setToast("");
              setUndo(null);
            }}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
