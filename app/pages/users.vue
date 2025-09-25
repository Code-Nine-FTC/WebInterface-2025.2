<template>
  <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
    <div class="d-flex flex-row items-center gap-2 mt-2">
      <v-text-field
        v-model="search"
        clearable
        density="compact"
        variant="outlined"
        label="Pesquisar"
        placeholder="Buscar usuários"
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
  <v-item-group>
    <v-row>
      <v-col v-for="user in filteredUsers" :key="user.id" cols="12" md="4">
        <v-card class="mx-auto" max-width="550" outlined>
          <v-list-item class="pa-4">
            <v-row class="d-flex align-center" no-gutters>
              <v-col class="d-flex justify-center" cols="3">
                <v-avatar size="48" color="primary" class="text-white">
                  {{ getInitials(user.username) }}
                </v-avatar>
              </v-col>
              <v-col cols="9">
                <span>{{ user.username }}</span>
                <v-chip
                  size="small"
                  label
                  :color="roleColor(user.role)"
                  class="text-white font-medium ml-2"
                  >{{ roleName(user.role) }}</v-chip
                >
                <span class="text-subtitle text-grey">{{ user.email }}</span>
              </v-col>
            </v-row>
          </v-list-item>
          <v-row class="d-flex justify-end pa-2" no-gutters>
            <v-btn
              prepend-icon="mdi-eye"
              variant="tonal"
              class="mr-2"
              density="comfortable"
              color="primary"
              @click="
                sidebar?.open({ mode: 'view', itemId: user.id, item: user })
              "
              >Ver</v-btn
            >
            <v-btn
              density="comfortable"
              color="green"
              prepend-icon="mdi-pencil"
              variant="tonal"
              >Editar</v-btn
            >
            <v-btn
              density="comfortable"
              color="red"
              prepend-icon="mdi-delete"
              variant="tonal"
              class="ml-2"
              >Excluir</v-btn
            >
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-item-group>
  <FormSidebar />
</template>

<script setup>
definePageMeta({ layout: "default", middleware: "auth" });
</script>
<script>
import { useUsers } from "~/stores/users";
import { useSidebarStore } from "~/stores/sidebar";
import FormSidebar from "~/components/sidebars/users.vue";
export default {
  name: "profileRegister",
  layout: "default",
  data() {
    return {
      data: [],
      list_users: [],
      search: "",
    };
  },
  computed: {
    filteredUsers() {
      const roleOrder = { ADMIN: 0, MANAGER: 1, ASSISTANT: 2 };
      const q = (this.search || "").toLowerCase().trim();
      let users = this.data;
      if (q) {
        users = users.filter((u) =>
          [u.username, u.email, u.name]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(q))
        );
      }
      return users.slice().sort((a, b) => {
        const ra = roleOrder[a.role] ?? 99;
        const rb = roleOrder[b.role] ?? 99;
        return ra - rb;
      });
    },
  },
  created() {
    this.list_users = useUsers();
    this.sidebar = useSidebarStore();
  },
  async mounted() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        this.data = await this.list_users.list();
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    },
    openSidebar() {
      this.sidebar?.open({ mode: "create" });
    },
  },
};
</script>
