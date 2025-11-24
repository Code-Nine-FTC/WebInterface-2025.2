<template>
  <v-navigation-drawer v-model="sidebar.isOpen" location="right" temporary width="720">
    <v-toolbar flat density="comfortable">
      <v-toolbar-title>
        {{
          isAuthorizeEmail
            ? 'Autorizar Envio de E-mail'
            : isEdit
              ? 'Editar Ordem de Compra'
              : isView
                ? 'Visualizar Ordem de Compra'
                : 'Cadastrar Ordem de Compra'
        }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" :disabled="loading" @click="closeAndReset" />
    </v-toolbar>
    <v-divider />
    <!-- Formulário de Autorização de E-mail -->
    <v-form
      v-if="isAuthorizeEmail"
      ref="authorizeFormRef"
      v-model="authorizeFormValid"
      class="pa-4"
      @submit.prevent="submitAuthorize"
    >
      <v-row dense>
        <v-col cols="12">
          <v-alert type="info" variant="tonal" density="comfortable" class="mb-4">
            <div class="text-body-2">
              <strong>ID da OC:</strong>
              #{{ orderDetails?.id || 'Carregando...' }}
            </div>
            <div class="text-body-2 mt-1">
              <strong>Nº OC:</strong>
              {{ orderDetails?.purchaseOrderNumber || '—' }}
            </div>
            <div class="text-body-2 mt-1">
              <strong>Nº NE:</strong>
              {{ orderDetails?.commitmentNoteNumber || '—' }}
            </div>
            <div class="text-body-2 mt-1">
              <strong>Fornecedor:</strong>
              {{ orderDetails?.supplierCompanyName || '—' }}
            </div>
            <div class="text-body-2 mt-1">
              <strong>E-mail:</strong>
              {{ orderDetails?.supplierCompanyEmail || '—' }}
            </div>
            <div class="text-body-2 mt-1">
              <strong>Valor:</strong>
              {{ formatCurrencyDisplay(orderDetails?.totalValue) }}
            </div>
          </v-alert>
        </v-col>
        <v-col cols="12">
          <v-file-input
            v-model="attachments"
            label="Anexar Arquivos (opcional)"
            multiple
            chips
            prepend-icon="mdi-paperclip"
            hint="Selecione um ou mais arquivos para anexar ao e-mail"
            persistent-hint
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12">
          <v-alert
            v-if="authorizeError"
            type="error"
            variant="tonal"
            density="comfortable"
            class="mb-2"
          >
            {{ authorizeError }}
          </v-alert>
        </v-col>
        <v-col cols="12" class="d-flex justify-end ga-2 mt-4">
          <v-btn type="button" variant="text" :disabled="loading" @click="closeAndReset">
            Cancelar
          </v-btn>
          <v-btn type="submit" color="primary" :loading="loading" prepend-icon="mdi-send">
            Autorizar e Enviar E-mail
          </v-btn>
        </v-col>
      </v-row>
    </v-form>

    <!-- Formulário de Cadastro/Edição -->
    <v-form v-else ref="formRef" v-model="formValid" class="pa-4" @submit.prevent="submit">
      <v-row dense>
        <v-col v-if="isEdit && form.purchaseOrderNumber" cols="12">
          <v-alert type="info" variant="tonal" density="compact" class="mb-2">
            <strong>Nº da Ordem de Compra:</strong>
            {{ form.purchaseOrderNumber }}
          </v-alert>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.commitmentNoteNumber"
            label="Nº da NE"
            :rules="[rules.required]"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.issuingBody"
            label="Órgão Emissor"
            :rules="[rules.required]"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.year"
            label="Ano"
            type="number"
            :rules="[rules.required]"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.processNumber"
            label="Processo"
            :rules="[rules.required]"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="form.supplierCompanyId"
            :items="supplierOptions"
            item-title="name"
            item-value="id"
            label="Fornecedor"
            :rules="[rules.required]"
            hide-details="auto"
            :loading="suppliersLoading"
            return-object="false"
            @update:modelValue="
              (val) =>
                (form.supplierCompanyId = typeof val === 'object' && val !== null ? val.id : val)
            "
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="displayValue"
            label="Valor"
            :rules="[rules.required]"
            hide-details="auto"
            prefix="R$"
            placeholder="0,00"
            @blur="formatValueOnBlur"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.issueDate"
            label="Data de Emissão"
            type="date"
            :rules="[rules.required]"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="form.status"
            :items="deliveryStatusOptions"
            label="Status da Entrega"
            :rules="[rules.required]"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="form.emailStatus"
            :items="emailStatusOptions"
            label="Status do E-mail"
            :rules="[rules.required]"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12">
          <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mb-2">
            {{ error }}
          </v-alert>
        </v-col>
        <v-col cols="12" class="d-flex justify-end ga-2 mt-4">
          <v-btn type="button" variant="text" :disabled="loading" @click="reset">Limpar</v-btn>
          <v-btn
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="!formValid || !canSubmit"
          >
            {{ isEdit ? 'Salvar Alterações' : 'Salvar' }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-navigation-drawer>
</template>

<script>
import { useSidebarStore } from '~/stores/sidebar';
import { usePurchaseOrder } from '~/stores/purchaseOrder';

export default {
  name: 'PurchaseOrderSidebar',
  emits: ['created', 'updated'],
  data() {
    return {
      sidebar: null,
      purchaseOrderStore: null,
      loading: false,
      formValid: true,
      error: null,
      form: {
        purchaseOrderNumber: '',
        commitmentNoteNumber: '',
        issuingBody: '',
        year: '',
        processNumber: '',
        totalValue: '',
        issueDate: '',
        supplierCompanyId: null,
        status: '',
        emailStatus: '',
      },
      displayValue: '',
      suppliers: [],
      suppliersLoading: false,
      authorizeFormValid: true,
      authorizeError: null,
      attachments: [],
      orderDetails: null,
      rules: {
        required: (v) => !!v || v === 0 || 'Obrigatório',
      },
      deliveryStatusOptions: [
        { value: 'PENDING_DELIVERY', title: 'Pendente' },
        { value: 'DELIVERY', title: 'Entregue' },
        { value: 'LATE', title: 'Atrasado' },
        { value: 'CANCELLED', title: 'Cancelado' },
      ],
      emailStatusOptions: [
        { value: 'NOT_SENT', title: 'Não enviado' },
        { value: 'SENT', title: 'Enviado' },
        { value: 'REMINDER_SENT', title: 'Lembrete enviado' },
      ],
    };
  },
  computed: {
    isEdit() {
      return this.sidebar?.payload?.mode === 'edit';
    },
    isView() {
      return this.sidebar?.payload?.mode === 'view';
    },
    isAuthorizeEmail() {
      return this.sidebar?.payload?.mode === 'authorize-email';
    },
    supplierOptions() {
      return this.suppliers.map((s) => ({
        id: s.id,
        name: s.name || s.razaoSocial || s.nomeFantasia || `#${s.id}`,
      }));
    },
    canSubmit() {
      return Boolean(
        this.form.commitmentNoteNumber &&
          this.form.issuingBody &&
          this.form.year &&
          this.form.processNumber &&
          this.form.totalValue &&
          this.form.issueDate &&
          this.form.supplierCompanyId,
      );
    },
  },
  async created() {
    this.sidebar = useSidebarStore();
    this.purchaseOrderStore = usePurchaseOrder();
    const { useSupplier } = await import('~/stores/supplier');
    this.supplierStore = useSupplier();
    await this.fetchSuppliers();
    if (this.isEdit && this.sidebar.payload?.purchaseOrderId) {
      await this.loadOrderDetails(this.sidebar.payload.purchaseOrderId);
    }
    if (this.isAuthorizeEmail && this.sidebar.payload?.purchaseOrderId) {
      await this.loadOrderDetailsForAuthorize(this.sidebar.payload.purchaseOrderId);
    }
  },
  watch: {
    displayValue(newVal, oldVal) {
      if (newVal === oldVal) return;

      let onlyNumbers = (newVal || '').replace(/\D/g, '');

      if (!onlyNumbers) {
        this.form.totalValue = '';
        if (newVal !== '') {
          this.$nextTick(() => {
            this.displayValue = '';
          });
        }
        return;
      }

      onlyNumbers = onlyNumbers.replace(/^0+/, '') || '0';

      const length = onlyNumbers.length;
      let formatted = '';

      if (length === 1) {
        formatted = '0,0' + onlyNumbers;
      } else if (length === 2) {
        formatted = '0,' + onlyNumbers;
      } else {
        const reais = onlyNumbers.slice(0, -2);
        const centavos = onlyNumbers.slice(-2);
        const reaisFormatted = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        formatted = reaisFormatted + ',' + centavos;
      }

      if (formatted !== newVal) {
        this.$nextTick(() => {
          this.displayValue = formatted;
        });
      }

      const num = parseFloat(onlyNumbers) / 100;
      this.form.totalValue = isNaN(num) ? '' : num;
    },
    'sidebar.payload': {
      deep: true,
      async handler(val) {
        if (this.isEdit && val?.purchaseOrderId) {
          await this.loadOrderDetails(val.purchaseOrderId);
        } else if (this.isAuthorizeEmail && val?.purchaseOrderId) {
          await this.loadOrderDetailsForAuthorize(val.purchaseOrderId);
        } else if (val?.mode === 'create') {
          this.reset();
        }
      },
    },
    'sidebar.isOpen'(open) {
      if (!open) setTimeout(() => this.reset(), 150);
    },
  },
  methods: {
    formatCurrencyDisplay(value) {
      if (value === null || value === undefined || value === '') return 'R$ 0,00';
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) return 'R$ 0,00';
      return num.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
    },
    formatValueOnBlur() {
      if (
        this.form.totalValue !== null &&
        this.form.totalValue !== undefined &&
        this.form.totalValue !== ''
      ) {
        const num =
          typeof this.form.totalValue === 'string'
            ? parseFloat(this.form.totalValue)
            : this.form.totalValue;
        if (!isNaN(num)) {
          const cents = Math.round(num * 100).toString();
          const length = cents.length;

          if (length === 1) {
            this.displayValue = '0,0' + cents;
          } else if (length === 2) {
            this.displayValue = '0,' + cents;
          } else {
            const reais = cents.slice(0, -2);
            const centavos = cents.slice(-2);
            const reaisFormatted = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            this.displayValue = reaisFormatted + ',' + centavos;
          }
        }
      }
    },
    async fetchSuppliers() {
      this.suppliersLoading = true;
      try {
        this.suppliers = await this.supplierStore.list();
      } catch (e) {
        this.suppliers = [];
      } finally {
        this.suppliersLoading = false;
      }
    },
    async loadOrderDetails(id) {
      this.loading = true;
      try {
        const order = await this.purchaseOrderStore.getById(id);
        if (order) {
          this.form = {
            purchaseOrderNumber: order.purchaseOrderNumber || '',
            commitmentNoteNumber: order.commitmentNoteNumber || '',
            issuingBody: order.issuingBody || '',
            year: order.year || '',
            processNumber: order.processNumber || '',
            totalValue: order.totalValue || '',
            issueDate: (function (d) {
              if (!d) return '';
              try {
                const dt = new Date(d);
                if (isNaN(dt.getTime())) return '';
                return dt.toISOString().slice(0, 10);
              } catch (e) {
                return '';
              }
            })(order.issueDate),
            supplierCompanyId: order.supplierCompanyId || null,
            status: order.status || '',
            emailStatus: order.emailStatus || '',
          };
          if (order.totalValue) {
            const num = parseFloat(order.totalValue);
            if (!isNaN(num)) {
              this.displayValue = num.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            }
          }
        }
      } catch (e) {
        this.error = 'Falha ao carregar dados da ordem de compra.';
      } finally {
        this.loading = false;
      }
    },
    async loadOrderDetailsForAuthorize(id) {
      this.loading = true;
      this.authorizeError = null;
      try {
        const order = await this.purchaseOrderStore.getById(id);
        if (order) {
          this.orderDetails = order;
        }
      } catch (e) {
        this.authorizeError = 'Falha ao carregar dados da ordem de compra.';
      } finally {
        this.loading = false;
      }
    },
    closeAndReset() {
      this.sidebar.close();
      this.reset();
    },
    reset() {
      this.error = null;
      this.authorizeError = null;
      this.attachments = [];
      this.orderDetails = null;
      this.displayValue = '';
      this.form = {
        purchaseOrderNumber: '',
        commitmentNoteNumber: '',
        issuingBody: '',
        year: '',
        processNumber: '',
        totalValue: '',
        issueDate: '',
        supplierCompanyId: null,
        status: '',
        emailStatus: '',
      };
      if (this.$refs.formRef) this.$refs.formRef.resetValidation();
      if (this.$refs.authorizeFormRef) this.$refs.authorizeFormRef.resetValidation();
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
        const payload = { ...this.form };
        if (payload.year !== undefined && payload.year !== null && payload.year !== '') {
          payload.year = parseInt(payload.year);
        }
        if (
          payload.totalValue !== undefined &&
          payload.totalValue !== null &&
          payload.totalValue !== ''
        ) {
          payload.totalValue = parseFloat(payload.totalValue);
        }
        if (
          payload.supplierCompanyId !== undefined &&
          payload.supplierCompanyId !== null &&
          payload.supplierCompanyId !== ''
        ) {
          payload.supplierCompanyId = Number(payload.supplierCompanyId);
        }
        if (payload.issueDate && /^\d{4}-\d{2}-\d{2}$/.test(payload.issueDate)) {
          payload.issueDate = payload.issueDate + 'T00:00:00';
        }
        if (this.isEdit && this.sidebar.payload?.purchaseOrderId) {
          payload.id = this.sidebar.payload.purchaseOrderId;
          await this.purchaseOrderStore.update(payload);
          this.$emit('updated', { ...payload });
        } else {
          await this.purchaseOrderStore.create(payload);
          this.$emit('created', { ...payload });
        }
        this.sidebar.close();
        this.reset();
      } catch (e) {
        this.error = this.isEdit
          ? 'Falha ao atualizar ordem de compra.'
          : 'Falha ao salvar ordem de compra.';
      } finally {
        this.loading = false;
      }
    },
    async submitAuthorize() {
      this.authorizeError = null;
      if (this.$refs.authorizeFormRef) {
        const ok = await this.$refs.authorizeFormRef.validate();
        if (!ok.valid) return;
      }
      if (!this.sidebar.payload?.purchaseOrderId) {
        this.authorizeError = 'ID da ordem de compra não encontrado.';
        return;
      }
      this.loading = true;
      try {
        const files = this.attachments && this.attachments.length > 0 ? this.attachments : null;
        await this.purchaseOrderStore.sendEmail(this.sidebar.payload.purchaseOrderId, files);
        this.$emit('updated');
        this.sidebar.close();
        this.reset();
      } catch (e) {
        this.authorizeError = e?.message || 'Falha ao enviar e-mail. Tente novamente.';
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
