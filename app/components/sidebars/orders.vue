<template>
  <v-navigation-drawer
    v-model="sidebar.isOpen"
    location="right"
    temporary
    width="720"
  >
    <v-toolbar flat density="comfortable">
      <v-toolbar-title>
        {{ isEdit ? "Editar Pedido" : "Cadastrar Pedido" }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" :disabled="loading" @click="closeAndReset" />
    </v-toolbar>

    <v-divider />

    <v-form ref="formRef" v-model="formValid" class="pa-4" @submit.prevent="submit">
      <v-row dense>
        <v-col cols="12">
          <v-select
            v-model="form.supplierId"
            label="Fornecedor"
            :items="supplierOptions"
            item-title="label"
            item-value="id"
            :loading="suppliersLoading"
            :rules="[rules.required]"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            placeholder="Selecione o fornecedor"
          />
        </v-col>

        <v-col cols="12">
          <v-card variant="tonal" color="primary">
            <v-card-text>
              <div class="d-flex flex-column ga-2">
                <div class="d-flex ga-2 align-end">
                  <v-autocomplete
                    v-model="pick.itemId"
                    label="Adicionar item do estoque"
                    :items="itemOptions"
                    item-title="label"
                    item-value="id"
                    :loading="itemsLoading"
                    variant="outlined"
                    density="comfortable"
                    class="flex-1"
                    hide-details="auto"
                    clearable
                  />
                  <v-text-field
                    v-model.number="pick.qtd"
                    type="number"
                    min="1"
                    step="1"
                    inputmode="numeric"
                    :rules="[rules.intQty]"
                    label="Qtd"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    style="max-width: 140px"
                    @input="normalizePickQty"
                  />
                  <v-btn color="primary" variant="elevated" @click="addPickedItem" :disabled="!canAddPick">
                    Adicionar
                  </v-btn>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Dica: você pode procurar pelo nome, tipo, seção ou fornecedor do item.
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mb-2">
            {{ error }}
          </v-alert>
          <v-table density="comfortable" class="order-items-table">
            <thead>
              <tr>
                <th class="text-left">Item</th>
                <th class="text-left">Unidade</th>
                <th class="text-left">Estoque Atual</th>
                <th class="text-left" style="width:160px">Quantidade</th>
                <th class="text-right" style="width:70px">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!form.items.length">
                <td colspan="5" class="text-center text-medium-emphasis py-6">
                  Nenhum item adicionado. Utilize o campo acima para incluir itens ao pedido.
                </td>
              </tr>
              <tr v-for="(it, idx) in form.items" :key="it.itemId">
                <td>
                  <div class="d-flex flex-column">
                    <span class="font-medium">{{ it.name }}</span>
                    <span class="text-caption text-medium-emphasis">#{{ it.itemId }}</span>
                  </div>
                </td>
                <td>
                  <span>{{ it.measure || "—" }}</span>
                </td>
                <td>
                  <span>{{ it.currentStock ?? "—" }}</span>
                </td>
                <td>
                  <v-text-field
                    v-model.number="it.qtd"
                    type="number"
                    min="1"
                    step="1"
                    inputmode="numeric"
                    :rules="[rules.intQty]"
                    density="comfortable"
                    variant="outlined"
                    hide-details="auto"
                    @input="normalizeQty(it)"
                    @blur="normalizeQty(it)"
                  />
                </td>
                <td class="text-right">
                  <v-btn icon="mdi-delete" variant="text" color="red" @click="removeItem(idx)" />
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-col>

        <v-col cols="12" class="d-flex justify-end ga-2 mt-4">
          <v-btn type="button" variant="text" :disabled="loading" @click="reset">
            Limpar
          </v-btn>
          <v-btn type="submit" color="primary" :loading="loading" :disabled="!formValid || !canSubmit">
            {{ isEdit ? "Salvar Alterações" : "Salvar Pedido" }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-navigation-drawer>
  
</template>

<script>
import { useSidebarStore } from "~/stores/sidebar";
import { useSupplier } from "~/stores/supplier";
import { useStorage } from "~/stores/storage";
import { useOrders } from "~/stores/orders";

export default {
  name: "OrdersSidebar",
  emits: ["created", "updated"],
  data() {
    return {
      sidebar: null,
      supplierStore: null,
      storageStore: null,
  suppliersLoading: false,
      itemsLoading: false,
      loading: false,
      formValid: true,
      error: null,
      form: {
        supplierId: null,
        items: [], // { itemId, name, measure, currentStock, qtd }
      },
      pick: {
        itemId: null,
        qtd: 1,
      },
      suppliers: [],
      items: [],
      rules: {
        required: (v) => !!v || v === 0 || "Obrigatório",
        intQty: (v) => {
          const n = Number(v);
          return Number.isInteger(n) && n > 0 || "Quantidade deve ser inteira e maior que 0";
        },
      },
    };
  },
  computed: {
    isEdit() {
      return this.sidebar?.payload?.mode === "edit";
    },
    supplierOptions() {
      return (this.suppliers || [])
        .filter((s) => (s.name || s.nomeFantasia || "") !== "Usuario de Migração")
        .map((s) => ({ id: s.id, label: s.name || s.nomeFantasia || s.razaoSocial || `#${s.id}` }));
    },
    itemOptions() {
      return (this.items || []).map((it) => ({
        id: it.itemId ?? it.id,
        label: `${it.name || it.itemName || `#${it.itemId || it.id}`} • ${it.measure || it.unit || "un"} • stock: ${it.currentStock ?? it.qtd ?? "?"}`,
      }));
    },
    canAddPick() {
      return !!(this.pick.itemId && Number.isInteger(this.pick.qtd) && this.pick.qtd > 0);
    },
    canSubmit() {
      return !!(
        this.form.supplierId &&
        this.form.items.length > 0 &&
        this.form.items.every((i) => Number.isInteger(i.qtd) && i.qtd > 0)
      );
    },
  },
  async created() {
    this.sidebar = useSidebarStore();
    this.supplierStore = useSupplier();
    this.storageStore = useStorage();
    this.ordersStore = useOrders();
    await this.fetchSuppliers();
    await this.fetchItems();
  },
  watch: {
    "sidebar.isOpen"(open) {
      if (!open) setTimeout(() => this.reset(), 150);
    },
  },
  methods: {
    async fetchSuppliers() {
      this.suppliersLoading = true;
      try {
        this.suppliers = (await this.supplierStore.list()) || [];
      } catch (e) {
        this.suppliers = [];
      } finally {
        this.suppliersLoading = false;
      }
    },
    async fetchItems() {
      this.itemsLoading = true;
      try {
        this.items = (await this.storageStore.list()) || [];
      } catch (e) {
        this.items = [];
      } finally {
        this.itemsLoading = false;
      }
    },
    closeAndReset() {
      this.sidebar.close();
      this.reset();
    },
    reset() {
      this.error = null;
      this.form = { supplierId: null, items: [] };
      this.pick = { itemId: null, qtd: 1 };
      if (this.$refs.formRef) this.$refs.formRef.resetValidation();
    },
    addPickedItem() {
      if (!this.canAddPick) return;
      const id = this.pick.itemId;
      const base = (this.items || []).find((x) => (x.itemId ?? x.id) === id);
      if (!base) return;
      const exists = this.form.items.find((x) => x.itemId === (base.itemId ?? base.id));
      if (exists) {
        exists.qtd = Math.max(1, Math.round(Number(exists.qtd || 0) + Number(this.pick.qtd || 0)));
      } else {
        this.form.items.push({
          itemId: base.itemId ?? base.id,
          name: base.name || base.itemName || `#${base.itemId ?? base.id}`,
          measure: base.measure || base.unit,
          currentStock: base.currentStock ?? base.qtd,
          qtd: Math.max(1, Math.round(Number(this.pick.qtd || 0))),
        });
      }
      this.pick = { itemId: null, qtd: 1 };
    },
    removeItem(idx) {
      this.form.items.splice(idx, 1);
    },
    normalizeQty(it) {
      const n = Number(it.qtd);
      if (!isFinite(n) || n < 1) it.qtd = 1;
      else it.qtd = Math.round(n);
    },
    normalizePickQty() {
      const n = Number(this.pick.qtd);
      if (!isFinite(n) || n < 1) this.pick.qtd = 1;
      else this.pick.qtd = Math.round(n);
    },
    async submit() {
      this.error = null;
      if (this.$refs.formRef) {
        const ok = await this.$refs.formRef.validate();
        if (!ok.valid) return;
      }
      if (!this.canSubmit) return;
      this.loading = true;
      try {
        // Monta payload do pedido
        const payload = {
          supplierId: this.form.supplierId,
          items: this.form.items.map((i) => ({ itemId: i.itemId, quantity: i.qtd })),
        };
        const created = await this.ordersStore.create(payload);
        // Prepara campos para tabela (fallbacks caso API retorne diferente)
        const supplier = this.suppliers.find((s) => s.id === payload.supplierId);
        const normalized = {
          id: created?.id ?? Date.now(),
          supplierName: created?.supplierName || supplier?.name || supplier?.nomeFantasia || `#${payload.supplierId}`,
          itemsCount: created?.itemsCount ?? payload.items?.length ?? 0,
          lastUpdate: created?.updatedAt || created?.createdAt || Date.now(),
          ...created,
        };
        this.$emit("created", normalized);
        this.sidebar.close();
        this.reset();
      } catch (e) {
        this.error = this.isEdit ? "Falha ao atualizar pedido" : "Falha ao salvar pedido";
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.order-items-table thead th {
  font-weight: 600;
}
</style>
