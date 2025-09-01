import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SiweMessage } from 'siwe'

export async function POST(req: Request) {
  try {
    const body = await req.json() as { message: string; signature: string }
    const msg = new SiweMessage(body.message)
    const nonce = cookies().get('siwe-nonce')?.value
    if (!nonce) return NextResponse.json({ ok: false, error: 'Missing nonce' }, { status: 400 })

    const { success } = await msg.verify({ signature: body.signature, nonce })
    if (!success) return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 })

    const session = { address: msg.address, chainId: msg.chainId, issuedAt: msg.issuedAt }
    const res = NextResponse.json({ ok: true, session })
    res.cookies.set('siwe-session', JSON.stringify(session), { httpOnly: true, sameSite: 'lax', path: '/' })
    return res
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 })
  }
}

