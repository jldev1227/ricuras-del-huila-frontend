export function formatCOP(amount: number) {
    const toNumber = Number(amount)

    return toNumber.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}
