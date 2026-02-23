import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { isDark, toggle } = useTheme()

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 rounded-lg border border-border hover:bg-card transition-colors"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDark
        ? <Sun className="w-4 h-4 text-foreground" />
        : <Moon className="w-4 h-4 text-foreground" />}
    </button>
  )
}
