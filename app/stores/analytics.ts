import { defineStore } from 'pinia'
import { ref } from 'vue'

type DateISO = string

export interface TopMaterialItem {
  id?: number | string
  name: string
  group?: string
  groupId?: number | string
  pedidos: number
  quantidade: number
}

export interface DemandaGrupoItem {
  group: string
  groupId?: number | string
  pedidos: number
  quantidade: number
}

export interface SeriesResponse {
  categories: string[]
  series: Array<{ name: string; data: number[] }>
}

export interface AnalyticsFilters {
  startDate: DateISO
  endDate: DateISO
  onlyCompleted?: boolean
  groupId?: number | string | null
  sectionId?: number | string | null
  limit?: number
  step?: 'month' | 'week' | 'day'
}

export const useAnalytics = defineStore('analytics', () => {
  const topMateriais = ref<TopMaterialItem[]>([])
  const demandaPorGrupo = ref<DemandaGrupoItem[]>([])
  const demandaSeries = ref<SeriesResponse>({ categories: [], series: [] })

  const loadingTop = ref(false)
  const loadingGrupo = ref(false)
  const loadingSeries = ref(false)

  const errorTop = ref<string | null>(null)
  const errorGrupo = ref<string | null>(null)
  const errorSeries = ref<string | null>(null)

  const { $api } = useNuxtApp()

  function firstNonEmpty(...vals: any[]): any {
    for (const v of vals) {
      if (v !== undefined && v !== null && v !== '') return v
    }
    return undefined
  }

  function extractItemName(r: any): string {
    const v = firstNonEmpty(
      r.nome, r.name, r.itemName, r.itemNome, r.material, r.materialNome, r.title,
      r.descricao, r.description,
      r.item?.name, r.item?.descricao, r.item?.description,
    )
    return v != null ? String(v) : '-'
  }

  function extractGroupName(r: any): string {
    const v = firstNonEmpty(
      r.grupoNome,
      r.group?.name, r.groupName, r.group,
      r.typeName, r.type, r.tipo, r.tipoItem,
      r.category, r.categoryName, r.categoria,
      r.typeItem?.name,
    )
    return v != null ? String(v) : '-'
  }

  function extractItemId(r: any): number | string | undefined {
    return firstNonEmpty(r.materialId, r.id, r.itemId, r.idItem, r.item?.id)
  }

  function extractGroupId(r: any): number | string | undefined {
    return firstNonEmpty(r.grupoId, r.groupId, r.typeId, r.categoryId, r.group?.id, r.typeItem?.id)
  }

  function buildQuery(params: Record<string, any>) {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return
      q.append(k, String(v))
    })
    const s = q.toString()
    return s ? `?${s}` : ''
  }

  async function fetchTop(filters: AnalyticsFilters) {
    loadingTop.value = true; errorTop.value = null
    try {
      const query = buildQuery({
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: filters.limit,
        onlyCompleted: filters.onlyCompleted,
      })
      const res: any = await $api(`/api/analytics/materiais/top${query}`)
      // Map using the backend's exact schema when available
      topMateriais.value = Array.isArray(res) ? res.map((r: any) => ({
        id: r?.materialId ?? extractItemId(r),
        name: r?.nome ?? extractItemName(r),
        group: r?.grupoNome ?? extractGroupName(r),
        groupId: r?.grupoId ?? extractGroupId(r),
        pedidos: Number(firstNonEmpty(r?.pedidos, r?.orders, r?.count, 0)),
        quantidade: Number(firstNonEmpty(r?.quantidade, r?.quantity, r?.sum, 0)),
      })) : []
      return topMateriais.value
    } catch (e: any) {
      errorTop.value = e?.message || 'Falha ao carregar Top materiais.'
      topMateriais.value = []
      return []
    } finally {
      loadingTop.value = false
    }
  }

  async function fetchDemandaGrupo(filters: AnalyticsFilters) {
    loadingGrupo.value = true; errorGrupo.value = null
    try {
      const query = buildQuery({
        startDate: filters.startDate,
        endDate: filters.endDate,
        onlyCompleted: filters.onlyCompleted,
        groupId: filters.groupId,
        sectionId: filters.sectionId,
      })
      const res: any = await $api(`/api/analytics/grupos/demanda${query}`)
      demandaPorGrupo.value = Array.isArray(res) ? res.map((r: any) => ({
        group: extractGroupName(r),
        groupId: extractGroupId(r),
        pedidos: Number(firstNonEmpty(r.pedidos, r.orders, r.count, 0)),
        quantidade: Number(firstNonEmpty(r.quantidade, r.quantity, r.sum, 0)),
      })) : []
      return demandaPorGrupo.value
    } catch (e: any) {
      errorGrupo.value = e?.message || 'Falha ao carregar demanda por grupo.'
      demandaPorGrupo.value = []
      return []
    } finally {
      loadingGrupo.value = false
    }
  }

  async function fetchDemandaSeries(filters: AnalyticsFilters) {
    loadingSeries.value = true; errorSeries.value = null
    try {
      const query = buildQuery({
        startDate: filters.startDate,
        endDate: filters.endDate,
        onlyCompleted: filters.onlyCompleted,
        step: filters.step,
        groupId: filters.groupId,
        sectionId: filters.sectionId,
      })
      const res: any = await $api(`/api/analytics/grupos/demanda-series${query}`)
      const categories = (Array.isArray(res?.categories) ? res.categories : []).map((c: any) => String(c))
      const rawSeries = Array.isArray(res?.series) ? res.series : []
      const series = rawSeries.map((s: any) => {
        const name = firstNonEmpty(
          s.name, s.label, s.grupoNome, s.groupName, s.group?.name, s.group,
          s.typeName, s.category, s.categoria, s.nome
        )
        const values = Array.isArray(s.data) ? s.data : (Array.isArray(s.values) ? s.values : [])
        return { name: String(name ?? '-'), data: values.map((v: any) => Number(v) || 0) }
      })
      demandaSeries.value = { categories, series }
      return demandaSeries.value
    } catch (e: any) {
      errorSeries.value = e?.message || 'Falha ao carregar séries por grupo.'
      demandaSeries.value = { categories: [], series: [] }
      return demandaSeries.value
    } finally {
      loadingSeries.value = false
    }
  }

  return {
    topMateriais,
    demandaPorGrupo,
    demandaSeries,
    loadingTop,
    loadingGrupo,
    loadingSeries,
    errorTop,
    errorGrupo,
    errorSeries,
    fetchTop,
    fetchDemandaGrupo,
    fetchDemandaSeries,
  }
})
