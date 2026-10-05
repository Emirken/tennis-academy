# Üye Kayıt Formu (UTA Dijital Form) — Tasarım

Tarih: 2026-09-25 · Kaynak: `UTA Dijital Form Taslağı.docx` · Onay: kullanıcı (2026-09-25)
Kapsam: önce **tennis-academy** (Vue 3 + Vuetify + Firestore), sonra **tenis-project-new**
(NestJS + Prisma + React). İki projede alan adları ve seçenek değerleri **birebir aynı**
(Firestore → Postgres taşıma scripti eşlemeyi düz kopyalar).

## Amaç

Öğrencinin kendi kaydı sırasında akademinin üye kayıt formundaki bilgileri toplamak,
öğrenci kaydında filtrelenebilir biçimde saklamak ve admin/boss'a göstermek. Kayıt sonrası
akış aynı kalır: öğrenci `pending` olur, admin/boss'a "Ad Soyad (telefon) kayıt olmak
istiyor." bildirimi gider, onaylanana kadar öğrenci yalnız "onay bekleniyor" uyarısını görür.

## Kullanıcı kararları

| Konu | Karar |
|---|---|
| Eğitim türü | Çoklu seçim (en az 1) |
| Onaylar | 2 zorunlu kutu (sorumluluk beyanı, veri kullanımı) + ayrı, isteğe bağlı pazarlama izni |
| Admin kapsamı | Detayda "Kayıt Formu" bölümü + düzenleme + liste filtreleri + CSV |
| Form düzeni | 4 adımlı sihirbaz |
| Veri yeri | Öğrenci kaydında düz alanlar (veli/adres alanlarıyla aynı desen) |

## Veri modeli (iki projede aynı)

| Alan | Tip | Doğrulama |
|---|---|---|
| `heightCm`, `weightKg` | tam sayı | isteğe bağlı; boy 50–250, kilo 10–250 |
| `occupation` | metin | isteğe bağlı, ≤100 |
| `address` | metin (mevcut) | isteğe bağlı, ≤300 |
| `isMinor` | boolean | zorunlu; doğum tarihiyle çelişemez |
| `parentFirstName`, `parentLastName`, `parentPhone` | metin (mevcut) | `isMinor` ise zorunlu; telefon `0XXXXXXXXXX` |
| `parentEmail` | metin | isteğe bağlı, geçerli e-posta |
| `parentRelation` | `mother` \| `father` \| `other` | isteğe bağlı |
| `trainingTypes` | liste: `private_lesson`, `adult_group`, `tennis_school`, `court_rental`, `other` | en az 1 |
| `trainingTypeOther` | metin | `other` seçiliyse zorunlu, ≤200 |
| `hasHealthCondition` | boolean | zorunlu (Evet/Hayır) |
| `healthConditionNote` | metin | `hasHealthCondition` ise zorunlu, ≤1000 |
| `specialCareNote`, `coachNote` | metin | isteğe bağlı, ≤1000 |
| `referralSource` | `instagram`, `facebook`, `google`, `website`, `friend`, `existing_student`, `other` | zorunlu |
| `referralDetail` | metin | `friend` → referans ismi, `other` → açıklama; ikisinde zorunlu, ≤200 |
| `waiverAcceptedAt` | zaman damgası | kayıtta zorunlu onayın kanıtı |
| `dataConsentAcceptedAt` | zaman damgası | kayıtta zorunlu onayın kanıtı |
| `marketingConsent` | boolean | isteğe bağlı (varsayılan false) |
| `marketingConsentAt` | zaman damgası | `marketingConsent` true ise |

- **Kayıt tarihi** = mevcut `createdAt`. tenis-project-new'de silinmiş bir hesap aynı
  telefonla yeniden kayıt olunca satır yeniden açılır; o durumda `createdAt` da sıfırlanır.
- Mevcut zorunlu alanlar değişmez: ad, soyad, telefon, e-posta, doğum tarihi, seviye, şifre.
- Dokümanda yıldızsız olduğu hâlde **zorunlu** yapılanlar (önerildi, itiraz gelmedi):
  sağlık "Evet/Hayır" ve "Nereden duydunuz".
- `isMinor` false ise veli alanları yazılmaz.
- Mevcut öğrencilerde alanlar boştur; ekranlar boşu "—" gösterir. Yaş filtresi `isMinor`
  yoksa doğum tarihinden hesaplar.

## Kayıt formu — 4 adım

1. **Hesap:** ad, soyad, telefon, e-posta, şifre, şifre tekrar.
2. **Kişisel / Veli:** doğum tarihi, boy, kilo, adres, meslek, "Öğrenci 18 yaşından küçük
   mü?"; evet ise veli adı, soyadı, telefonu, e-postası, yakınlık (Anne/Baba/Diğer).
   Doğum tarihi girilince 18 yaş sorusu (kullanıcı elle seçmediyse) otomatik işaretlenir.
3. **Başvuru ve Sağlık:** eğitim türü (çoklu, "Diğer" açıklaması), seviye, sağlık durumu
   (Hayır/Evet + açıklama), düzenli dikkat edilmesi gereken durum, antrenöre not.
4. **Nereden duydunuz ve Onaylar:** kaynak + koşullu detay; iki metin ve her birinin
   altında zorunlu kutu; isteğe bağlı pazarlama izni; "Kayıt Ol".

Kurallar: "İleri" yalnız o adımı doğrular (hatalar o adımda görünür), "Geri" değerleri
korur. Gönderimde tüm adımlar doğrulanır; hata varsa ilk hatalı adıma dönülür. Sunucu
"telefon kayıtlı" derse 1. adıma dönülür. Doğrulama her projede tek kaynaktadır
(Proje A: `src/utils/registrationForm.ts`; Proje B: shared Zod şeması — hem sayfa hem API).

