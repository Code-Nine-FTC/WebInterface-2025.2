<template>
  <div class="max-w-6xl mx-auto p-6">
    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div class="d-flex flex-row items-center gap-3">
        <v-chip variant="elevated" color="primary"> Tipos de Item </v-chip>
      </div>
      <div class="d-flex flex-row items-center gap-2 mt-2">
        <v-text-field
          v-model="search"
          clearable
          density="compact"
          variant="outlined"
          label="Pesquisar"
          placeholder="Buscar por nome ou descrição..."
          append-inner-icon="mdi-magnify"
          class="flex-1"
        />
        <v-btn
          prepend-icon="mdi-plus"
          density="comfortable"
          color="primary"
          class="flex-shrink-0 ml-2"
          height="38"
          @click="openSidebar"
          >Cadastrar</v-btn
        >
      </div>
    </v-card>

    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div class="px-4 py-3 border-b border-slate-100">
        <div class="d-flex items-center gap-2 text-xs text-slate-500">
          <v-icon icon="mdi-shape" class="mr-1" />
          <span> Tipos de Item </span>
          <div class="ml-auto flex items-center gap-2">
            <span class="hidden sm:inline text-slate-500">
              Última atualização:
            </span>
            <v-chip
              color="green"
              size="x-small"
              variant="tonal"
              class="font-medium"
            >
              {{ formatDate(Date.now()) }}
            </v-chip>
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              :loading="loading"
              @click="fetchData"
            >
              Atualizar
            </v-btn>
          </div>
        </div>
      </div>
      <div class="p-4">
        <div class="overflow-auto">
          <v-data-table
            :headers="headers"
            :items="filteredData"
            item-key="id"
            :loading="loading"
            class="min-w-[900px]"
            @click:row="editTypeItem"
            row-class="clickable-row"
          >
            <template v-slot:item.name="{ item }">
              <span>{{ item.name }}</span>
            </template>
            <template v-slot:item.isActive="{ item }">
              <v-chip
                :color="item.isActive ? 'green' : 'red'"
                size="x-small"
                variant="tonal"
              >
                {{ item.isActive ? "Ativo" : "Inativo" }}
              </v-chip>
            </template>
            <template v-slot:item.lastUpdate="{ item }">
              <span class="text-sm text-slate-700">{{
                formatDate(item.lastUpdate)
              }}</span>
            </template>
            <template v-slot:item.lastUserName="{ item }">
              <span class="text-sm text-slate-700">{{
                item.lastUserName || "-"
              }}</span>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                size="x-small"
                color="red"
                @click.stop="removeTypeItem(item)"
                title="Remover tipo de item"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </div>
      </div>
    </v-card>
    <TypeItemSidebar @created="fetchData" @updated="fetchData" />
  </div>
</template>

<script>
import { useTypeItem } from "~/stores/typeItem";
import TypeItemSidebar from "~/components/sidebars/typeitem.vue";
import { useSidebarStore } from "~/stores/sidebar";
import { useAuthStore } from "~/stores/auth";

export default {
  name: "TypeItems",
  components: {
    TypeItemSidebar,
  },
  data() {
    return {
      data: [],
      loading: false,
      search: "",
      headers: [
        { title: "ID", key: "id" },
        { title: "Nome", key: "name" },
        { title: "Status", key: "isActive" },
        { title: "Última atualização", key: "lastUpdate" },
        { title: "Usuário", key: "lastUserName" },
        {
          title: "",
          key: "actions",
          sortable: false,
          align: "center",
          width: 60,
        },
      ],
      sidebar: null,
    };
  },
  created() {
    this.typeItemStore = useTypeItem();
    this.sidebar = useSidebarStore();
    this.authStore = useAuthStore();
  },
  async mounted() {
    await this.fetchData();
  },
  computed: {
    filteredData() {
      const q = (this.search || "").toString().toLowerCase().trim();
      let items = this.data;
      const user = this.authStore?.user;
      if (user && user.role !== "ADMIN") {
        const userSectionIds = (user.sections || []).map((s) => s.id);
        items = items.filter((item) => userSectionIds.includes(item.sectionId));
      }
      if (!q) return items;
      return items.filter((item) => {
        return ["name", "description"].some((key) => {
          const v = item?.[key];
          return (
            v !== undefined &&
            v !== null &&
            v.toString().toLowerCase().includes(q)
          );
        });
      });
    },
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        this.data = await this.typeItemStore.list();
      } catch (e) {
        console.error("Error fetching type items:", e);
      } finally {
        this.loading = false;
      }
    },
    formatDate(value) {
      if (!value) return "—";
      try {
        const d = new Date(value);
        return d.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return value;
      }
    },
    openSidebar() {
      this.sidebar?.open({ mode: "create" });
    },
    editTypeItem(event, row) {
      const item = row.item;
      console.log("editTypeItem chamado:", item);
      if (!item || typeof item !== "object") return;
      this.sidebar?.open({ mode: "edit", typeItemId: item.id });
    },
    async removeTypeItem(item) {
      if (confirm("Tem certeza que deseja remover este tipo de item?")) {
        try {
          await this.typeItemStore.remove(item);
          await this.fetchData();
        } catch (e) {
          console.error("Erro ao remover tipo de item:", e);
        }
      }
    },
  },
};
</script>

<style scoped>
.clickable-row {
  cursor: pointer;
  transition: background 0.2s;
}
.clickable-row:hover {
  background: #f3f4f6;
}
</style>
