// @ts-nocheck
export default function AuthCard({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
      <div className="card rise p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-flame-600">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-navy-900">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
    </div>
  )
}

export function FormError({ children }) {
  if (!children) return null
  return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{children}</p>
}
