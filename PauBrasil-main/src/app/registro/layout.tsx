import { portalFont } from '@/lib/portal-font'
import '@/app/portal-brand.css'

// Mesma moldura do login: o cadastro é a continuação dele.
export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`portal-brand portal-login ${portalFont.variable}`}>
      {children}
    </div>
  )
}
