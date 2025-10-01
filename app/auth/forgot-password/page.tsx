'use client'

import { Button, Checkbox } from '@heroui/react' // Cambia a @heroui/react
import Link from 'next/link'
import React from 'react'

export default function Page() {
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
          <Button isIconOnly color='primary' as={Link} href='/auth/login'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Button>
          <p className='text-2xl font-bold text-foreground-700'>Volver</p>
        </div>
        <form className="space-y-6">
          {/* Header */}
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

          {/* Form fields */}
          <div className="space-y-5">
            {/* Identificación */}
            <div>
              <label
                htmlFor="identificacion"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Identificación
              </label>
              <input
                id="identificacion"
                type="number"
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-primary"
                placeholder="Ej: 1234567890"
              />
            </div>

            {/* Submit button */}
            <div>
              <Button
                color="primary"
                variant="solid"
                className='h-16 font-bold text-xl'
                size="md"
                fullWidth
              >
                Solicitar instrucciones
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}