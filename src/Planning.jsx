import { useState } from "react";
import {
  PageHeading,
  Button,
  Empty,
  ArrowRight,
  icons,
  CalendarDays,
  Plus,
  Modal,
} from "./components.jsx";
import { SuggestionRow, TimeBudget } from "./Dashboard.jsx";
import { localDate, dateLabel } from "./state.js";
export function Routes({ state, suggestions, onSuggestion, setBudget }) {
  const [type, setType] = useState("all");
  const types = {
    all: "Tüm bağlantılar",
    route: "Birleşik rotalar",
    meal: "Mutfak",
    care: "Bakım",
  };
  const filtered = suggestions.filter((s) => type === "all" || s.type === type);
  return (
    <>
      <PageHeading
        title="Küçük işler, büyük bağlantılar"
        description="Aynı bölge, yakın tarihler, ortak ihtiyaçlar. Elindekilerden yeni bir yol çıkar."
      />
      <div className="routes-layout">
        <div>
          <div className="tabs route-tabs">
            {Object.entries(types).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setType(k)}
                className={type === k ? "selected" : ""}
              >
                {v}
              </button>
            ))}
          </div>
          {filtered.length ? (
            filtered.map((s) => (
              <section className="route-card" key={s.id}>
                <SuggestionRow suggestion={s} onClick={onSuggestion} />
                <div className="route-card-bottom">
                  <span>
                    {s.itemIds.length} kayıt <span>·</span> {s.minutes} dakika
                  </span>
                  <span className="savings">
                    {s.savedMinutes > 0
                      ? `${s.savedMinutes} dk tahmini kazanım`
                      : "Önce elindekini değerlendir"}
                  </span>
                </div>
                <div className="route-reason">{s.reason}</div>
                <button className="text-button" onClick={() => onSuggestion(s)}>
                  Döngüyü incele <ArrowRight size={17} />
                </button>
              </section>
            ))
          ) : (
            <Empty title="Bu süreye uygun bağlantı yok.">
              Günlük zamanını artır veya aynı bölgede en az iki iş ekle.
            </Empty>
          )}
        </div>
        <aside>
          <TimeBudget value={state.profile.dailyMinutes} onChange={setBudget} />
          <div className="explanation">
            <h3>Bağlantılar nasıl bulunuyor?</h3>
            <p>
              Döngü, girdiğin bölge, tarih ve süreleri karşılaştırır. Her
              önerinin gerekçesini açıkça gösterir.
            </p>
            <p>
              Rotanın yol süresi tek çıkış için 15 dakika varsayılır. Konum veya
              canlı harita kullanılmaz.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
export function PlanAdd({ suggestion, state, onClose, onSave }) {
  const [day, setDay] = useState(localDate()),
    [error, setError] = useState("");
  return (
    <Modal title="Gününde bir yer aç" onClose={onClose}>
      <p className="modal-description">
        {suggestion.title} · {suggestion.minutes} dakika
      </p>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            state.plan.some((p) =>
              p.itemIds.some((id) => suggestion.itemIds.includes(id)),
            )
          )
            return setError(
              "Bu kayıtların bazıları zaten planında. Önce mevcut plan kaydını kaldır.",
            );
          const total = state.plan
            .filter((p) => p.day === day)
            .reduce((n, p) => n + p.minutes, 0);
          if (total + suggestion.minutes > state.profile.dailyMinutes)
            return setError(
              "Bu günün zaman bütçesi doluyor. Başka gün seç veya zaman bütçesini artır.",
            );
          onSave({
            id: crypto.randomUUID(),
            day,
            title: suggestion.title,
            minutes: suggestion.minutes,
            itemIds: suggestion.itemIds,
          });
        }}
      >
        <label>
          Hangi gün?
          <input
            type="date"
            required
            min="1900-01-01"
            max="2200-12-31"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <Button type="submit">
            <Plus size={17} />
            Plana ekle
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function WeeklyPlan({
  state,
  onGenerate,
  onRemove,
  onComplete,
  onNew,
  navigate,
}) {
  const [offset, setOffset] = useState(0);
  const start = new Date(localDate() + "T12:00:00");
  start.setDate(start.getDate() + offset);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return localDate(d);
  });
  const [confirm, setConfirm] = useState(false);
  const generate = () => {
    if (state.plan.length) setConfirm(true);
    else onGenerate(days[0]);
  };
  return (
    <>
      <PageHeading
        title="Haftana nefes aldır"
        description="Her şeye yetişmek yerine, zamanına sığan bir plan yap."
        action={
          <Button onClick={generate}>
            <CalendarDays size={18} />
            Haftamı oluştur
          </Button>
        }
      />
      <div className="plan-toolbar">
        <div>
          <button
            className="icon-button"
            aria-label="Önceki hafta"
            onClick={() => setOffset((o) => o - 7)}
          >
            ←
          </button>
          <strong>
            {dateLabel(days[0])} — {dateLabel(days[6])}
          </strong>
          <button
            className="icon-button"
            aria-label="Sonraki hafta"
            onClick={() => setOffset((o) => o + 7)}
          >
            →
          </button>
          <button className="text-button" onClick={() => setOffset(0)}>
            Bugüne dön
          </button>
        </div>
        <span>Günlük {state.profile.dailyMinutes} dk bütçe</span>
      </div>
      <div className="week-grid">
        {days.map((day) => {
          const entries = state.plan.filter((p) => p.day === day),
            total = entries.reduce((n, p) => n + p.minutes, 0);
          return (
            <section
              key={day}
              className={`day-column ${day === localDate() ? "today" : ""}`}
            >
              <div className="day-header">
                <span>
                  {new Date(day + "T12:00:00").toLocaleDateString("tr-TR", {
                    weekday: "short",
                  })}
                </span>
                <strong>{new Date(day + "T12:00:00").getDate()}</strong>
                <small>
                  {total} / {state.profile.dailyMinutes} dk
                </small>
                <div className="day-progress">
                  <span
                    style={{
                      width: `${Math.min(100, (total / state.profile.dailyMinutes) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="day-content">
                {entries.map((p) => (
                  <article className="plan-entry" key={p.id}>
                    <span>{p.itemIds.length} kayıt</span>
                    <h3>{p.title}</h3>
                    <small>{p.minutes} dakika</small>
                    <div>
                      <button onClick={() => onComplete(p)}>Tamamla</button>
                      <button
                        aria-label={`${p.title} plandan kaldır`}
                        onClick={() => onRemove(p.id)}
                      >
                        Kaldır
                      </button>
                    </div>
                  </article>
                ))}
                {!entries.length && (
                  <button
                    className="day-add"
                    onClick={() => navigate("routes")}
                  >
                    <Plus size={19} />
                    <span>Bağlantı seç</span>
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {!state.plan.length && (
        <div className="plan-tip">
          <div className="round-icon">
            <CalendarDays />
          </div>
          <div>
            <h3>Planı biz yerleştirelim, ritmi sen belirle.</h3>
            <p>
              “Haftamı oluştur” kayıtlarını, tarihleri ve günlük zamanını
              dikkate alarak yedi güne dağıtır.
            </p>
          </div>
        </div>
      )}
      {confirm && (
        <Modal
          title="Haftanı yeniden düzenle"
          onClose={() => setConfirm(false)}
        >
          <p className="modal-description">
            Mevcut planın, seçtiğin haftaya göre yeniden oluşturulacak. Envanter
            kayıtların korunur.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Vazgeç
            </Button>
            <Button
              onClick={() => {
                onGenerate(days[0]);
                setConfirm(false);
              }}
            >
              Yeniden oluştur
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
