<template>
  <div class="dashboard space-y-10">
    <!-- KPIs -->
    <div class="kpi-grid my-6">
      <v-card
        v-for="k in kpis"
        :key="k.key"
        class="kpi-card pa-4 d-flex flex-column justify-space-between"
        elevation="2"
      >
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption text-medium-emphasis font-medium">
            {{ k.label }}
          </span>
          <v-icon :icon="k.icon" size="20" class="text-medium-emphasis" />
        </div>
        <div class="kpi-value">
          {{ k.loading ? "…" : k.value }}
        </div>
        <div
          v-if="k.helper"
          class="text-caption text-medium-emphasis mt-1 font-regular"
        >
          {{ k.helper }}
        </div>
      </v-card>
    </div>

    <!-- Ações rápidas -->
    <v-card class="section-card pa-5 mb-6">
      <div class="d-flex align-center mb-4">
        <v-icon icon="mdi-flash" class="mr-2" />
        <span class="text-subtitle-2 font-semibold">Ações Rápidas</span>
      </div>
      <div class="d-flex flex-wrap gap-3">
        <v-btn
          v-for="action in quickActions"
          :key="action.label"
          size="large"
          variant="elevated"
          :color="action.color"
          class="quick-action-btn mr-12"
          @click="action.run()"
        >
          <v-icon start icon="mdi-chevron-right" />
          {{ action.label }}
        </v-btn>
      </div>
    </v-card>

    <!-- Itens críticos -->
    <v-card
      v-if="criticalItems.length"
      class="section-card pa-5 critical-card"
      elevation="2"
    >
      <div class="d-flex align-center mb-4">
        <v-icon icon="mdi-alert" color="red" class="mr-2" />
        <span class="text-subtitle-2 font-semibold">Itens Críticos</span>
        <v-spacer />
        <v-chip
          size="x-small"
          color="red"
          variant="tonal"
          class="font-medium"
          >{{ criticalItems.length }}</v-chip
        >
      </div>
      <v-table density="compact" class="table-flat">
        <thead>
          <tr>
            <th class="text-left">Item</th>
            <th class="text-left">Qtd</th>
            <th class="text-left">Mínimo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="it in criticalItems" :key="it.id">
            <td>{{ it.name || it.descricao || "#" + it.id }}</td>
            <td>{{ it.quantity ?? it.qtd ?? "-" }}</td>
            <td>{{ it.minQuantity ?? it.min ?? "-" }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Últimos Fornecedores -->
    <v-card class="section-card pa-5" elevation="2">
      <div class="d-flex align-center mb-4">
        <v-icon icon="mdi-account-multiple" class="mr-2" />
        <span class="text-subtitle-2 font-semibold">Últimos Fornecedores</span>
        <v-spacer />
        <v-btn
          size="x-small"
          variant="text"
          color="primary"
          @click="$router.push('/suppliers')"
          >Ver todos</v-btn
        >
      </div>

      <v-data-table
        :headers="lastSupplierHeaders"
        :items="lastSuppliers"
        :loading="suppliersLoading"
        item-key="id"
        density="comfortable"
        class="last-suppliers-table elevation-0"
        hide-default-footer
      >
        <template #item.cnpj="{ item }">
          {{ formatCNPJ(item.cnpj || "") }}
        </template>

        <template #item.lastUpdate="{ item }">
          {{ formatDate(item.lastUpdate) }}
        </template>

        <template #loading>
          <div class="py-6 text-center text-medium-emphasis text-caption">
            Carregando...
          </div>
        </template>

        <template #no-data>
          <div class="py-6 text-center text-medium-emphasis text-caption">
            Nenhum fornecedor
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({ layout: "default", middleware: "auth" });
</script>

<script>
import { useAuthStore } from "~/stores/auth";
import { useSupplier } from "~/stores/supplier";
import { useStorage } from "~/stores/storage";
import { formatCNPJ, formatDate } from "~/utils";

export default {
  name: "home",
  data() {
    return {
      auth: null,
      supplierStore: null,
      storageStore: null,
      suppliersLoading: false,
      itemsLoading: false,
      suppliers: [],
      items: [],
      kpis: [
        {
          key: "items",
          label: "Itens",
          icon: "mdi-package-variant",
          value: 0,
          loading: true,
        },
        {
          key: "crit",
          label: "Críticos",
          icon: "mdi-alert-circle",
          value: 0,
          loading: true,
        },
        {
          key: "suppliers",
          label: "Fornecedores",
          icon: "mdi-domain",
          value: 0,
          loading: true,
        },
        {
          key: "sections",
          label: "Seções",
          icon: "mdi-view-grid",
          value: 0,
          loading: true,
        },
      ],
      lastSupplierHeaders: [
        { title: "Nome", key: "name" },
        { title: "CNPJ", key: "cnpj" },
        { title: "Última Atualização", key: "lastUpdate" },
      ],
    };
  },
  computed: {
    userRole() {
      return this.auth?.user?.role;
    },
    quickActions() {
      const actions = [];
      const sidebar = useSidebarStore?.();

      if (["ADMIN", "MANAGER"].includes(this.userRole)) {
        actions.push(
          {
            label: "Novo Fornecedor",
            color: "teal",
            run: () => this.$router.push("/suppliers"),
          },
          {
            label: "Novo Item",
            color: "indigo",
            run: () => this.$router.push("/storage"),
          },
          {
            label: "Gerenciar Usuários",
            color: "secondary",
            run: () => this.$router.push("/users"),
          }
        );
        if (this.userRole === "ADMIN") {
          actions.push({
            label: "Nova Seção",
            color: "primary",
            run: () => this.$router.push("/sections"),
          });
        }
      }
      return actions;
    },
    lastSuppliers() {
      return [...this.suppliers]
        .map((s) => ({
          ...s,
          name: s.name || s.nomeFantasia || s.razaoSocial || "#" + s.id,
          lastUpdate: s.lastUpdate || s.updatedAt || s.createdAt || null,
        }))
        .sort(
          (a, b) =>
            new Date(b.lastUpdate || 0).getTime() -
            new Date(a.lastUpdate || 0).getTime()
        )
        .slice(0, 5);
    },
    criticalItems() {
      return (this.items || [])
        .filter((it) => {
          const qtd = it.quantity ?? it.qtd;
          const min = it.minQuantity ?? it.min;
          return qtd != null && min != null && qtd <= min;
        })
        .slice(0, 8);
    },
  },
  async created() {
    this.auth = useAuthStore();
    this.supplierStore = useSupplier();
    this.storageStore = useStorage();
    await this.fetchAll();
  },
  methods: {
    formatCNPJ,
    formatDate,
    async fetchAll() {
      this.suppliersLoading = true;
      this.itemsLoading = true;
      try {
        const [suppliers, items] = await Promise.all([
          this.supplierStore.list().catch(() => []),
          this.storageStore.list().catch(() => []),
        ]);
        this.suppliers = suppliers;
        this.items = items;
        this.updateKpis();
      } finally {
        this.suppliersLoading = false;
        this.itemsLoading = false;
      }
    },
    updateKpis() {
      const crit = this.criticalItems.length;
      const map = {
        items: this.items.length,
        crit,
        suppliers: this.suppliers.length,
        sections: this.auth?.user?.sections?.length || 0,
      };
      this.kpis = this.kpis.map((k) => ({
        ...k,
        value: map[k.key] ?? 0,
        loading: false,
        helper:
          k.key === "crit" && crit > 0
            ? "Verifique níveis de estoque"
            : undefined,
      }));
    },
  },
};
</script>

<style scoped>
.kpi-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

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

.section-card {
  border: 1px solid #ececec;
  border-radius: 10px;
}

.critical-card {
  border-color: rgba(244, 67, 54, 0.35);
}

.quick-action-btn {
  flex: 1 1 180px;
  max-width: 240px;
  height: 120px;
  justify-content: flex-start;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.table-flat :deep(thead tr) {
  background: #fafafa;
}

.table-flat :deep(th) {
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-flat :deep(td) {
  font-size: 0.78rem;
  vertical-align: middle;
}

.last-suppliers-table :deep(th) {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}
.last-suppliers-table :deep(td) {
  font-size: 0.78rem;
  vertical-align: middle;
}

@media (max-width: 640px) {
  .quick-action-btn {
    flex: 1 1 100%;
    max-width: 100%;
  }
  .kpi-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
  .kpi-value {
    font-size: 1.6rem;
  }
}
</style>
