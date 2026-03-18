import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div style={{ height: 64, borderBottom: '1px solid #1e1e30', background: 'rgba(13,13,20,0.92)', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <Skeleton style={{ width: 160, height: 18 }} />
      </div>
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 100, borderRadius: 12 }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 280, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
