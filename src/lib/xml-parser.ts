import { Transaction } from '@/stores/useErpStore'

export interface ParsedFiscalDoc extends Omit<
  Transaction,
  'id' | 'companyId' | 'status'
> {
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

  // Categorization Logic
  const categorize = (desc: string) => {
    const d = desc.toLowerCase()
    if (
      d.includes('diesel') ||
      d.includes('gasolina') ||
      d.includes('etanol') ||
      d.includes('arla')
    )
      return 'Fuel'
    if (
      d.includes('manutencao') ||
      d.includes('manutenção') ||
      d.includes('revisao') ||
      d.includes('pneu') ||
      d.includes('servico')
    )
      return 'Maintenance'
    if (d.includes('pedagio') || d.includes('pedágio')) return 'Tolls'
    return 'Uncategorized'
  }

  // Try NF-e (Nota Fiscal Eletrônica)
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

    // Attempt to extract access key
    let accessKey = ''
    if (infNFe.hasAttribute('Id')) {
      accessKey = infNFe.getAttribute('Id')?.replace('NFe', '') || ''
    }

    // Extract first product
    const det = infNFe.getElementsByTagName('det')[0]
    const prod = det?.getElementsByTagName('prod')[0]
    const xProd = getValue(prod!, 'xProd')
    const category = categorize(xProd || '')

    // Fleet Enrichment
    let fuelType, fuelQuantity
    if (category === 'Fuel') {
      fuelType = xProd.includes('S10')
        ? 'Diesel S10'
        : xProd.includes('Gasolina')
          ? 'Gasolina'
          : 'Diesel'
      const qCom = parseFloat(getValue(prod!, 'qCom') || '0')
      fuelQuantity = qCom
    }

    return {
      type: 'expense',
      date: dhEmi
        ? dhEmi.split('T')[0]
        : new Date().toISOString().split('T')[0],
      value: vNF,
      description: xProd ? `NF-e ${nNF} - ${xProd}` : `NF-e ${nNF} - Compra`,
      providerName: xNomeEmit,
      providerCnpj: cnpjEmit,
      recipientCnpj: cnpjDest,
      documentNumber: nNF,
      accessKey,
      category,
      icmsValue: 0,
      pisValue: 0,
      cofinsValue: 0,
      fuelType,
      fuelQuantity,
      odometer: 0,
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

    // Parties
    const dest = infCte.getElementsByTagName('dest')[0]
    const cnpjDest = getValue(dest!, 'CNPJ') || getValue(dest!, 'CPF')
    const xNomeDest = getValue(dest!, 'xNome')

    const emit = infCte.getElementsByTagName('emit')[0]
    const cnpjEmit = getValue(emit!, 'CNPJ')
    const xNomeEmit = getValue(emit!, 'xNome')

    // Taxes (ICMS)
    let icmsValue = 0
    const imp = infCte.getElementsByTagName('imp')[0]
    if (imp) {
      const icms = imp.getElementsByTagName('ICMS')[0]
      if (icms) {
        // Look for common tags inside ICMS00, ICMS20, etc.
        // We search for any tag ending in 'vICMS' that is direct child of a CST group
        // A simple approach is searching for 'vICMS' in the subtree of 'ICMS'
        const vICMS = icms.getElementsByTagName('vICMS')[0]
        if (vICMS) {
          icmsValue = parseFloat(vICMS.textContent || '0')
        }
      }
    }

    // Access Key
    let accessKey = ''
    if (infCte.hasAttribute('Id')) {
      accessKey = infCte.getAttribute('Id')?.replace('CTe', '') || ''
    }

    const xObs = getValue(infCte, 'xObs')
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
      recipientCnpj: cnpjDest,
      takerName: xNomeDest,
      providerCnpj: cnpjEmit,
      providerName: xNomeEmit,
      accessKey,
      icmsValue,
      pisValue: 0,
      cofinsValue: 0,
    }
  }

  // Try NFS-e
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
    const razaoSocialTomador = getValue(tomador!, 'RazaoSocial')

    // Attempt to find Prestador CNPJ
    const prestador =
      xmlDoc.getElementsByTagName('Prestador')[0] ||
      xmlDoc.getElementsByTagName('PrestadorServico')[0]
    const cpfCnpjPrestador = prestador?.getElementsByTagName('CpfCnpj')[0]
    const cnpjPrestador = getValue(cpfCnpjPrestador!, 'Cnpj')
    const razaoSocialPrestador = getValue(prestador!, 'RazaoSocial')
    const category = categorize(discriminacao)

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
        cteNumber: numero,
        recipientCnpj: cnpjTomador,
        takerName: razaoSocialTomador,
        providerCnpj: cnpjPrestador,
        providerName: razaoSocialPrestador,
        documentNumber: numero,
        category,
        icmsValue: 0,
        pisValue: 0,
        cofinsValue: 0,
      }
    }
  }

  throw new Error('Formato de XML não reconhecido.')
}
