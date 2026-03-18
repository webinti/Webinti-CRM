export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(90deg, #13131e 25%, #1a1a28 50%, #13131e 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite',
        borderRadius: 8,
        ...style,
      }}
    />
  )
}

export function SkeletonPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div style={{ height: 64, borderBottom: '1px solid #1e1e30', background: 'rgba(13,13,20,0.92)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <div>
          <Skeleton style={{ width: 160, height: 18, marginBottom: 6 }} />
          <Skeleton style={{ width: 80, height: 12 }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-4">
        {/* Search/action bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton style={{ width: 240, height: 36 }} />
          <Skeleton style={{ width: 140, height: 36 }} />
        </div>

        {/* Table */}
        <div style={{ background: '#13131e', border: '1px solid #252538', borderRadius: 8, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #252538', display: 'flex', gap: 16 }}>
            {[200, 160, 100, 100].map((w, i) => (
              <Skeleton key={i} style={{ width: w, height: 12 }} />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e30', display: 'flex', alignItems: 'center', gap: 16 }}>
              <Skeleton style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
              <Skeleton style={{ width: 160, height: 14 }} />
              <Skeleton style={{ width: 120, height: 12, marginLeft: 'auto' }} />
              <Skeleton style={{ width: 80, height: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonDetail() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div style={{ height: 64, borderBottom: '1px solid #1e1e30', background: 'rgba(13,13,20,0.92)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <div>
          <Skeleton style={{ width: 180, height: 18, marginBottom: 6 }} />
          <Skeleton style={{ width: 80, height: 12 }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Skeleton style={{ width: 140, height: 14 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Skeleton style={{ width: 80, height: 32 }} />
            <Skeleton style={{ width: 100, height: 32 }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left */}
          <div className="lg:col-span-1 space-y-4">
            <div style={{ background: '#13131e', border: '1px solid #252538', borderRadius: 12, padding: 20, space: 12 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <Skeleton style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton style={{ width: '80%', height: 16, marginBottom: 8 }} />
                  <Skeleton style={{ width: '50%', height: 12 }} />
                </div>
              </div>
              {[1, 2, 3].map(i => <Skeleton key={i} style={{ width: '100%', height: 13, marginBottom: 10 }} />)}
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map(i => (
              <div key={i} style={{ background: '#13131e', border: '1px solid #252538', borderRadius: 12, padding: 20 }}>
                <Skeleton style={{ width: 120, height: 16, marginBottom: 16 }} />
                {[1, 2].map(j => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e1e30' }}>
                    <Skeleton style={{ width: 140, height: 14 }} />
                    <Skeleton style={{ width: 80, height: 22, borderRadius: 20 }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
