import { test, expect, Page } from '@playwright/test';

/**
 * Mobil uyumluluk smoke testi.
 *
 * Amaç: Uygulamanın telefon genişliğinde (Pixel 5 / 393px ve daha dar)
 * YATAY SAYFA TAŞMASI yapmadığını doğrulamak. Yatay taşma, mobilde en sık
 * görülen "bozuk" belirtisidir: sayfa sağa kayar, içerik kesilir.
 *
 * Yalnızca kimlik doğrulaması gerektirmeyen genel sayfaları gezeriz
 * (Home, Login, İletişim) — bunlar auth olmadan render olur.
 *
 * Bu test "Mobile Chrome" (Pixel 5) projesinde anlamlıdır; masaüstü
 * projesinde de geçer ama asıl değeri mobil viewport'tadır.
 */

const PUBLIC_PATHS = [
  { path: '/', name: 'Ana Sayfa' },
  { path: '/login', name: 'Giriş' },
  { path: '/contact', name: 'İletişim' },
];

/** Sayfada yatay taşma var mı? (1px tolerans — alt piksel yuvarlama) */
async function getHorizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(0, doc.scrollWidth - doc.clientWidth);
  });
}

test.describe('Mobil uyumluluk - yatay taşma yok', () => {
  for (const { path, name } of PUBLIC_PATHS) {
    test(`${name} (${path}) telefon genişliğinde yatay taşma yapmamalı`, async ({ page }) => {
      await page.goto(path);
      // İçeriğin yerleşmesi için ağ boşalmasını bekle (Vue mount + Vuetify).
      await page.waitForLoadState('networkidle');

      const overflow = await getHorizontalOverflow(page);
      expect(overflow, `${name} sayfasında ${overflow}px yatay taşma var`).toBeLessThanOrEqual(1);
    });
  }
});

test.describe('Mobil navigasyon - hamburger menü', () => {
  test('telefon genişliğinde hamburger menü açılır', async ({ page, isMobile }) => {
    // Bu kontrol yalnızca gerçek mobil viewport'ta anlamlı.
    test.skip(!isMobile, 'Sadece mobil viewport projesinde çalışır');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hamburger butonu (mdi-menu) görünür ve tıklanınca drawer açılır.
    const menuButton = page.locator('.modern-header button:has(.mdi-menu)').first();
    await expect(menuButton).toBeVisible();

    await menuButton.click();
    const drawer = page.locator('.mobile-drawer');
    await expect(drawer).toBeVisible();

    // Drawer açıkken de yatay taşma olmamalı.
    const overflow = await getHorizontalOverflow(page);
    expect(overflow, `Drawer açıkken ${overflow}px yatay taşma var`).toBeLessThanOrEqual(1);
  });
});
