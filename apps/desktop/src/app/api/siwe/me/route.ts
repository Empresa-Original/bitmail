import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const raw = cookies().get('siwe-session')?.value
  if (!raw) return NextResponse.json({ ok: false })
  try {
    const session = JSON.parse(raw)
    return NextResponse.json({ ok: true, session })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

