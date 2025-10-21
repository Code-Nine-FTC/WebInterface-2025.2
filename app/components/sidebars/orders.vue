<template>
  <v-navigation-drawer v-model="sidebar.isOpen" location="right" temporary width="720">
    <v-toolbar flat density="comfortable">
      <v-toolbar-title>
        {{ isView ? 'Detalhes do Pedido' : isEdit ? 'Editar Pedido' : 'Cadastrar Pedido' }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" :disabled="loading" @click="closeAndReset" />
    </v-toolbar>

    <v-divider />

    <!-- Modo Visualização -->
    <div v-if="isView" class="pa-4">
      <v-card class="mb-4" variant="tonal" color="primary">
        <v-card-text>
          <div class="d-flex flex-column gap-1">
            <div class="d-flex align-center gap-2">
              <v-icon size="small" color="primary">mdi-pound</v-icon>
              <span class="text-body-2">
                <strong>Código:</strong>
                {{ orderDetails?.id }}
              </span>
            </div>
            <div class="d-flex align-center gap-2">
              <v-icon size="small" color="primary">mdi-calendar</v-icon>
              <span class="text-body-2">
                <strong>Retirada:</strong>
                {{ formatDate(orderDetails?.withdrawDay) }}
              </span>
            </div>
            <div class="d-flex align-center gap-2">
              <v-icon size="small" color="primary">mdi-information</v-icon>
              <span class="text-body-2">
                <strong>Status:</strong>
                {{ statusLabel(orderDetails?.status) }}
              </span>
            </div>
            <div v-if="supplierNames.length" class="d-flex align-center gap-2">
              <v-icon size="small" color="primary">mdi-domain</v-icon>
              <span class="text-body-2">
                <strong>Fornecedores:</strong>
                {{ supplierNames.join(', ') }}
              </span>
            </div>
            <div class="d-flex flex-column gap-2 mt-3">
              <div class="text-caption text-medium-emphasis">Atualizar status</div>
              <v-btn-toggle
                v-model="selectedStatus"
                class="flex-wrap"
                divided
                color="primary"
                :mandatory="false"
                :disabled="loading || isTerminalStatus"
                @update:modelValue="handleStatusToggle"
              >
                <v-btn
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :value="opt.value"
                  :disabled="isOptionDisabled(opt.value)"
                  :color="opt.color"
                  variant="tonal"
                  class="mr-1 mb-1"
                  @click="statusChange(opt.value)"
                >
                  <v-icon size="16" class="mr-1">{{ opt.icon }}</v-icon>
                  {{ opt.label }}
                </v-btn>
              </v-btn-toggle>
              <div v-if="isTerminalStatus" class="text-caption text-medium-emphasis">
                Este pedido está em estado finalizado. Alterações não são permitidas.
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Confirmar cancelamento -->
      <v-dialog v-model="confirmCancel" max-width="420">
        <v-card>
          <v-card-title class="text-subtitle-1">Cancelar pedido?</v-card-title>
          <v-card-text>
            Essa ação definirá o status como "Cancelado" e não poderá ser desfeita diretamente.
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="confirmCancel = false">Voltar</v-btn>
            <v-btn color="red" :loading="loading" @click="confirmCancelAction">Confirmar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="completeDialog" max-width="420">
        <v-card>
          <v-card-title class="text-subtitle-1">Concluir pedido?</v-card-title>
          <v-card-text>
            Selecione a data de conclusão do pedido:
            <v-text-field
              v-model="completeDate"
              label="Data de conclusão"
              type="date"
              variant="outlined"
              density="comfortable"
              class="mt-2"
            />
            <div class="text-caption text-medium-emphasis mt-2">
              Se não selecionar, será usada a data atual.
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="completeDialog = false">Voltar</v-btn>
            <v-btn color="primary" :loading="loading" @click="confirmCompleteAction">
              Confirmar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Snackbar de feedback -->
      <v-snackbar v-model="snack.show" :color="snack.color" timeout="2500">
        {{ snack.text }}
      </v-snackbar>

      <v-table density="comfortable" class="order-items-table">
        <thead>
          <tr>
            <th class="text-left">Item</th>
            <th class="text-left">Unidade</th>
            <th class="text-left" style="width: 160px">Quantidade</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!orderDetailsItems.length">
            <td colspan="3" class="text-center text-medium-emphasis py-6">
              Este pedido não possui itens.
            </td>
          </tr>
          <tr v-for="it in orderDetailsItems" :key="it.itemId">
            <td>
              <div class="d-flex flex-column">
                <span class="font-medium">{{ it.name }}</span>
                <span class="text-caption text-medium-emphasis">#{{ it.itemId }}</span>
              </div>
            </td>
            <td>{{ it.measure || '—' }}</td>
            <td>{{ it.qtd }}</td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <!-- Modo Criação/Edição -->
    <v-form v-else ref="formRef" v-model="formValid" class="pa-4" @submit.prevent="submit">
      <v-row dense>
        <v-col cols="12">
          <v-select
            v-model="form.supplierId"
            label="Fornecedor"
            :items="supplierOptions"
            item-title="label"
            item-value="id"
            :loading="suppliersLoading"
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
                  <v-btn
                    color="primary"
                    variant="elevated"
                    @click="addPickedItem"
                    :disabled="!canAddPick"
                  >
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
                <th class="text-left" style="width: 160px">Quantidade</th>
                <th class="text-right" style="width: 70px">Ações</th>
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
                  <span>{{ it.measure || '—' }}</span>
                </td>
                <td>
                  <span>{{ it.currentStock ?? '—' }}</span>
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
          <v-btn type="button" variant="text" :disabled="loading" @click="reset">Limpar</v-btn>
          <v-btn
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="!formValid || !canSubmit"
          >
            {{ isEdit ? 'Salvar Alterações' : 'Salvar Pedido' }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-navigation-drawer>
</template>

<script>
import { useSidebarStore } from '~/stores/sidebar';
import { useSupplier } from '~/stores/supplier';
import { useStorage } from '~/stores/storage';
import { useOrders } from '~/stores/orders';

export default {
  name: 'OrdersSidebar',
  emits: ['created', 'updated'],
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
      orderDetails: null,
      orderItems: [],
      supplierNames: [],
      selectedStatus: null,
      confirmCancel: false,
      completeDialog: false,
      pendingNewStatus: null,
      snack: { show: false, color: 'success', text: '' },
      form: {
        supplierId: null,
        items: [],
      },
      pick: {
        itemId: null,
        qtd: 1,
      },
      completeDate: null,
      suppliers: [],
      items: [],
      ORDER_STATUS: {
        APPROVED: {
          label: 'Aprovado',
          color: 'green',
          icon: 'mdi-check-circle',
          next: ['PROCESSING', 'CANCELLED'],
        },
        PROCESSING: {
          label: 'Processando',
          color: 'blue',
          icon: 'mdi-cog',
          next: ['COMPLETED', 'CANCELLED'],
        },
        COMPLETED: { label: 'Concluído', color: 'purple', icon: 'mdi-check-all', next: [] },
        CANCELLED: { label: 'Cancelado', color: 'red', icon: 'mdi-cancel', next: [] },
        PENDING: {
          label: 'Pendente',
          color: 'grey',
          icon: 'mdi-timer-sand',
          next: ['APPROVED', 'PROCESSING', 'CANCELLED'],
        },
      },
      rules: {
        required: (v) => !!v || v === 0 || 'Obrigatório',
        intQty: (v) => {
          const n = Number(v);
          return (Number.isInteger(n) && n > 0) || 'Quantidade deve ser inteira e maior que 0';
        },
      },
    };
  },
  computed: {
    isEdit() {
      return this.sidebar?.payload?.mode === 'edit';
    },
    isView() {
      return this.sidebar?.payload?.mode === 'view';
    },
    currentStatus() {
      return this.normalizeStatusKey(this.orderDetails?.status);
    },
    statusMeta() {
      return this.ORDER_STATUS[this.currentStatus] || this.ORDER_STATUS.PENDING;
    },
    isTerminalStatus() {
      return ['COMPLETED', 'CANCELLED'].includes(this.currentStatus);
    },
    statusOptions() {
      const opts = [this.currentStatus, ...(this.statusMeta.next || [])];
      return opts.map((key) => ({
        value: key,
        label: this.ORDER_STATUS[key].label,
        icon: this.ORDER_STATUS[key].icon,
        color: this.ORDER_STATUS[key].color,
      }));
    },
    orderDetailsItems() {
      if (Array.isArray(this.orderItems) && this.orderItems.length) {
        return this.orderItems.map((it) => {
          const itemId = it.itemId ?? it.id;
          const qtd = it.quantity ?? it.qtd ?? it.amount ?? 0;
          const base = (this.items || []).find((x) => (x.itemId ?? x.id) === itemId) || {};
          return {
            itemId,
            qtd,
            name: it.name || base.name || base.itemName || `#${itemId}`,
            measure: it.measure || base.measure || base.unit || null,
          };
        });
      }
      if (this.orderDetails?.itemQuantities) {
        return Object.entries(this.orderDetails.itemQuantities).map(([k, v]) => {
          const itemId = Number(k);
          const qtd = Number(v);
          const base = (this.items || []).find((x) => (x.itemId ?? x.id) === itemId) || {};
          return {
            itemId,
            qtd,
            name: base.name || base.itemName || `#${itemId}`,
            measure: base.measure || base.unit || null,
          };
        });
      }
      return [];
    },
    supplierOptions() {
      return (this.suppliers || []).map((s) => ({
        id: s.id,
        label: s.name || s.nomeFantasia || s.razaoSocial || `Fornecedor ${s.id}`,
      }));
    },
    itemOptions() {
      return (this.items || []).map((i) => ({
        id: i.itemId ?? i.id,
        label: i.name || i.itemName || i.itemCode || `#${i.itemId ?? i.id}`,
      }));
    },
    canAddPick() {
      const id = this.pick?.itemId;
      const qtd = Number(this.pick?.qtd ?? 0);
      if (!id) return false;
      if (!Number.isFinite(qtd) || !Number.isInteger(qtd) || qtd < 1) return false;
      const base = (this.items || []).find((x) => (x.itemId ?? x.id) === id);
      return Boolean(base);
    },

    canSubmit() {
      return Boolean(
        this.form.supplierId && Array.isArray(this.form.items) && this.form.items.length > 0,
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
    'sidebar.isOpen'(open) {
      if (!open) setTimeout(() => this.reset(), 150);
    },
    'sidebar.payload': {
      deep: true,
      async handler(val) {
        if (!this.sidebar.isOpen) return;
        await this.loadOrderDetails(val);
      },
    },
  },
  methods: {
    normalizeStatusKey(s) {
      return typeof s === 'string' && this.ORDER_STATUS[s.toUpperCase()]
        ? s.toUpperCase()
        : 'PENDING';
    },
    statusLabel(s) {
      const key = this.normalizeStatusKey(s);
      return this.ORDER_STATUS[key]?.label || '—';
    },
    isOptionDisabled(target) {
      if (this.isTerminalStatus) return true;
      if (target === this.currentStatus) return false;
      return !this.statusMeta.next.includes(target);
    },
    async handleStatusToggle(newVal) {
      if (!newVal || newVal === this.currentStatus) return;
      if (newVal === 'CANCELLED') {
        this.pendingNewStatus = newVal;
        this.confirmCancel = true;
        return;
      }
      if (newVal === 'COMPLETED') {
        this.pendingNewStatus = newVal;
        this.completeDialog = true;
        return;
      }
      await this.changeStatus(newVal);
    },
    async confirmCancelAction() {
      if (!this.pendingNewStatus) return;
      await this.changeStatus(this.pendingNewStatus);
      this.confirmCancel = false;
      this.pendingNewStatus = null;
    },
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
      this.orderDetails = null;
      this.orderItems = [];
      this.supplierNames = [];
      this.selectedStatus = null;
      this.confirmCancel = false;
      this.completeDialog = false;
      this.pendingNewStatus = null;
      this.snack = { show: false, color: 'success', text: '' };
      this.form = { supplierId: null, items: [] };
      this.pick = { itemId: null, qtd: 1 };
      this.completeDate = null;
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
        const itemQuantities = {};
        for (const i of this.form.items) {
          itemQuantities[String(i.itemId)] = Math.round(Number(i.qtd));
        }
        const payload = { itemQuantities, supplierId: this.form.supplierId };
        await this.ordersStore.create(payload);
        this.snack = {
          show: true,
          color: 'success',
          text: 'Pedido criado com sucesso!',
        };
        this.$emit('created', { created: true });
        this.sidebar.close();
        this.reset();
      } catch (e) {
        this.error = this.isEdit ? 'Falha ao atualizar pedido' : 'Falha ao salvar pedido';
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    async changeStatus(status, withdrawDay = null) {
      if (!this.orderDetails?.id) return;
      try {
        switch (status) {
          case 'APPROVED':
            await this.ordersStore.approve(this.orderDetails.id, status);
            break;
          case 'PROCESSING':
            await this.ordersStore.process(this.orderDetails.id, status);
            break;
          case 'CANCELLED':
            await this.ordersStore.cancel(this.orderDetails.id, status);
            break;
          case 'COMPLETED':
            // recebe um Date (ou null) e repassa ao store; o store serializa para LocalDateTime
            await this.ordersStore.complete(this.orderDetails.id, withdrawDay ?? new Date());
            break;
          default:
            return;
        }
        this.$emit('created', { created: true });
        this.sidebar.close();
      } catch (e) {
        this.error = 'Falha ao atualizar status do pedido';
        console.error(e);
      }
    },
    async confirmCompleteAction() {
      const dt = this.completeDate ? new Date(`${this.completeDate}T00:00:00`) : new Date();
      this.loading = true;
      try {
        await this.changeStatus('COMPLETED', dt);
        this.completeDialog = false;
      } finally {
        this.loading = false;
        this.pendingNewStatus = null;
      }
    },
    async statusChange(value) {
      await this.changeStatus(value);
    },
    async loadOrderDetails(val) {
      if (val?.mode === 'view' && val.orderId != null) {
        try {
          this.loading = true;
          const data = await this.ordersStore.getById(val.orderId);
          this.orderDetails = data || null;
          this.orderItems = await this.ordersStore.getItemsByOrderId(val.orderId);

          const supplierIds = Array.isArray(this.orderDetails?.supplierIds)
            ? this.orderDetails.supplierIds
            : [];
          this.supplierNames = await Promise.all(
            supplierIds.map(async (sid) => {
              try {
                const s = await this.supplierStore.getById(sid);
                if (s && typeof s === 'object') {
                  if (s.name && String(s.name).trim()) return String(s.name);
                  if (s.nomeFantasia && String(s.nomeFantasia).trim())
                    return String(s.nomeFantasia);
                  if (s.razaoSocial && String(s.razaoSocial).trim()) return String(s.razaoSocial);
                }
                return `Fornecedor não encontrado (ID ${sid})`;
              } catch {
                return `Fornecedor não encontrado (ID ${sid})`;
              }
            }),
          );

          const cur = this.currentStatus;
          const exists = this.statusOptions.some((o) => o.value === cur);
          this.selectedStatus = exists ? cur : null;
        } catch (e) {
          this.orderDetails = null;
          this.orderItems = [];
          this.supplierNames = [];
          this.selectedStatus = null;
        } finally {
          this.loading = false;
        }
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
