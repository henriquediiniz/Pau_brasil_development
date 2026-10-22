import Image from 'next/image'
import { BookOpen, GraduationCap, Users } from 'lucide-react'
import styles from './Hub.module.css'

/** Etapas de aprendizagem e programas do grupo. Usado na home e na vitrine da Universidade. */
export function HubLearningPath() {
  return (
    <div className={styles.learningPath} data-reveal>
      <span className={styles.learningEyebrow}>
        Aprendizagem em cada etapa
      </span>
      <div>
        <span>
          <Users size={22} />
        </span>
        <div>
          <h3>Chegar e pertencer</h3>
          <p>Integração e conexão com a cultura do grupo.</p>
        </div>
        <small>01</small>
      </div>
      <div>
        <span>
          <BookOpen size={22} />
        </span>
        <div>
          <h3>Aprender na prática</h3>
          <p>Conteúdos compartilhados pelos nossos líderes.</p>
        </div>
        <small>02</small>
      </div>
      <div>
        <span>
          <GraduationCap size={22} />
        </span>
        <div>
          <h3>Continuar evoluindo</h3>
          <p>Aprendizado, avaliações e certificados.</p>
        </div>
        <small>03</small>
      </div>
      <ul className={styles.programs} aria-label="Programas do grupo">
        <li>
          <Image
            src="/brand/programa-capacitar.png"
            alt="Capacitar · Grupo Pau Brasil"
            width={640}
            height={302}
            sizes="180px"
          />
          <span>Capacitação das equipes</span>
        </li>
        <li>
          <Image
            src="/brand/programa-td-lideres.jpg"
            alt="T&D Líderes · Grupo Pau Brasil"
            width={640}
            height={393}
            sizes="180px"
          />
          <span>Treinamento e desenvolvimento de líderes</span>
        </li>
      </ul>
    </div>
  )
}
