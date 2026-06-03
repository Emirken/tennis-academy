import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// AppHeader.vue kontrolü:
// "Kayıt Ol" butonları geçici olarak yorum satırına alındı.
// Aktif (yorum dışı) kaynak kodunda Register route'una giden bir buton
// kalmamalı; "Giriş Yap" aktif kalmalı; ve yorum içinde Kayıt Ol bloğu
// silinmeden korunmuş olmalı.

const headerPath = resolve(__dirname, '../../src/components/common/AppHeader.vue')
const source = readFileSync(headerPath, 'utf-8')

// Tüm HTML/Vue yorum bloklarını çıkararak "aktif" kaynak elde et.
// (template iç içe <template v-if> içerdiği için regex ile dış template'i
// güvenle ayıklamak zor — onun yerine tüm dosyayı tarayıp yorumları
// çıkarıyoruz; script bloğunda Kayıt Ol / Register geçmiyor.)
const active = source.replace(/<!--[\s\S]*?-->/g, '')

describe('AppHeader Kayıt Ol gizli', () => {
  it('aktif kaynak "Kayıt Ol" metnini içermez', () => {
    expect(active).not.toContain('Kayıt Ol')
  })

  it('aktif kaynak Register route\'una referans vermez', () => {
    expect(active).not.toMatch(/name:\s*'Register'/)
  })

  it('"Giriş Yap" hâlâ aktif kaynak içindedir', () => {
    expect(active).toContain('Giriş Yap')
    expect(active).toMatch(/name:\s*'Login'/)
  })

  it('Kayıt Ol satırları yorum içinde korunmuştur (silinmedi)', () => {
    expect(source).toContain('Kayıt Ol')
    expect(source).toMatch(/name:\s*'Register'/)
  })
})
