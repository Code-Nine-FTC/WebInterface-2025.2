import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface AuditLog {
  id: number;
  userId?: number | null;
  userName: string | null;
  userEmail?: string | null;
  actionType: string;
  entityName: string | null;
  entityId: number | null;
  details: string;
  createdAt: string;
}

export interface AuditFilters {
  userId?: number;
  actionType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export const useAuditStore = defineStore('audit', () => {
  const logs = ref<AuditLog[]>([]);
  const total = ref<number>(0);
  const page = ref<number>(0);
  const limit = ref<number>(20);
  const totalPages = ref<number>(0);
  const loading = ref<boolean>(false);
  const { $api } = useNuxtApp();

  async function fetchLogs(filters: AuditFilters = {}) {
    loading.value = true;
    try {
      const params = new URLSearchParams();

      if (filters.userId) params.append('userId', String(filters.userId));
      if (filters.actionType) params.append('actionType', filters.actionType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page !== undefined) params.append('page', String(filters.page));
      if (filters.size) params.append('size', String(filters.size));

      const url = params.toString() ? `/audit-logs?${params.toString()}` : '/audit-logs';
      console.log('[AUDIT] Fetching logs from:', url);

      const res: any = await $api(url);
      console.log('[AUDIT] Response received:', res);

      if (res) {
        logs.value = res.content || [];
        total.value = res.totalElements || 0;
        page.value = res.number || 0;
        limit.value = res.size || 20;
        totalPages.value = res.totalPages || 0;

        console.log('[AUDIT] Logs parsed:', {
          logsCount: logs.value.length,
          total: total.value,
          page: page.value,
          totalPages: totalPages.value,
        });
      }

      return logs.value;
    } catch (e: any) {
      console.error('[AUDIT] Erro ao buscar logs de auditoria:', e);
      console.error('[AUDIT] Detalhes do erro:', {
        status: e?.status || e?.response?.status,
        statusText: e?.statusText || e?.response?.statusText,
        data: e?.data || e?.response?.data,
        message: e?.message,
      });

      if (e?.status === 403 || e?.response?.status === 403) {
        console.error('[AUDIT] Acesso negado (403). Usuário não tem permissão de ADMIN.');
      }

      if (e?.status === 500 || e?.response?.status === 500) {
        console.error('[AUDIT] Erro 500 do servidor. Verifique os logs do backend.');
        console.error('[AUDIT] Resposta do servidor:', e?.data || e?.response?.data);
      }

      logs.value = [];
      total.value = 0;
      return [];
    } finally {
      loading.value = false;
    }
  }

  function getActionTypes() {
    return [
      { value: 'ORDER_CREATED', label: 'Pedido Criado' },
      { value: 'ORDER_UPDATED', label: 'Pedido Atualizado' },
      { value: 'ORDER_CANCELLED', label: 'Pedido Cancelado' },
      { value: 'ORDER_STATUS_CHANGED', label: 'Status do Pedido Alterado' },
      { value: 'USER_CREATED', label: 'Usuário Criado' },
      { value: 'USER_ENABLED_CHANGED', label: 'Status do Usuário Alterado' },
      { value: 'USER_UPDATED', label: 'Usuário Atualizado' },
      { value: 'SECTION_CREATED', label: 'Seção Criada' },
      { value: 'SECTION_UPDATED', label: 'Seção Atualizada' },
      { value: 'PURCHASE_ORDER_CREATED', label: 'Ordem de Compra Criada' },
      { value: 'EMAIL_CHARGE_SENT', label: 'Email de Cobrança Enviado' },
      { value: 'PURCHASE_ORDER_UPDATED', label: 'Ordem de Compra Atualizada' },
      { value: 'PURCHASE_ORDER_STATUS_UPDATED', label: 'Status da Ordem de Compra Atualizado' },
    ];
  }

  function getActionLabel(actionType: string): string {
    const types = getActionTypes();
    const found = types.find((t) => t.value === actionType);
    return found ? found.label : actionType;
  }

  function getActionColor(actionType: string): string {
    if (actionType.includes('CREATED')) return 'green';
    if (actionType.includes('UPDATED')) return 'blue';
    if (actionType.includes('CANCELLED')) return 'red';
    if (actionType.includes('STATUS')) return 'orange';
    if (actionType.includes('EMAIL')) return 'purple';
    return 'grey';
  }

  function getEntityLabel(entityName: string | null): string {
    if (!entityName) return '—';

    const entities: Record<string, string> = {
      User: 'Usuário',
      Order: 'Pedido',
      PurchaseOrder: 'Ordem de Compra',
      Section: 'Seção',
      Item: 'Item',
      Supplier: 'Fornecedor',
      Stock: 'Estoque',
      StorageItem: 'Item de Estoque',
      TypeItem: 'Tipo de Item',
      Lot: 'Lote',
    };

    return entities[entityName] || entityName;
  }

  function getEntityColor(entityName: string | null): string {
    if (!entityName) return 'grey';

    if (entityName.includes('User')) return 'purple';
    if (entityName.includes('Order')) return 'blue';
    if (entityName.includes('Purchase')) return 'indigo';
    if (entityName.includes('Section')) return 'teal';
    if (entityName.includes('Item') || entityName.includes('Stock')) return 'orange';
    if (entityName.includes('Supplier')) return 'cyan';

    return 'grey';
  }

  function clearLogs() {
    logs.value = [];
    total.value = 0;
    page.value = 0;
    totalPages.value = 0;
  }

  return {
    logs,
    total,
    page,
    limit,
    totalPages,
    loading,
    fetchLogs,
    getActionTypes,
    getActionLabel,
    getActionColor,
    getEntityLabel,
    getEntityColor,
    clearLogs,
  };
});
