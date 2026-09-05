type PageHeaderProps = {
  eyebrow: React.ReactNode
  title: string
  description: string
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  className = ''
}: PageHeaderProps): React.JSX.Element {
  return (
    <section className={`max-w-2xl ${className}`}>
      <p className="text-sm font-medium text-accent">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 text-base leading-7 text-muted">{description}</p>
    </section>
  )
}
