'use client'

// Re-export from toaster for convenience
export { toast } from '@/components/ui/toaster'

export interface ToastProps {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  // Dynamic import to avoid circular deps
  const toastFn = async (t: ToastProps) => {
    const { toast } = await import('@/components/ui/toaster')
    toast(t)
  }

  // Sync version
  let toastSync: (t: ToastProps) => void = () => {}
  if (typeof window !== 'undefined') {
    // Import synchronously from module registry at runtime
    toastSync = (t: ToastProps) => {
      // Use global registry
      ;(window as any).__gpbToast?.(t)
    }
  }

  return {
    toast: (t: ToastProps) => {
      import('@/components/ui/toaster').then(m => m.toast(t))
    }
  }
}
