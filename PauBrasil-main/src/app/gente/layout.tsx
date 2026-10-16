import AppLayout from '@/app/app/layout'
import { DockGente } from './_components/DockGente'

export default function GenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      {/*
        O dock fica aqui, e não em cada página, para aparecer em todas as telas
        do módulo sem repetição — inclusive nas de importar e editar, que eram
        justamente as que obrigavam a voltar pelo hub para trocar de assunto.

        A largura do módulo é o teto das telas de leitura — pipeline, listas e
        tabelas. Em 1600px a matriz de sucessão cabe inteira sem rolagem
        lateral, que era o que obrigava a arrastar para ver Armazém e Frota.
        As telas de formulário e importação continuam com o próprio limite
        (`max-w-4xl` / `max-w-5xl`): campo largo demais piora a leitura.
      */}
      <div className="mx-auto w-full max-w-[1600px] space-y-5">
        <DockGente />
        {children}
      </div>
    </AppLayout>
  )
}
