import { Transaction } from '@/stores/useErpStore'

export interface ParsedFiscalDoc extends Omit<Transaction, 'id' | 'companyId'> {
  rawXml?: string
}

export async function parseFiscalXml(file: File): Promise<ParsedFiscalDoc> {
  const text = await file.text()
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(text, 'text/xml')

  if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Arquivo XML inválido ou corrompido.')
  }

  // Try CT-e (Conhecimento de Transporte Eletrônico)
  // Structure: CTe > infCte > ide, emit, dest, vPrest, etc.
  const infCte = xmlDoc.getElementsByTagName('infCte')[0]
  if (infCte) {
    const getValue = (tag: string) =>
      infCte.getElementsByTagName(tag)[0]?.textContent || ''

    const nCT = getValue('nCT')
    const dhEmi = getValue('dhEmi')
    const vTPrest = parseFloat(getValue('vTPrest') || '0')
    const ufIni = getValue('UFIni')
    const ufFim = getValue('UFFim')

    // Extracting basic description from observation or defaulting
    const xObs = getValue('xObs')
    const description = xObs
      ? xObs.slice(0, 50)
      : `Frete CT-e ${nCT} (${ufIni} -> ${ufFim})`

    return {
      type: 'revenue',
      date: dhEmi
        ? dhEmi.split('T')[0]
        : new Date().toISOString().split('T')[0],
      value: vTPrest,
      cteNumber: nCT,
      origin: ufIni,
      destination: ufFim,
      description: description,
      icmsValue: 0, // Will be calculated by the tax engine
      pisValue: 0,
      cofinsValue: 0,
    }
  }

  // Try NFS-e (Nota Fiscal de Serviço Eletrônica)
  // NFS-e layouts vary significantly (ABRASF vs others). We try to find common tags.
  // Common tags: ValorServicos, DataEmissao, Discriminacao, Numero
  const valorServicos = xmlDoc.getElementsByTagName('ValorServicos')[0]
  const dataEmissao = xmlDoc.getElementsByTagName('DataEmissao')[0]

  if (valorServicos) {
    const vServ = parseFloat(valorServicos.textContent || '0')
    const dEmi = dataEmissao?.textContent
    const discriminacao =
      xmlDoc.getElementsByTagName('Discriminacao')[0]?.textContent || ''
    const numero = xmlDoc.getElementsByTagName('Numero')[0]?.textContent || ''

    if (vServ > 0) {
      return {
        type: 'revenue',
        date: dEmi
          ? dEmi.split('T')[0]
          : new Date().toISOString().split('T')[0],
        value: vServ,
        description: discriminacao
          ? discriminacao.slice(0, 100)
          : `Serviço NFS-e ${numero}`,
        cteNumber: numero, // Using cteNumber field to store NF Number
        origin: '',
        destination: '',
        icmsValue: 0,
        pisValue: 0,
        cofinsValue: 0,
      }
    }
  }

  throw new Error(
    'Formato de XML não reconhecido. Certifique-se de que é um CT-e ou NFS-e padrão.',
  )
}
