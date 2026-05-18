import emailjs from '@emailjs/browser'

const SERVICE_ID = process.env.VUE_APP_EMAILJS_SERVICE_ID || ''
const TEMPLATE_WELCOME = process.env.VUE_APP_EMAILJS_TEMPLATE_WELCOME || ''
const TEMPLATE_APPROVED = process.env.VUE_APP_EMAILJS_TEMPLATE_APPROVED || ''
const PUBLIC_KEY = process.env.VUE_APP_EMAILJS_PUBLIC_KEY || ''

let initialized = false
const initIfNeeded = () => {
  if (initialized) return
  if (!PUBLIC_KEY) return
  emailjs.init({ publicKey: PUBLIC_KEY })
  initialized = true
}

export interface SendResult {
  ok: boolean
  skipped?: boolean
  error?: any
}

const isValidEmail = (email?: string): email is string => {
  if (!email) return false
  return /.+@.+\..+/.test(email)
}

const isConfigured = (templateId: string): boolean => {
  return Boolean(SERVICE_ID && PUBLIC_KEY && templateId)
}

const send = async (
  templateId: string,
  params: Record<string, string>,
  context: string,
): Promise<SendResult> => {
  if (!isConfigured(templateId)) {
    console.warn(`[emailService] ${context} atlandı: EmailJS yapılandırılmamış (.env eksik)`)
    return { ok: false, skipped: true }
  }
  if (!isValidEmail(params.to_email)) {
    console.warn(`[emailService] ${context} atlandı: geçersiz/boş alıcı e-posta`)
    return { ok: false, skipped: true }
  }
  try {
    initIfNeeded()
    await emailjs.send(SERVICE_ID, templateId, params)
    console.log(`[emailService] ${context} gönderildi → ${params.to_email}`)
    return { ok: true }
  } catch (error: any) {
    console.error(`[emailService] ${context} hata:`, error)
    return { ok: false, error }
  }
}

/** Yeni kayıt sonrası kullanıcıya hoş geldin/onay-bekliyor maili. */
export const sendWelcomeEmail = async (params: {
  email: string
  fullName: string
}): Promise<SendResult> => {
  return send(
    TEMPLATE_WELCOME,
    {
      to_email: params.email,
      to_name: params.fullName,
      subject: 'Tenis Akademisi — Kaydınız alındı',
      message:
        `Merhaba ${params.fullName},\n\n` +
        `Kaydınız başarıyla oluşturuldu. Yöneticilerimiz hesabınızı en kısa sürede onaylayacak. ` +
        `Onaylandığında bilgilendirici bir e-posta daha alacaksınız.\n\n` +
        `İyi günler dileriz.`,
    },
    'welcome',
  )
}

/** Admin onayı sonrası kullanıcıya "kaydınız onaylandı" maili. */
export const sendApprovalEmail = async (params: {
  email: string
  fullName: string
}): Promise<SendResult> => {
  return send(
    TEMPLATE_APPROVED,
    {
      to_email: params.email,
      to_name: params.fullName,
      subject: 'Tenis Akademisi — Kaydınız onaylandı',
      message:
        `Merhaba ${params.fullName},\n\n` +
        `Kaydınız onaylandı. Artık sisteme giriş yapıp ders/rezervasyon işlemlerinizi yönetebilirsiniz.\n\n` +
        `İyi günler dileriz.`,
    },
    'approval',
  )
}

export const emailService = {
  sendWelcomeEmail,
  sendApprovalEmail,
}
