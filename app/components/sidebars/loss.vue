<template>
  <v-navigation-drawer v-model="isOpen" location="right" temporary width="680">
    <v-toolbar flat density="comfortable">
      <v-toolbar-title>Registrar Perda de Item</v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" :disabled="loading" @click="closeAndReset" />
    </v-toolbar>
    <v-divider />

    <v-form ref="formRef" v-model="formValid" class="pa-4" @submit.prevent="submit">
      <v-row dense>
        <!-- Nome do Item (somente leitura) -->
        <v-col cols="12">
          <v-text-field
            v-model="itemName"
            label="Item"
            variant="outlined"
            density="comfortable"
            readonly
            disabled
            prepend-inner-icon="mdi-package-variant"
          />
        </v-col>

        <!-- Quantidade Perdida -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="form.lostQuantity"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            :rules="[rules.required, rules.positiveInt]"
            label="Quantidade Perdida"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-minus-circle"
            hint="Deve ser maior que zero"
            persistent-hint
          />
        </v-col>

        <!-- Estoque Atual (apenas informativo) -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="currentStock"
            label="Estoque Atual"
            variant="outlined"
            density="comfortable"
            readonly
            disabled
            prepend-inner-icon="mdi-warehouse"
          />
        </v-col>

        <!-- Motivo -->
        <v-col cols="12">
          <v-textarea
            v-model="form.reason"
            :rules="[rules.required, rules.notEmpty]"
            label="Motivo da Perda"
            variant="outlined"
            density="comfortable"
            rows="4"
            prepend-inner-icon="mdi-text"
            hint="Descreva o motivo da perda do item"
            persistent-hint
            counter
          />
        </v-col>

        <!-- Botões de ação -->
        <v-col cols="12" class="d-flex justify-end ga-2 mt-4">
          <v-btn type="button" variant="text" :disabled="loading" @click="reset">Limpar</v-btn>
          <v-btn type="submit" color="error" :loading="loading">
            <v-icon left class="mr-2">mdi-alert-circle</v-icon>
            Registrar Perda
          </v-btn>
        </v-col>
      </v-row>

      <!-- Mensagem de erro -->
      <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
        {{ error }}
      </v-alert>

      <!-- Snackbar de sucesso -->
      <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000">
        <div class="d-flex align-center">
          <v-icon class="mr-2">{{ snack.icon }}</v-icon>
          {{ snack.text }}
        </div>
      </v-snackbar>
    </v-form>
  </v-navigation-drawer>
</template>

<script>
import { useSidebarStore } from '~/stores/sidebar';
import { useItemLoss } from '~/stores/itemLoss';
import { useAuthStore } from '~/stores/auth';

export default {
  name: 'LossSidebar',
  emits: ['loss-registered'],
  data() {
    return {
      sidebar: null,
      itemLossStore: null,
      auth: null,
      loading: false,
      formValid: true,
      error: null,
      snack: {
        show: false,
        color: 'success',
        text: '',
        icon: 'mdi-check-circle',
      },
      form: {
        lostQuantity: null,
        reason: '',
      },
      rules: {
        required: (v) => {
          if (v === null || v === undefined || v === '') return 'Obrigatório';
          return true;
        },
        positiveInt: (v) => {
          const num = Number(v);
          if (!Number.isInteger(num)) return 'Deve ser um número inteiro';
          if (num <= 0) return 'Deve ser maior que zero';
          return true;
        },
        notEmpty: (v) => {
          if (typeof v !== 'string') return 'Obrigatório';
          if (v.trim() === '') return 'Motivo não pode ser vazio';
          return true;
        },
      },
    };
  },
  computed: {
    isOpen: {
      get() {
        return this.sidebar?.isOpen && this.sidebar?.payload?.mode === 'loss';
      },
      set(value) {
        if (!value) this.sidebar?.close();
      },
    },
    isLossMode() {
      return this.sidebar?.payload?.mode === 'loss';
    },
    userId() {
      return this.auth?.user?.id;
    },
    item() {
      return this.sidebar?.payload?.item || null;
    },
    itemId() {
      return this.item?.itemId || this.item?.id || null;
    },
    itemName() {
      return this.item?.name || '—';
    },
    currentStock() {
      const stock = this.item?.currentStock;
      if (stock === null || stock === undefined) return '—';
      return String(stock);
    },
  },
  created() {
    this.sidebar = useSidebarStore();
    this.itemLossStore = useItemLoss();
    this.auth = useAuthStore();
  },
  watch: {
    isOpen(open) {
      if (!open) {
        setTimeout(() => this.reset(), 150);
      }
    },
    'sidebar.payload': {
      deep: true,
      handler(val) {
        if (val?.mode === 'loss' && val?.item) {
          // Pré-preenche os dados se necessário
          this.error = null;
        }
      },
    },
  },
  methods: {
    closeAndReset() {
      this.sidebar.close();
      this.reset();
    },
    reset() {
      this.error = null;
      this.form = {
        lostQuantity: null,
        reason: '',
      };
      if (this.$refs.formRef) {
        this.$refs.formRef.resetValidation();
      }
    },
    async submit() {
      if (!this.isLossMode || !this.itemId) {
        this.error = 'Item não identificado';
        return;
      }

      // Valida o formulário
      if (this.$refs.formRef) {
        const validation = await this.$refs.formRef.validate();
        if (!validation.valid) return;
      }

      this.loading = true;
      this.error = null;

      try {
        const recordedById = this.userId || 1;

        const payload = {
          lostQuantity: Number(this.form.lostQuantity),
          reason: this.form.reason.trim(),
          recordedById: recordedById,
        };

        await this.itemLossStore.registerLoss(this.itemId, payload);

        // Sucesso!
        this.snack = {
          show: true,
          color: 'success',
          text: 'Perda registrada com sucesso!',
          icon: 'mdi-check-circle',
        };

        // Emite evento para atualizar a tabela
        this.$emit('loss-registered', {
          itemId: this.itemId,
          ...payload,
        });

        // Fecha a sidebar após um breve delay
        setTimeout(() => {
          this.sidebar.close();
          this.reset();
        }, 500);
      } catch (e) {
        console.error('Erro ao registrar perda:', e);

        // Trata erros específicos
        if (e?.response?.status === 422) {
          this.error = e?.response?.data?.message || 'Quantidade excede o estoque disponível!';
        } else if (e?.response?.status === 404) {
          this.error = 'Item não encontrado';
        } else if (e?.data?.message) {
          this.error = e.data.message;
        } else if (e?.message) {
          this.error = e.message;
        } else {
          this.error = 'Falha ao registrar perda. Tente novamente.';
        }

        this.snack = {
          show: true,
          color: 'error',
          text: this.error,
          icon: 'mdi-alert-circle',
        };
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
