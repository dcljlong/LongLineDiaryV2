import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'

export default function SettingsSimple() {
  const { theme, setTheme } = useTheme()

  return (
    <div className='p-6 space-y-6'>
      <h1 className='text-2xl font-semibold'>Settings</h1>

      <div className='space-y-3'>
        <p className='text-muted-foreground text-sm'>Theme Mode</p>
        <div className='flex gap-3'>
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            onClick={() => setTheme('light')}
          >
            Light
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            onClick={() => setTheme('dark')}
          >
            Dark
          </Button>
        </div>
      </div>
    </div>
  )
}
