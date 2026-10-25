/** Proves to IndexNow that we own the domain (keyLocation in lib/indexnow.ts). */
export async function GET() {
  const key = process.env.INDEXNOW_KEY
  return key ? new Response(key, { headers: { 'Content-Type': 'text/plain' } }) : new Response('Not found', { status: 404 })
}
