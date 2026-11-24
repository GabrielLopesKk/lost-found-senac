// @ts-nocheck
// Ferramentas de imagem no navegador:
// 1) validação + re-codificação (remove metadados EXIF, inclusive GPS)
// 2) analisador local de fallback (cor dominante e características visuais)
import { CATEGORIES } from '../data/constants'

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_BYTES = 8 * 1024 * 1024
const MAX_SIDE = 1200

export function validateImage(file) {
  if (!file) return 'Selecione uma imagem.'
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Formato não suportado. Use JPG, PNG ou WEBP.'
  if (file.size > MAX_BYTES) return 'A imagem deve ter no máximo 8 MB.'
  return null
}

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    // imageOrientation aplica a rotação do EXIF antes de descartá-lo
    return createImageBitmap(file, { imageOrientation: 'from-image' })
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Redesenha a foto num canvas e exporta como JPEG novo, sem nenhum metadado. */
export async function reencodeImage(file) {
  const error = validateImage(file)
  if (error) throw new Error(error)
  let bmp
  try {
    bmp = await loadBitmap(file)
  } catch {
    throw new Error('Não foi possível ler a imagem. O arquivo pode estar corrompido.')
  }
  const ratio = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * ratio)
  const h = Math.round(bmp.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.82), width: w, height: h }
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h * 60, s, l]
}

function colorName([h, s, l]) {
  if (l < 0.16) return 'preto'
  if (l > 0.88 && s < 0.35) return 'branco'
  if (s < 0.14) return l > 0.62 ? 'prata' : 'cinza'
  if (h >= 15 && h < 48 && l < 0.4) return 'marrom'
  if (h >= 28 && h < 55 && s < 0.45 && l > 0.6) return 'bege'
  if (h < 12 || h >= 345) return 'vermelho'
  if (h < 40) return 'laranja'
  if (h < 66) return 'amarelo'
  if (h < 170) return 'verde'
  if (h < 255) return 'azul'
  if (h < 290) return 'roxo'
  return 'rosa'
}

const NAME_HINTS = [
  [/garraf|bottle|copo|squeeze|termic/i, 'garrafas'],
  [/fone|phone|celular|iphone|samsung|notebook|carregador|cabo|mouse|airpod/i, 'eletronicos'],
  [/chave|key/i, 'chaves'],
  [/rg|cnh|cpf|carteira|wallet|cart[aã]o|card|document/i, 'documentos'],
  [/casaco|moletom|jaqueta|blusa|camis|shirt|hoodie/i, 'roupas'],
  [/mochila|bolsa|bag|necessaire/i, 'bolsas'],
  [/caderno|livro|estojo|caneta|calculadora|book/i, 'material'],
  [/[oó]culos|rel[oó]gio|anel|brinco|pulseira|bon[eé]|glasses|watch/i, 'acessorios'],
]

/**
 * Analisador local (sem IA): estima cor dominante/secundária, tom e formato,
 * e tenta inferir a categoria pelo nome do arquivo. Sempre editável pelo usuário.
 */
export async function analyzeLocally(dataUrl, fileName = '') {
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  const S = 56
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, S, S)
  const { data } = ctx.getImageData(0, 0, S, S)

  const counts = {}
  let lightSum = 0, n = 0
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4
      const hsl = rgbToHsl(data[i], data[i + 1], data[i + 2])
      lightSum += hsl[2]; n++
      // pondera o centro (onde o objeto costuma estar) mais que as bordas
      const dx = (x - S / 2) / (S / 2), dy = (y - S / 2) / (S / 2)
      const weight = Math.max(0.15, 1 - Math.sqrt(dx * dx + dy * dy))
      const name = colorName(hsl)
      counts[name] = (counts[name] || 0) + weight
    }
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1])
  // ignora fundo branco/cinza claro se houver outra cor relevante
  let primary = ranked[0][0]
  if (['branco', 'prata'].includes(primary) && ranked[1] && ranked[1][1] > ranked[0][1] * 0.35) primary = ranked[1][0]
  const secondary = ranked.find(([c, v]) => c !== primary && v > ranked[0][1] * 0.2)?.[0]

  const hint = NAME_HINTS.find(([re]) => re.test(fileName))
  const category = hint ? hint[1] : 'outros'
  const avgLight = lightSum / n
  const characteristics = [
    avgLight < 0.35 ? 'Tons predominantemente escuros' : avgLight > 0.7 ? 'Tons predominantemente claros' : 'Tons médios',
    img.width > img.height * 1.3 ? 'Formato horizontal/alongado' : img.height > img.width * 1.3 ? 'Formato vertical/alongado' : 'Formato compacto',
  ]
  if (secondary) characteristics.push(`Detalhes em ${secondary}`)

  return {
    source: 'local',
    category,
    categoryConfidence: hint ? 'média' : 'baixa',
    color: primary,
    characteristics,
    marks: [],
    sensitiveWarning: category === 'documentos',
    note: hint
      ? 'Sugestões geradas pelo analisador local (cor da foto e nome do arquivo). Revise antes de publicar.'
      : 'Analisador local: a cor foi estimada pela foto; a categoria precisa ser escolhida manualmente.',
  }
}

export const categoryIds = CATEGORIES.map((c) => c.id)
