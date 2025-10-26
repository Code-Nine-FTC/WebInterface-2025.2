<template>
  <div class="max-w-5xl mx-auto p-6">
    <div class="d-flex align-center mb-3">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
      <h1 class="ml-2 text-h6">Item #{{ id }} — {{ item?.name || '—' }}</h1>
      <v-spacer />
      <v-chip color="indigo" variant="tonal" size="small">
        Estoque: {{ item?.currentStock ?? '—' }}
      </v-chip>
    </div>

    <v-card class="pa-4">
      <v-tabs v-model="tab" bg-color="transparent" density="comfortable">
        <v-tab value="info">Info</v-tab>
        <v-tab value="lotes">Lotes</v-tab>
      </v-tabs>

      <v-window v-model="tab" class="mt-3">
        <v-window-item value="info">
          <div v-if="loadingItem" class="py-6 text-center text-medium-emphasis">
            Carregando item...
          </div>
          <div v-else>
            <v-table density="comfortable" class="table-flat">
              <tbody>
                <tr>
                  <td class="font-medium">Nome</td>
                  <td>{{ item?.name || '—' }}</td>
                </tr>
                <tr>
                  <td class="font-medium">Unidade</td>
                  <td>{{ item?.measure || '—' }}</td>
                </tr>
                <tr>
                  <td class="font-medium">Fornecedor</td>
                  <td>{{ item?.supplierName || '—' }}</td>
                </tr>
                <tr>
                  <td class="font-medium">Tipo de Item</td>
                  <td>{{ item?.itemTypeName || '—' }}</td>
                </tr>
                <tr>
                  <td class="font-medium">Stock Mínimo</td>
                  <td>{{ item?.minimumStock ?? '—' }}</td>
                </tr>
                <tr>
                  <td class="font-medium">Validade</td>
                  <td>{{ formatDate(item?.expireDate) }}</td>
                </tr>
                <tr>
                  <td class="font-medium">Última atualização</td>
                  <td>{{ formatDate(item?.lastUpdate) }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-window-item>
        <v-window-item value="lotes">
          <div class="d-flex align-center mb-3">
            <span class="text-subtitle-2 font-semibold">Lotes do item</span>
            <v-spacer />
            <v-btn size="small" color="primary" @click="openCreateDialog">
              <v-icon start icon="mdi-plus" />
              Novo Lote
            </v-btn>
            <v-btn
              size="small"
              variant="tonal"
              class="ml-2"
              :loading="lotsLoading"
              @click="reloadLots"
            >
              Recarregar
            </v-btn>
          </div>
          <v-data-table :headers="lotHeaders" :items="lots" :loading="lotsLoading" item-key="id">
            <template #item.expireDate="{ item }">{{ formatDateShort(item.expireDate) }}</template>
            <template #item.quantityOnHand="{ item }">{{ item.quantityOnHand }}</template>
            <template #item.actions="{ item }">
              <div class="d-flex align-center gap-2">
                <v-btn
                  size="x-small"
                  icon="mdi-plus"
                  variant="tonal"
                  color="green"
                  :loading="adjustingId === item.id"
                  @click="adjust(item.id, +1)"
                />
                <v-btn
                  size="x-small"
                  icon="mdi-minus"
                  variant="tonal"
                  color="red"
                  :loading="adjustingId === item.id"
                  @click="adjust(item.id, -1)"
                />
                <v-text-field
                  v-model.number="customDelta[item.id]"
                  type="number"
                  density="compact"
                  variant="outlined"
                  style="max-width: 90px"
                  hide-details
                  placeholder="±0"
                />
                <v-btn
                  size="small"
                  variant="tonal"
                  :loading="adjustingId === item.id"
                  @click="adjust(item.id, Number(customDelta[item.id] || 0))"
                >
                  Ajustar
                </v-btn>
              </div>
            </template>
            <template #no-data>
              <div class="py-6 text-center text-medium-emphasis">Nenhum lote para este item.</div>
            </template>
          </v-data-table>

          <v-dialog v-model="createDialog" max-width="520">
            <v-card>
              <v-card-title class="text-subtitle-1">Novo Lote</v-card-title>
              <v-card-text>
                <v-alert v-if="lotError" type="error" variant="tonal" class="mb-2">
                  {{ lotError }}
                </v-alert>
                <v-row dense>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newLot.code"
                      label="Código"
                      :rules="[rules.required]"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newLot.expireDate"
                      type="date"
                      label="Validade (opcional)"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model.number="newLot.quantity"
                      type="number"
                      min="0"
                      step="1"
                      inputmode="numeric"
                      :rules="[rules.nonneg, rules.int]"
                      label="Quantidade"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="createDialog = false">Cancelar</v-btn>
                <v-btn color="primary" :loading="creatingLot" @click="handleCreateLot">
                  Adicionar
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-window-item>
      </v-window>
    </v-card>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="2500">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' });
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from '#imports';
import { useStorage } from '~/stores/storage';
import { useLotService } from '~/services/lot';
import { formatDate as fmtDate } from '~/utils';

const route = useRoute();
const router = useRouter();
const id = Number(route.params.id);
const tab = ref<'info' | 'lotes'>(route.query.tab === 'lotes' ? 'lotes' : 'info');

const storage = useStorage();
const lotService = useLotService();

const item = ref<any>(null);
const loadingItem = ref(false);

const lots = ref<any[]>([]);
const lotsLoading = ref(false);
const adjustingId = ref<number | null>(null);
const customDelta = ref<Record<number, number>>({});
const createDialog = ref(false);
const newLot = ref<{ code: string; expireDate: string; quantity: number }>({
  code: '',
  expireDate: '',
  quantity: 0,
});
const creatingLot = ref(false);
const lotError = ref<string | null>(null);
const snack = ref({ show: false, color: 'success', text: '' });

const lotHeaders = [
  { title: 'Código', key: 'code' },
  { title: 'Validade', key: 'expireDate' },
  { title: 'Quantidade', key: 'quantityOnHand' },
  { title: 'Ações', key: 'actions', sortable: false, width: 220 },
];

const rules = {
  required: (v: any) => !!v || v === 0 || 'Obrigatório',
  int: (v: any) => (Number.isInteger(Number(v)) && Number(v) >= 0) || 'Número inteiro',
  nonneg: (v: any) => Number(v) >= 0 || 'Número inválido',
};

function formatDate(val: any) {
  return fmtDate(val);
}
function formatDateShort(val: any) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return String(val);
  }
}

