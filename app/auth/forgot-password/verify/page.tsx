'use client'

import { Button, InputOtp } from '@heroui/react' // Cambia a @heroui/react
import Link from 'next/link'
import React, { useState } from 'react'

export default function Page() {
    const [otp, setOtp] = useState<string>('') // ✅ Inicializa como string vacío

    const handleSubmit = () => {
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
                            Verificación de{" "}
                            <span className='text-primary'>
                                Código
                            </span>
                        </h1>
                        <p className="text-sm text-gray-600 mt-4">
                            Hemos enviado un código de seguridad a tu correo registrado. Escríbelo para crear una nueva contraseña.
                        </p>
                    </div>

                    {/* Form fields */}
                    <div className="space-y-5">
                        {/* Identificación */}
                        <div className='flex flex-col'>
                            <InputOtp
                                className='mx-auto'
                                classNames={{
                                    segmentWrapper: "gap-x-2"
                                }}
                                size='lg' length={6} value={otp} onValueChange={setOtp}
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
                                onPress={handleSubmit}
                            >
                                Restaurar acceso
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}