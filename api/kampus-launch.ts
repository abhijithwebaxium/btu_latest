import type { VercelRequest, VercelResponse } from '@vercel/node'

const KAMPUS_ORIGIN = 'https://test.kampus.org.in'
const KAMPUS_API    = 'https://testapi1.kampus.org.in'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const loginRes = await fetch(`${KAMPUS_API}/login/checklogin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userLoginID: process.env.KAMPUS_USERNAME || '',
        password:    process.env.KAMPUS_PASSWORD  || '',
      }),
    })

    const loginData = await loginRes.json() as any

    if (loginData.status !== 'Login Success') {
      return res.redirect(302, `${KAMPUS_ORIGIN}/login`)
    }

    const accessToken: string = loginData.value.accessToken
    const userCreds: string   = JSON.stringify(loginData.value)

    const kampusRes = await fetch(`${KAMPUS_ORIGIN}/`, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
    })
    let html = await kampusRes.text()

    // <base> resolves all relative asset URLs to the Kampus origin.
    // The auth script runs before the React bundle, so the SPA boots already authenticated.
    const baseTag    = `<base href="${KAMPUS_ORIGIN}/">`
    const authScript = `<script>(function(){try{` +
      `localStorage.setItem('AccessToken',${JSON.stringify(accessToken)});` +
      `localStorage.setItem('userCreds',${JSON.stringify(userCreds)});` +
      `}catch(e){}})()</script>`

    html = html.replace(/<head>/i, `<head>${baseTag}${authScript}`)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(html)
  } catch {
    return res.redirect(302, `${KAMPUS_ORIGIN}/login`)
  }
}
