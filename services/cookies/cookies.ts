import { createCookie } from "@remix-run/node"

export let i18nCookie = createCookie('i18n', {
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 365, // 1 year
  secure: process.env.NODE_ENV === 'production',
})