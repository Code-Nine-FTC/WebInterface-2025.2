<template>
  <div class="max-w-6xl mx-auto p-6">
    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-4">
      <div class="d-flex align-center mb-3">
        <v-icon icon="mdi-view-grid" class="mr-2" />
        <span class="text-subtitle-2 font-semibold">Seções</span>
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Nova Seção</v-btn>
      </div>

      <div class="d-flex flex-wrap gap-3 mb-2">
        <v-select
          v-model="filterType"
          :items="typeOptions"
          label="Tipo"
          density="comfortable"
          variant="outlined"
          hide-details="auto"
          style="max-width: 220px"
        />
        <v-select
          v-model="filterActive"
          :items="activeOptions"
          label="Status"
          density="comfortable"
          variant="outlined"
          hide-details="auto"
          style="max-width: 220px"
        />
        <v-text-field
          v-model="search"
          label="Buscar por título"
          prepend-inner-icon="mdi-magnify"
          density="comfortable"
          variant="outlined"
          hide-details="auto"
          style="min-width: 260px"
        />
        <v-spacer />
        <v-btn variant="tonal" :loading="loading" @click="fetchList">Recarregar</v-btn>
      </div>
    </v-card>

    <v-card class="bg-white rounded-lg shadow-md pa-4">
      <div class="px-4 py-3 border-b border-slate-100">
        <div class="d-flex items-center gap-2 text-xs text-slate-500">
          <v-icon icon="mdi-view-grid" class="mr-1" />
          <span>Lista de Seções</span>
          <v-spacer />
          <v-chip color="green" size="x-small" variant="tonal" class="font-medium">
            {{ filtered.length }}
          </v-chip>
        </div>
      </div>
      <div class="p-2">
        <v-data-table
          :headers="headers"
          :items="filtered"
          item-key="id"
          :loading="loading"
          class="min-w-[900px]"
        >
          <template #item.sectionType="{ item }">
            <v-chip
              size="x-small"
              :color="item.sectionType === 'CONSUMER' ? 'indigo' : 'blue'"
              variant="tonal"
            >
              {{ translateSectionType(item.sectionType) }}
            </v-chip>
          </template>
          <template #item.isActive="{ item }">
            <v-chip size="x-small" :color="item.isActive ? 'green' : 'grey'" variant="tonal">
              {{ item.isActive ? 'Ativa' : 'Inativa' }}
            </v-chip>
          </template>
          <template #item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
          <template #item.lastUpdate="{ item }">
            {{ formatDate(item.lastUpdate || item.updatedAt) }}
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex align-center gap-1">
              <v-tooltip text="Editar" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="small"
                    icon="mdi-pencil"
                    variant="text"
                    color="primary"
                    @click="openEdit(item)"
                  />
                </template>
              </v-tooltip>
              <v-tooltip :text="item.isActive ? 'Inativar' : 'Ativar'" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="small"
                    :icon="item.isActive ? 'mdi-cancel' : 'mdi-check-circle'"
                    variant="text"
                    :color="item.isActive ? 'red' : 'green'"
                    @click="toggleActive(item)"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>
          <template #no-data>
            <div class="py-6 text-center text-medium-emphasis text-caption">Nenhuma seção</div>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <v-dialog v-model="dialog" max-width="520">
      <v-card>
        <v-card-title class="text-subtitle-1">
          {{ editing ? 'Editar Seção' : 'Nova Seção' }}
        </v-card-title>
        <v-card-text>
          <v-alert v-if="formError" type="error" variant="tonal" class="mb-2">
            {{ formError }}
          </v-alert>
          <v-form ref="formRef" v-model="formValid" @submit.prevent="save">
            <v-text-field
              v-model="form.title"
              label="Título"
              placeholder="Digite o título da seção"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            />
            <v-select
              v-model="form.sectionType"
              :items="typeOnlyOptions"
              label="Tipo de Seção"
              placeholder="Selecione o tipo"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            />
            <div class="d-flex align-center mt-2">
              <v-switch v-model="form.isActive" color="green" inset hide-details label="Ativa" />
              <v-spacer />
              <v-btn type="button" variant="text" @click="dialog = false">Cancelar</v-btn>
              <v-btn type="submit" color="primary" :loading="saving">
                {{ editing ? 'Salvar' : 'Criar' }}
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' });
import { ref, computed, onMounted } from 'vue';
import { useSection } from '~/stores/section';
import { formatDate } from '~/utils';

const sectionStore = useSection();

