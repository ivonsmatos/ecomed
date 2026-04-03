import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

type Template =
  | "welcome"
  | "partner-pending"
  | "partner-approved"
  | "partner-rejected"
  | "password-reset"
  | "report-received"

const subjects: Record<Template, string> = {
  "welcome": "Bem-vindo ao EcoMed! 🌿",
  "partner-pending": "Solicitação de cadastro recebida",
  "partner-approved": "Seu ponto foi aprovado! ✅",
  "partner-rejected": "Atualização sobre seu cadastro",
  "password-reset": "Redefinir sua senha",
  "report-received": "Novo problema reportado no seu ponto",
}

export async function sendEmail(
  template: Template,
  to: string,
  data: Record<string, string>
) {
  const { EmailTemplate } = await import(`./templates/${template}`)

  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: subjects[template],
    react: EmailTemplate(data),
  })
}
