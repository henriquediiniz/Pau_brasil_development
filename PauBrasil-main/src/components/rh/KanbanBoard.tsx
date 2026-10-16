'use client'

import React, { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { EtapaCandidatura } from '@prisma/client'
import { Clock, ExternalLink, XCircle } from 'lucide-react'

export interface CandidaturaItem {
  id: string
  nome: string
  email: string
  telefone?: string
  cidade: string
  estado: string
  cargosInteresse: string[]
  gruposInteresse: string[]
  etapa: EtapaCandidatura
  createdAt: string
  updatedAt: string
}

interface KanbanBoardProps {
  items: CandidaturaItem[]
  onItemMoved: (id: string, newEtapa: EtapaCandidatura, motivo?: string) => Promise<void>
  onItemClick: (id: string) => void
}

const getGroupColor = (group: string) => {
  const g = group.toLowerCase()
  if (g.includes('venda') || g.includes('comercial')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  if (g.includes('log') || g.includes('armazém')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  if (g.includes('financeiro') || g.includes('admin')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  if (g.includes('tecnologia') || g.includes('ti')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  if (g.includes('gente') || g.includes('rh')) return 'bg-pink-500/20 text-pink-400 border-pink-500/30'
  return 'bg-brand-500/10 text-brand-400 border-brand-500/20'
}

const getTopBorderColor = (group: string) => {
  const g = group.toLowerCase()
  if (g.includes('venda') || g.includes('comercial')) return '#f97316' // orange-500
  if (g.includes('log') || g.includes('armazém')) return '#3b82f6' // blue-500
  if (g.includes('financeiro') || g.includes('admin')) return '#10b981' // emerald-500
  if (g.includes('tecnologia') || g.includes('ti')) return '#a855f7' // purple-500
  if (g.includes('gente') || g.includes('rh')) return '#ec4899' // pink-500
  return '#e11d48' // brand-500
}

/*
  `REJEITADO` entrou em 2026-09-23. Sem ele o candidato rejeitado sumia do
  quadro: nao havia onde conferir a decisao nem como desfazer, e o filtro
  "Rejeitado" do topo devolvia quatro colunas vazias.
*/
const COLUMNS: EtapaCandidatura[] = ['RECEBIDO', 'TRIAGEM', 'ENTREVISTA', 'APROVADO', 'REJEITADO']

const COLUMN_COLORS: Record<string, string> = {
  RECEBIDO: 'border-blue-500/20 bg-blue-500/5',
  TRIAGEM: 'border-yellow-500/20 bg-yellow-500/5',
  ENTREVISTA: 'border-purple-500/20 bg-purple-500/5',
  APROVADO: 'border-emerald-500/20 bg-emerald-500/5',
  REJEITADO: 'border-red-500/20 bg-red-500/5',
}

const COLUMN_TITLES: Record<string, string> = {
  RECEBIDO: 'Novos Recebidos',
  TRIAGEM: 'Em Triagem',
  ENTREVISTA: 'Entrevista',
  APROVADO: 'Aprovados',
  REJEITADO: 'Rejeitados',
}

function KanbanItem({ item, onClick, onReject }: { item: CandidaturaItem; onClick: () => void; onReject: (motivo?: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    borderTopWidth: '4px',
    borderTopColor: item.gruposInteresse[0] ? getTopBorderColor(item.gruposInteresse[0]) : '#334155'
  }

  // SLA Tracker
  const daysInStage = Math.floor((Date.now() - new Date(item.updatedAt ?? item.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  const isStale = daysInStage >= 4

  const openPdf = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`/api/admin/rh/candidaturas/${item.id}/cv-url`, '_blank', 'noopener,noreferrer')
  }

  const reject = (e: React.MouseEvent) => {
    e.stopPropagation()
    /*
      O motivo era pedido e jogado fora: `prompt` guardava em `p` e `onReject()`
      era chamado sem argumento. Quem digitava a justificativa perdia o texto e
      nao tinha como saber.
    */
    const motivo = prompt('Motivo da rejeição (opcional):')
    if (motivo === null) return // cancelou
    onReject(motivo.trim() || undefined)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) onClick()
      }}
      className={`group relative bg-[#1c1c24] border-x border-b border-white/10 p-4 rounded-xl cursor-grab hover:border-b-brand-500/50 hover:border-x-brand-500/50 transition-all overflow-hidden ${isDragging ? 'shadow-xl scale-105' : 'shadow-sm'}`}
    >
      {/* Quick Actions Hover Overlay */}
      <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 z-10 bg-[#1c1c24]/90 backdrop-blur-sm p-1 rounded-lg border border-white/10">
        <button onClick={openPdf} className="p-1.5 rounded bg-brand-500/10 text-brand-400 hover:bg-brand-500/20" title="Ver Currículo">
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button onClick={reject} className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20" title="Rejeitar Candidato">
          <XCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="font-semibold text-sm text-white mb-1 pr-8 truncate">{item.nome}</div>
      <div className="text-[11px] text-slate-500 mb-3 truncate flex items-center justify-between gap-1">
        <span>📍 {item.cidade}, {item.estado}</span>
        {daysInStage > 0 && (
          <span className={`flex items-center gap-1 font-medium ${isStale ? 'text-red-400' : 'text-slate-500'}`}>
            <Clock className="w-3 h-3" /> {daysInStage} {daysInStage === 1 ? 'dia' : 'dias'}
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {item.cargosInteresse.slice(0, 2).map((c) => {
          // Usa o grupo da mesma string ou o primeiro grupo para pintar a tag
          const colorClass = item.gruposInteresse[0] ? getGroupColor(item.gruposInteresse[0]) : getGroupColor('')
          return (
            <span key={c} className={`px-2 py-0.5 rounded text-[10px] border truncate max-w-full font-medium ${colorClass}`}>
              {c}
            </span>
          )
        })}
        {item.cargosInteresse.length > 2 && (
          <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 border border-white/10 bg-white/5 font-medium">+{item.cargosInteresse.length - 2}</span>
        )}
      </div>
    </div>
  )
}

function KanbanColumn({ id, title, items, onItemClick, onReject }: { id: string, title: string, items: CandidaturaItem[], onItemClick: (id: string) => void, onReject: (id: string, motivo?: string) => void }) {
  const { setNodeRef } = useDroppable({ id })

  // Efeito vazio animado
  const isEmpty = items.length === 0

  return (
    <div className={`flex flex-col min-w-0 rounded-2xl border p-4 ${COLUMN_COLORS[id] || 'border-white/10'}`}>
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="font-bold text-sm text-slate-200">{title}</h3>
        <span className="text-[11px] bg-black/40 px-2 py-0.5 rounded-md text-slate-400 font-bold border border-white/5">{items.length}</span>
      </div>

      <div ref={setNodeRef} className="flex-1 min-h-[250px] overflow-y-auto space-y-3 custom-scrollbar">
        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
          {items.map(item => (
            <KanbanItem key={item.id} item={item} onClick={() => onItemClick(item.id)} onReject={(motivo) => onReject(item.id, motivo)} />
          ))}
        </SortableContext>
        
        {isEmpty && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-xl p-8 text-center bg-white/[0.02] opacity-80">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <span className="text-xl">📂</span>
            </div>
            <span className="text-xs font-semibold">Nenhum candidato aqui</span>
            <p className="text-[10px] text-slate-600 mt-1">Arraste novos perfis para esta coluna para avançar a esteira.</p>
          </div>
        )}
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  )
}

export function KanbanBoard({ items, onItemMoved, onItemClick }: KanbanBoardProps) {
  const [localItems, setLocalItems] = useState(items)
  const [activeId, setActiveId] = useState<string | null>(null)
  
  useEffect(() => {
    setLocalItems(items)
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeIdStr = active.id as string
    const overIdStr = over.id as string

    const activeItem = localItems.find(i => i.id === activeIdStr)
    if (!activeItem) return

    let overColumnId = overIdStr as EtapaCandidatura
    if (!COLUMNS.includes(overColumnId as any)) {
      const overItem = localItems.find(i => i.id === overIdStr)
      if (overItem) overColumnId = overItem.etapa
      else return
    }

    if (activeItem.etapa !== overColumnId) {
      setLocalItems(prev => {
        const arr = [...prev]
        const idx = arr.findIndex(i => i.id === activeIdStr)
        if (idx !== -1) arr[idx] = { ...arr[idx], etapa: overColumnId }
        return arr
      })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    
    const activeItem = localItems.find(i => i.id === active.id)
    if (activeItem) {
      const originalItem = items.find(i => i.id === active.id)
      if (originalItem && originalItem.etapa !== activeItem.etapa) {
        // Trigger optimistically parent callback
        try {
          await onItemMoved(activeItem.id, activeItem.etapa)
        } catch (err) {
          // Revert on error
          setLocalItems(items)
        }
      }
    }
  }

  const activeItem = activeId ? localItems.find(i => i.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/*
        Grade em vez de faixa rolavel: com `w-80` por coluna as cinco somavam
        mais que a tela e o RH tinha que arrastar para o lado para ver os
        rejeitados. No grid cada coluna recebe a fracao da largura disponivel,
        e a rolagem so volta abaixo de 1280px, onde cinco colunas nao cabem
        mesmo.
      */}
      <div className="grid gap-4 pb-6 w-full grid-cols-[repeat(5,minmax(240px,1fr))] overflow-x-auto xl:overflow-x-visible">
        {COLUMNS.map(col => {
          const colItems = localItems.filter(i => i.etapa === col)
          return (
            <KanbanColumn 
              key={col} 
              id={col} 
              title={COLUMN_TITLES[col]} 
              items={colItems} 
              onItemClick={onItemClick}
              onReject={(id, motivo) => onItemMoved(id, 'REJEITADO', motivo)} 
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="opacity-90 rotate-2 scale-105">
            <KanbanItem item={activeItem} onClick={() => {}} onReject={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
