// Admin bildirim kitlesi. Boss admin-eşidir (bkz. CLAUDE.md): admin'e giden
// bildirimleri (kayıt onayı, rezervasyon onayı) o da görür ve işler.
export function isAdminAudience(role?: string | null): boolean {
  const normalized = (role || '').toLowerCase()
  return normalized === 'admin' || normalized === 'boss'
}
