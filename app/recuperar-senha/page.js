'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const REDIRECT_URL = 'https://flashcard.bizupremium.com/definir-senha'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: REDIRECT_URL
          }
        )

      if (resetError) {
        if (resetError.status === 429) {
          setError(
            'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.'
          )
        } else {
          setError(
            'Não foi possível enviar o link agora. Tente novamente em alguns instantes.'
          )
        }

        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError(
        'Não foi possível enviar o link agora. Tente novamente em alguns instantes.'
      )
    } finally {
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
          ACESSO À CONTA
        </div>

        {!sent ? (
          <>
            <h1>
              Primeiro acesso ou esqueceu a senha?
            </h1>

            <p className="muted">
              Digite o e-mail usado na compra.
              Enviaremos um link seguro para você
              definir uma nova senha.
            </p>

            {error && (
              <div className="error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="field">

                <label htmlFor="email">
                  E-mail
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="seuemail@exemplo.com"
                />

              </div>

              <button
                className="btn btn-primary"
                type="submit"
                style={{
                  width: '100%',
                  marginTop: 8
                }}
                disabled={loading}
              >

                {loading
                  ? 'ENVIANDO...'
                  : 'ENVIAR LINK DE ACESSO'}

              </button>

            </form>

            <Link
              href="/login"
              className="btn btn-ghost"
              style={{
                width: '100%',
                marginTop: 12
              }}
            >
              VOLTAR PARA O LOGIN
            </Link>
          </>
        ) : (
          <>
            <h1>
              Confira seu e-mail
            </h1>

            <div
              className="notice"
              style={{ marginTop: 14 }}
            >
              Se o endereço informado estiver
              vinculado à sua conta, você receberá
              um link para criar uma nova senha.
            </div>

            <p
              className="muted"
              style={{ marginTop: 16 }}
            >
              Verifique também as pastas Spam,
              Lixo eletrônico e Promoções.
            </p>

            <button
              className="btn btn-ghost"
              type="button"
              style={{
                width: '100%',
                marginTop: 8
              }}
              onClick={() => {
                setSent(false)
                setError('')
              }}
            >
              TENTAR OUTRO E-MAIL
            </button>

            <Link
              href="/login"
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: 12
              }}
            >
              VOLTAR PARA O LOGIN
            </Link>
          </>
        )}

        <p
          className="muted"
          style={{
            fontSize: 12,
            marginTop: 18
          }}
        >
          Por segurança, não informamos se um
          endereço específico possui ou não uma
          conta cadastrada.
        </p>

      </section>
    </main>
  )
}
