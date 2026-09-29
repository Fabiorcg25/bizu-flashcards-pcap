'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmarRecuperacaoPage() {
  const [tokenHash, setTokenHash] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token_hash')
      const type = params.get('type')

      if (!token || type !== 'recovery') {
        setInvalid(true)
        return
      }

      setTokenHash(token)
    } catch {
      setInvalid(true)
    }
  }, [])

  async function confirmar() {
    if (!tokenHash || loading) return

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery'
      })

      if (verifyError) {
        throw verifyError
      }

      window.history.replaceState({}, '', '/confirmar-recuperacao')
      window.location.assign('/definir-senha')
    } catch {
      setError(
        'Este link está inválido ou expirou. Solicite um novo acesso para continuar.'
      )
      setLoading(false)
    }
  }

  return (
    <main className="login-wrap">
      <section className="login-card">
        <div className="brand">
          <div className="bolt">⚡</div>

          <div>
            <h1 style={{ margin: 0 }}>
              BIZU FLASHCARDS
            </h1>

            <small>
              PC/AP 2026 • OFICIAL INVESTIGADOR
            </small>
          </div>
        </div>

        <div
          style={{ marginTop: 24 }}
          className="eyebrow"
        >
          CONFIRMAÇÃO DE SEGURANÇA
        </div>

        <h1>
          Confirme sua solicitação
        </h1>

        <p className="muted">
          Para proteger seu acesso, confirme abaixo que foi você quem
          solicitou a criação ou alteração da senha.
        </p>

        {invalid && (
          <>
            <div className="error">
              Este link não é válido. Solicite um novo acesso para continuar.
            </div>

            <Link
              href="/recuperar-senha"
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: 14
              }}
            >
              SOLICITAR NOVO ACESSO
            </Link>
          </>
        )}

        {!invalid && tokenHash && (
          <button
            type="button"
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: 14
            }}
            onClick={confirmar}
            disabled={loading}
          >
            {loading
              ? 'CONFIRMANDO...'
              : 'CRIAR MINHA SENHA'}
          </button>
        )}

        {error && (
          <>
            <div
              className="error"
              style={{ marginTop: 14 }}
            >
              {error}
            </div>

            <Link
              href="/recuperar-senha"
              className="btn"
              style={{
                width: '100%',
                marginTop: 12
              }}
            >
              SOLICITAR NOVO ACESSO
            </Link>
          </>
        )}

        {!invalid && !error && (
          <p
            className="muted"
            style={{
              fontSize: 12,
              marginTop: 18
            }}
          >
            O link de segurança só será confirmado quando você tocar no botão acima.
          </p>
        )}
      </section>
    </main>
  )
}
