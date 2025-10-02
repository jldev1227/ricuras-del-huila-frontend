'use client'

import { Button } from '@heroui/react'
import Link from 'next/link'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  const [identificacion, setIdentificacion] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificacion }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al procesar solicitud')
      }

      // Guardar identificación en sessionStorage
      sessionStorage.setItem('reset_identificacion', identificacion)
      
      // Redirigir a verificar OTP
      router.push('/auth/forgot-password/verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className='block lg:hidden'>
          <img
            src="/logo.png"
            alt="Logo Ricuras del Huila"
            className='mx-auto relative z-10 w-56 h-56'
            loading='eager'
          />
        </div>

        <div className='flex items-center gap-2 mb-8'>
          <Button isIconOnly color='primary' as={Link} href='/login'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Button>
          <p className='text-2xl font-bold text-foreground-700'>Volver</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-6">
            <h1 className="text-4xl sm:text-5xl font-black text-foreground-700 leading-[40px] sm:leading-[55px] sm:w-[30rem]">
              Recuperar{" "}
              <span className='text-primary'>
                Contraseña
              </span>
            </h1>
            <p className="text-sm text-gray-600 mt-4">
              Ingresa tu número de documento registrado para restablecer tu contraseña y volver a acceder al sistema.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="identificacion" className="block text-sm font-medium text-gray-700 mb-2">
                Identificación
              </label>
              <input
                id="identificacion"
                type="text"
                value={identificacion}
                onChange={(e) => setIdentificacion(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-primary disabled:bg-gray-100"
                placeholder="Ej: 1234567890"
              />
            </div>

            <div>
              <Button
                type="submit"
                color="primary"
                variant="solid"
                className='h-16 font-bold text-xl'
                size="md"
                fullWidth
                isLoading={loading}
                isDisabled={loading}
              >
                {loading ? 'Enviando...' : 'Solicitar instrucciones'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}