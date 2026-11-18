import ui from '../styles/ui.module.css'

export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className={ui.header}>
      <h1 className={ui.title}>{title}</h1>
      {subtitle ? <p className={ui.subtitle}>{subtitle}</p> : null}
      {children}
    </header>
  )
}
