<template>
  <v-navigation-drawer v-model="sidebar.isOpen" location="right" temporary width="680">
    <v-toolbar flat density="comfortable">
      <v-toolbar-title>{{ isEdit ? 'Editar Item' : 'Detalhes do Item' }}</v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" :disabled="loading" @click="closeAndReset" />
    </v-toolbar>
    <v-divider />

    <v-form ref="formRef" v-model="formValid" class="pa-4" @submit.prevent="submit">
      <v-alert v-if="loading" type="info" variant="tonal" class="mb-3">Carregando dados do item...</v-alert>
      <v-row dense>
        <v-col cols="12" md="8">
          <v-text-field v-model="form.name" :rules="[rules.required]" label="Nome" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model.number="form.currentStock" type="number" min="0" step="1" inputmode="numeric" :rules="[rules.int]" label="Estoque Atual" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="form.measure" :rules="[rules.required]" label="Unidade" variant="outlined" density="comfortable" />
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
          <v-text-field v-model.number="form.minimumStock" type="number" min="0" step="1" inputmode="numeric" :rules="[rules.nonneg]" label="Stock Mínimo" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field v-model.number="form.maximumStock" type="number" min="0" step="1" inputmode="numeric" :rules="[rules.nonneg]" label="Stock Máximo" variant="outlined" density="comfortable" />
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
        <v-col cols="12">
          <v-switch v-model="form.isActive" color="green" inset label="Ativo" />
        </v-col>

        <v-col cols="12" class="d-flex justify-end ga-2 mt-4">
          <v-btn type="button" variant="text" :disabled="loading" @click="reset">Limpar</v-btn>
          <v-btn v-if="isEdit" type="submit" color="primary" :loading="loading">Salvar</v-btn>
        </v-col>
      </v-row>
      <v-alert v-if="error" type="error" variant="tonal" class="mt-2">{{ error }}</v-alert>
      <v-snackbar v-model="snack.show" :color="snack.color" timeout="2500">{{ snack.text }}</v-snackbar>
    </v-form>
  </v-navigation-drawer>
</template>

<script>
import { useSidebarStore } from "~/stores/sidebar";
import { useStorage } from "~/stores/storage";
import { useSupplier } from "~/stores/supplier";
import { useTypeItem } from "~/stores/typeItem";

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
        maximumStock: 0,
        isActive: true,
      },
      rules: {
        required: v => !!v || v === 0 || 'Obrigatório',
        int: v => Number.isInteger(Number(v)) && Number(v) >= 0 || 'Número inteiro',
        nonneg: v => Number(v) >= 0 || 'Número inválido',
      }
    }
  },
  computed: {
    isEdit() { return this.sidebar?.payload?.mode === 'edit-item' },
    itemId() { return this.sidebar?.payload?.itemId ?? null },
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
      }
    },
    supplierOptions() {
      return (this.suppliers || [])
        .filter(s => (s.name || s.nomeFantasia || '') !== 'Usuario de Migração')
        .map(s => ({ id: Number(s.id), label: s.name || s.nomeFantasia || s.razaoSocial || `#${s.id}` }));
    },
    typeOptions() {
      return (this.types || []).map(t => ({ id: Number(t.id ?? t.itemTypeId), label: t.name || t.title || `#${t.id ?? t.itemTypeId}` }));
    },
  },
  created() {
    this.sidebar = useSidebarStore();
    this.storage = useStorage();
    this.supplierStore = useSupplier();
    this.typeItemStore = useTypeItem();
  },
  watch: {
    'sidebar.isOpen'(open) {
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
                maximumStock: data.maximumStock ?? 0,
                isActive: data.isActive ?? data.active ?? true,
              };
            }
          } catch (e) {
            console.error(e);
          } finally {
            this.loading = false;
          }
        }
      }
    }
  },
  methods: {
    async fetchSuppliers() {
      this.suppliersLoading = true;
      try {
        this.suppliers = (await this.supplierStore.list()) || [];
      } catch { this.suppliers = []; }
      finally { this.suppliersLoading = false; }
    },
    async fetchTypes() {
      this.typesLoading = true;
      try {
        this.types = (await this.typeItemStore.list()) || [];
      } catch { this.types = []; }
      finally { this.typesLoading = false; }
    },
    closeAndReset() { this.sidebar.close(); this.reset(); },
    reset() {
      this.error = null;
      this.form = { id: null, name: '', currentStock: 0, measure: '', expireDate: '', supplierId: null, itemTypeId: null, minimumStock: 0, maximumStock: 0, isActive: true };
      if (this.$refs.formRef) this.$refs.formRef.resetValidation();
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
          maximumStock: Number(this.form.maximumStock),
          isActive: !!this.form.isActive,
        };
        const res = await this.storage.updateItem(this.form.id, payload);
        this.snack = { show: true, color: 'success', text: 'Item atualizado com sucesso' };
        this.$emit('updated', { id: this.form.id, ...payload });
        this.sidebar.close();
        this.reset();
      } catch (e) {
        this.error = 'Falha ao atualizar item';
        console.error(e);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
</style>
