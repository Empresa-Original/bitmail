import { NextResponse } from 'next/server'

function randomNonce() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export async function GET() {
  const nonce = randomNonce()
  const res = NextResponse.json({ nonce })
  res.cookies.set('siwe-nonce', nonce, { httpOnly: true, path: '/', sameSite: 'lax' })
  return res
}

