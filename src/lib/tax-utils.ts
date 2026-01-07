import { Transaction } from '@/stores/useErpStore'

export const STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

export interface TaxCalculationResult {
  icmsRate: number
  icmsValue: number
  pisRate: number
  pisValue: number
  cofinsRate: number
  cofinsValue: number
}

export function calculateCteTaxes(
  value: number,
  origin: string,
  destination: string,
): TaxCalculationResult {
  if (!value || !origin || !destination) {
    return {
      icmsRate: 0,
      icmsValue: 0,
      pisRate: 0,
      pisValue: 0,
      cofinsRate: 0,
      cofinsValue: 0,
    }
  }

  const isInternal = origin === destination
  const icmsRate = isInternal ? 18 : 12 // Simplified logic
  const pisRate = 1.65
  const cofinsRate = 7.6

  return {
    icmsRate,
    icmsValue: parseFloat(((value * icmsRate) / 100).toFixed(2)),
    pisRate,
    pisValue: parseFloat(((value * pisRate) / 100).toFixed(2)),
    cofinsRate,
    cofinsValue: parseFloat(((value * cofinsRate) / 100).toFixed(2)),
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateCte(data: Partial<Transaction>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data.cteNumber) errors.push('Número do CT-e é obrigatório.')
  if (!data.value || data.value <= 0)
    errors.push('Valor deve ser maior que zero.')
  if (!data.origin) errors.push('Origem é obrigatória.')
  if (!data.destination) errors.push('Destino é obrigatório.')
  if (data.origin && !STATES.includes(data.origin))
    errors.push('Estado de origem inválido.')
  if (data.destination && !STATES.includes(data.destination))
    errors.push('Estado de destino inválido.')

  if (data.cfop && data.origin && data.destination) {
    const isInternal = data.origin === data.destination
    const firstDigit = data.cfop.charAt(0)

    if (isInternal && firstDigit !== '5') {
      warnings.push(
        `Operação interna (${data.origin}->${data.destination}) geralmente usa CFOP iniciado em 5.`,
      )
    }
    if (!isInternal && firstDigit !== '6') {
      warnings.push(
        `Operação interestadual (${data.origin}->${data.destination}) geralmente usa CFOP iniciado em 6.`,
      )
    }
  }

  if (data.type === 'revenue' && !data.category) {
    warnings.push('Categoria não definida.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
