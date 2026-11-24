// @ts-nocheck
// Motor de correspondência entre relatos de perda e objetos encontrados.
// Função pura, sem dependência do navegador — será reutilizada no servidor.
// Nunca confirma posse: apenas sugere e explica a pontuação.
import { normalize } from './format'
import { categoryLabel, colorOf } from '../data/constants'

const STOPWORDS = new Set('a o os as de da do das dos e em no na nos nas um uma com sem para por que meu minha perdi acho foi esta estava ele ela muito pouco tem lado parte cor'.split(' '))

export const tokens = (text) =>
  new Set(normalize(text).split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOPWORDS.has(t)))

const NEUTRALS = ['preto', 'cinza', 'prata']

export function scoreMatch(lost, found) {
  const reasons = []
  let score = 0

  if (lost.category === found.category) {
    score += 35
    reasons.push(`Mesma categoria (${categoryLabel(found.category)})`)
  }

  if (lost.color === found.color) {
    score += 20
    reasons.push(`Mesma cor (${colorOf(found.color)?.label ?? found.color})`)
  } else if (NEUTRALS.includes(lost.color) && NEUTRALS.includes(found.color)) {
    score += 8
    reasons.push('Cores próximas (tons neutros)')
  }

  const a = tokens(`${lost.name} ${lost.description}`)
  const b = tokens(`${found.name} ${found.description} ${(found.marks || []).join(' ')}`)
  const shared = [...a].filter((t) => b.has(t))
  if (shared.length) {
    const kw = Math.min(25, Math.round((shared.length / Math.max(3, Math.min(a.size, b.size))) * 25))
    score += kw
    reasons.push(`Palavras em comum: ${shared.slice(0, 5).join(', ')}`)
  }

  if (lost.location === found.location) {
    score += 10
    reasons.push(`Mesmo local (${found.location})`)
  }

  const gap = (new Date(found.dateFound) - new Date(lost.dateLost)) / 86400000
  if (gap >= -1 && gap <= 3) {
    score += 10
    reasons.push('Encontrado logo após a data da perda')
  } else if (gap > 3 && gap <= 14) {
    score += 5
    reasons.push(`Encontrado ${Math.round(gap)} dias após a perda`)
  } else if (gap < -1) {
    score -= 15
    reasons.push('Encontrado antes da data informada da perda')
  }

  return { score: Math.max(0, Math.min(100, score)), reasons }
}

export function findMatches(lost, foundItems, { min = 40, limit = 5 } = {}) {
  return foundItems
    .filter((f) => f.status !== 'Devolvido')
    .map((f) => ({ item: f, ...scoreMatch(lost, f) }))
    .filter((m) => m.score >= min)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
}
