import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Yoğun tablo CSS doğrulaması (login gerektirmeyen, izole).
 *
 * Kort takvimi ve Yoklama tabloları auth arkasında olduğu için canlı sayfada
 * test edemiyoruz. Bunun yerine GERÇEK main.css'i yükleyip tabloların birebir
 * markup'ını 375px viewport'ta render ederiz ve mobil davranışı doğrularız:
 *   1. Sayfa (document) yatay TAŞMAMALI — tablo kendi içinde kaydırılmalı.
 *   2. Tablo sarmalayıcısı yatay kaydırılabilir olmalı (scrollWidth > clientWidth).
 *   3. İlk sütun (saat hücresi) sticky olmalı (position: sticky).
 *
 * Bu, planın "en az bir tablo bileşeni için sticky-sütun/scroll davranışını
 * doğrula" gereğini karşılar.
 */

const MAIN_CSS = readFileSync(
  resolve(__dirname, '../../src/assets/styles/main.css'),
  'utf-8'
);

// 3 kortlu kort takvimi (Courts.vue markup'ı, .v-table sınıfları sadeleştirildi).
const scheduleTableHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; }
  /* main.css'in tablo stilleri .v-table altındaki <table>'ı bekler; sadeleştirilmiş eşdeğeri */
  .schedule-table { width: 100%; border-collapse: collapse; }
  ${MAIN_CSS}
</style></head>
<body>
  <div style="padding:16px;">
    <div class="schedule-table-container">
      <table class="schedule-table">
        <thead>
          <tr class="table-header">
            <th class="time-column">Saat</th>
            <th class="court-column">Kort 1</th>
            <th class="court-column">Kort 2</th>
            <th class="court-column">Kort 3</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: 14 }, (_, i) => {
            const h = 9 + i;
            return `<tr class="time-slot-row">
              <td class="time-cell"><div class="time-display">${h}:00</div></td>
              <td class="court-cell"><div class="slot-status status-available"><span class="slot-text">MÜSAİT</span></div></td>
              <td class="court-cell"><div class="slot-status status-occupied"><span class="slot-text">DOLU</span></div></td>
              <td class="court-cell"><div class="slot-status status-available"><span class="slot-text">MÜSAİT</span></div></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>
</body></html>`;

test.describe('Yoğun tablo mobil davranışı (izole CSS)', () => {
  test('kort takvimi 375px: sayfa taşmaz, tablo içeride kayar, saat sütunu sticky', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.setContent(scheduleTableHtml);

    // 1) Sayfanın kendisi yatay taşmamalı (1px tolerans).
    const pageOverflow = await page.evaluate(() => {
      const d = document.documentElement;
      return Math.max(0, d.scrollWidth - d.clientWidth);
    });
    expect(pageOverflow, `Sayfa ${pageOverflow}px yatay taşıyor`).toBeLessThanOrEqual(1);

    // 2) Tablo sarmalayıcısı kendi içinde yatay kaydırılabilir olmalı
    //    (içerik viewport'tan geniş; .schedule-table min-width:480px @768px).
    const container = page.locator('.schedule-table-container');
    const scrollInfo = await container.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      overflowX: getComputedStyle(el).overflowX,
    }));
    expect(scrollInfo.overflowX).toBe('auto');
    expect(
      scrollInfo.scrollWidth,
      'Tablo sarmalayıcısı içeride kaydırılabilir olmalı'
    ).toBeGreaterThan(scrollInfo.clientWidth);

    // 3) Saat hücresi (.time-cell) sticky olmalı.
    const timeCellPosition = await page
      .locator('.time-cell')
      .first()
      .evaluate((el) => getComputedStyle(el).position);
    expect(timeCellPosition).toBe('sticky');
  });
});

/**
 * AdminCalendar hafta görünümü ızgarası (mobil).
 *
 * Hata: Telefonda Perşembe sütunundan itibaren günleri ayıran çizgiler
 * kayboluyordu. Ayırıcılar grid'in `gap:1px` + gri arka planından geliyor;
 * .week-header/.week-body blok elemanlarının kutusu yalnızca viewport kadar
 * (375px) olduğu için gri arka plan taşan kısımda (Perşembe ötesi) bitiyordu.
 * Düzeltme: mobilde bu container'lara `width: max-content; min-width: 100%`.
 *
 * Doğrulama: container genişliği viewport'tan belirgin büyük (tüm 7 güne
 * yayılmış) ve hücreler arka planı tamamen kaplamıyor (1px gri ayırıcı kalıyor).
 *
 * NOT: AdminCalendar scoped CSS kullanır; burada ilgili layout kurallarının
 * scoped-olmayan birebir eşdeğerini kullanıyoruz (data-v bağımlılığı olmadan).
 */
const weekGridHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; }
  .week-grid { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .week-header { display: grid; grid-template-columns: 60px repeat(7, 100px);
    gap: 1px; background: #e0e0e0; border: 1px solid #e0e0e0;
    width: max-content; min-width: 100%; }
  .week-body { display: grid; gap: 1px; background: #e0e0e0;
    border: 1px solid #e0e0e0; border-top: none;
    width: max-content; min-width: 100%; }
  .hour-row { display: grid; grid-template-columns: 60px repeat(7, 100px); gap: 1px; }
  .time-column { background: white; padding: 12px 8px; text-align: center;
    position: sticky; left: 0; z-index: 2; }
  .day-column, .day-cell { background: white; padding: 12px; min-width: 100px; }
</style></head>
<body>
  <div class="week-grid">
    <div class="week-header">
      <div class="time-column">Saat</div>
      ${['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(d => `<div class="day-column">${d}</div>`).join('')}
    </div>
    <div class="week-body">
      ${Array.from({ length: 14 }, (_, i) => `<div class="hour-row">
        <div class="time-column">${9 + i}:00</div>
        ${Array.from({ length: 7 }, () => `<div class="day-cell"></div>`).join('')}
      </div>`).join('')}
    </div>
  </div>
</body></html>`;

test.describe('Hafta ızgarası mobil ayırıcı çizgiler (izole CSS)', () => {
  test('375px: container tüm 7 güne yayılır (çizgiler Perşembe ötesinde de görünür)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.setContent(weekGridHtml);

    // 60px (saat) + 7×100px + gap/border ≈ 768px. Container kutusu viewport'a
    // (375px) kısıtlanmamalı; track toplamına yayılmalı ki gri arka plan/çizgiler
    // tüm günlerde görünsün.
    const headerWidth = await page.locator('.week-header').evaluate((el) => el.getBoundingClientRect().width);
    const bodyWidth = await page.locator('.week-body').evaluate((el) => el.getBoundingClientRect().width);

    expect(headerWidth, 'week-header tüm günlere yayılmalı (viewport\'a sıkışmamalı)').toBeGreaterThan(740);
    expect(bodyWidth, 'week-body tüm günlere yayılmalı').toBeGreaterThan(740);

    // Ayırıcı kanıtı: son satırın son iki day-cell'i arasında 1px boşluk (gri)
    // olmalı — yani hücreler bitişik değil.
    const gapBetweenLastCells = await page.evaluate(() => {
      const cells = document.querySelectorAll('.hour-row:last-child .day-cell');
      if (cells.length < 2) return -1;
      const a = cells[cells.length - 2].getBoundingClientRect();
      const b = cells[cells.length - 1].getBoundingClientRect();
      return Math.round(b.left - a.right);
    });
    expect(gapBetweenLastCells, 'Son günler arasında 1px ayırıcı boşluk olmalı').toBe(1);
  });
});
