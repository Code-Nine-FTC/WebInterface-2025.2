<template>
  <v-navigation-drawer v-model="isOpen" location="right" temporary width="680">
    <v-toolbar flat density="comfortable">
      <v-toolbar-title>{{ isEdit ? 'Editar Item' : 'Detalhes do Item' }}</v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" :disabled="loading" @click="closeAndReset" />
    </v-toolbar>
    <v-divider />

    <v-form ref="formRef" v-model="formValid" class="pa-4" @submit.prevent="submit">
      <v-alert v-if="loading" type="info" variant="tonal" class="mb-3">
        Carregando dados do item...
      </v-alert>
      <v-row dense>
        <v-col cols="12" md="8">
          <v-text-field
            v-model="form.name"
            :rules="[rules.required]"
            label="Nome"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model.number="form.currentStock"
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
            :rules="[rules.int]"
            label="Estoque Atual"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="form.measure"
            :rules="[rules.required]"
            label="Unidade"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="8">
          <v-text-field
            v-model="expireDateInput"
            type="datetime-local"
            label="Validade"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-calendar"
            :hint="'aaaa-mm-dd hh:mm'"
            persistent-hint
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="form.minimumStock"
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
            :rules="[rules.nonneg]"
            label="Stock Mínimo"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model.number="form.supplierId"
            :items="supplierOptions"
            :loading="suppliersLoading"
            item-title="label"
            item-value="id"
            clearable
            label="Fornecedor"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model.number="form.itemTypeId"
            :items="typeOptions"
            :loading="typesLoading"
            item-title="label"
            item-value="id"
            clearable
            label="Tipo de Item"
            variant="outlined"
            density="comfortable"
          />
        </v-col>

        <v-col cols="12" class="d-flex justify-end ga-2 mt-4">
          <v-btn type="button" variant="text" :disabled="loading" @click="reset">Limpar</v-btn>
          <v-btn v-if="isEdit" type="submit" color="primary" :loading="loading">Salvar</v-btn>
        </v-col>
      </v-row>
      <v-alert v-if="error" type="error" variant="tonal" class="mt-2">{{ error }}</v-alert>
      <v-snackbar v-model="snack.show" :color="snack.color" timeout="2500">
        {{ snack.text }}
      </v-snackbar>

      <v-divider class="my-4" />

      <div v-if="isEdit && itemId" class="mt-2">
        <div class="d-flex align-center mb-2">
          <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
          <span class="text-subtitle-2 font-semibold">Lotes</span>
          <v-spacer />
          <v-btn
            size="x-small"
            variant="tonal"
            color="primary"
            :loading="lotsLoading"
            @click="reloadLots"
          >
            Recarregar
          </v-btn>
        </div>

        <v-card variant="flat" class="pa-3 mb-3 bg-slate-50">
          <div class="text-caption text-medium-emphasis mb-2">Adicionar Lote</div>
          <v-row dense class="ga-2 align-end">
            <v-col cols="12" md="5">
              <v-text-field
                v-model="newLot.code"
                label="Código"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="newLot.expireDate"
                type="date"
                label="Validade (opcional)"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model.number="newLot.quantity"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                :rules="[rules.nonneg, rules.int]"
                label="Qtd"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" md="3" class="d-flex align-end justify-end">
              <v-btn
                color="primary"
                class="btn-add-lot"
                height="40"
                :loading="creatingLot"
                prepend-icon="mdi-plus"
                @click="handleCreateLot"
              >
                Adicionar
              </v-btn>
            </v-col>
          </v-row>
          <v-alert v-if="lotError" type="error" variant="tonal" class="mt-2">
            {{ lotError }}
          </v-alert>
          <v-snackbar v-model="lotSnack.show" :color="lotSnack.color" timeout="2500">
            {{ lotSnack.text }}
          </v-snackbar>
        </v-card>

        <v-card variant="flat" class="pa-0">
          <v-table density="comfortable" class="table-flat">
            <thead>
              <tr>
                <th class="text-left">Código</th>
                <th class="text-left">Validade</th>
                <th class="text-left">Quantidade</th>
                <th class="text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="lotsLoading">
                <td colspan="4" class="py-4 text-center text-medium-emphasis">
                  Carregando lotes...
                </td>
              </tr>
              <tr v-else-if="!lots.length">
                <td colspan="4" class="py-4 text-center text-medium-emphasis">
                  Nenhum lote para este item.
                </td>
              </tr>
              <tr v-else v-for="lot in lots" :key="lot.id">
                <td>{{ lot.code }}</td>
                <td>{{ formatDateShort(lot.expireDate) }}</td>
                <td>{{ lot.quantityOnHand }}</td>
                <td>
                  <div class="lot-actions d-flex align-center">
                    <v-btn
                      size="x-small"
                      icon="mdi-plus"
                      variant="tonal"
                      color="green"
                      :loading="adjustingId === lot.id"
                      @click="adjust(lot.id, +1)"
                    />
                    <v-btn
                      size="x-small"
                      icon="mdi-minus"
                      variant="tonal"
                      color="red"
                      :loading="adjustingId === lot.id"
                      @click="adjust(lot.id, -1)"
                    />
                    <v-text-field
                      class="lot-delta"
                      v-model.number="customDelta[lot.id]"
                      type="number"
                      density="compact"
                      variant="outlined"
                      hide-details
                      placeholder="±0"
                    />
                    <v-btn
                      size="small"
                      variant="tonal"
                      :loading="adjustingId === lot.id"
                      @click="adjust(lot.id, Number(customDelta[lot.id] || 0))"
                    >
                      Ajustar
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </div>
    </v-form>
  </v-navigation-drawer>
