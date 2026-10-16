import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { SessionUser } from '@/lib/auth-helpers'
import { resolveMiddlewareRedirect } from '@/lib/middleware-access'
import { REWARDS_STORE_ENABLED } from '@/lib/portal-features'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const user = token as SessionUser | null
    const redirectPath = resolveMiddlewareRedirect(path, user, token?.isActive)

    if (redirectPath) {
      return NextResponse.redirect(new URL(redirectPath, req.url))
    }

    if (!REWARDS_STORE_ENABLED && ['/app/loja', '/app/resgates'].includes(path)) {
      return NextResponse.redirect(new URL('/app/pontos', req.url))
    }

    return NextResponse.next()
  },
  {
    pages: { signIn: '/login', error: '/login' },
    callbacks: {
      authorized: ({ token }) => !!token && token.isActive !== false,
    },
  }
)

export const config = {
  matcher: ['/app/:path*', '/admin/:path*', '/talentos', '/talentos/:path*', '/gente', '/gente/:path*', '/gestor/:path*', '/coord/:path*', '/empresa', '/empresa/:path*', '/universidade', '/universidade/:path*'],
}
