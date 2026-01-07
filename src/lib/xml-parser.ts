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
  if (infNFe) {
    const ide = infNFe.getElementsByTagName('ide')[0]
    const emit = infNFe.getElementsByTagName('emit')[0]
    const dest = infNFe.getElementsByTagName('dest')[0]
    const total = infNFe.getElementsByTagName('total')[0]

    if (!ide || !emit || !total)
      throw new Error('Estrutura NF-e incompleta (ide/emit/total ausentes).')

    const nNF = getValue(ide, 'nNF')
    const dhEmi = getValue(ide, 'dhEmi')
    const vNF = parseFloat(getValue(total, 'vNF') || '0')
    const xNomeEmit = getValue(emit, 'xNome')
    const cnpjEmit = getValue(emit, 'CNPJ')
    const cnpjDest = getValue(dest, 'CNPJ')

    let accessKey = ''
    if (infNFe.hasAttribute('Id')) {
      accessKey = infNFe.getAttribute('Id')?.replace('NFe', '') || ''
    }

    const det = infNFe.getElementsByTagName('det')[0]
    const prod = det?.getElementsByTagName('prod')[0]
    if (!prod) throw new Error('Detalhes do produto não encontrados.')

    const xProd = getValue(prod, 'xProd')
    const cfop = getValue(prod, 'CFOP')

    let type: 'revenue' | 'expense' = 'expense'
    if (cfop.startsWith('5') || cfop.startsWith('6')) {
      type = 'expense' // Default assumption for imported NFe
    }

    const category = categorize(xProd || '', cfop)

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

  // Try CT-e
  const infCte = xmlDoc.getElementsByTagName('infCte')[0]
  if (infCte) {
    const nCT = getValue(infCte, 'nCT')
    if (!nCT) throw new Error('Número do CT-e (nCT) não encontrado.')

    const dhEmi = getValue(infCte, 'dhEmi')
    const vTPrest = parseFloat(getValue(infCte, 'vTPrest') || '0')
    const ide = infCte.getElementsByTagName('ide')[0]
    const ufIni = getValue(ide, 'UFIni')
    const ufFim = getValue(ide, 'UFFim')
    const cfop = getValue(ide, 'CFOP')

    const dest = infCte.getElementsByTagName('dest')[0]
    const cnpjDest = getValue(dest!, 'CNPJ') || getValue(dest!, 'CPF')
    const xNomeDest = getValue(dest!, 'xNome')

    const emit = infCte.getElementsByTagName('emit')[0]
    const cnpjEmit = getValue(emit!, 'CNPJ')
    const xNomeEmit = getValue(emit!, 'xNome')

    let icmsValue = 0
    const imp = infCte.getElementsByTagName('imp')[0]
    if (imp) {
      const icms = imp.getElementsByTagName('ICMS')[0]
      if (icms) {
        const vICMS = icms.getElementsByTagName('vICMS')[0]
        if (vICMS) {
          icmsValue = parseFloat(vICMS.textContent || '0')
        }
      }
    }

    let accessKey = ''
    if (infCte.hasAttribute('Id')) {
      accessKey = infCte.getAttribute('Id')?.replace('CTe', '') || ''
    }

    const xObs = getValue(infCte, 'xObs')
    const description = xObs
      ? xObs.slice(0, 50)
      : `Frete CT-e ${nCT} (${ufIni} -> ${ufFim})`
    const category = categorize(description, cfop)

    // Try to extract freight info (mock logic as usually it's not in standard CT-e XML explicitly like this, but simulating reading from Obs)
    let freightId = ''
    if (xObs && xObs.includes('Ref:')) {
      const match = xObs.match(/Ref:\s*([A-Z0-9]+)/)
      if (match) freightId = match[1]
    }

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
    const numero = xmlDoc.getElementsByTagName('Numero')[0]?.textContent || ''

    if (!numero) throw new Error('Número da NFS-e não encontrado.')

    const tomador = xmlDoc.getElementsByTagName('Tomador')[0]
    const cpfCnpj = tomador?.getElementsByTagName('CpfCnpj')[0]
    const cnpjTomador = getValue(cpfCnpj!, 'Cnpj')
    const razaoSocialTomador = getValue(tomador!, 'RazaoSocial')

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

  throw new Error(
    'Formato de XML não reconhecido (Não é NFe, CTe ou NFSe padrão).',
  )
}
