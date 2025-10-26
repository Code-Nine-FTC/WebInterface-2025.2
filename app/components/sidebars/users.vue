<template>
  <v-navigation-drawer v-model="sidebar.isOpen" location="right" temporary width="600">
    <v-toolbar flat density="comfortable">
      <v-toolbar-title>{{ isEdit ? 'Editar Usuário' : 'Cadastrar Usuário' }}</v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" :disabled="loading" @click="closeAndReset" />
    </v-toolbar>

    <v-divider />

    <v-form ref="formRef" v-model="formValid" class="pa-4" @submit.prevent="submit">
      <v-row dense>
        <v-col cols="12">
          <v-text-field
            v-model="form.name"
            label="Nome Completo"
            :rules="[rules.required]"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="form.email"
            label="E-mail"
            :rules="[rules.required, rules.email]"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
        </v-col>

        <v-col v-if="!isEdit" cols="12" md="6">
          <v-text-field
            v-model="form.password"
            label="Senha"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            placeholder="********"
          />
        </v-col>

        <v-col v-if="userRole === 'ADMIN'" cols="12" md="6">
          <v-select
            v-model="form.section"
            label="Seção"
            :items="sections || []"
            item-title="title"
            item-value="id"
            :rules="[rules.required]"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            placeholder="Selecione a seção"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-select
            v-model="form.role"
            label="Função"
            :items="filteredRoles"
            item-title="label"
            item-value="value"
            :rules="[rules.required]"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            placeholder="Assistente"
          />
        </v-col>

        <v-col cols="12">
          <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mb-2">
            {{ error }}
          </v-alert>
        </v-col>

        <v-col cols="12" class="d-flex justify-end ga-2 mt-4">
          <v-btn type="button" variant="text" :disabled="loading" @click="reset">Limpar</v-btn>
          <v-btn type="submit" color="primary" :loading="loading" :disabled="!formValid">
            {{ isEdit ? 'Salvar Alterações' : 'Salvar' }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-navigation-drawer>
</template>

<script>
import { useSidebarStore } from '~/stores/sidebar';
import { useUsers } from '~/stores/users';
import { useAuthStore } from '~/stores/auth';
import { useSection } from '~/stores/section';

export default {
  name: 'FormSidebar',
  emits: ['created', 'updated'],
  data() {
    return {
      sidebar: null,
      supplierStore: null,
      loading: false,
      formValid: true,
      error: null,
      currentId: null,
      sections: [],
      roles: [
        { label: 'Administrador', value: 'ADMIN' },
        { label: 'Gerente', value: 'MANAGER' },
        { label: 'Assistente', value: 'ASSISTANT' },
      ],
      form: {
        name: '',
        password: '',
        email: '',
        section: {},
        role: '',
      },
      rules: {
        required: (v) => !!v || v === 0 || 'Obrigatório',
        email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'E-mail inválido',
      },
    };
  },
  computed: {
    isEdit() {
      return this.sidebar?.payload?.mode === 'edit';
    },
    userId() {
      return this.auth?.user?.id;
    },
    userRole() {
      return this.auth?.user?.role;
    },
    userSections() {
      return this.auth?.user?.sections || [];
    },
    filteredRoles() {
      if (this.userRole === 'ADMIN') return this.roles;
      return this.roles.filter((r) => r.value !== 'ADMIN' && r.value !== 'MANAGER');
    },
  },
  created() {
    this.sidebar = useSidebarStore();
    this.users = useUsers();
    this.auth = useAuthStore();
    this.section = useSection();
    this.prefillIfEdit();
  },
  mounted() {
    this.fetchSections();
  },
  watch: {
    'sidebar.payload': {
      deep: true,
      handler() {
        this.prefillIfEdit();
      },
    },
    'sidebar.isOpen'(open) {
      if (!open) {
        setTimeout(() => this.reset(), 150);
      }
    },
  },
  methods: {
    async fetchSections() {
      try {
        const res = await this.section.list();
        this.sections = res;
      } catch (e) {
        console.error('Error fetching sections:', e);
        return [];
      }
    },
    prefillIfEdit() {
      if (this.isEdit && this.sidebar.payload?.user) {
        const s = this.sidebar.payload.user;
        this.currentId = s.id;
        this.form.name = s.name || s.username || '';
        this.form.password = s.password || '';
        this.form.email = s.email || '';
        if (Array.isArray(s.sectionIds) && s.sectionIds.length > 0) {
          this.form.section = s.sectionIds[0];
        } else if (Array.isArray(s.sections) && s.sections.length > 0) {
          this.form.section = s.sections[0].id;
        } else {
          this.form.section = '';
        }
        this.form.role = s.role || '';
      } else if (!this.isEdit) {
        this.currentId = null;
        this.reset();
      }
    },
    reset() {
      this.error = null;
      this.currentId = null;
      this.form = {
        name: '',
        password: '',
        email: '',
        section: '',
        role: '',
      };
      if (this.$refs.formRef) this.$refs.formRef.resetValidation();
    },
    closeAndReset() {
      this.sidebar.close();
      this.reset();
    },
    async submit() {
      this.error = null;
      if (this.$refs.formRef) {
        const ok = await this.$refs.formRef.validate();
        if (!ok.valid) return;
      }
      this.loading = true;
      try {
        const payload = {
          user: this.userId,
          name: this.form.name,
          email: this.form.email.trim(),
          password: this.form.password,
          sectionIds: Array.isArray(this.form.section)
            ? this.form.section
            : [this.form.section].filter(Boolean),
          role: this.form.role,
        };
        if (this.isEdit && this.currentId) {
          const updated = await this.users.update({
            id: this.currentId,
            ...payload,
          });
          this.$emit('updated', updated);
        } else {
          const created = await this.users.create(payload);
          this.$emit('created', created);
        }
        this.sidebar.close();
        this.reset();
      } catch (e) {
        this.error = this.isEdit ? 'Falha ao atualizar usuário' : 'Falha ao salvar usuário';
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
