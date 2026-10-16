'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  CheckSquare, Trophy, User, LogOut,
  Search, Calculator, Shield,
  GraduationCap
} from 'lucide-react'
import { signOut } from 'next-auth/react'

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Toggle on Cmd+K or Ctrl+K
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  if (!open) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm pointer-events-auto" 
        onClick={() => setOpen(false)} 
      />
      <div className="fixed left-1/2 top-[15%] z-[101] w-full max-w-lg -translate-x-1/2 p-4 pointer-events-none">
        <Command
          className="pointer-events-auto w-full overflow-hidden rounded-2xl bg-[#111118]/95 backdrop-blur-xl border border-white/10 shadow-2xl ring-1 ring-white/5"
          loop
        >
          <div className="flex items-center border-b border-white/5 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-slate-500" />
            <Command.Input
              autoFocus
              placeholder="O que você procura?..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 text-white disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0"
            />
            <div className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 shrink-0">ESC</div>
          </div>
          
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">
              Nenhum resultado encontrado.
            </Command.Empty>
            
            <Command.Group heading="Principal" className="text-[10px] font-medium text-slate-500 px-2 py-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500">
              <Command.Item
                onSelect={() => runCommand(() => router.push('/app/hoje'))}
                className="relative flex cursor-pointer select-none items-center rounded-xl px-2 py-2 text-sm text-slate-300 outline-none data-[selected='true']:bg-brand-500/15 data-[selected='true']:text-brand-400 hover:bg-white/5 transition-colors"
              >
                <CheckSquare className="mr-2 h-4 w-4 text-brand-400 opacity-70" />
                <span>Minhas Tarefas (Hoje)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/app/pontos'))}
                className="relative flex cursor-pointer select-none items-center rounded-xl px-2 py-2 text-sm text-slate-300 outline-none data-[selected='true']:bg-brand-500/15 data-[selected='true']:text-brand-400 hover:bg-white/5 transition-colors"
              >
                <Calculator className="mr-2 h-4 w-4 text-yellow-400 opacity-70" />
                <span>Minha Carteira (Pontos)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/app/ranking'))}
                className="relative flex cursor-pointer select-none items-center rounded-xl px-2 py-2 text-sm text-slate-300 outline-none data-[selected='true']:bg-brand-500/15 data-[selected='true']:text-brand-400 hover:bg-white/5 transition-colors"
              >
                <Trophy className="mr-2 h-4 w-4 text-emerald-400 opacity-70" />
                <span>Ver o Ranking</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/universidade'))}
                className="relative flex cursor-pointer select-none items-center rounded-xl px-2 py-2 text-sm text-slate-300 outline-none data-[selected='true']:bg-brand-500/15 data-[selected='true']:text-brand-400 hover:bg-white/5 transition-colors"
              >
                <GraduationCap className="mr-2 h-4 w-4 text-purple-400 opacity-70" />
                <span>Universidade Corporativa</span>
              </Command.Item>
            </Command.Group>
            
            <Command.Group heading="Conta e Configurações" className="text-[10px] font-medium text-slate-500 px-2 py-1.5 mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500">
              <Command.Item
                onSelect={() => runCommand(() => router.push('/app/perfil'))}
                className="relative flex cursor-pointer select-none items-center rounded-xl px-2 py-2 text-sm text-slate-300 outline-none data-[selected='true']:bg-white/10 data-[selected='true']:text-white hover:bg-white/5 transition-colors"
              >
                <User className="mr-2 h-4 w-4 text-slate-400" />
                <span>Meu Perfil</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/app/perfil?tab=senha'))}
                className="relative flex cursor-pointer select-none items-center rounded-xl px-2 py-2 text-sm text-slate-300 outline-none data-[selected='true']:bg-white/10 data-[selected='true']:text-white hover:bg-white/5 transition-colors"
              >
                <Shield className="mr-2 h-4 w-4 text-slate-400" />
                <span>Alterar Senha</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => signOut({ callbackUrl: '/login' }))}
                className="relative flex cursor-pointer select-none items-center rounded-xl px-2 py-2 text-sm text-red-400 outline-none data-[selected='true']:bg-red-500/15 data-[selected='true']:text-red-300 hover:bg-red-500/5 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair da conta</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </>
  )
}
