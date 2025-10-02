'use client'

import { Button, InputOtp } from '@heroui/react'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  const [otp, setOtp] = useState<string>('')
  const [identificacion, setIdentificacion] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Verificar que venimos del paso anterior
    const storedId = sessionStorage.getItem('reset_identificacion')
    if (!storedId) {
      router.push('/forgot-password')
      return
    }
    setIdentificacion(storedId)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      setError('Ingresa el código completo de 6 dígitos')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificacion, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Código inválido')
      }

      // Guardar token temporal
      sessionStorage.setItem('reset_token', data.resetToken)
      
      // Redirigir a crear nueva contraseña
      router.push('/auth/forgot-password/reset')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificacion }),
      })
      setError('')
      alert('Código reenviado exitosamente')
    } catch (err) {
      setError('Error al reenviar código')
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
          <Button isIconOnly color='primary' as={Link} href='/forgot-password'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Button>
          <p className='text-2xl font-bold text-foreground-700'>Volver</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-6">
            <h1 className="text-4xl sm:text-5xl font-black text-foreground-700 leading-[40px] sm:leading-[55px] sm:w-[30rem]">
              Verificación de{" "}
              <span className='text-primary'>
                Código
              </span>
            </h1>
            <p className="text-sm text-gray-600 mt-4">
              Hemos enviado un código de seguridad a tu correo registrado. Escríbelo para crear una nueva contraseña.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div className='flex flex-col'>
              <InputOtp
                className='mx-auto'
                classNames={{
                  segmentWrapper: "gap-x-2"
                }}
                size='lg'
                length={6}
                value={otp}
                onValueChange={setOtp}
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
                isDisabled={loading || otp.length !== 6}
              >
                {loading ? 'Verificando...' : 'Restaurar acceso'}
              </Button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-sm text-primary hover:underline"
              >
                Reenviar código
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}