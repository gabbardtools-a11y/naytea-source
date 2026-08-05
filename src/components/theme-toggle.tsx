'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type ThemeOption = 'light' | 'dark' | 'system'

const options: { value: ThemeOption; label: string; icon: typeof Moon }[] = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Системная', icon: Monitor },
]

// useSyncExternalStore with empty subscribe + getServerSnapshot=false
// gives us a stable mounted flag without triggering the
// "setState in effect" lint rule.
const subscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60"
        aria-label="Переключить тему"
      >
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const current = (theme as ThemeOption) || 'dark'
  const CurrentIcon = options.find((o) => o.value === current)?.icon || Moon
  const effective = resolvedTheme || 'dark'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-9 w-9 rounded-lg border transition-colors',
            effective === 'dark'
              ? 'border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white'
              : 'border-slate-200 bg-white/60 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          )}
          aria-label="Переключить тему"
        >
          <CurrentIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[140px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
      >
        {options.map((opt) => {
          const Icon = opt.icon
          const isActive = current === opt.value
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                'cursor-pointer flex items-center gap-2',
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 focus:bg-indigo-50 dark:focus:bg-indigo-950/60 focus:text-indigo-700 dark:focus:text-indigo-300'
                  : 'text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{opt.label}</span>
              {isActive && <span className="ml-auto text-xs">●</span>}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
