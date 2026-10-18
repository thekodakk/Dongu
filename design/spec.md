# Döngü tasarım ve ürün spesifikasyonu

Kişisel işleri, gıdaları ve eşyaları zaman bütçesiyle birleştiren, API ve hesap gerektirmeyen yerel uygulama. Kullanıcı verileri yalnızca aynı tarayıcıdaki localStorage içinde saklanır. Örnek kayıtlar ilk başlangıçta açıkça belirtilir.

Görsel referans: concept.png. 1536×1024 masaüstü. Ivory #f5f3ee, yeşil #163e35, turuncu #df7548, kömür #142521. Sidebar 246px; header 72px; içerik yatay padding 42px. Serif display ve kontrollü sans metin. Büyük yeşil fotoğraflı panel, dairesel zaman seçici, yatay üç metrik, altta bağlantı listesi ve akış. Lucide 1.7px ikonlar. İnce sınırlar, 14px köşeler. Hareket 180ms, reduced-motion destekli. Mobil sidebar yatay gezinme; tek sütun paneller.

Konseptten işlevsel sapmalar: gerçek güncel tarih; gerçek veriye bağlı metrikler; plan boşken açık boş durum; örnek veri notu; fotoğraftaki bitki dekorasyonu sidebar'da tekrarlanmaz. Konseptteki noktalı carousel eklenmez çünkü tek içerik var.

Ekranlar: Genel bakış, yaşam envanteri CRUD ve filtreler, açıklanabilir öneriler ve tamamlama, 7 günlük zaman bütçeli otomatik/manuel plan, tamamlanan döngüler ve kazanılan tahmini süre, profil/yedek içeri alma ve dışarı verme. Silme yerine arşiv, arşivden geri alma. Öneri tamamlama açık kullanıcı onayıyla kayıtları kapatır; geri al mümkündür. Rotalar coğrafi navigasyon değildir, kullanıcının aynı bölge etiketlerini birleştirir.