async function fetchItem() {
  loadingItem.value = true;
  try {
    item.value = await storage.getById(id);
  } finally {
    loadingItem.value = false;
  }
}

async function reloadLots() {
  lotsLoading.value = true;
  try {
    lots.value = await lotService.listLots(id);
  } finally {
    lotsLoading.value = false;
  }
}

function openCreateDialog() {
  lotError.value = null;
  newLot.value = { code: '', expireDate: '', quantity: 0 };
  createDialog.value = true;
}

async function handleCreateLot() {
  lotError.value = null;
  const code = (newLot.value.code || '').trim();
  const quantity = Number(newLot.value.quantity);
  if (!code) {
    lotError.value = 'Código é obrigatório';
    return;
  }
  if (!Number.isInteger(quantity) || quantity < 0) {
    lotError.value = 'Quantidade deve ser inteiro >= 0';
    return;
  }
  creatingLot.value = true;
  try {
    await lotService.createLot({
      itemId: id,
      code,
      quantity,
      ...(newLot.value.expireDate ? { expireDate: newLot.value.expireDate } : {}),
    });
    snack.value = { show: true, color: 'success', text: 'Lote criado com sucesso' };
    createDialog.value = false;
    await reloadLots();
    await fetchItem();
  } catch (e) {
    lotError.value = 'Falha ao criar lote';
  } finally {
    creatingLot.value = false;
  }
}

async function adjust(lotId: number, delta: number) {
  lotError.value = null;
  if (!Number.isFinite(delta) || delta === 0) return;
  adjustingId.value = lotId;
  try {
    await lotService.adjustLot(lotId, delta);
    snack.value = { show: true, color: delta > 0 ? 'green' : 'orange', text: 'Ajuste aplicado' };
    await reloadLots();
    await fetchItem();
  } catch (e) {
    lotError.value = 'Falha ao ajustar lote';
  } finally {
    adjustingId.value = null;
  }
}

watch(tab, (t) => {
  const q = { ...route.query, tab: t };
  router.replace({ query: q });
});

onMounted(async () => {
  await fetchItem();
  await reloadLots();
});
</script>

<style scoped></style>
