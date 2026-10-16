'use client'

import {
  useEffect,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import {
  ArrowLeft,
  LogOut,
  Search,
  Shield,
  X,
  type LucideIcon,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

export interface CommandSection {
  label: string
  items: { href: string; label: string; icon: LucideIcon }[]
}

/** Usa os mesmos destinos autorizados da barra lateral; não mantém um catálogo separado. */
export function CommandMenu({
  sections,
  open,
  onOpenChange: setOpen,
  triggerRef,
}: {
  sections: CommandSection[]
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  triggerRef: RefObject<HTMLButtonElement>
}) {
  const router = useRouter()

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setOpen])

  function run(action: () => void) {
    setOpen(false)
    action()
  }
  const itemClass =
    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm text-foreground outline-none data-[selected=true]:bg-accent data-[selected=true]:text-brand-400'
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Overlay className="portal-menu-overlay fixed inset-0 z-[100]" />
      <Dialog.Content
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          triggerRef.current?.focus()
        }}
        className="fixed left-1/2 top-[12%] z-[101] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl bg-surface border border-border shadow-2xl overflow-hidden"
      >
        <Dialog.Title className="sr-only">Buscar no portal</Dialog.Title>
        <Dialog.Description className="sr-only">
          Busque uma função do portal e pressione Enter para abrir.
        </Dialog.Description>
        <Command label="Buscar funções do portal" loop>
          <div className="flex items-center border-b border-border px-4 gap-3">
            <Search
              size={18}
              className="text-muted-foreground"
              aria-hidden="true"
            />
            <Command.Input
              placeholder="O que você procura?"
              aria-label="Buscar funções do portal"
              className="h-14 flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none border-0"
            />
            <Dialog.Close
              className="p-2 text-muted-foreground"
              aria-label="Fechar busca"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <Command.List className="max-h-[55vh] overflow-y-auto p-2">
            <Command.Empty className="p-6 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </Command.Empty>
            {sections.map((section) => (
              <Command.Group
                key={section.label}
                heading={section.label}
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {section.items.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={`${section.label} ${item.label}`}
                    onSelect={() => run(() => router.push(item.href))}
                    className={itemClass}
                  >
                    <item.icon size={17} />
                    <span>{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
            <Command.Group
              heading="Conta e grupo"
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              <Command.Item
                onSelect={() => run(() => router.push('/app/perfil?tab=senha'))}
                className={itemClass}
              >
                <Shield size={17} />
                Alterar senha
              </Command.Item>
              <Command.Item
                onSelect={() => run(() => router.push('/'))}
                className={itemClass}
              >
                <ArrowLeft size={17} />
                Voltar ao hub do grupo
              </Command.Item>
              <Command.Item
                onSelect={() =>
                  run(() => {
                    void signOut({ callbackUrl: '/login' })
                  })
                }
                className={itemClass}
              >
                <LogOut size={17} />
                Sair da conta
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </Dialog.Content>
    </Dialog.Root>
  )
}
