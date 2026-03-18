'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, style, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label style={{ fontSize: 11, fontWeight: 600, color: '#9898b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5e5e7a' }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            style={{
              width: '100%', height: 38, borderRadius: 8,
              border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid #252538',
              background: '#0d0d14',
              padding: icon ? '0 12px 0 36px' : '0 12px',
              fontSize: 13, color: '#f0f0ff',
              outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.15s',
              ...style,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#6366f1' }}
            onBlur={e => { e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : '#252538' }}
            className={cn('placeholder:text-[#5e5e7a] disabled:opacity-50 disabled:cursor-not-allowed', className)}
            {...props}
          />
        </div>
        {error && <p style={{ fontSize: 11, color: '#f87171' }}>{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, style, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label style={{ fontSize: 11, fontWeight: 600, color: '#9898b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          style={{
            width: '100%', borderRadius: 8,
            border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid #252538',
            background: '#0d0d14',
            padding: '8px 12px',
            fontSize: 13, color: '#f0f0ff',
            outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.15s',
            resize: 'none',
            ...style,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#6366f1' }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : '#252538' }}
          className={cn('placeholder:text-[#5e5e7a] disabled:opacity-50 disabled:cursor-not-allowed', className)}
          {...props}
        />
        {error && <p style={{ fontSize: 11, color: '#f87171' }}>{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
