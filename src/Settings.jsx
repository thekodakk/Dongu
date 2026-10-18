import { useState, useRef } from "react";
import { PageHeading, Button, Modal, Check, Box, Leaf } from "./components.jsx";
import { downloadJSON } from "./state.js";
import { validateImport, createSeed } from "./engine.js";
export default function Settings({ state, onProfile, onImport, notify }) {
  const [name, setName] = useState(state.profile.name),
    [error, setError] = useState(""),
    [pending, setPending] = useState(null),
    [fresh, setFresh] = useState(false);
  const file = useRef();
  const importFile = async (e) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024)
      return setError("Yedek dosyası 5 MB sınırını aşıyor.");
    try {
      const data = JSON.parse(await selected.text());
      if (!validateImport(data)) throw Error();
      setError("");
      setPending(data);
    } catch {
      setError(
        "Bu dosya geçerli bir Döngü yedeği değil. Mevcut kayıtların korundu.",
      );
    }
  };
  return (
    <>
      <PageHeading
        title="Tamamen senin alanın"
        description="Ritmini, verilerini ve kişisel alanını yönet."
      />
      <div className="settings-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Kişisel profil</h2>
            <span className="avatar">
              {state.profile.name.charAt(0).toLocaleUpperCase("tr")}
            </span>
          </div>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              onProfile({ name: name.trim() });
              notify("Profilin güncellendi.");
            }}
          >
            <label>
              Sana nasıl hitap edelim?
              <input
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <p className="fine-print">
              Günlük zamanını Genel bakış veya Akıllı rotalar ekranından
              ayarlayabilirsin.
            </p>
            <Button type="submit">
              <Check size={17} />
              Değişiklikleri kaydet
            </Button>
          </form>
        </section>
        <section className="panel privacy-panel">
          <Leaf size={35} strokeWidth={1.3} />
          <h2>Verilerin, cihazında.</h2>
          <p>
            Hesap yok. API anahtarı yok. Döngü, kayıtlarını bu tarayıcının yerel
            depolamasında tutar.
          </p>
          <p>
            Tarayıcı verilerini temizlemek kayıtları kaldırır. Farklı tarayıcıya
            geçerken yedeğini içeri aktar.
          </p>
          <span className="local-status">
            <span className="status-dot" />
            Yerel çalışma
          </span>
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Yedek ve taşıma</h2>
            <Box size={22} />
          </div>
          <p className="setting-description">
            Kayıtlarını tek dosyada yanında götür. Yedek; profilini,
            envanterini, planını ve geçmişini içerir.
          </p>
          <div className="backup-buttons">
            <Button
              onClick={() => {
                downloadJSON(state);
                notify("Yedek dosyan indiriliyor.");
              }}
            >
              Yedeği dışa aktar
            </Button>
            <Button variant="secondary" onClick={() => file.current.click()}>
              Yedeği içeri aktar
            </Button>
          </div>
          <input
            ref={file}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            aria-label="Döngü yedek dosyası"
            onChange={importFile}
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
        <section className="panel">
          <h2>Yeni bir başlangıç</h2>
          <p className="setting-description">
            Boş bir alanla başlayabilir veya örnek kayıtları tekrar
            deneyebilirsin. Önce yedek almanı öneririz.
          </p>
          <Button variant="secondary" onClick={() => setFresh(true)}>
            Başlangıç seçenekleri
          </Button>
          <p className="fine-print">
            Döngü 1.0 · İnternetsiz yerel kullanım · Açıklanabilir kurallar
          </p>
        </section>
      </div>
      {pending && (
        <Modal title="Yedeği içeri aktar" onClose={() => setPending(null)}>
          <p className="modal-description">
            {pending.profile.name} adına {pending.items.length} kayıt,{" "}
            {pending.plan.length} plan ve {pending.history.length} geçmiş kaydı
            bulundu. Mevcut alanının yerine bu yedek açılacak.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => downloadJSON(state)}>
              Önce mevcut yedeği al
            </Button>
            <Button
              onClick={() => {
                onImport(pending);
                setName(pending.profile.name);
                setPending(null);
                notify("Yedek başarıyla içeri aktarıldı.");
              }}
            >
              Yedeği aç
            </Button>
          </div>
        </Modal>
      )}
      {fresh && (
        <Modal title="Yeni alanını seç" onClose={() => setFresh(false)}>
          <p className="modal-description">
            Mevcut kayıtların değiştirilecek. İstersen önce dışa aktar. Bu
            işlemden sonra ekrandaki “Geri al” düğmesiyle önceki alanını geri
            getirebilirsin.
          </p>
          <div className="reset-options">
            <Button variant="secondary" onClick={() => downloadJSON(state)}>
              Mevcut yedeği al
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                onImport({
                  ...createSeed(),
                  profile: state.profile,
                  items: [],
                  plan: [],
                  history: [],
                });
                setFresh(false);
                notify("Boş alanın hazır.");
              }}
            >
              Boş alanla başla
            </Button>
            <Button
              onClick={() => {
                onImport(createSeed());
                setName("Ece");
                setFresh(false);
                notify("Örnek kayıtlar hazır.");
              }}
            >
              Örnekleri yükle
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
