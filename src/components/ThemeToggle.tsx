import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg border border-border hover:bg-card transition-colors"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === 'dark'
        ? <Sun className="w-4 h-4 text-foreground" />
        : <Moon className="w-4 h-4 text-foreground" />}
    </button>
  )
}
