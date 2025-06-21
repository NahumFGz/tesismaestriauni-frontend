export function formatCurrency(quantity: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(quantity)
}

//!Otra opción es usar la librería date-fns
export function formatDate(isoString: string) {
  const date = new Date(isoString)

  const formater = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return formater.format(date)
}

// Función para formatear fecha a formato yyyy-mm-dd
export function formatDateToISO(dateString: string | null) {
  if (!dateString) return 'NO DISPONIBLE'
  return new Date(dateString).toISOString().split('T')[0]
}

// Función para formatear números con separadores de miles y decimales
export function formatNumber(amount: string) {
  const num = parseFloat(amount)
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2
  }).format(num)
}

// Función para truncar texto con puntos suspensivos
export function truncateText(text: string, maxLength: number = 50) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
