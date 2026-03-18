'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

export function DialogOverlay({ className, ...props }: DialogPrimitive.DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  )
}

export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: DialogPrimitive.DialogContentProps & { title?: string; description?: string }) {
  const isMobile = useIsMobile()

  return (
    <DialogPortal>
      <DialogOverlay />
      {isMobile ? (
        <DialogPrimitive.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'rounded-t-2xl p-5 shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            'max-h-[92dvh] overflow-y-auto duration-300',
            className
          )}
          style={{ border: '1px solid #252538', borderBottom: 'none', background: '#13131e' }}
          {...props}
        >
          {/* Drag handle */}
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: '#33334e',
            margin: '0 auto 16px',
          }} />
          {(title || description) && (
            <div className="mb-5">
              {title && (
                <DialogPrimitive.Title className="text-lg font-semibold text-[#f1f5f9]">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="text-sm text-[#64748b] mt-1">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
          )}
          {children}
          <DialogPrimitive.Close
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 28, height: 28, borderRadius: 6,
              border: '1px solid #252538', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#5e5e7a',
            }}
          >
            <X size={14} />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      ) : (
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
            'w-[calc(100vw-24px)] max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'max-h-[90dvh] overflow-y-auto duration-200',
            className
          )}
          style={{ border: '1px solid #252538', background: '#13131e' }}
          {...props}
        >
          {(title || description) && (
            <div className="mb-5">
              {title && (
                <DialogPrimitive.Title className="text-lg font-semibold text-[#f1f5f9]">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="text-sm text-[#64748b] mt-1">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
          )}
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1.5 text-[#64748b] hover:text-[#f1f5f9] transition-colors focus:outline-none">
            <X size={16} />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      )}
    </DialogPortal>
  )
}
