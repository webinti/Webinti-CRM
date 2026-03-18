'use client'

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'

export function NavigationProgressBar() {
  return (
    <ProgressBar
      height="2px"
      color="#7ee5aa"
      options={{ showSpinner: false }}
      shallowRouting
    />
  )
}
