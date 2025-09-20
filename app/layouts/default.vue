<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      @click="rail = false"
    >
      <v-list-item
        class="mt-4"
        :prepend-avatar="userAvatar"
        :title="userName"
        :subtitle="userEmail"
        nav
      >
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          :value="item.value"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="primary">
      <v-app-bar-nav-icon
        variant="text"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>

      <v-toolbar-title>{{ pageTitle }}</v-toolbar-title>

      <v-img :width="50" :max-height="50" src="../assets/icons/logo.svg" />

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>mdi-bell</v-icon>
      </v-btn>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn color="white" v-bind="props" icon>
            <v-avatar size="32">
              <v-icon icon="mdi-account-circle"></v-icon>
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
          title: "Registrar Perfil",
          icon: "mdi-account-plus",
          to: "/profile-register",
          value: "profile-register",
        },
        {
          title: "Stock",
          icon: "mdi-warehouse",
          to: "/storage",
          value: "storage",
        },
      ],
      auth: null,
      ui: null,
    };
  },
  created() {
    this.auth = useAuthStore();
    this.pageTitle = this.pageTitle;
  },
  mounted() {
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
      return this.auth?.user?.avatar || "~/assets/icons/logo.svg";
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
