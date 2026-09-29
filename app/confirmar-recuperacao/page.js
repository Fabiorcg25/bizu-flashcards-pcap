'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function ConfirmarRecuperacaoPage() {
  const [confirmationUrl, setConfirmationUrl] = useState('')
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    try {
      const current = new URL(window.location.href)
      const rawConfirmationUrl = current.searchParams.get('confirmation_url')

      if (!rawConfirmationUrl) {
        setInvalid(true)
        return
      }

      const target = new URL(rawConfirmationUrl)
      const allowedOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
      const outerType = current.searchParams.get('type')
      const outerRedirectTo = current.searchParams.get('redirect_to')

      if (outerType && !target.searchParams.get('type')) {
        target.searchParams.set('type', outerType)
      }

      if (outerRedirectTo && !target.searchParams.get('redirect_to')) {
        target.searchParams.set('redirect_to', outerRedirectTo)
      }

      const type = target.searchParams.get('type')

      if (
        target.origin !== allowedOrigin ||
        target.pathname !== '/auth/v1/verify' ||
        type !== 'recovery'
      ) {
        setInvalid(true)
        return
      }

      setConfirmationUrl(target.toString())
    } catch {
      setInvalid(true)
    }
  }, [])

  return (
    <main className="login-wrap">
      <section className="login-card">
        <div className="brand">
          <div className="bolt">⚡</div>
          <div>
            <h1 style={{ margin: 0 }}>BIZU FLASHCARDS</h1>
            <small>PC/AP 2026 • OFICIAL INVESTIGADOR</small>
          </div>
        </div>

        <div style={{ marginTop: 24 }} className="eyebrow">
          CONFIRMAÇÃO DE SEGURANÇA
        </div>

        <h1>Confirme sua solicitação</h1>

        <p className="muted">
          Para proteger seu acesso, confirme abaixo que foi você quem
          solicitou a criação ou alteração da senha.
        </p>

        {!invalid && !confirmationUrl && (
          <div className="notice">Preparando seu acesso seguro...</div>
        )}

        {invalid && (
          <>
            <div className="error">
              Este link não é válido. Solicite um novo acesso para continuar.
            </div>
            <Link
              href="/recuperar-senha"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 14 }}
            >
              SOLICITAR NOVO ACESSO
            </Link>
          </>
        )}

        {confirmationUrl && (
          <a
            href={confirmationUrl}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 14 }}
          >
            CRIAR MINHA SENHA
          </a>
        )}

        <p className="muted" style={{ fontSize: 12, marginTop: 18 }}>
          O link de segurança só será confirmado quando você tocar no botão acima.
        </p>
      </section>
    </main>
  )
}
