/**
 * Firestore dokümanını düz nesneye çevirir — DOKÜMAN ID'Sİ HER ZAMAN KAZANIR.
 *
 * NEDEN: `{ id: snap.id, ...snap.data() }` yazımı sessiz bir tuzak. Doküman
 * ALANLARI arasında bir `id` varsa (migration kalıntısı; ör. `groups/6lJK...`
 * dokümanı artık var olmayan `yZbPbDwwuZYkorVsRAv6` değerini `id` alanında
 * taşıyordu), spread `id:` anahtarını EZER ve uygulama yanlış bir id ile
 * çalışır. Sonuçları:
 *   - `deleteDoc(doc(db,'groups', yanlışId))` var OLMAYAN dokümanı siler;
 *     Firestore'da silme idempotenttir, HATA VERMEZ → "başarıyla silindi"
 *     bildirimi çıkar ama kayıt yerinde kalır (kullanıcı bug raporu).
 *   - `updateDoc` aynı durumda `not-found` ile patlar → düzenleme kaydedilemez.
 *
 * Kural: id her zaman spread'den SONRA yazılır. Bu yardımcı o sırayı tek yerde
 * sabitler; okuma yollarında `{ id: ..., ...data }` yazımı KULLANILMAMALIDIR.
 */

export interface DocSnapshotLike<T = Record<string, any>> {
  id: string
  data: () => T | undefined
}

/** Tek dokümanı `{...alanlar, id}` olarak döndürür (id alan değerini ezer). */
export function docWithId<T = Record<string, any>>(snap: DocSnapshotLike<T>): T & { id: string } {
  return { ...(snap.data() as T), id: snap.id }
}

/** Doküman listesini `{...alanlar, id}` nesnelerine çevirir. */
export function docsWithId<T = Record<string, any>>(
  snaps: Array<DocSnapshotLike<T>>
): Array<T & { id: string }> {
  return snaps.map(s => docWithId<T>(s))
}
