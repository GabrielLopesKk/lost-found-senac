// @ts-nocheck
// Vocabulário compartilhado do domínio (reutilizado pela API nos próximos marcos).

export const CATEGORIES = [
  { id: 'eletronicos', label: 'Eletrônicos', icon: 'Smartphone' },
  { id: 'documentos', label: 'Documentos e cartões', icon: 'IdCard' },
  { id: 'chaves', label: 'Chaves', icon: 'KeyRound' },
  { id: 'garrafas', label: 'Garrafas e copos', icon: 'CupSoda' },
  { id: 'roupas', label: 'Roupas e agasalhos', icon: 'Shirt' },
  { id: 'bolsas', label: 'Mochilas e bolsas', icon: 'Backpack' },
  { id: 'material', label: 'Material escolar', icon: 'NotebookPen' },
  { id: 'acessorios', label: 'Acessórios', icon: 'Glasses' },
  { id: 'outros', label: 'Outros', icon: 'Package' },
]

export const COLORS = [
  { id: 'preto', label: 'Preto', hex: '#1f2430' },
  { id: 'branco', label: 'Branco', hex: '#f4f4f4' },
  { id: 'cinza', label: 'Cinza', hex: '#9aa3ae' },
  { id: 'azul', label: 'Azul', hex: '#2f6fd6' },
  { id: 'vermelho', label: 'Vermelho', hex: '#d33b3b' },
  { id: 'verde', label: 'Verde', hex: '#2f9e5b' },
  { id: 'amarelo', label: 'Amarelo', hex: '#f2c230' },
  { id: 'laranja', label: 'Laranja', hex: '#f7931e' },
  { id: 'rosa', label: 'Rosa', hex: '#e87bb0' },
  { id: 'roxo', label: 'Roxo', hex: '#7b4fd1' },
  { id: 'marrom', label: 'Marrom', hex: '#8a5a35' },
  { id: 'bege', label: 'Bege', hex: '#d9c3a0' },
  { id: 'prata', label: 'Prata / metálico', hex: '#c4cad2' },
  { id: 'multicolorido', label: 'Multicolorido', hex: 'conic-gradient(#f7931e,#2f6fd6,#2f9e5b,#f2c230,#f7931e)' },
]

export const LOCATIONS = [
  'Recepção',
  'Biblioteca',
  'Cantina',
  'Laboratório de Informática',
  'Laboratório de Gastronomia',
  'Salas do 1º andar',
  'Salas do 2º andar',
  'Auditório',
  'Banheiros',
  'Pátio e área externa',
  'Estacionamento',
  'Outro local',
]

export const STATUS = {
  ENCONTRADO: 'Encontrado',
  AGUARDANDO: 'Aguardando retirada',
  DEVOLVIDO: 'Devolvido',
}

export const CLAIM_STATUS = {
  PENDENTE: 'Em análise',
  APROVADA: 'Aprovada',
  RECUSADA: 'Recusada',
}

export const AUTO_HIDE_DAYS = 90

export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? 'Outros'
export const colorOf = (id) => COLORS.find((c) => c.id === id)
