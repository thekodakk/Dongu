import { useState } from "react";
import {
  PageHeading,
  Button,
  Plus,
  Empty,
  icons,
  Modal,
  Check,
} from "./components.jsx";
import { dateLabel, localDate } from "./state.js";
const kinds = { all: "Tümü", task: "İşler", food: "Gıdalar", item: "Eşyalar" };
export function ItemForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(
    item || {
      title: "",
      kind: "task",
      zone: "Merkez",
      minutes: 15,
      value: 0,
      due: localDate(),
      quantity: "",
      notes: "",
    },
  );
  const [error, setError] = useState("");
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Bir kayıt adı yaz.");
    if (form.due < "1900-01-01" || form.due > "2200-12-31")
      return setError("1900–2200 arasında bir tarih seç.");
    onSave({
      ...form,
      title: form.title.trim(),
      minutes: Number(form.minutes),
      value: Number(form.value),
      id: form.id || crypto.randomUUID(),
      status: form.status || "active",
    });
  };
  return (
    <Modal
      title={item ? "Kaydı düzenle" : "Hayatına bir kayıt ekle"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="form">
        <label>
          Kayıt adı
          <input
            required
            maxLength={200}
            value={form.title}
            placeholder="Örn. Kargo iadesini bırak"
            onChange={(e) => set("title", e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Tür
            <select
              value={form.kind}
              onChange={(e) => set("kind", e.target.value)}
            >
              <option value="task">İş / yapılacak</option>
              <option value="food">Gıda / malzeme</option>
              <option value="item">Eşya / bakım</option>
            </select>
          </label>
          <label>
            Bölge
            <select
              value={form.zone}
              onChange={(e) => set("zone", e.target.value)}
            >
              <option>Merkez</option>
              <option>Mahalle</option>
              <option>Ev</option>
            </select>
          </label>
          <label>
            Ayıracağın süre (dk)
            <input
              type="number"
              min="1"
              max="240"
              step="1"
              required
              value={form.minutes}
              onChange={(e) => set("minutes", e.target.value)}
            />
          </label>
          <label>
            {form.kind === "food" ? "Değerlendirme tarihi" : "Hedef tarih"}
            <input
              type="date"
              required
              min="1900-01-01"
              max="2200-12-31"
              value={form.due}
              onChange={(e) => set("due", e.target.value)}
            />
          </label>
          <label>
            Miktar
            <input
              maxLength={100}
              value={form.quantity}
              placeholder="1 paket, 2 adet…"
              onChange={(e) => set("quantity", e.target.value)}
            />
          </label>
          <label>
            Kayıt değeri (₺, isteğe bağlı)
            <input
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              value={form.value}
              onChange={(e) => set("value", e.target.value)}
            />
          </label>
        </div>
        <label>
          Not
          <textarea
            maxLength={2000}
            rows="3"
            value={form.notes}
            placeholder="Yanına alman gerekenler, bakım notu…"
            onChange={(e) => set("notes", e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit">
            <Check size={17} />
            Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default function Inventory({
  state,
  search,
  onEdit,
  onNew,
  onToggle,
  onArchive,
}) {
  const [kind, setKind] = useState("all"),
    [status, setStatus] = useState("active"),
    [sort, setSort] = useState("due");
  const rows = state.items
    .filter(
      (i) =>
        (kind === "all" || i.kind === kind) &&
        i.status === status &&
        `${i.title} ${i.zone} ${i.notes}`
          .toLocaleLowerCase("tr")
          .includes(search.toLocaleLowerCase("tr")),
    )
    .sort((a, b) =>
      sort === "due"
        ? a.due.localeCompare(b.due)
        : a.title.localeCompare(b.title, "tr"),
    );
  return (
    <>
      <PageHeading
        title="Elindekiler, bir arada"
        description="İşlerini, malzemelerini ve eşyalarını aynı yerden yönet."
        action={
          <Button onClick={onNew}>
            <Plus size={18} />
            Yeni kayıt
          </Button>
        }
      />
      <div className="inventory-summary">
        <div>
          <span>Yaşam envanteri</span>
          <strong>
            {state.items.filter((i) => i.status === "active").length}
            <small>aktif kayıt</small>
          </strong>
        </div>
        <p>
          Birbirine bağlanan küçük işler,
          <br />
          daha ferah bir günün başlangıcı.
        </p>
      </div>
      <div className="filter-bar">
        <div className="tabs">
          {Object.entries(kinds).map(([key, label]) => (
            <button
              key={key}
              className={kind === key ? "selected" : ""}
              onClick={() => setKind(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="filter-selects">
          <select
            aria-label="Kayıt durumu"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">Aktif kayıtlar</option>
            <option value="done">Tamamlanan / arşiv</option>
          </select>
          <select
            aria-label="Sıralama"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="due">Tarihe göre</option>
            <option value="title">Ada göre</option>
          </select>
        </div>
      </div>
      <div className="inventory-table">
        {rows.length ? (
          <>
            <div className="table-header">
              <span>Kayıt</span>
              <span>Bölge</span>
              <span>Tarih</span>
              <span>Süre</span>
              <span>İşlemler</span>
            </div>
            {rows.map((i) => {
              const Icon = icons[i.kind];
              return (
                <article className="inventory-row" key={i.id}>
                  <button className="item-title" onClick={() => onEdit(i)}>
                    <span className={`square-icon ${i.kind}`}>
                      <Icon size={22} />
                    </span>
                    <span>
                      <strong>{i.title}</strong>
                      <small>{i.quantity || kinds[i.kind]}</small>
                    </span>
                  </button>
                  <span className="zone-label">{i.zone}</span>
                  <span
                    className={
                      i.due <= localDate() && i.status === "active"
                        ? "due-soon"
                        : ""
                    }
                  >
                    {dateLabel(i.due)}
                  </span>
                  <span>{i.minutes} dk</span>
                  <div className="row-actions">
                    <button onClick={() => onEdit(i)}>Düzenle</button>
                    <button
                      title={
                        i.status === "active"
                          ? "Tamamla / arşivle"
                          : "Yeniden etkinleştir"
                      }
                      onClick={() =>
                        i.status === "active" ? onArchive(i) : onToggle(i)
                      }
                    >
                      {i.status === "active" ? "Tamamla" : "Geri al"}
                    </button>
                  </div>
                </article>
              );
            })}
          </>
        ) : (
          <Empty title="Bu görünümde kayıt yok.">
            Filtrelerini değiştir veya yeni bir kayıtla başla.
          </Empty>
        )}
      </div>
      <p className="fine-print">
        Tamamlanan kayıtlar arşivde kalır. Gıdalarda tarih, güvenli tüketim
        garantisi değil; kişisel hatırlatmandır.
      </p>
    </>
  );
}
