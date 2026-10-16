import { portalFont } from '@/lib/portal-font'
import '@/app/portal-brand.css'

export default function LoginLayout({
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
