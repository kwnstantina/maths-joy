
// import {Metric} from 'web-vitals'
// import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals/dist/web-vitals'

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals'

function getConnectionSpeed() {
  const isSupported = !!(navigator )?.connection?.effectiveType

  return isSupported ? (navigator )?.connection?.effectiveType : ''
}

export function sendToVercelAnalytics(metric) {
  // This requires us passing the variable from a loader in root.tsx
  const analyticsId = window.ENV?.VERCEL_ANALYTICS_ID;

  if (!analyticsId) {
    return
  }

  const body = {
    dsn: analyticsId,
    id: metric.id,
    page: window.location.pathname,
    href: window.location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: getConnectionSpeed(),
  }

  const blob = new Blob([new URLSearchParams(body).toString()], {
    // This content type is necessary for `sendBeacon`
    type: 'application/x-www-form-urlencoded',
  })
  if (navigator.sendBeacon) {
    navigator.sendBeacon(vitalsUrl, blob)
  } else
    fetch(vitalsUrl, {
      body: blob,
      method: 'POST',
      credentials: 'omit',
      keepalive: true,
    })
}