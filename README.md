> **İlk kurulum:** Node.js kurulu bir bilgisayarda proje klasöründe `npm ci` ve `npm run build` çalıştırın; ardından Windows üzerinde `start.vbs` ile açabilirsiniz. `dist` ve `node_modules` depoya dahil değildir. Tarayıcınızdaki kişisel kayıtlar ve dışa aktarılan yedekler paylaşılmaz.

# DÖNGÜ

DÖNGÜ, günün farklı parçalarını aynı akışta birleştiren kişisel yaşam planlayıcısıdır. İşleri bölge, süre ve hedef tarihleriyle düzenler; uygun işleri bir araya getirerek günlük akışlar oluşturur. Gıdalar için değerlendirme, eşyalar için bakım hatırlatmaları üretir. Hesap, AI servisi veya API anahtarı gerekmez.

## Açılış

Masaüstündeki **Dongu - Baslat** kısayoluna çift tıklayın. Alternatif olarak bu klasördeki `start.vbs` dosyasını açın. Uygulama varsayılan tarayıcıda `http://127.0.0.1:5187` adresinden açılır. Terminal, kurulum komutu veya API ayarı gerekmez. Bu bilgisayarda bulunan Node.js başlatıcı tarafından kullanılır.

İlk açılışta ürünün nasıl çalıştığını göstermek için örnek veriler yüklenir. Kendi işlerinizi ekleyerek kullanmaya başlayabilirsiniz. Gün planları ve kayıtlar tarayıcının yerel depolamasında tutulur. Aynı bilgisayarda farklı tarayıcı veya tarayıcı profili ayrı kayıtlar kullanır; gizli mod kayıtları kalıcı olmayabilir. Tarayıcı verilerini temizlemeden önce uygulamadaki dışa aktarma seçeneğiyle JSON yedeği alın. Yedeğinizi içe aktararak geri yükleyebilirsiniz.

## Planlama mantığı

Bölge alanları canlı harita veya navigasyon hizmeti kullanmaz; sizin belirlediğiniz etiketlerdir. Aynı bölgede yapılan işleri gruplamak tekrar gidişleri azaltmaya yardımcı olur. Tasarruf ve süre göstergeleri girilen süreler ile uygulamanın planlama kurallarından üretilen tahminlerdir; ölçülmüş trafik veya rota verileri değildir. Uygulama verileri herhangi bir AI hizmetine göndermez.

Yerel sunucu yalnızca bu bilgisayarda erişilebilen `127.0.0.1` adresini dinler. Tekrar kısayola tıkladığınızda çalışan DÖNGÜ sunucusu kullanılır. 5187 portunu başka bir uygulama kullanıyorsa açıklayıcı bir hata görünür; o uygulamayı kapatıp tekrar deneyin. Başlatma hataları `.dongu-server.log` dosyasına yazılır. Tarayıcı sekmesini kapatmak arka plandaki yerel sunucuyu durdurmaz; Windows yeniden başlatıldığında sunucu kapanır, kayıtlar tarayıcıda kalır.

## Geliştirici

Kaynak kod React ve Vite kullanır. Geliştirme için Node.js gereklidir:

```powershell
npm install
npm run dev
```

Masaüstü başlatıcısının sunacağı üretim dosyalarını yenilemek için:

```powershell
npm run build
```

`server.cjs` yalnızca Node.js standart kütüphanesine bağlıdır ve `dist` klasörünü sunar. Üretim sunucusu sabit port kullandığı için masaüstü açılışlarında tarayıcı kayıtlarının adresi değişmez. Proje taşınırsa masaüstü kısayolunun `start.vbs` hedefini yeni konuma güncelleyin.
