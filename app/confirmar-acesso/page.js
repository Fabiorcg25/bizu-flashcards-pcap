'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmarAcessoPage() {
  const [tokenHash, setTokenHash] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token_hash')
      const type = params.get('type')

      if (!token || type !== 'invite') {
        setInvalid(true)
        return
      }

      setTokenHash(token)
    } catch {
      setInvalid(true)
    }
  }, [])

  async function confirmarAcesso() {
    if (!tokenHash || loading) return

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'invite'
      })

      if (verifyError) {
        throw verifyError
      }

      window.history.replaceState({}, '', '/confirmar-acesso')
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
          COMPRA APROVADA
        </div>

        <h1>
          Seu acesso está liberado!
        </h1>

        <p className="muted">
          Seu pagamento foi confirmado e seu acesso ao
          BIZU FLASHCARDS já está disponível.
        </p>

        <p className="muted">
          Confirme abaixo para criar sua senha e entrar no aplicativo.
        </p>

        {invalid && (
          <>
            <div className="error">
              Este link de acesso não é válido ou está incompleto.
            </div>

            <Link
              href="/login"
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: 14
              }}
            >
              IR PARA O LOGIN
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
            onClick={confirmarAcesso}
            disabled={loading}
          >
            {loading
              ? 'CONFIRMANDO ACESSO...'
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
              href="/login"
              className="btn"
              style={{
                width: '100%',
                marginTop: 12
              }}
            >
              IR PARA O LOGIN
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
            Por segurança, seu convite somente será confirmado
            quando você tocar no botão acima.
          </p>
        )}

      </section>
    </main>
  )
}
