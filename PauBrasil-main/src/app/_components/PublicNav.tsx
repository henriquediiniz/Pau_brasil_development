'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/carreiras',      label: 'Carreiras' },
  { href: '/universidade-pb', label: 'Universidade' },
  { href: '/contato',        label: 'Contato' },
]

export function PublicNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  function close() { setOpen(false) }

  return (
    <nav className="border-b border-white/5 px-6 py-4 bg-[#0d0d14] relative z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" onClick={close} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <span className="font-bold text-sm text-white">P</span>
          </div>
          <span className="font-display font-bold text-white">Grupo Pau Brasil</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-white transition-colors ${pathname === link.href ? 'text-white' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all"
          >
            Área do Colaborador
          </Link>

          {/* Hambúrguer — mobile only */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setOpen(p => !p)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden absolute top-full left-0 right-0 bg-[#0d0d14] border-b border-white/5 px-6 pb-4"
          >
            <div className="flex flex-col gap-1 pt-3">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={`px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    pathname === link.href
                      ? 'text-white bg-white/5'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
