import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://04dca7eabb4787cc556346a1f0ed1f3d@o4511213732626432.ingest.us.sentry.io/4511213739376640',

  // Captura 10% das transações em produção para tracing de performance
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  /*
    Session Replay grava a tela e manda para o Sentry (servidores nos EUA).

    Este portal tem salario em Controle de Vagas, CPF e telefone em Candidatos,
    e laudo medico em Gestao de PCD — dado de saude, art. 11 da LGPD. A
    configuracao anterior tinha o comentario "Mascara inputs e textos por
    padrao (LGPD)" e, logo abaixo, `maskAllText: false` e `blockAllMedia:
    false`: gravava tudo legivel, em 10% de TODAS as sessoes. O comentario
    dizia a intencao; o codigo fazia o contrario.

    - `replaysSessionSampleRate: 0` — sem amostragem de sessao. Replay deixa de
      ser gravacao de rotina e vira ferramenta de diagnostico.
    - `replaysOnErrorSampleRate: 1` — quando da erro, grava. E para isso que
      serve, e e quando a captura se justifica.
    - Texto mascarado e midia bloqueada: o replay mostra o caminho que a pessoa
      percorreu, nao o conteudo que ela leu.
  */
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
      // Redundante com maskAllText, mas explicito: se alguem afrouxar a
      // mascara geral um dia, campo de formulario continua coberto.
      mask: ['input', 'textarea', 'select', '[data-sensivel]'],
    }),
  ],

  // Não envia erros em desenvolvimento
  enabled: process.env.NODE_ENV === 'production',

  // Ignora erros de cancelamento de fetch e extensões de browser
  ignoreErrors: [
    'AbortError',
    'ResizeObserver loop limit exceeded',
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
  ],
})

// Next 15.3+: o Sentry acompanha as navegações do App Router por aqui.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
