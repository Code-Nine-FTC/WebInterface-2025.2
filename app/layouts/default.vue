<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      @click="rail = false"
    >
      <div class="d-flex flex-column h-100">
        <v-list-item class="mt-4" nav>
          <template #prepend>
            <v-avatar size="48" color="primary" class="text-white font-bold">
              {{ getInitials(userName) }}
            </v-avatar>
          </template>
          <div class="flex items-center gap-2">
            <span>{{ userName }}</span>
            <v-chip
              v-if="userRole"
              :color="roleColor(userRole)"
              size="x-small"
              label
              class="text-white font-small ml-2"
            >
              {{ roleName(userRole) }}
            </v-chip>
          </div>
          <template #subtitle>
            {{ userEmail }}
          </template>
        </v-list-item>
        <v-divider />

        <v-list density="compact" nav>
          <v-list-item
            v-for="item in filteredMenuItems"
            :key="item.title"
            :prepend-icon="item.icon"
            :title="item.title"
            :to="item.to"
            :value="item.value"
          />
        </v-list>

        <v-spacer />

        <v-divider class="mt-2" />
        <div class="pa-3">
          <v-btn
            block
            color="red"
            variant="tonal"
            prepend-icon="mdi-logout"
            @click="logout"
          >
            Sair
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>

    <v-app-bar color="primary">
      <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer" />
      <v-toolbar-title>{{ pageTitle }}</v-toolbar-title>
      <v-img :width="50" :max-height="50" src="../assets/icons/logo.svg" />
      <v-spacer />
      <v-btn icon>
        <v-icon>mdi-bell</v-icon>
      </v-btn>
      <v-menu>
        <template #activator="{ props }">
          <v-btn color="white" v-bind="props" icon>
            <v-avatar size="32">
              <v-icon icon="mdi-account-circle" />
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="logout">
            <v-list-item-title>Sair</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { useAuthStore } from "~/stores/auth";

export default {
  name: "default",
  data() {
    return {
      drawer: true,
      rail: false,
      pageTitle: "Home",
      menuItems: [
        { title: "Home", icon: "mdi-home", to: "/home", value: "home" },
        {
          title: "Stock",
          icon: "mdi-warehouse",
          to: "/storage",
          value: "storage",
        },
        {
          title: "Usuários",
          icon: "mdi-account-multiple",
          to: "/users",
          value: "users",
        },
        {
          title: "Fornecedores",
          icon: "mdi-truck",
          to: "/suppliers",
          value: "suppliers",
        },
        {
          title: "Pedidos",
          icon: "mdi-cart",
          to: "/orders",
          value: "orders",
        },
        // {
        //   title: "Seções",
        //   icon: "mdi-view-grid",
        //   to: "/sections",
        //   value: "sections",
        // }
      ],
      auth: null,
    };
  },
  created() {
    this.auth = useAuthStore();
    this.pageTitle = this.pageTitle;
  },
  async mounted() {
    await this.auth.initializeAuth();
    this.updatePageTitle();
  },
  watch: {
    $route() {
      this.updatePageTitle();
    },
  },
  computed: {
    userName() {
      return this.auth?.user?.name || "Usuário";
    },
    userEmail() {
      return this.auth?.user?.email || "—";
    },
    userAvatar() {
      return this.auth?.user?.avatar;
    },
    userRole() {
      return this.auth?.user?.role || null;
    },
    filteredMenuItems() {
      const role = this.auth?.user?.role;
      return this.menuItems.filter((m) => {
        if (m.value === "sections" && m.value === "users")
          return role === "ADMIN";
        return true;
      });
    },
  },
  methods: {
    updatePageTitle() {
      const currentMenuItem = this.menuItems.find(
        (item) => item.to === this.$route.path
      );
      if (currentMenuItem) {
        this.pageTitle = currentMenuItem.title;
      } else {
        this.pageTitle = "Home";
      }
    },
    logout() {
      if (this.auth && typeof this.auth.logout === "function") {
        this.auth.logout();
      } else {
        this.$router.push("/login");
      }
    },
  },
};
</script>

<style scoped>
.v-main {
  background-color: #f5f5f5;
}

@media (max-width: 768px) {
  .v-navigation-drawer {
    position: fixed !important;
  }
}
</style>
