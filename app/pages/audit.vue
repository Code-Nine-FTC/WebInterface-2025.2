<template>
  <div class="max-w-7xl mx-auto p-6">
    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div class="d-flex flex-column gap-3">
        <div class="d-flex flex-row items-center gap-2">
          <v-text-field
            v-model="search"
            clearable
            density="compact"
            variant="outlined"
            label="Pesquisar"
            placeholder="Buscar por usuário, ação, entidade..."
            append-inner-icon="mdi-magnify"
            class="flex-1"
          />
          <v-btn
            prepend-icon="mdi-filter"
            density="comfortable"
            color="primary"
            variant="tonal"
            class="flex-shrink-0"
            height="38"
            @click="showFilters = !showFilters"
          >
            Filtros
          </v-btn>
          <v-btn
            prepend-icon="mdi-refresh"
            density="comfortable"
            color="primary"
            class="flex-shrink-0"
            height="38"
            :loading="loading"
            @click="fetchData"
          >
            Atualizar
          </v-btn>
        </div>

        <v-expand-transition>
          <div v-if="showFilters" class="pt-3 border-t border-slate-200">
            <v-row dense>
              <v-col cols="12" md="3">
                <v-select
                  v-model="filters.actionType"
                  label="Tipo de Ação"
                  :items="actionTypes"
                  item-title="label"
                  item-value="value"
                  clearable
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="filters.userId"
                  label="ID do Usuário"
                  type="number"
                  clearable
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="filters.startDate"
                  label="Data Inicial"
                  type="datetime-local"
                  clearable
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="filters.endDate"
                  label="Data Final"
                  type="datetime-local"
                  clearable
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
            <div class="d-flex justify-end gap-2 mt-3">
              <v-btn size="small" variant="text" @click="clearFilters">Limpar Filtros</v-btn>
              <v-btn size="small" color="primary" @click="applyFilters">Aplicar Filtros</v-btn>
            </div>
          </div>
        </v-expand-transition>
      </div>
    </v-card>

    <!-- Estatísticas -->
    <div class="kpi-grid mb-6">
      <v-card class="kpi-card pa-4 d-flex flex-column justify-space-between" elevation="2">
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption text-medium-emphasis font-medium">Total de Registros</span>
          <v-icon icon="mdi-file-document-multiple" size="20" class="text-medium-emphasis" />
        </div>
        <div class="kpi-value">
          {{ loading ? '…' : total }}
        </div>
      </v-card>

      <v-card class="kpi-card pa-4 d-flex flex-column justify-space-between" elevation="2">
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption text-medium-emphasis font-medium">Usuários Ativos</span>
          <v-icon icon="mdi-account-multiple" size="20" class="text-medium-emphasis" />
        </div>
        <div class="kpi-value">
          {{ loading ? '…' : uniqueUsers }}
        </div>
      </v-card>

      <v-card class="kpi-card pa-4 d-flex flex-column justify-space-between" elevation="2">
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption text-medium-emphasis font-medium">Tipos de Ação</span>
          <v-icon icon="mdi-lightning-bolt" size="20" class="text-medium-emphasis" />
        </div>
        <div class="kpi-value">
          {{ loading ? '…' : uniqueActions }}
        </div>
      </v-card>

      <v-card class="kpi-card pa-4 d-flex flex-column justify-space-between" elevation="2">
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption text-medium-emphasis font-medium">Última Atualização</span>
          <v-icon icon="mdi-clock-outline" size="20" class="text-medium-emphasis" />
        </div>
        <div class="kpi-value text-sm">
          {{ formatDate(lastUpdated) }}
        </div>
      </v-card>
    </div>

    <!-- Tabela de Logs -->
    <v-card class="bg-white rounded-lg shadow-md pa-4">
      <div class="px-4 py-3 border-b border-slate-100">
        <div class="d-flex items-center gap-2 text-xs text-slate-500">
          <v-icon icon="mdi-shield-check" class="mr-1" />
          <span>Registros de Auditoria</span>
          <div class="ml-auto flex items-center gap-2">
            <v-chip color="primary" size="x-small" variant="tonal" class="font-medium">
              Página {{ currentPage + 1 }} de {{ totalPages || 1 }}
            </v-chip>
          </div>
        </div>
      </div>

      <div class="p-4">
        <!-- Alerta de Erro -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          closable
          class="mb-4"
          @click:close="error = null"
        >
          <div class="d-flex align-center">
            <v-icon icon="mdi-shield-lock" size="48" class="mr-3" />
            <div>
              <div class="font-weight-bold text-h6 mb-2">{{ error }}</div>
              <div class="text-sm mb-2">
                Entre em contato com um administrador se você precisa de acesso aos logs de
                auditoria.
              </div>
              <v-divider class="my-2" />
              <div class="text-xs text-medium-emphasis">
                <strong>Solução:</strong>
                Faça logout e entre com uma conta que tenha permissão de Administrador.
              </div>
            </div>
          </div>
        </v-alert>

        <div class="overflow-auto">
          <v-data-table
            :headers="headers"
            :items="filteredData"
            :items-per-page="pageSize"
            :loading="loading"
            hide-default-footer
            class="min-w-[1000px]"
          >
            <template v-slot:item.id="{ item }">
              <span class="text-sm font-medium text-slate-700">#{{ item.id }}</span>
            </template>

            <template v-slot:item.userName="{ item }">
              <span class="text-sm font-medium">{{ item.userName || 'Sistema' }}</span>
            </template>

            <template v-slot:item.actionType="{ item }">
              <v-chip
                :color="auditStore.getActionColor(item.actionType)"
                size="small"
                label
                class="text-white font-medium"
              >
                {{ auditStore.getActionLabel(item.actionType) }}
              </v-chip>
            </template>

            <template v-slot:item.entityName="{ item }">
              <v-chip
                :color="auditStore.getEntityColor(item.entityName)"
                size="small"
                label
                class="text-white font-medium"
              >
                {{ auditStore.getEntityLabel(item.entityName) }}
              </v-chip>
            </template>

            <template v-slot:item.details="{ item }">
              <v-tooltip :text="item.details" location="top">
                <template #activator="{ props }">
                  <span
                    v-bind="props"
                    class="text-sm text-slate-600 d-inline-block text-truncate"
                    style="max-width: 200px"
                  >
                    {{ item.details }}
                  </span>
                </template>
              </v-tooltip>
            </template>

            <template v-slot:item.createdAt="{ item }">
              <span class="text-sm text-slate-700">{{ formatDate(item.createdAt) }}</span>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-tooltip text="Ver Detalhes" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="small"
                    icon="mdi-eye"
                    variant="text"
                    color="primary"
                    @click="viewDetails(item)"
                  />
                </template>
              </v-tooltip>
            </template>

            <template v-slot:no-data>
              <div class="text-center py-8">
                <v-icon icon="mdi-file-document-outline" size="48" class="text-slate-300 mb-2" />
                <p class="text-slate-500">Nenhum registro de auditoria encontrado</p>
              </div>
            </template>
          </v-data-table>
        </div>

        <!-- Paginação -->
        <div class="d-flex justify-center align-center gap-2 mt-4">
          <v-btn
            size="small"
            icon="mdi-chevron-left"
            variant="text"
            :disabled="currentPage === 0 || loading"
            @click="goToPage(currentPage - 1)"
          />
          <span class="text-sm text-slate-600">
            Página {{ currentPage + 1 }} de {{ totalPages || 1 }}
          </span>
          <v-btn
            size="small"
            icon="mdi-chevron-right"
            variant="text"
            :disabled="currentPage >= totalPages - 1 || loading"
            @click="goToPage(currentPage + 1)"
          />
        </div>
      </div>
    </v-card>

    <!-- Dialog de Detalhes -->
    <v-dialog v-model="detailsDialog" max-width="600">
      <v-card v-if="selectedLog">
        <v-toolbar flat density="comfortable" color="primary">
          <v-toolbar-title class="text-white">
            Detalhes do Log #{{ selectedLog.id }}
          </v-toolbar-title>
          <v-spacer />
          <v-btn icon="mdi-close" color="white" variant="text" @click="detailsDialog = false" />
        </v-toolbar>

        <v-card-text class="pa-6">
          <v-row dense>
            <v-col cols="12">
              <div class="mb-4">
                <span class="text-xs text-slate-500 font-medium">USUÁRIO</span>
                <div class="mt-1 font-medium text-lg">
                  {{ selectedLog.userName || 'Sistema' }}
                </div>
                <div v-if="selectedLog.userEmail" class="text-sm text-slate-500 mt-1">
                  {{ selectedLog.userEmail }}
                </div>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <span class="text-xs text-slate-500 font-medium">TIPO DE AÇÃO</span>
                <div class="mt-1">
                  <v-chip
                    :color="auditStore.getActionColor(selectedLog.actionType)"
                    size="small"
                    label
                    class="text-white"
                  >
                    {{ auditStore.getActionLabel(selectedLog.actionType) }}
                  </v-chip>
                </div>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <span class="text-xs text-slate-500 font-medium">DATA/HORA</span>
                <div class="mt-1 font-medium">{{ formatDate(selectedLog.createdAt) }}</div>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <span class="text-xs text-slate-500 font-medium">ENTIDADE</span>
                <div class="mt-1">
                  <v-chip
                    :color="auditStore.getEntityColor(selectedLog.entityName)"
                    size="small"
                    label
                    class="text-white"
                  >
                    {{ auditStore.getEntityLabel(selectedLog.entityName) }}
                  </v-chip>
                  <span v-if="selectedLog.entityId" class="ml-2 text-sm text-slate-500">
                    (ID: {{ selectedLog.entityId }})
                  </span>
                </div>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <span class="text-xs text-slate-500 font-medium">DETALHES</span>
                <div class="mt-1 pa-3 bg-slate-50 rounded border border-slate-200">
                  <pre class="text-sm whitespace-pre-wrap">{{ selectedLog.details }}</pre>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn color="primary" variant="text" @click="detailsDialog = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default', middleware: 'auth' });
