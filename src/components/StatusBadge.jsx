/** Pequeno indicador de estado (pílula colorida). */
export default function StatusBadge({ label, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-white/10 text-slate-200',
    good: 'bg-accent-500/20 text-accent-500',
    warn: 'bg-amber-400/20 text-amber-300',
    bad: 'bg-red-500/20 text-red-300',
    brand: 'bg-brand-500/20 text-brand-100',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        tones[tone] ?? tones.neutral
      }`}
    >
      {label}
    </span>
  )
}
