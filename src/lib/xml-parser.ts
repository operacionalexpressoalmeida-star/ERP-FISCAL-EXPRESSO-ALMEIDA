import { Transaction } from '@/stores/useErpStore'

export interface ParsedFiscalDoc extends Omit<Transaction, 'id' | 'companyId'> {
  rawXml?: string
  recipientCnpj?: string
  providerCnpj?: string
}

export async function parseFiscalXml(file: File): Promise<ParsedFiscalDoc> {
  const text = await file.text()
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(text, 'text/xml')

  if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Arquivo XML inválido ou corrompido.')
  }

  const getValue = (parent: Element | Document, tag: string) =>
    parent.getElementsByTagName(tag)[0]?.textContent || ''

  // Try NF-e (Nota Fiscal Eletrônica) - e.g. Fuel, Products
  const infNFe = xmlDoc.getElementsByTagName('infNFe')[0]
  if (infNFe) {
    const ide = infNFe.getElementsByTagName('ide')[0]
    const emit = infNFe.getElementsByTagName('emit')[0]
    const dest = infNFe.getElementsByTagName('dest')[0]
    const total = infNFe.getElementsByTagName('total')[0]

    const nNF = getValue(ide, 'nNF')
    const dhEmi = getValue(ide, 'dhEmi')
    const vNF = parseFloat(getValue(total, 'vNF') || '0')
    const xNomeEmit = getValue(emit, 'xNome')
    const cnpjEmit = getValue(emit, 'CNPJ')
    const cnpjDest = getValue(dest, 'CNPJ')

    // Extract first product for description
    const det = infNFe.getElementsByTagName('det')[0]
    const prod = det?.getElementsByTagName('prod')[0]
    const xProd = getValue(prod!, 'xProd')

    return {
      type: 'expense', // Assume expense for NF-e (incoming)
      date: dhEmi
        ? dhEmi.split('T')[0]
        : new Date().toISOString().split('T')[0],
      value: vNF,
      description: xProd ? `NF-e ${nNF} - ${xProd}` : `NF-e ${nNF} - Compra`,
      providerName: xNomeEmit,
      providerCnpj: cnpjEmit,
      recipientCnpj: cnpjDest,
      documentNumber: nNF,
      category: 'Other', // Default
      icmsValue: 0,
      pisValue: 0,
      cofinsValue: 0,
    }
  }

  // Try CT-e (Conhecimento de Transporte Eletrônico)
  const infCte = xmlDoc.getElementsByTagName('infCte')[0]
  if (infCte) {
    const nCT = getValue(infCte, 'nCT')
    const dhEmi = getValue(infCte, 'dhEmi')
    const vTPrest = parseFloat(getValue(infCte, 'vTPrest') || '0')
    const ide = infCte.getElementsByTagName('ide')[0]
    const ufIni = getValue(ide, 'UFIni')
    const ufFim = getValue(ide, 'UFFim')
    const dest = infCte.getElementsByTagName('dest')[0]
    const cnpjDest = getValue(dest!, 'CNPJ')

    const xObs = getValue(infCte, 'xObs')
    const description = xObs
      ? xObs.slice(0, 50)
      : `Frete CT-e ${nCT} (${ufIni} -> ${ufFim})`

    return {
      type: 'revenue', // Default to revenue for CT-e
      date: dhEmi
        ? dhEmi.split('T')[0]
        : new Date().toISOString().split('T')[0],
      value: vTPrest,
      cteNumber: nCT,
      origin: ufIni,
      destination: ufFim,
      description: description,
      recipientCnpj: cnpjDest,
      icmsValue: 0,
      pisValue: 0,
      cofinsValue: 0,
    }
  }

  // Try NFS-e (Nota Fiscal de Serviço Eletrônica)
  const valorServicos = xmlDoc.getElementsByTagName('ValorServicos')[0]
  const dataEmissao = xmlDoc.getElementsByTagName('DataEmissao')[0]

  if (valorServicos) {
    const vServ = parseFloat(valorServicos.textContent || '0')
    const dEmi = dataEmissao?.textContent
    const discriminacao =
      xmlDoc.getElementsByTagName('Discriminacao')[0]?.textContent || ''
    const numero = xmlDoc.getElementsByTagName('Numero')[0]?.textContent || ''

    // Attempt to find Tomador CNPJ
    const tomador = xmlDoc.getElementsByTagName('Tomador')[0]
    const cpfCnpj = tomador?.getElementsByTagName('CpfCnpj')[0]
    const cnpjTomador = getValue(cpfCnpj!, 'Cnpj')

    // Attempt to find Prestador CNPJ
    const prestador =
      xmlDoc.getElementsByTagName('Prestador')[0] ||
      xmlDoc.getElementsByTagName('PrestadorServico')[0]
    const cpfCnpjPrestador = prestador?.getElementsByTagName('CpfCnpj')[0]
    const cnpjPrestador = getValue(cpfCnpjPrestador!, 'Cnpj')
    const razaoSocialPrestador = getValue(prestador!, 'RazaoSocial')

    if (vServ > 0) {
      return {
        type: 'revenue', // Default, logic might change to expense based on CNPJ match in UI
        date: dEmi
          ? dEmi.split('T')[0]
          : new Date().toISOString().split('T')[0],
        value: vServ,
        description: discriminacao
          ? discriminacao.slice(0, 100)
          : `Serviço NFS-e ${numero}`,
        cteNumber: numero, // Using cteNumber field to store NF Number
        recipientCnpj: cnpjTomador,
        providerCnpj: cnpjPrestador,
        providerName: razaoSocialPrestador,
        documentNumber: numero,
        icmsValue: 0,
        pisValue: 0,
        cofinsValue: 0,
      }
    }
  }

  throw new Error(
    'Formato de XML não reconhecido. Certifique-se de que é um NF-e, CT-e ou NFS-e padrão.',
  )
}
