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

  // Safe getValue that handles undefined parent
  const getValue = (
    parent: Element | Document | undefined | null,
    tag: string,
  ) => {
    if (!parent) return ''
    return parent.getElementsByTagName(tag)[0]?.textContent || ''
  }

  // Helper to extract access key from different possible locations
  const getAccessKey = (
    infBlock: Element | undefined,
    type: 'NFe' | 'CTe',
  ): string => {
    // 1. Try Id attribute on infBlock
    if (infBlock && infBlock.hasAttribute('Id')) {
      return infBlock.getAttribute('Id')?.replace(type, '') || ''
    }
    // 2. Try prot[Type] -> infProt -> ch[Type]
    const protTag = `prot${type}`
    const chTag = `ch${type}`
    const prot = xmlDoc.getElementsByTagName(protTag)[0]
    if (prot) {
      return getValue(prot, chTag)
    }
    return ''
  }

  // Extended Categorization Logic
  const categorize = (desc: string, cfop: string = '') => {
    const d = desc.toLowerCase()
    if (cfop) {
      if (cfop.startsWith('535') || cfop.startsWith('635'))
        return 'Transport Revenue'
      if (cfop.startsWith('510') || cfop.startsWith('610'))
        return 'Sales Revenue'
      if (cfop.startsWith('1556') || cfop.startsWith('2556')) {
        if (d.includes('diesel') || d.includes('gasolina')) return 'Fuel'
        if (d.includes('pneu') || d.includes('peca')) return 'Maintenance'
      }
    }
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
    if (d.includes('frete') || d.includes('transporte'))
      return 'Transport Revenue'
    return 'Uncategorized'
  }

  // Try NF-e
  const infNFe = xmlDoc.getElementsByTagName('infNFe')[0]
  if (infNFe || xmlDoc.getElementsByTagName('NFe')[0]) {
    // We allow infNFe to be missing if NFe tag exists, but usually infNFe is the data container.
    // If infNFe is missing but it's an NFe, likely very corrupted, but let's try safely.

    const ide = infNFe?.getElementsByTagName('ide')[0]
    const emit = infNFe?.getElementsByTagName('emit')[0]
    const dest = infNFe?.getElementsByTagName('dest')[0]
    const total = infNFe?.getElementsByTagName('total')[0]

    // Access Key priority
    const accessKey = getAccessKey(infNFe, 'NFe')

    const nNF =
      getValue(ide, 'nNF') ||
      (accessKey ? accessKey.substring(25, 34) : 'SEM NUMERO')
    const dhEmi = getValue(ide, 'dhEmi') || new Date().toISOString()
    const vNF = parseFloat(getValue(total, 'vNF') || '0')
    const xNomeEmit = getValue(emit, 'xNome') || 'Emitente Desconhecido'
    const cnpjEmit = getValue(emit, 'CNPJ')
    const cnpjDest = getValue(dest, 'CNPJ')

    const det = infNFe?.getElementsByTagName('det')[0]
    const prod = det?.getElementsByTagName('prod')[0]

    const xProd = getValue(prod, 'xProd')
    const cfop = getValue(prod, 'CFOP')

    let type: 'revenue' | 'expense' = 'expense'
    if (cfop.startsWith('5') || cfop.startsWith('6')) {
      type = 'expense' // Default assumption for imported NFe
    }

    const category = categorize(xProd || 'Produto Genérico', cfop)

    let fuelType, fuelQuantity
    if (category === 'Fuel') {
      fuelType = xProd.includes('S10')
        ? 'Diesel S10'
        : xProd.includes('Gasolina')
          ? 'Gasolina'
          : 'Diesel'
      const qCom = parseFloat(getValue(prod, 'qCom') || '0')
      fuelQuantity = qCom
    }

    return {
      type,
      date: dhEmi.split('T')[0],
      value: vNF,
      description: xProd ? `NF-e ${nNF} - ${xProd}` : `NF-e ${nNF} - Compra`,
      providerName: xNomeEmit,
      providerCnpj: cnpjEmit,
      recipientCnpj: cnpjDest,
      documentNumber: nNF,
      accessKey,
      category,
      cfop,
      icmsValue: 0,
      pisValue: 0,
      cofinsValue: 0,
      fuelType,
      fuelQuantity,
      odometer: 0,
    }
  }

  // Try CT-e
  const infCte = xmlDoc.getElementsByTagName('infCte')[0]
  if (infCte || xmlDoc.getElementsByTagName('CTe')[0]) {
    const accessKey = getAccessKey(infCte, 'CTe')

    const nCT =
      getValue(infCte, 'nCT') ||
      (accessKey ? accessKey.substring(25, 34) : 'SEM NUMERO')
    const dhEmi = getValue(infCte, 'dhEmi') || new Date().toISOString()

    // vTPrest is typically direct child of infCte in standard layout
    let vTPrest = parseFloat(getValue(infCte, 'vTPrest') || '0')
    if (vTPrest === 0) {
      // Try vPrest -> vTPrest nested (some versions)
      const vPrest = infCte?.getElementsByTagName('vPrest')[0]
      if (vPrest) {
        vTPrest = parseFloat(getValue(vPrest, 'vTPrest') || '0')
      }
    }

    const ide = infCte?.getElementsByTagName('ide')[0]
    const ufIni = getValue(ide, 'UFIni') || 'XX'
    const ufFim = getValue(ide, 'UFFim') || 'XX'
    const cfop = getValue(ide, 'CFOP')

    const dest = infCte?.getElementsByTagName('dest')[0]
    const cnpjDest = getValue(dest, 'CNPJ') || getValue(dest, 'CPF')
    const xNomeDest = getValue(dest, 'xNome') || 'Destinatário Desconhecido'

    const emit = infCte?.getElementsByTagName('emit')[0]
    const cnpjEmit = getValue(emit, 'CNPJ')
    const xNomeEmit = getValue(emit, 'xNome') || 'Emitente Desconhecido'

    let icmsValue = 0
    const imp = infCte?.getElementsByTagName('imp')[0]
    if (imp) {
      const icms = imp.getElementsByTagName('ICMS')[0]
      if (icms) {
        const vICMS = icms.getElementsByTagName('vICMS')[0]
        if (vICMS) {
          icmsValue = parseFloat(vICMS.textContent || '0')
        }
      }
    }

    const xObs = getValue(infCte, 'xObs')
    const description =
      xObs && xObs.length > 0
        ? xObs.slice(0, 50)
        : `Frete CT-e ${nCT} (${ufIni} -> ${ufFim})`
    const category = categorize(description, cfop)

    let freightId = ''
    if (xObs && xObs.includes('Ref:')) {
      const match = xObs.match(/Ref:\s*([A-Z0-9]+)/)
      if (match) freightId = match[1]
    }

    return {
      type: 'revenue',
      date: dhEmi.split('T')[0],
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
      category: category === 'Uncategorized' ? 'Transport Revenue' : category,
      cfop,
      icmsValue,
      pisValue: 0,
      cofinsValue: 0,
      freightId,
      freightStatus: freightId ? 'In Transit' : undefined,
    }
  }

  // Try NFS-e
  const valorServicos = xmlDoc.getElementsByTagName('ValorServicos')[0]
  if (valorServicos) {
    const vServ = parseFloat(valorServicos.textContent || '0')
    const dataEmissao = xmlDoc.getElementsByTagName('DataEmissao')[0]
    const dEmi = dataEmissao?.textContent
    const discriminacao =
      xmlDoc.getElementsByTagName('Discriminacao')[0]?.textContent || ''
    const numero =
      xmlDoc.getElementsByTagName('Numero')[0]?.textContent || 'SEM NUMERO'

    const tomador = xmlDoc.getElementsByTagName('Tomador')[0]
    const cpfCnpj = tomador?.getElementsByTagName('CpfCnpj')[0]
    const cnpjTomador = getValue(cpfCnpj, 'Cnpj')
    const razaoSocialTomador =
      getValue(tomador, 'RazaoSocial') || 'Tomador Desconhecido'

    const prestador =
      xmlDoc.getElementsByTagName('Prestador')[0] ||
      xmlDoc.getElementsByTagName('PrestadorServico')[0]
    const cpfCnpjPrestador = prestador?.getElementsByTagName('CpfCnpj')[0]
    const cnpjPrestador = getValue(cpfCnpjPrestador, 'Cnpj')
    const razaoSocialPrestador =
      getValue(prestador, 'RazaoSocial') || 'Prestador Desconhecido'
    const category = categorize(discriminacao)

    // Accept NFS-e even if partial
    return {
      type: 'revenue',
      date: dEmi ? dEmi.split('T')[0] : new Date().toISOString().split('T')[0],
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

  throw new Error(
    'Formato de XML não reconhecido (Não é NFe, CTe ou NFSe padrão).',
  )
}
