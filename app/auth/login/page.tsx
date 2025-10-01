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
                <form className="space-y-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-4xl sm:text-5xl font-black text-foreground-700 leading-[40px] sm:leading-[55px] sm:w-[30rem]">
                            Acceso Interno{" "}
                            <span className='text-primary'>
                                Ricuras Del Huila
                            </span>
                        </h1>
                        <p className="text-sm text-gray-600 mt-4">
                            Sistema exclusivo para el personal autorizado.
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

                        {/* Contraseña */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-primary"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Remember me */}
                        <Checkbox
                            id="remember"
                            type="checkbox"
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        >
                            Recordarme
                        </Checkbox>

                        {/* Submit button */}
                        <div>
                            <Button
                                color="primary"
                                variant="solid"
                                className='h-16 font-bold text-xl'
                                size="md"
                                fullWidth
                            >
                                Ingresar
                            </Button>
                        </div>

                        <p className='text-center font-bold text-foreground-700'>{" "}¿Olvidate tu contraseña? <Link href={'/auth/forgot-password'} className='text-primary'>Recuperar contraseña</Link></p>
                    </div>
                </form>
            </div>
        </div>
    )
}