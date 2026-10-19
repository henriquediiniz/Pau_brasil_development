'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, LayoutDashboard, Users, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, Bell, X, Key, ClipboardList,
  GraduationCap, LayoutDashboard as DashboardIcon,
  Search, Home, Building2, Briefcase, MapPin, HardDrive, Camera, HelpCircle,
  UsersRound, ArrowLeft, type LucideIcon,
} from 'lucide-react'
import { CommandMenu } from '@/components/ui/command-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import * as Dialog from '@radix-ui/react-dialog'
import { portalFont } from '@/lib/portal-font'
import '@/app/portal-brand.css'
import { toast } from '@/components/ui/toaster'
import Image from 'next/image'
import {
  isRhAdmin as hasRhAdminAccess,
  isSysAdmin,
  isDiretoriaLevel,
  isUpbAdmin,
} from '@/lib/auth-helpers'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
  children?: NavItem[]
}

interface NavSection {
  label: string
  items: NavItem[]
  variant?: 'default' | 'admin'
}

interface Notification {
  id: string
  title: string
  description?: string
  read: boolean
  createdAt: string
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchTriggerRef = useRef<HTMLButtonElement>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifError, setNotifError] = useState(false)
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const user = session?.user
  const isAdmin = user ? isSysAdmin(user) : false
  const isDiretor = user ? isDiretoriaLevel(user) : false
  const isUPBAdmin = user ? isUpbAdmin(user) : false
  const isRhAdminUser = user ? hasRhAdminAccess(user) : false
  const isEmpresaAdmin = user?.isEmpresaAdmin === true
  const isItinerantLeader = user?.isItinerantLeader === true
  const isVisitasAdmin    = user?.isVisitasAdmin === true

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?error=SessionRevoked')
    }
  }, [status, router])

  useEffect(() => {
    if (!user) return
    if (user.mustChangePassword && pathname !== '/app/alterar-senha') {
      router.replace('/app/alterar-senha')
    }
  }, [user, pathname, router])

  // Build sectioned navigation — memoized to avoid rebuilding on every render
  const sections: NavSection[] = useMemo(() => {
  const _sections: NavSection[] = []

  _sections.push({
    label: 'Portal',
    items: [
      { href: '/app/inicio', label: 'Início', icon: Home },
      { href: '/universidade', label: 'Universidade', icon: GraduationCap },
      { href: '/app/ajuda', label: 'Ajuda', icon: HelpCircle },
      { href: '/app/perfil', label: 'Meu Perfil', icon: User },
    ],
  })
  if (isUPBAdmin && !isAdmin) {
    _sections.push({ label: 'Universidade', items: [
      { href: '/admin/upb', label: 'Gerenciar Universidade', icon: GraduationCap },
    ] })
  }

  // ── Zona: Visitas (condicional) ───────────────────────────────────────────
  if (isItinerantLeader || isAdmin || isVisitasAdmin) {
    const visitasItems: NavItem[] = []
    if (isItinerantLeader) {
      visitasItems.push({ href: '/app/visitas/configurar-face', label: 'Config. Face', icon: Camera })
      visitasItems.push({ href: '/app/visitas/checkin',         label: 'Check-in',    icon: MapPin })
    }
    if (isAdmin || isVisitasAdmin) {
      visitasItems.push({ href: '/app/visitas/dashboard',         label: 'Dashboard',  icon: DashboardIcon })
      visitasItems.push({ href: '/admin/visitas/obrigatorias',    label: 'Obrigações', icon: ClipboardList })
    }
    _sections.push({ label: 'Visitas', items: visitasItems })
  }

  if (isDiretor && !isAdmin) {
    _sections.push({ label: 'Gestão', items: [
      { href: '/gestor/auditoria', label: 'Auditoria', icon: ClipboardList },
    ] })
  }

  // ── Zona: Empresa (condicional) ───────────────────────────────────────────
  if (isEmpresaAdmin || isAdmin) {
    _sections.push({
      label: 'Empresa',
      items: [
        { href: '/empresa',          label: 'Painel',       icon: Building2 },
        { href: '/empresa/usuarios', label: 'Colaboradores', icon: Users },
        { href: '/empresa/funcoes',  label: 'Funções',      icon: Briefcase },
      ],
    })
  }

  // ── Zona: Gente & Cultura (RH_ADMIN, não SYS_ADMIN) ───────────────────────
  if (isRhAdminUser && !isAdmin) {
    _sections.push({
      label: 'Gente & Cultura',
      items: [
        { href: '/gente',          label: 'Gente',             icon: UsersRound },
        { href: '/talentos',       label: 'Banco de Talentos', icon: Users },
        { href: '/admin/usuarios', label: 'Usuários',          icon: Users },
      ],
    })
  }

  // ── Zona: Admin (visual distinto) ─────────────────────────────────────────
  if (isAdmin) {
    _sections.push({
      label: 'Admin',
      variant: 'admin',
      items: [
        { href: '/admin',              label: 'Painel',         icon: LayoutDashboard },
        { href: '/admin/usuarios',     label: 'Usuários',       icon: Users },
        { href: '/admin/empresas',     label: 'Empresas',       icon: Building2 },
        { href: '/admin/funcoes',      label: 'Funções',        icon: Settings },
        { href: '/admin/upb',          label: 'Universidade',   icon: GraduationCap },
        { href: '/admin/auditoria',    label: 'Auditoria',      icon: ClipboardList },
        { href: '/gente',              label: 'Gente',          icon: UsersRound },
        { href: '/talentos',           label: 'Banco de Talentos', icon: Users },
        { href: '/admin/operacoes',    label: 'Filiais',        icon: MapPin },
        { href: '/admin/backup',       label: 'Backup',         icon: HardDrive },
      ],
    })
  }

  return _sections
  }, [isAdmin, isDiretor,
      isUPBAdmin, isRhAdminUser, isEmpresaAdmin, isItinerantLeader, isVisitasAdmin])

  // Flat list for mobile bottom nav
  const commandSections = useMemo(() => sections.map(section => ({
    label: section.label,
    items: section.items.flatMap(item => [item, ...(item.children ?? [])]),
  })), [sections])

  // ── Fetch notifications from DB ───────────────────────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!user?.id) return
    if (!silent) setNotifLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Falha ao carregar notificações')
      const data = await res.json()
      setNotifError(false)
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)

      // Toast for new unread (only during silent poll)
      if (silent && data.unreadCount > 0) {
        const newest = data.notifications?.[0]
        if (newest && !newest.read) {
          toast({ title: newest.title, description: newest.description })
        }
      }
    } catch {
      setNotifError(true)
    } finally {
      if (!silent) setNotifLoading(false)
    }
  }, [user?.id])

  // Check browser notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission)
    }
  }, [])

  async function requestNotifPermission() {
    if (typeof Notification === 'undefined') return
    const perm = await Notification.requestPermission()
    setNotifPermission(perm)
  }

  function showBrowserNotif(title: string, body?: string) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    if (document.visibilityState === 'visible') return // skip when tab is focused
    try {
      new Notification(title, { body, icon: '/brand/icone.png', badge: '/brand/icone.png' })
    } catch {}
  }

  useEffect(() => {
    if (!user?.id) return
    fetchNotifications()

    const es = new EventSource('/api/notifications/stream')

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.notifications !== undefined) {
          setNotifications(data.notifications)
          setUnreadCount(data.unreadCount ?? 0)
        }
        if (data.newNotifications?.length) {
          setNotifications(prev => [...data.newNotifications, ...prev].slice(0, 30))
          setUnreadCount(data.unreadCount ?? 0)
          const newest = data.newNotifications[0]
          if (newest) {
            toast({ title: newest.title, description: newest.description })
            showBrowserNotif(newest.title, newest.description)
          }
        }
      } catch {}
    }

    es.onerror = () => {
      es.close()
      // Fallback to polling if SSE fails
      pollingRef.current = setInterval(() => fetchNotifications(true), 30_000)
    }

    return () => {
      es.close()
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [user?.id, fetchNotifications])

  // Restore expandedGroups from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar_expanded_groups')
      if (saved) setExpandedGroups(new Set(JSON.parse(saved)))
    } catch {}
  }, [])

  // Auto-expand group containing the current active child route
  useEffect(() => {
    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          const childActive = item.children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))
          if (childActive) {
            setExpandedGroups(prev => {
              if (prev.has(item.href)) return prev
              const next = new Set(prev)
              next.add(item.href)
              try { localStorage.setItem('sidebar_expanded_groups', JSON.stringify(Array.from(next))) } catch {}
              return next
            })
          }
        }
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  async function markAllRead() {
    if (unreadCount === 0) return
    try {
      const response = await fetch('/api/notifications', { method: 'PATCH' })
      if (!response.ok) throw new Error()
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch {
      toast({ title: 'Não foi possível marcar as notificações como lidas.', variant: 'destructive' })
    }
  }

  function handleBellClick() {
    setShowNotif(v => !v)
    setShowProfile(false)
    if (!showNotif) markAllRead()
  }

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggleGroup(href: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(href)) next.delete(href)
      else next.add(href)
      try { localStorage.setItem('sidebar_expanded_groups', JSON.stringify(Array.from(next))) } catch {}
      return next
    })
  }

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className={`flex flex-col gap-3 px-4 py-5 border-b border-border/30 ${collapsed && !mobile ? 'items-center' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="Voltar ao hub do Grupo Pau Brasil" className={`portal-logo ${collapsed && !mobile ? 'is-collapsed' : ''}`}>
            <Image src={collapsed && !mobile ? '/brand/icone.png' : '/brand/logo-compacta.png'} alt="Pau Brasil" width={136} height={64} priority />
          </Link>
          {mobile && <Dialog.Close className="portal-mobile-close" aria-label="Fechar menu"><X size={18} /></Dialog.Close>}
        </div>
        {(!collapsed || mobile) && <span className="portal-caption">Portal do colaborador</span>}
      </div>

      <nav aria-label={mobile ? "Menu móvel do portal" : "Menu do portal"} className="flex-1 overflow-y-auto py-4 px-2">
        {collapsed && !mobile ? (
          // Collapsed: icon-only; children hidden, parent icon shown
          <div className="space-y-0.5">
            {sections.map((section, si) => (
              <div key={si}>
                {si > 0 && <div className="my-1.5 mx-auto w-5 h-px bg-border/50" />}
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')
                  const childActive = item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + '/')) ?? false
                  const highlight = active || childActive
                  return (
                    <Link key={item.href} href={item.href} prefetch onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95
                        ${highlight ? 'bg-brand-500/15 text-brand-400 shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                      title={item.label}>
                      <Icon style={{ width: 18, height: 18 }} className={`shrink-0 ${highlight ? 'text-brand-400' : ''}`} />
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        ) : (
          // Expanded: zone separators + expandable parent-children groups
          <div className="space-y-0.5">
            {sections.map((section, si) => {
              const isAdminZone = section.variant === 'admin'
              return (
                <div key={si} className={si > 0 ? 'mt-3' : ''}>
                  <div className="flex items-center gap-2 px-3 mb-1">
                    <span className={`text-[10px] font-medium uppercase tracking-widest
                      portal-section-label`}>
                      {section.label}
                    </span>
                    <div className={`flex-1 h-px bg-border/30`} />
                  </div>

                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.href || pathname.startsWith(item.href + '/')
                    const childActive = item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + '/')) ?? false
                    const parentHighlight = active || childActive
                    const isExpanded = expandedGroups.has(item.href)

                    if (item.children) {
                      return (
                        <div key={item.href}>
                          <div className={`flex items-center rounded-xl transition-all duration-150
                            ${parentHighlight ? 'bg-brand-500/10' : 'hover:bg-accent'}`}>
                            <Link href={item.href} prefetch onClick={() => setMobileOpen(false)}
                              className={`flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-medium
                                ${parentHighlight ? 'text-brand-400' : 'text-muted-foreground hover:text-foreground'}`}>
                              <Icon style={{ width: 18, height: 18 }} className={`shrink-0 ${parentHighlight ? 'text-brand-400' : ''}`} />
                              <span>{item.label}</span>
                            </Link>
                            <button onClick={() => toggleGroup(item.href)}
                              className={`px-2.5 py-2.5 rounded-xl transition-colors
                                ${parentHighlight ? 'text-brand-400' : 'text-muted-foreground hover:text-foreground'}`}
                              aria-expanded={isExpanded} aria-label={`${isExpanded ? 'Recolher' : 'Expandir'} ${item.label}`}>
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                          </div>
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18, ease: 'easeInOut' }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div className="pl-4 ml-3 border-l border-border mt-0.5 mb-1">
                                  {item.children.map(child => {
                                    const ChildIcon = child.icon
                                    const childIsActive = pathname === child.href || pathname.startsWith(child.href + '/')
                                    return (
                                      <Link key={child.href} href={child.href} prefetch onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 active:scale-95
                                          ${childIsActive ? 'text-brand-400 bg-brand-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
                                        <ChildIcon style={{ width: 16, height: 16 }} className="shrink-0" />
                                        <span>{child.label}</span>
                                        {childIsActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />}
                                      </Link>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    }

                    return (
                      <Link key={item.href} href={item.href} prefetch onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95
                          ${active
                            ? 'bg-brand-500/15 text-brand-400 shadow-sm'
                            : `text-muted-foreground hover:text-foreground hover:bg-accent`
                          }`}>
                        <Icon style={{ width: 18, height: 18 }} className={`shrink-0 ${active ? 'text-brand-400' : ''}`} />
                        <span>{item.label}</span>
                        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </nav>

      <div className={`p-3 border-t border-border/30 ${collapsed && !mobile ? 'flex justify-center' : ''}`}>
        {(!collapsed || mobile) ? (
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
              {user?.photoUrl ? (
                <Image src={user.photoUrl} alt={user.name ?? ''} width={32} height={32} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-brand flex items-center justify-center">
                  <span className="text-white font-bold text-xs">{user?.name?.[0] ?? 'U'}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-foreground text-xs font-medium truncate">{user?.name}</div>
              <div className="text-muted-foreground text-xs truncate">{user?.units?.[0] ?? user?.company ?? user?.role}</div>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10" aria-label="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-muted-foreground hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10" aria-label="Sair">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )

  const mobileBottomItems: NavItem[] = [
    { href: '/app/inicio', label: 'Início', icon: Home },
    { href: '/universidade', label: 'Universidade', icon: GraduationCap },
    { href: '/app/ajuda', label: 'Ajuda', icon: HelpCircle },
    { href: '/app/perfil', label: 'Perfil', icon: User },
  ]

  if (status !== 'authenticated') return (
    <div className={`portal-brand ${portalFont.variable} min-h-screen grid place-items-center`} role="status">
      Carregando seu portal…
    </div>
  )

  return (
    <div className={`app-shell portal-brand ${portalFont.variable} min-h-screen flex`}>
      {/* Desktop Sidebar */}
      <aside className={`portal-sidebar hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-30 bg-surface border-r border-border/30 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
        <SidebarContent />
        <button aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-lg">
          <ChevronLeft className={`w-3 h-3 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Overlay className="lg:hidden fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content onCloseAutoFocus={event => { event.preventDefault(); mobileTriggerRef.current?.focus() }} className="portal-sidebar lg:hidden fixed left-0 top-0 bottom-0 w-[min(19rem,90vw)] z-50 bg-surface border-r border-border">
          <Dialog.Title className="sr-only">Menu do portal</Dialog.Title>
          <Dialog.Description className="sr-only">Navegue pelas funções disponíveis para seu perfil.</Dialog.Description>
          <SidebarContent mobile />
        </Dialog.Content>
      </Dialog.Root>

      <div className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-56'}`}>
        {/* Top bar */}
        <header className="portal-topbar sticky top-0 z-20 flex items-center gap-4 px-4 lg:px-6 h-14 bg-canvas/80 backdrop-blur-md border-b border-border/30">
          <button ref={mobileTriggerRef} aria-label="Abrir menu do portal" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0 lg:hidden">
            <div className="text-foreground font-display font-semibold text-sm leading-tight">Grupo Pau Brasil</div>
          </div>

          <Link href="/" className="portal-hub-link hidden lg:flex"><ArrowLeft size={15} /> Hub do grupo</Link>
          <div className="ml-auto flex items-center gap-2">
            {/* Command Menu Button */}
            <button
              ref={searchTriggerRef}
              aria-label="Buscar no portal"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 h-8 rounded-lg bg-accent hover:bg-accent/80 border border-border text-muted-foreground hover:text-foreground transition-colors text-xs mr-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-medium">Buscar...</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 ml-4 px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono text-muted-foreground">
                <span className="text-xs">⌘</span> K
              </kbd>
            </button>

            <ThemeToggle />

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button aria-label="Notificações" aria-expanded={showNotif} onClick={handleBellClick}
                className="relative w-8 h-8 rounded-lg bg-accent hover:bg-accent/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotif && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-10 w-80 max-w-[calc(100vw-1rem)] bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Notificações</span>
                      <div className="flex items-center gap-2">
                        {notifPermission === 'default' && (
                          <button onClick={requestNotifPermission}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors">
                            Ativar alertas
                          </button>
                        )}
                        <button aria-label="Fechar notificações" onClick={() => setShowNotif(false)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
                      {notifError && <div role="alert" className="p-4 text-sm text-muted-foreground">Não foi possível carregar as notificações. <button className="text-brand-400 underline" onClick={() => fetchNotifications()}>Tentar novamente</button></div>}
                      {notifLoading ? (
                        <div className="py-8 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">Nenhuma notificação</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`px-4 py-3 ${!n.read ? 'bg-brand-500/5 border-l-2 border-l-brand-500' : ''}`}>
                            <div className="text-sm text-foreground font-medium leading-snug">{n.title}</div>
                            {n.description && <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.description}</div>}
                            <div className="text-xs text-muted-foreground/60 mt-1">{new Date(n.createdAt).toLocaleString('pt-BR')}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button aria-label="Menu da conta" aria-expanded={showProfile} onClick={() => { setShowProfile(!showProfile); setShowNotif(false) }}
                className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-brand-400/50 transition-[box-shadow] cursor-pointer">
                {user?.photoUrl ? (
                  <Image src={user.photoUrl} alt={user.name ?? ''} width={32} height={32} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full gradient-brand flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{user?.name?.[0] ?? 'U'}</span>
                  </div>
                )}
              </button>
              <AnimatePresence>
                {showProfile && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-10 w-56 max-w-[calc(100vw-1rem)] bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-border/30">
                      <div className="text-sm font-medium text-foreground truncate">{user?.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                      {user?.units?.[0] && <div className="text-xs text-brand-400 mt-0.5">{user.units[0]}</div>}
                    </div>
                    <div className="p-1">
                      <button onClick={() => { setShowProfile(false); router.push('/app/perfil') }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left">
                        <User className="w-4 h-4" /> Meu Perfil
                      </button>
                      <button onClick={() => { setShowProfile(false); router.push('/app/perfil?tab=senha') }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left">
                        <Key className="w-4 h-4" /> Alterar Senha
                      </button>
                      <div className="h-px bg-border/30 my-1" />
                      <button onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors text-left">
                        <LogOut className="w-4 h-4" /> Sair
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>

        {/* Bottom nav - mobile */}
        <nav aria-label="Atalhos do portal" className="portal-bottom-nav lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-surface/95 backdrop-blur-md border-t border-border/30 flex">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} prefetch
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-all active:scale-95 ${active ? 'text-brand-400' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon style={{ width: 20, height: 20 }} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
      <CommandMenu sections={commandSections} open={searchOpen} onOpenChange={setSearchOpen} triggerRef={searchTriggerRef} />
    </div>
  )
}