Onay metinleri (dokümandan birebir):

- Sorumluluk: "Kendi iradem ile katıldığım tenis antrenmanlarında doğabilecek her türlü
  sağlık problemi, maddi ve manevi zararlarda tüm sorumluluğun tarafıma ait olduğunu
  kabul, beyan ve taahhüt ederim."
- Veri kullanımı: "Bilgilerimin kayıt işlemlerinin yürütülmesi amacıyla kullanılmasını
  kabul ediyorum."
- Pazarlama (yeni, isteğe bağlı): "Kampanya, etkinlik ve duyurulardan SMS, e-posta veya
  telefonla haberdar olmak istiyorum."

Metinlerin hukuki uygunluğu (KVKK açık rıza, 6563 ticari ileti izni) akademinin hukuk
danışmanınca teyit edilmelidir.

## Kayıt akışı, bildirim, onay bekleme

### Proje A (tennis-academy)

- **Hata düzeltmesi:** `register()` girişsiz `users` sorgusu (silinmiş telefon kontrolü)
  atıyordu; kurallar girişsiz okumaya hiç izin vermediği için 2026-05-12'den beri kayıt
  büyük olasılıkla hep hata veriyordu. Sorgu kaldırılır. Silme akışı zaten Auth kaydını
  siler ve telefonu temizler; silinmiş kişi yeniden kayıt olursa yeni bekleyen kayıt olur.
  Auth hesabı duruyorsa (`email-already-in-use`): girilen şifreyle giriş → belge yoksa
  (reddedilmiş) yeniden oluşturulur; belge silinmişse "hesap silinmiş" mesajı, aksi hâlde
  "zaten kayıtlı" mesajı verilir ve oturum kapatılır.
- Kayıt belgesi tek saf fonksiyonla kurulur (iki kopya kalkar); bildirim yazımı başarısız
  olsa da kayıt başarılı sayılır (admin bekleyenleri users'tan da görür).
- Bildirim metni: `Ad Soyad (0555 123 45 67) kayıt olmak istiyor.` (gerçek ve sentetik).
- **Boss:** bildirim aboneliği, bekleyen kayıt listesi ve rozet yalnız `role === 'admin'`
  için çalışıyordu → boss da görür ve onaylar.
- **Kurallar:** `isValidSelfRegistration` beyaz listesine yeni alanlar + tip/uzunluk/enum
  denetimi. Onay alanları kurallarda zorunlu **tutulmaz** (kurallar uygulamadan önce
  yayınlanınca eski istemci kayıtları kırılmasın); zorunluluk arayüzde.

### Proje B (tenis-project-new)

- `selfRegisterDto` yeni alanlarla genişler (shared Zod + koşullu kurallar); onaylar
  `true` olmadan kayıt 400 döner; onay zamanlarını sunucu yazar.
- Silinmiş hesabın yeniden açılmasında eski form/veli verisi yeni cevaplarla ezilir,
  `createdAt` sıfırlanır.
- Bildirim metni A ile aynı.
- Onay bekleyen öğrenci API'den de rezervasyon açamaz (bugün yalnız web engelliyor).
- Onay bekleme ekranı durumu 30 sn'de bir yeniler; onaylanınca kendiliğinden açılır.
- Firestore → Postgres taşıma scripti yeni alanları eşler.

## Admin tarafı (iki projede)

- Öğrenci detayında **"Kayıt Formu"** bölümü (okuma + düzenleme). Onay zamanları salt
  okunur; pazarlama iznini admin yalnız **geri alabilir** (açamaz).
- Veli alanları `needsParentInfo(üyelik) || isMinor` ise gösterilir/saklanır → admin
  düzenlemesi reşit olmayan öğrencinin veli bilgisini artık silmez. Proje A'da liste
  eşlemesi veli alanlarını hiç okumuyordu (düzenleme veli bilgisini siliyordu) → düzelir.
- **Filtreler** (istemci tarafı): eğitim türü, nereden duydu, yaş (18 altı/yetişkin),
  pazarlama izni (var/yok), sağlık durumu bildirenler, kayıt tarihi aralığı.
- **CSV:** filtrelenmiş liste; sağlık notları ve boy/kilo CSV'ye girmez.
- **Silme:** anonimleştirme listesine veli alanları ve yeni kişisel/sağlık alanları
  eklenir (onay zaman damgaları kanıt olarak kalır).

## Test ve doğrulama

- Saf fonksiyon birim testleri: adım doğrulama, 18 yaş/doğum tarihi tutarlılığı, belge
  kurma, bildirim metni, filtre, CSV, silme yaması, veli görünürlüğü.
- Proje A: `usersSelfWriteRules.spec` (istemci yükü ⊆ kural beyaz listesi), emülatörde
  kural testleri, `npm run build`, emülatörde tarayıcıyla uçtan uca.
- Proje B: API (auth/users/reservations/migration helper), web (kayıt sihirbazı, liste
  yardımcıları) testleri, migration lokal DB'de, tarayıcıyla uçtan uca.

## Kapsam dışı

Mevcut öğrencilere formu doldurtmak; öğrencinin bu alanları kendi profilinden düzenlemesi;
bildirimden öğrenci detayına bağlantı; deploy (ayrıca onay gerekir).

## Deploy notu (onay bekler)

- Proje A: önce `firestore:rules` (canlı kurallarla karşılaştırarak; `deviceTokens` notu),
  hemen ardından Netlify.
- Proje B: normal API + web deploy'u; migration konteyner açılışında otomatik uygulanır.
