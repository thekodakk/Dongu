import {
  PageHeading,
  Empty,
  icons,
  Button,
  ArrowRight,
  Clock,
  Check,
  Leaf,
} from "./components.jsx";
import { stats } from "./engine.js";
import { dateLabel, localDate } from "./state.js";
export default function Insights({ state, navigate, onUndoHistory }) {
  const s = stats(state);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return localDate(d);
  });
  const counts = days.map(
    (day) => state.history.filter((h) => h.date === day).length,
  );
  const max = Math.max(3, ...counts);
  return (
    <>
      <PageHeading
        title="Küçük adımların izi"
        description="Daha az dağınıklık. Daha çok alan. Tamamladığın her döngü burada."
      />
      <div className="insight-banner">
        <div>
          <h2>Zamanını geri kazan.</h2>
          <p>Kazancın, başka bir şeye yer açmak.</p>
        </div>
        <div>
          <strong>
            {s.savedMinutes}
            <span>dk</span>
          </strong>
          <small>Tahmini toplam zaman kazanımı</small>
        </div>
      </div>
      <div className="insight-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Son 7 günün ritmi</h2>
            <span>{s.completedCycles} döngü toplam</span>
          </div>
          <div
            className="bar-chart"
            role="img"
            aria-label={`Son yedi günde tamamlanan döngü sayıları: ${counts.join(", ")}`}
          >
            {days.map((day, i) => (
              <div key={day}>
                <span className="chart-value">{counts[i]}</span>
                <div className="bar-track">
                  <div style={{ height: `${(counts[i] / max) * 100}%` }} />
                </div>
                <small>
                  {new Date(day + "T12:00:00").toLocaleDateString("tr-TR", {
                    weekday: "short",
                  })}
                </small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel impact-notes">
          <Leaf size={32} strokeWidth={1.3} />
          <h2>Etki, alışkanlıkla büyür.</h2>
          <p>
            Birleştirdiğin rotalar, ayrı ayrı çıkışlara göre tahmini yol
            süresini azaltır. Her birleştirilen ek iş için 15 dakika hesaplanır.
          </p>
          <div>
            <strong>
              {state.items.filter((i) => i.status === "done").length}
            </strong>
            <span>tamamlanan / arşivlenen kayıt</span>
          </div>
          <p className="fine-print">
            Para veya karbon kazancı iddiası üretilmez. Zaman hesabı sabit
            varsayıma dayanır.
          </p>
        </section>
      </div>
      <section className="panel history">
        <div className="section-heading">
          <h2>Tamamladığın döngüler</h2>
          <span>En yeniler önce</span>
        </div>
        {state.history.length ? (
          [...state.history].reverse().map((h) => {
            const Icon = icons[h.type];
            return (
              <div className="history-row" key={h.id}>
                <span className="round-icon">
                  <Icon size={21} />
                </span>
                <div>
                  <h3>{h.title}</h3>
                  <small>
                    {dateLabel(h.date)} · {h.minutes} dk · {h.itemIds.length}{" "}
                    kayıt
                  </small>
                </div>
                <strong>
                  {h.savedMinutes > 0 ? `+${h.savedMinutes} dk` : "Tamamlandı"}
                </strong>
                <button
                  className="text-button"
                  onClick={() => onUndoHistory(h)}
                >
                  Geri al
                </button>
              </div>
            );
          })
        ) : (
          <Empty
            title="İlk döngün seni bekliyor."
            action={
              <Button onClick={() => navigate("routes")}>
                Bağlantılara bak <ArrowRight size={17} />
              </Button>
            }
          >
            Bir bağlantıyı tamamladığında etkisini burada göreceksin.
          </Empty>
        )}
      </section>
    </>
  );
}