</template>

<script>
import { useSidebarStore } from '~/stores/sidebar';
import { useStorage } from '~/stores/storage';
import { useSupplier } from '~/stores/supplier';
import { useTypeItem } from '~/stores/typeItem';
import { useLotService } from '~/services/lot';

export default {
  name: 'StorageItemSidebar',
  emits: ['updated'],
  data() {
    return {
      sidebar: null,
      storage: null,
      supplierStore: null,
      typeItemStore: null,
      loading: false,
      formValid: true,
      error: null,
      snack: { show: false, color: 'success', text: '' },
      suppliersLoading: false,
      typesLoading: false,
      suppliers: [],
      types: [],
      form: {
        id: null,
        name: '',
        currentStock: 0,
        measure: '',
        expireDate: '',
        supplierId: null,
        itemTypeId: null,
        minimumStock: 0,
        isActive: true,
      },
      rules: {
        required: (v) => !!v || v === 0 || 'Obrigatório',
        int: (v) => (Number.isInteger(Number(v)) && Number(v) >= 0) || 'Número inteiro',
        nonneg: (v) => Number(v) >= 0 || 'Número inválido',
      },
      // lots
      lots: [],
      lotsLoading: false,
      creatingLot: false,
      adjustingId: null,
      newLot: { code: '', expireDate: '', quantity: 0 },
      customDelta: {},
      lotError: null,
      lotSnack: { show: false, color: 'success', text: '' },
    };
  },
  computed: {
    isOpen: {
      get() {
        return this.sidebar?.isOpen && this.sidebar?.payload?.mode === 'edit-item';
      },
      set(value) {
        if (!value) this.sidebar?.close();
      },
    },
    isEdit() {
      return this.sidebar?.payload?.mode === 'edit-item';
    },
    itemId() {
      return this.sidebar?.payload?.itemId ?? null;
    },
    expireDateInput: {
      get() {
        const v = this.form?.expireDate;
        if (!v) return '';
        const d = new Date(v);
        if (isNaN(d.getTime())) return String(v);
        const pad = (n) => String(n).padStart(2, '0');
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
      },
      set(val) {
        this.form.expireDate = val || '';
      },
    },
    supplierOptions() {
      return (this.suppliers || [])
        .filter((s) => (s.name || s.nomeFantasia || '') !== 'Usuario de Migração')
        .map((s) => ({
          id: Number(s.id),
          label: s.name || s.nomeFantasia || s.razaoSocial || `#${s.id}`,
        }));
    },
    typeOptions() {
      return (this.types || []).map((t) => ({
        id: Number(t.id ?? t.itemTypeId),
        label: t.name || t.title || `#${t.id ?? t.itemTypeId}`,
      }));
    },
  },
  created() {
    this.sidebar = useSidebarStore();
    this.storage = useStorage();
    this.supplierStore = useSupplier();
    this.typeItemStore = useTypeItem();
    this.lotService = useLotService();
  },
  watch: {
    isOpen(open) {
      if (!open) setTimeout(() => this.reset(), 150);
    },
    'sidebar.payload': {
      deep: true,
      async handler(val) {
        if (val?.mode === 'edit-item' && val.itemId != null) {
          try {
            this.loading = true;
            // carrega opções
            await this.fetchSuppliers();
            await this.fetchTypes();
            const data = await this.storage.getById(val.itemId);
            if (data) {
              const id = data.itemId ?? data.id ?? val.itemId;
              this.form = {
                id,
                name: data.name ?? '',
                currentStock: data.currentStock ?? 0,
                measure: data.measure ?? '',
                expireDate: data.expireDate ?? '',
                supplierId: data.supplierId != null ? Number(data.supplierId) : null,
                itemTypeId: data.itemTypeId != null ? Number(data.itemTypeId) : null,
                minimumStock: data.minimumStock ?? 0,
                isActive: data.isActive ?? data.active ?? true,
              };
              await this.reloadLots();
            }
          } catch (e) {
            console.error(e);
          } finally {
            this.loading = false;
          }
        }
      },
    },
  },
  methods: {
    async fetchSuppliers() {
      this.suppliersLoading = true;
      try {
        this.suppliers = (await this.supplierStore.list()) || [];
      } catch {
        this.suppliers = [];
      } finally {
        this.suppliersLoading = false;
      }
    },
    async fetchTypes() {
      this.typesLoading = true;
      try {
        this.types = (await this.typeItemStore.list()) || [];
      } catch {
        this.types = [];
      } finally {
        this.typesLoading = false;
      }
    },
    closeAndReset() {
      this.sidebar.close();
      this.reset();
    },
    reset() {
      this.error = null;
      this.form = {
        id: null,
        name: '',
        currentStock: 0,
        measure: '',
        expireDate: '',
        supplierId: null,
        itemTypeId: null,
        minimumStock: 0,
        isActive: true,
      };
      this.lots = [];
      this.newLot = { code: '', expireDate: '', quantity: 0 };
      this.customDelta = {};
      this.lotError = null;
      if (this.$refs.formRef) this.$refs.formRef.resetValidation();
    },
    async reloadLots() {
      if (!this.itemId) return;
      this.lotsLoading = true;
      try {
        this.lots = await this.lotService.listLots(Number(this.itemId));
      } catch (e) {
        console.error(e);
        this.lots = [];
      } finally {
        this.lotsLoading = false;
      }
    },
    async handleCreateLot() {
      this.lotError = null;
      if (!this.itemId) return;
      const code = (this.newLot.code || '').trim();
      const quantity = Number(this.newLot.quantity);
      if (!code) {
        this.lotError = 'Código é obrigatório';
        return;
      }
      if (!Number.isInteger(quantity) || quantity < 0) {
        this.lotError = 'Quantidade deve ser inteiro >= 0';
        return;
      }
      const payload = {
        itemId: Number(this.itemId),
        code,
        quantity,
      };
      if (this.newLot.expireDate) payload.expireDate = this.newLot.expireDate;
      this.creatingLot = true;
      try {
        await this.lotService.createLot(payload);
        this.lotSnack = { show: true, color: 'success', text: 'Lote criado com sucesso' };
        this.newLot = { code: '', expireDate: '', quantity: 0 };
        await this.reloadLots();
        // re-fetch item to update currentStock
        const data = await this.storage.getById(this.itemId);
        if (data) this.form.currentStock = data.currentStock ?? this.form.currentStock;
        this.$emit('updated', { id: this.itemId });
      } catch (e) {
        console.error(e);
        this.lotError = 'Falha ao criar lote';
      } finally {
        this.creatingLot = false;
      }
    },
    async adjust(lotId, delta) {
      this.lotError = null;
      if (!Number.isFinite(delta) || delta === 0) return;
      this.adjustingId = lotId;
      try {
        await this.lotService.adjustLot(Number(lotId), Number(delta));
        this.lotSnack = {
          show: true,
          color: delta > 0 ? 'green' : 'orange',
          text: 'Ajuste aplicado',
        };
        await this.reloadLots();
        const data = await this.storage.getById(this.itemId);
        if (data) this.form.currentStock = data.currentStock ?? this.form.currentStock;
        this.$emit('updated', { id: this.itemId });
      } catch (e) {
        console.error(e);
        this.lotError = 'Falha ao ajustar lote';
      } finally {
        this.adjustingId = null;
      }
    },
    formatDateShort(val) {
      if (!val) return '—';
      try {
        const d = new Date(val);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch {
        return String(val);
      }
    },
    async submit() {
      if (!this.isEdit || !this.form.id) return;
      if (this.$refs.formRef) {
        const ok = await this.$refs.formRef.validate();
        if (!ok.valid) return;
      }
      this.loading = true;
      try {
        const payload = {
          name: this.form.name,
          currentStock: Number(this.form.currentStock),
          measure: this.form.measure,
          expireDate: this.form.expireDate || null,
          supplierId: this.form.supplierId,
          itemTypeId: this.form.itemTypeId,
          minimumStock: Number(this.form.minimumStock),
          isActive: !!this.form.isActive,
        };
        const res = await this.storage.updateItem(this.form.id, payload);
        this.snack = {
          show: true,
          color: 'success',
          text: 'Item atualizado com sucesso',
        };
        this.$emit('updated', { id: this.form.id, ...payload });
        this.sidebar.close();
        this.reset();
      } catch (e) {
        this.error = 'Falha ao atualizar item';
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.btn-add-lot {
  width: 100%;
  min-width: 160px;
}
@media (min-width: 960px) {
  .btn-add-lot {
    width: auto;
  }
}
.lot-actions {
  gap: 10px;
  flex-wrap: wrap;
}
.lot-actions .v-btn {
  margin: 2px 0;
}
.lot-delta {
  max-width: 110px;
}
</style>
