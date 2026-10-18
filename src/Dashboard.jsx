import {
  PageHeading,
  Button,
  ArrowRight,
  ChevronRight,
  Clock,
  Box,
  Check,
  icons,
  CalendarDays,
  Empty,
} from "./components.jsx";
import { stats } from "./engine.js";
import { localDate } from "./state.js";
export function TimeBudget({ value, onChange }) {
  const circumference = 2 * Math.PI * 73;
  return (
    <section className="time-budget">
      <div className="section-heading">
        <h2>Günün dengesi</h2>
        <span title="Gün içinde bu işlere ayırmak istediğin süre">◷</span>
      </div>
      <div className="time-ring">
        <svg viewBox="0 0 180 180" aria-hidden="true">
          <circle cx="90" cy="90" r="73" className="ring-track" />
          <circle
            cx="90"
            cy="90"
            r="73"
            className="ring-fill"
            strokeDasharray={`${(circumference * value) / 240} ${circumference}`}
            transform="rotate(-90 90 90)"
          />
        </svg>
        <div>
          <strong>{value} dk</strong>
          <span>Kullanılabilir zaman</span>
        </div>
      </div>
      <label className="range-label">
        <span className="sr-only">Günlük zaman bütçesi</span>
        <input
          type="range"
          min="5"
          max="240"
          step="5"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
      <div className="range-caption">
        <span>Sakin</span>
        <span>Dengeli</span>
        <span>Yoğun</span>
      </div>
    </section>
  );
}
export function SuggestionRow({ suggestion, onClick }) {
  const Icon = icons[suggestion.type];
  return (
    <button className="suggestion-row" onClick={() => onClick(suggestion)}>
      <span
        className={`round-icon ${suggestion.type === "route" ? "orange" : ""}`}
      >
        <Icon size={24} />
      </span>
      <span className="suggestion-copy">
        <strong>{suggestion.title}</strong>
        <span>{suggestion.description}</span>
      </span>
      <ChevronRight size={19} />
    </button>
  );
}
export default function Dashboard({
  state,
  suggestions,
  setBudget,
  navigate,
  onSuggestion,
}) {
  const numbers = stats(state),
    firstRoute = suggestions.find((s) => s.type === "route");
  const todayPlan = state.plan.filter((p) => p.day === localDate());
  return (
    <>
      <PageHeading
        title="Hayatın, daha uyumlu"
        description="Elindekileri değerlendir. Zamanına yer aç."
        action={
          <div className="today-date">
            <span>
              {new Date().toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <small>
              {new Date().toLocaleDateString("tr-TR", { weekday: "long" })}
            </small>
            <CalendarDays size={22} />
          </div>
        }
      />
      <div className="dashboard-top">
        <section className="hero-panel">
          <div className="hero-copy">
            <h2>
              Bugün küçük
              <br />
              bir döngü başlat.
            </h2>
            <p>Bir yolculuk. Üç iş. Daha az efor.</p>
            <Button
              onClick={() =>
                firstRoute ? onSuggestion(firstRoute) : navigate("routes")
              }
            >
              Rotamı oluştur <ArrowRight size={19} />
            </Button>
          </div>
          <span className="hero-footer">Küçük adımlar, büyük uyum.</span>
        </section>
        <TimeBudget value={state.profile.dailyMinutes} onChange={setBudget} />
      </div>
      <div className="metrics">
        {[
          [Clock, "Bekleyen işler", numbers.activeTasks, "inventory"],
          [Box, "Öncelikli kaynaklar", numbers.urgentResources, "inventory"],
          [Check, "Tamamlanan döngüler", numbers.completedCycles, "insights"],
        ].map(([Icon, label, value, page]) => (
          <button key={label} onClick={() => navigate(page)}>
            <span className="metric-icon">
              <Icon size={27} strokeWidth={1.6} />
            </span>
            <span>
              <small>{label}</small>
              <strong>{value}</strong>
            </span>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
      <div className="dashboard-bottom">
        <section className="panel connections">
          <div className="section-heading">
            <h2>Senin için bağlantılar</h2>
            <button className="text-button" onClick={() => navigate("routes")}>
              Tümünü gör <ArrowRight size={17} />
            </button>
          </div>
          {suggestions.length ? (
            suggestions
              .slice(0, 3)
              .map((s) => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  onClick={onSuggestion}
                />
              ))
          ) : (
            <Empty title="Şimdilik her şey dengede.">
              Yeni kayıt ekle veya günlük zamanını artır.
            </Empty>
          )}
        </section>
        <section className="panel flow">
          <div className="section-heading">
            <h2>Bugünün akışı</h2>
            <button className="text-button" onClick={() => navigate("plan")}>
              Takvime aç <ArrowRight size={17} />
            </button>
          </div>
          {todayPlan.length ? (
            <div className="timeline">
              {todayPlan.map((p, i) => (
                <div key={p.id}>
                  <span className="timeline-dot" />
                  <small>{String(9 + i * 2).padStart(2, "0")}:00</small>
                  <section>
                    <h3>{p.title}</h3>
                    <p>
                      {p.minutes} dakika · {p.itemIds.length} kayıt
                    </p>
                  </section>
                </div>
              ))}
            </div>
          ) : (
            <div className="flow-empty">
              <div className="flow-illustration">
                <CalendarDays size={40} strokeWidth={1.1} />
                <span>01 — 07</span>
              </div>
              <h3>Gününe biraz yer aç.</h3>
              <p>
                Bağlantılarını haftaya yerleştir.
                <br />
                Planın, zamanına göre şekillensin.
              </p>
              <button className="text-button" onClick={() => navigate("plan")}>
                Haftamı planla <ArrowRight size={17} />
              </button>
            </div>
          )}
        </section>
      </div>
      <div className="demo-note">
        <span className="status-dot" />
        Veriler bu tarayıcıda saklanır. İlk açılış örnek kayıtlarla başlar.
      </div>
    </>
  );
}
