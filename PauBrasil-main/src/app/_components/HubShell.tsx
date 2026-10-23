'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import styles from './Hub.module.css'

const links = [
  { href: '/#historia', label: 'O grupo' },
  { href: '/#empresas', label: 'Nossas empresas' },
  { href: '/newsletter', label: 'Newsletter' },
  { href: '/nossa-gente', label: 'Nossa gente' },
  { href: '/#universidade', label: 'Universidade' },
  { href: '/#talentos', label: 'Trabalhe conosco' },
]

export function HubNav() {
  const [open, setOpen] = useState(false)
  // Depois de rolar um pouco, a sombra do cabeçalho fica mais marcada sobre o conteúdo.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={styles.header} data-scrolled={scrolled || undefined}>
      <span className={styles.scrollProgress} aria-hidden="true" />
      <a href="#conteudo" className={styles.skip}>
        Pular para o conteúdo
      </a>
      <div className={styles.navInner}>
        <Link
          href="/"
          aria-label="Grupo Pau Brasil — início"
          onClick={() => setOpen(false)}
          className={styles.logo}
        >
          <Image
            src="/brand/logo-compacta.png"
            alt="Pau Brasil"
            width={140}
            height={66}
            priority
          />
        </Link>
        <nav aria-label="Navegação principal" className={styles.desktopNav}>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <Link className={styles.portalLink} href="/login">
          Portal do colaborador <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="hub-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav
          id="hub-menu"
          aria-label="Navegação móvel"
          className={styles.mobileNav}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)}>
            Portal do colaborador <ArrowUpRight size={16} />
          </Link>
        </nav>
      )}
    </header>
  )
}

export function HubFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerMain}>
          <Image
            src="/brand/logo-branca.png"
            alt="Pau Brasil"
            width={150}
            height={122}
          />
          <p>
            Raízes que nos unem.
            <br />
            Caminhos que nos levam além.
          </p>
          <nav aria-label="Links do rodapé">
            <Link href="/#empresas">Nossas empresas</Link>
            <Link href="/universidade-pb">Universidade Pau Brasil</Link>
            <Link href="/carreiras/candidatar">Banco de talentos</Link>
            <Link href="/contato">
              Fale com a gente <ArrowUpRight size={14} />
            </Link>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Grupo Pau Brasil</span>
          <span>Juntos, escrevemos os próximos capítulos.</span>
        </div>
      </div>
    </footer>
  )
}
