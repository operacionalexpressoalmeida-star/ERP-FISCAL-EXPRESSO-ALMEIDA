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

  // Extended Categorization Logic based on Description and CFOP
  const categorize = (desc: string, cfop: string = '') => {
    const d = desc.toLowerCase()

    // CFOP Based (More precise)
    if (cfop) {
      // 5.35X, 6.35X = Transportation Service (Revenue)
      if (cfop.startsWith('535') || cfop.startsWith('635'))
        return 'Transport Revenue'
      // 5.10X, 6.10X = Sales of Goods
      if (cfop.startsWith('510') || cfop.startsWith('610'))
        return 'Sales Revenue'
      // 1.556, 2.556 = Purchase for Usage/Consumption
      if (cfop.startsWith('1556') || cfop.startsWith('2556')) {
        if (d.includes('diesel') || d.includes('gasolina')) return 'Fuel'
        if (d.includes('pneu') || d.includes('peca')) return 'Maintenance'
      }
    }

    // Description Based (Fallback)
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

    // Extract first product & CFOP
    const det = infNFe.getElementsByTagName('det')[0]
    const prod = det?.getElementsByTagName('prod')[0]
    const xProd = getValue(prod!, 'xProd')
    const cfop = getValue(prod!, 'CFOP')

    // Determine type based on CFOP or User Context (simplified assumption)
    // If it's a purchase (CFOP 1xxx or 2xxx), it's Expense.
    // If it's a sale (CFOP 5xxx or 6xxx), it's Revenue.
    // However, the user usually imports what they receive (Expenses) or what they emit (Revenues)
    // Let's assume: If Issuer matches User Company -> Revenue. If Recipient matches -> Expense.
    // For now, based on previous logic, we defaulted NF-e to Expense, but user story asks for Revenue categorization too.
    // We'll stick to 'expense' for generic NF-e unless CFOP clearly indicates revenue (Sales).
    // Actually, let's treat it as Expense by default unless CFOP is 5xxx/6xxx AND we are the emitter (we don't check emitter here against store).
    // Let's assume standard behavior: Import = Expense, unless clearly a Service/Transport Revenue.

    let type: 'revenue' | 'expense' = 'expense'
    if (cfop.startsWith('5') || cfop.startsWith('6')) {
      // If standard sales CFOP, might be revenue if we are the issuer.
      // Without checking store 'companies', we can default to 'revenue' if categorization says 'Sales Revenue' or 'Transport Revenue'.
      // But usually NF-e xml imported by user is an invoice RECEIVED.
      // Let's keep existing logic but allow categorization to run.
      type = 'expense'
    }

    const category = categorize(xProd || '', cfop)

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
      type,
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
      cfop,
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

    // CFOP for CT-e is often in <ide><CFOP>
    const cfop = getValue(ide, 'CFOP')

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

    const category = categorize(description, cfop)

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
      category: category === 'Uncategorized' ? 'Transport Revenue' : category, // Default for CT-e
      cfop,
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