</script>

<script>
import { useAuditStore } from '~/stores/audit';
import { useAuthStore } from '~/stores/auth';
import { formatDate, getInitials } from '~/utils';

export default {
  name: 'AuditPage',
  data() {
    return {
      auditStore: null,
      search: '',
      loading: false,
      lastUpdated: Date.now(),
      showFilters: false,
      detailsDialog: false,
      selectedLog: null,
      pageSize: 20,
      error: null,
      filters: {
        userId: null,
        actionType: null,
        startDate: null,
        endDate: null,
      },
      headers: [
        { title: 'ID', key: 'id', width: 80 },
        { title: 'Usuário', key: 'userName', width: 150 },
        { title: 'Ação', key: 'actionType', width: 180 },
        { title: 'Entidade', key: 'entityName', width: 150 },
        { title: 'Detalhes', key: 'details', width: 200 },
        { title: 'Data/Hora', key: 'createdAt', width: 180 },
        { title: 'Ações', key: 'actions', sortable: false, width: 80 },
      ],
    };
  },
  computed: {
    logs() {
      return this.auditStore?.logs || [];
    },
    total() {
      return this.auditStore?.total || 0;
    },
    currentPage() {
      return this.auditStore?.page || 0;
    },
    totalPages() {
      return this.auditStore?.totalPages || 0;
    },
    actionTypes() {
      return this.auditStore?.getActionTypes() || [];
    },
    filteredData() {
      const q = (this.search || '').toLowerCase().trim();
      if (!q) return this.logs;

      return this.logs.filter((log) => {
        const searchFields = [
          log.userName,
          log.userEmail,
          log.actionType,
          this.auditStore.getActionLabel(log.actionType),
          log.entityName,
          log.details,
          String(log.id),
          String(log.entityId),
        ].filter(Boolean);

        return searchFields.some((field) => String(field).toLowerCase().includes(q));
      });
    },
    uniqueUsers() {
      const userNames = new Set(
        this.logs
          .map((log) => log.userName)
          .filter((name) => name && name !== 'Unknown' && name !== 'Sistema'),
      );
      return userNames.size;
    },
    uniqueActions() {
      const actions = new Set(this.logs.map((log) => log.actionType).filter(Boolean));
      return actions.size;
    },
  },
  created() {
    this.auditStore = useAuditStore();
  },
  async mounted() {
    const auth = useAuthStore();
    const userRole = auth?.user?.role;
    const userName = auth?.user?.name || 'Usuário';

    if (userRole !== 'ADMIN') {
      this.error = `Acesso Negado: Apenas administradores podem visualizar os logs de auditoria.`;
      console.warn('[AUDIT PAGE] Usuário sem permissão.', userRole);
      this.loading = false;
      return;
    }

    await this.fetchData();
  },
  methods: {
    formatDate,
    getInitials,
    async fetchData() {
      this.loading = true;
      this.error = null;
      try {
        console.log('[AUDIT PAGE] Iniciando busca de logs...');
        const result = await this.auditStore.fetchLogs({
          page: this.currentPage,
          size: this.pageSize,
        });
        console.log('[AUDIT PAGE] Logs recebidos:', result);
        this.lastUpdated = Date.now();

        if (!result || result.length === 0) {
          console.log('[AUDIT PAGE] Nenhum log encontrado');
        }
      } catch (error) {
        console.error('[AUDIT PAGE] Erro ao buscar logs de auditoria:', error);
        this.error =
          'Erro ao carregar logs de auditoria. Verifique se você tem permissão de administrador.';
      } finally {
        this.loading = false;
      }
    },
    async applyFilters() {
      this.loading = true;
      this.error = null;
      try {
        const filterPayload = {
          page: 0,
          size: this.pageSize,
        };

        if (this.filters.userId) {
          filterPayload.userId = Number(this.filters.userId);
        }
        if (this.filters.actionType) {
          filterPayload.actionType = this.filters.actionType;
        }
        if (this.filters.startDate) {
          filterPayload.startDate = this.filters.startDate;
        }
        if (this.filters.endDate) {
          filterPayload.endDate = this.filters.endDate;
        }

        console.log('[AUDIT PAGE] Aplicando filtros:', filterPayload);
        await this.auditStore.fetchLogs(filterPayload);
        this.lastUpdated = Date.now();
      } catch (error) {
        console.error('[AUDIT PAGE] Erro ao aplicar filtros:', error);
        this.error = 'Erro ao aplicar filtros. Tente novamente.';
      } finally {
        this.loading = false;
      }
    },
    clearFilters() {
      this.filters = {
        userId: null,
        actionType: null,
        startDate: null,
        endDate: null,
      };
      this.error = null;
      this.fetchData();
    },
    async goToPage(page) {
      if (page < 0 || page >= this.totalPages) return;
      this.loading = true;
      this.error = null;
      try {
        console.log('[AUDIT PAGE] Navegando para página:', page);
        await this.auditStore.fetchLogs({
          ...this.filters,
          page,
          size: this.pageSize,
        });
        this.lastUpdated = Date.now();
      } catch (error) {
        console.error('[AUDIT PAGE] Erro ao navegar páginas:', error);
        this.error = 'Erro ao carregar página.';
      } finally {
        this.loading = false;
      }
    },
    viewDetails(log) {
      this.selectedLog = log;
      this.detailsDialog = true;
    },
  },
};
</script>

<style scoped>
.kpi-card {
  min-height: 110px;
  position: relative;
}

.kpi-value {
  font-size: 1.9rem;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.kpi-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
