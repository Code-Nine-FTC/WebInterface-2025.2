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
        icon="mdi-plus"
        density="comfortable"
        color="primary"
        class="flex-shrink-0 ml-2"
        @click="openSidebar"
      />
    </div>
  </v-card>
  <v-item-group>
    <v-row>
      <v-col v-for="user in data" :key="user.id" cols="12" md="4">
        <v-card class="mx-auto" max-width="500" outlined>
          <v-list-item three-line>
            <v-list-item-avatar size="80" tile color="grey lighten-4">
              <v-icon icon="mdi-account" size="48" color="grey" />
              <span>{{ user.username }}</span>
              <v-chip
                size="small"
                label
                :color="roleColor(user.role)"
                class="text-white font-medium ml-2"
                >{{ roleName(user.role) }}</v-chip
              >
              <span class="text-subtitle">{{ user.email }}</span>
            </v-list-item-avatar>
          </v-list-item>
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
