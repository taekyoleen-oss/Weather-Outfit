'use client'

interface SourceOption {
  key: string
  label: string
  sublabel?: string
  available?: boolean
}

interface Props {
  options: SourceOption[]
  selected: string
  onChange: (key: string) => void
}

export function LocationSourcePicker({ options, selected, onChange }: Props) {
  return (
    <div className="flex gap-1.5">
      {options.map(opt => {
        const active = selected === opt.key
        const disabled = opt.available === false
        return (
          <button
            key={opt.key}
            onClick={() => !disabled && onChange(opt.key)}
            disabled={disabled}
            className="flex-1 flex flex-col items-center py-2 px-2 rounded-md transition-all"
            style={{
              background: active
                ? 'var(--primary)'
                : disabled
                  ? 'rgba(0,0,0,0.06)'
                  : 'var(--colors-surface-filter)',
              color: active ? 'var(--colors-on-primary)' : disabled ? 'var(--muted)' : 'var(--humidity)',
              border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
              opacity: disabled ? 0.55 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <span className="text-xs font-semibold leading-tight">{opt.label}</span>
            {opt.sublabel && (
              <span
                className="text-[10px] leading-tight truncate w-full text-center mt-0.5 px-1"
                style={{ color: active ? 'rgba(255,255,255,0.8)' : 'var(--muted)', maxWidth: 72 }}
              >
                {opt.sublabel}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
