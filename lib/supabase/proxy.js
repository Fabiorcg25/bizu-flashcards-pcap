import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },

      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )

        response = NextResponse.next({ request })

        cookiesToSet.forEach(
          ({ name, value, options }) =>
            response.cookies.set(name, value, options)
        )

        if (headers) {
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          )
        }
      }
    }
  })

  const { data } = await supabase.auth.getClaims()

  const authenticated = Boolean(data?.claims)
  const path = request.nextUrl.pathname

  const isPublic =
    path.startsWith('/login') ||
    path.startsWith('/demo') ||
    path.startsWith('/auth') ||
    path.startsWith('/definir-senha') ||
    path.startsWith('/recuperar-senha') ||
  path.startsWith('/confirmar-recuperacao') ||
path.startsWith('/confirmar-acesso')

  if (!authenticated && !isPublic) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  if (authenticated && path === '/login') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
