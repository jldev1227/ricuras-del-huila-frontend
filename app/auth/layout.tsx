import React, { ReactNode } from 'react'

export default function layout({ children }: { children: ReactNode }) {
    return (
        <div className='grid grid-cols-1 lg:grid-cols-2 min-h-screen'>
            {children}
            <div 
                className='hidden lg:flex relative bg-cover bg-center bg-no-repeat items-center justify-center'
                style={{
                    backgroundImage: 'url(/auth-bg.avif)'
                }}
            >
                {/* Logo centrado */}
                <img 
                    src="/logo.png" 
                    alt="Logo Ricuras del Huila"
                    className='relative z-10 max-w-md'
                    loading='eager'
                />
            </div>
        </div>
    )
}