<template>
  <v-navigation-drawer
    v-model="sidebar.isOpen"
    location="right"
    temporary
    width="600"
  >
    <v-toolbar flat density="comfortable">
      <v-toolbar-title>
        {{ isView ? "Detalhes do Tipo de Item" : isEdit ? "Editar Tipo de Item" : "Cadastrar Tipo de Item" }}
        <span v-if="(isEdit || isView) && form.nomeTipo" class="ml-2 text-primary font-bold">
          - {{ form.nomeTipo }}
        </span>
      </v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" :disabled="!isView && loading" @click="closeAndReset" />
    </v-toolbar>
    <v-card v-if="(isEdit || isView) && (form.nomeTipo || selectedSectionName)" class="ma-4 pa-3" variant="tonal" color="primary">
      <v-card-text class="pa-0">
        <div class="d-flex flex-column gap-1">
          <div v-if="form.nomeTipo" class="d-flex align-center gap-2">
            <v-icon size="small" color="primary">mdi-tag</v-icon>
            <span class="text-body-2"><strong>Nome:</strong> {{ form.nomeTipo }}</span>
          </div>
          <div v-if="selectedSectionName" class="d-flex align-center gap-2">
            <v-icon size="small" color="primary">mdi-folder</v-icon>
            <span class="text-body-2"><strong>Seção:</strong> {{ selectedSectionName }}</span>
          </div>
        </div>
      </v-card-text>
    </v-card>
    <v-divider />

    <v-form
      v-if="!isView"
      ref="formRef"
      v-model="formValid"
      class="pa-4"
      @submit.prevent="submit"
    >
      <v-row dense>
        <v-col cols="12">
          <v-text-field
            v-model="form.nomeTipo"
            label="Nome do Tipo de Item"
            :rules="[rules.required]"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
        </v-col>
        <v-col v-if="userRole === 'ADMIN'" cols="12" md="6">
          <v-select
            v-model="form.sectionId"
            label="Seção"
            :items="sections"
            item-title="title"
            item-value="id"
            :rules="[rules.required]"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            placeholder="Selecione a seção"
          />
        </v-col>
        <v-col cols="12">
          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            density="comfortable"
            class="mb-2"
          >
            {{ error }}
          </v-alert>
        </v-col>
        <v-col cols="12" class="d-flex justify-end ga-2 mt-4">
          <v-btn
            type="button"
            variant="text"
            :disabled="loading"
            @click="reset"
          >
            Limpar
          </v-btn>
          <v-btn
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="!formValid"
          >
            {{ isEdit ? "Salvar Alterações" : "Salvar" }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-navigation-drawer>
</template>

<script>
import { useSidebarStore } from "~/stores/sidebar";
import { useTypeItem } from "~/stores/typeItem";
import { useAuthStore } from "~/stores/auth";
import { useSection } from "~/stores/section";

export default {
  name: "TypeItemSidebar",
  emits: ["created", "updated"],
  data() {
    return {
      sidebar: null,
      typeItemStore: null,
      authStore: null,
      sectionStore: null,
      sections: [],
      loading: false,
      formValid: true,
      error: null,
      currentId: null,
      form: {
        nomeTipo: "",
        sectionId: null,
      },
      rules: {
        required: (v) => !!v || v === 0 || "Obrigatório",
      },
    };
  },
  computed: {
    isEdit() {
      return this.sidebar?.payload?.mode === "edit";
    },
    isView() {
      return this.sidebar?.payload?.mode === "view";
    },
    userRole() {
      return this.authStore?.user?.role;
    },
    selectedSectionName() {
      if (!this.form.sectionId) return null;
      const section = this.sections.find(s => s.id === this.form.sectionId);
      return section ? section.title : null;
    },
  },
  async created() {
    this.sidebar = useSidebarStore();
    this.typeItemStore = useTypeItem();
    this.authStore = useAuthStore();
    this.sectionStore = useSection();
    this.sections = await this.sectionStore.list();
    const userSections = this.authStore.user?.sections || [];
    if (this.userRole === 'ADMIN') {
      this.form.sectionId = null;
    } else {
      this.form.sectionId = userSections.length ? userSections[0].id : null;
    }
    this.prefillIfEdit();
  },
  watch: {
    "sidebar.payload": {
      deep: true,
      handler() {
        this.prefillIfEdit();
      },
    },
    "sidebar.isOpen"(open) {
      if (!open) {
        setTimeout(() => this.reset(), 150);
      }
    },
  },
  methods: {
    async prefillIfEdit() {
      if ((this.isEdit || this.isView) && this.sidebar.payload?.typeItemId) {
        const id = this.sidebar.payload.typeItemId;
        this.currentId = id;
        try {
          const item = await this.typeItemStore.getById(id);
          this.form.nomeTipo = item.name || item.nomeTipo || "";
          this.form.sectionId = item.sectionId || (this.authStore.user?.sections?.[0]?.id ?? null);
        } catch (e) {
          this.form.nomeTipo = "";
          this.form.sectionId = this.authStore.user?.sections?.[0]?.id ?? null;
        }
      } else if (!this.isEdit && !this.isView) {
        this.currentId = null;
        this.reset();
        const userSections = this.authStore.user?.sections || [];
        this.form.sectionId = userSections.length ? userSections[0].id : null;
      }
    },
    reset() {
      this.error = null;
      this.currentId = null;
      this.form = {
        nomeTipo: "",
        sectionId: null,
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
          sectionId: this.form.sectionId,
          name: this.form.nomeTipo,
        };
        if (this.isEdit && this.currentId) {
          const updated = await this.typeItemStore.update({
            id: this.currentId,
            ...payload,
          });
          this.$emit("updated", updated);
        } else {
          const created = await this.typeItemStore.create(payload);
          this.$emit("created", created);
        }
        this.sidebar.close();
        this.reset();
      } catch (e) {
        this.error = this.isEdit
          ? "Falha ao atualizar tipo de item"
          : "Falha ao salvar tipo de item";
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
