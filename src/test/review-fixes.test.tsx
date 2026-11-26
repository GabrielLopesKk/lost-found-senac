import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), toast: vi.fn(), mutate: vi.fn(), auth: {} as Record<string, unknown> }))
vi.mock('@/app/lib/supabase', () => ({ supabase: { from: mocks.from, rpc: mocks.rpc, auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) }, storage: { from: () => ({ createSignedUrls: async () => ({ data: [] }) }) } }, PHOTO_BUCKET: 'item-photos' }))
vi.mock('swr', () => ({ useSWRConfig: () => ({ mutate: mocks.mutate }) }))
vi.mock('@/app/components/ui', async (orig) => ({ ...(await orig<object>()), useToast: () => mocks.toast }))
vi.mock('@/app/auth/AuthProvider', () => ({ useAuth: () => mocks.auth }))
vi.mock('@/app/lib/router-compat', () => ({ useLocation: () => ({ pathname: '/minha-conta', search: '' }), Navigate: () => null, Link: (p: { children?: unknown }) => p.children }))

import { fetchAllRows, createLostReport } from '@/app/data/api'
import { mergeSuggestion } from '@/app/components/forms'
import { useAction } from '@/app/components/admin/useAction'
import RequireAuth from '@/app/auth/RequireAuth'

afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('review fixes', () => {
  it('reads every page instead of stopping at 1000 rows', async () => {
    const pages = [Array.from({ length: 1000 }, (_, i) => i), [1000, 1001]]
    const range = vi.fn(async () => ({ data: pages.shift(), error: null }))
    expect(await fetchAllRows(() => ({ range }), 'x')).toHaveLength(1002)
    expect(range).toHaveBeenNthCalledWith(2, 1000, 1999)
  })

  it('keeps the chosen category when the photo fallback leaves it blank', () => {
    expect(mergeSuggestion({ category: 'chaves', color: '', sensitive: false }, { category: '', color: 'azul' }))
      .toMatchObject({ category: 'chaves', color: 'azul' })
  })

  it('reports a saved lost item as saved when suggestions fail', async () => {
    mocks.from.mockImplementation((table: string) => table === 'lost_reports'
      ? { insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'r1', ref: 'PRD-1' }, error: null }) }) }) }
      : { select: () => { throw new Error('offline') } })
    await expect(createLostReport({ name: 'Chave', dateLost: '2026-11-01', description: 'Chave prateada' }))
      .resolves.toMatchObject({ ref: 'PRD-1', matches: [], matchesError: true })
  })

  it('does not turn a saved reception action into a failure when refresh fails', async () => {
    let action: ReturnType<typeof useAction> | undefined
    function Probe() { action = useAction(async () => { throw new Error('offline') }); return null }
    render(<Probe />)
    let result: unknown
    await act(async () => { result = await action?.run('k', async () => 'saved', 'Solicitação aprovada.') })
    expect(result).toBe('saved')
    expect(mocks.toast).toHaveBeenCalledWith('Solicitação aprovada.')
  })

  it('shows a retry instead of loading forever when the account fails to load', () => {
    mocks.auth = { user: { id: 'u1' }, loading: false, isStaff: false, profileError: new Error('Falha'), refreshProfile: vi.fn() }
    render(<RequireAuth><p>Privado</p></RequireAuth>)
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
    expect(screen.queryByText('Privado')).toBeNull()
  })
})