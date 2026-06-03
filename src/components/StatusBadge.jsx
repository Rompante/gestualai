/** Pequeno indicador de estado (pílula colorida com ponto). */
export default function StatusBadge({ label, tone = 'neutral', dot = true }) {
  const tones = {
    neutral: 'bg-white/10 text-slate-200 ring-white/10',
    good: 'bg-accent-500/15 text-accent-300 ring-accent-500/30',
    warn: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
    bad: 'bg-red-500/15 text-red-300 ring-red-500/30',
    brand: 'bg-brand-500/15 text-brand-100 ring-brand-500/30',
  }
  const dotTones = {
    neutral: 'bg-slate-400',
    good: 'bg-accent-400',
    warn: 'bg-amber-400',
    bad: 'bg-red-400',
    brand: 'bg-brand-400',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
        tones[tone] ?? tones.neutral
      }`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotTones[tone] ?? dotTones.neutral}`} />}
      {label}
    </span>
  )
}