const headers = [
  { title: 'Título', key: 'title' },
  { title: 'Tipo', key: 'sectionType', width: 130 },
  { title: 'Ativo', key: 'isActive', width: 110 },
  { title: 'Criado em', key: 'createdAt' },
  { title: 'Última atualização', key: 'lastUpdate' },
  { title: 'Último usuário', key: 'lastUserName' },
  { title: 'Ações', key: 'actions', sortable: false, width: 120 },
];

const loading = ref(false);
const search = ref('');
const filterType = ref<'ALL' | 'CONSUMIDOR' | 'ESTOQUE'>('ALL');
const filterActive = ref<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

const typeOptions = [
  { title: 'Todos os tipos', value: 'ALL' },
  { title: 'CONSUMIDOR', value: 'CONSUMIDOR' },
  { title: 'ESTOQUE', value: 'ESTOQUE' },
];
const typeOnlyOptions = [
  { title: 'CONSUMIDOR', value: 'CONSUMIDOR' },
  { title: 'ESTOQUE', value: 'ESTOQUE' },
];
const activeOptions = [
  { title: 'Todos', value: 'ALL' },
  { title: 'Ativas', value: 'ACTIVE' },
  { title: 'Inativas', value: 'INACTIVE' },
];

const items = computed(() => sectionStore.sections || []);
const filtered = computed(() => {
  const t = filterType.value;
  const a = filterActive.value;
  const q = search.value.toLowerCase().trim();
  return (items.value || [])
    .filter((s) => (t === 'ALL' ? true : String(s.sectionType).toUpperCase() === t))
    .filter((s) => (a === 'ALL' ? true : a === 'ACTIVE' ? !!s.isActive : !s.isActive))
    .filter((s) =>
      q
        ? String(s.title || '')
            .toLowerCase()
            .includes(q)
        : true,
    )
    .map((s) => ({
      ...s,
      lastUpdate: s.lastUpdate || s.updatedAt || s.modifiedAt || null,
    }));
});

async function fetchList() {
  loading.value = true;
  try {
    const type = filterType.value;
    if (type === 'ALL') await sectionStore.list();
    else await sectionStore.list({ sectionType: type });
  } finally {
    loading.value = false;
  }
}

onMounted(fetchList);

// dialog & form
const dialog = ref(false);
const editing = ref(false);
const saving = ref(false);
const formRef = ref();
const formValid = ref(true);
const form = ref<{
  id?: number;
  title: string;
  sectionType: 'CONSUMIDOR' | 'ESTOQUE';
  isActive: boolean;
}>({
  title: '',
  sectionType: 'CONSUMIDOR',
  isActive: true,
});
const formError = ref<string | null>(null);

const rules = {
  required: (v: any) => !!v || v === 0 || 'Obrigatório',
};

// Função para traduzir tipos de seção
function translateSectionType(type: string): string {
  const translations: Record<string, string> = {
    CONSUMER: 'Consumidor',
    STORAGE: 'Estoque',
    CONSUMIDOR: 'Consumidor',
    ESTOQUE: 'Estoque',
  };
  return translations[String(type).toUpperCase()] || type;
}

function openCreate() {
  editing.value = false;
  form.value = { title: '', sectionType: 'CONSUMIDOR', isActive: true };
  formError.value = null;
  dialog.value = true;
}

function openEdit(item: any) {
  editing.value = true;
  form.value = {
    id: item.id,
    title: item.title || '',
    sectionType: (String(item.sectionType).toUpperCase() as any) || 'CONSUMIDOR',
    isActive: !!item.isActive,
  };
  formError.value = null;
  dialog.value = true;
}

async function save() {
  if (formRef.value) {
    const ok = await (formRef.value as any).validate();
    if (!ok.valid) return;
  }
  saving.value = true;
  formError.value = null;
  try {
    const payload: any = {
      title: form.value.title,
      sectionType: form.value.sectionType,
      isActive: !!form.value.isActive,
    };
    if (editing.value && form.value.id != null) {
      await sectionStore.update({ id: form.value.id, ...payload });
    } else {
      await sectionStore.create(payload);
    }
    dialog.value = false;
    await fetchList();
  } catch (e: any) {
    // Exibir mensagens 400/404 quando disponíveis
    const msg = e?.data?.message || e?.message || 'Falha ao salvar seção';
    formError.value = msg;
  } finally {
    saving.value = false;
  }
}

async function toggleActive(item: any) {
  try {
    const id = item.id;
    const next = !item.isActive;
    await sectionStore.update({ id, isActive: next });
    await fetchList();
  } catch (e) {
    // opcional: snackbar de erro
  }
}
</script>

<style scoped>
.min-w-\[900px\] {
  min-width: 900px;
}
</style>
