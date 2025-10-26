<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent @click="rail = false">
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
            @click="setPageTitle(item.title)"
          />
        </v-list>

        <v-spacer />

        <v-divider class="mt-2" />
        <div class="pa-3">
          <v-btn block color="red" variant="tonal" prepend-icon="mdi-logout" @click="logout">
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

      <v-menu :close-on-content-click="false" max-width="400">
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-badge v-if="notificationCount > 0" :content="notificationCount" color="red" overlap>
              <v-icon>mdi-bell</v-icon>
            </v-badge>
            <v-icon v-else>mdi-bell</v-icon>
          </v-btn>
        </template>

        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Notificações</span>
            <v-btn
              v-if="notifications.length > 0"
              size="small"
              variant="text"
              color="primary"
              @click="markAllAsRead"
            >
              Marcar todas como lidas
            </v-btn>
          </v-card-title>

          <v-divider />

          <v-list v-if="notifications.length > 0" max-height="400" class="overflow-y-auto">
            <v-list-item
              v-for="notification in notifications"
              :key="notification.id"
              class="notification-item"
            >
              <template #prepend>
                <v-icon :color="getNotificationColor(notification.severity)">
                  {{ getNotificationIcon(notification.type) }}
                </v-icon>
              </template>

              <v-list-item-title>
                {{ getNotificationTitle(notification) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ notification.message }}
              </v-list-item-subtitle>

              <template #append>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="red"
                  @click="markAsRead(notification)"
                >
                  <v-icon size="20">mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>

          <v-card-text v-else class="text-center py-8 text-grey">
            <v-icon size="64" color="grey-lighten-1">mdi-bell-off-outline</v-icon>
            <div class="mt-2">Nenhuma notificação</div>
          </v-card-text>
        </v-card>
      </v-menu>

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
import { useAuthStore } from '~/stores/auth';
import { useNotification } from '~/stores/notification';
import { getInitials, roleColor, roleName } from '~/utils';

export default {
  name: 'default',
  data() {
    return {
      drawer: true,
      rail: false,
      pageTitle: 'Home',
      menuItems: [
        { title: 'Home', icon: 'mdi-home', to: '/home', value: 'home' },
        {
          title: 'Análises e Consumo',
          icon: 'mdi-chart-line',
          to: '/dashboard',
          value: 'dashboard',
        },
        {
          title: 'Stock',
          icon: 'mdi-warehouse',
          to: '/storage',
          value: 'storage',
        },
        {
          title: 'Usuários',
          icon: 'mdi-account-multiple',
          to: '/users',
          value: 'users',
        },
        {
          title: 'Fornecedores',
          icon: 'mdi-truck',
          to: '/suppliers',
          value: 'suppliers',
        },
        {
          title: 'Pedidos',
          icon: 'mdi-cart',
          to: '/orders',
          value: 'orders',
        },
		{
		title: 'Ordens de Compra',
		icon: 'mdi-file-document-edit-outline',
		to: '/purchase-orders',
		value: 'purchase-orders',
		},
        {
          title: 'Validades',
          icon: 'mdi-calendar-alert',
          to: '/expiry',
          value: 'expiry',
        },
        {
          title: 'Seções',
          icon: 'mdi-view-grid',
          to: '/sections',
          value: 'sections',
        },
      ],
      auth: null,
      notification: null,
    };
  },
  created() {
    this.auth = useAuthStore();
    this.notification = useNotification();
    this.pageTitle = this.pageTitle;
  },
  async mounted() {
    await this.auth.initializeAuth();
    this.updatePageTitle();
    await this.fetchNotifications();

    this.notificationInterval = setInterval(() => {
      this.fetchNotifications();
    }, 10000);
  },
  beforeUnmount() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
  },
  watch: {
    $route: {
      handler() {
        this.updatePageTitle();
      },
      immediate: true,
    },
  },
  computed: {
    userName() {
      return this.auth?.user?.name || 'Usuário';
    },
    userEmail() {
      return this.auth?.user?.email || '—';
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
        if (m.value === 'users' || m.value === 'sections') {
          return role === 'ADMIN';
        }
        return true;
      });
    },
    notifications() {
      console.log('Computed notifications:', this.notification?.notifications);
      return this.notification?.notifications || [];
    },
    notificationCount() {
      console.log('Notification count:', this.notifications.length);
      return this.notifications.length;
    },
  },
  methods: {
    getNotificationTitle(notification) {
      if (notification.type === 'ORDER_PROCESSING' && notification.order) {
        return `Pedido #${notification.order.id}`;
      }
      return notification.title || 'Notificação';
    },
    getNotificationIcon(type) {
      const icons = {
        ORDER_PROCESSING: 'mdi-cart-check',
        ORDER_DELIVERED: 'mdi-truck-delivery',
        ORDER_CANCELED: 'mdi-cart-remove',
        STOCK_LOW: 'mdi-alert',
        STOCK_OUT: 'mdi-alert-circle',
      };
      return icons[type] || 'mdi-bell-outline';
    },
    getNotificationColor(severity) {
      const colors = {
        INFO: 'blue',
        PROCESSING: 'purple',
        WARNING: 'orange',
        ERROR: 'red',
        SUCCESS: 'green',
      };
      return colors[severity] || 'primary';
    },
    getInitials,
    roleColor,
    roleName,
    setPageTitle(title) {
      this.pageTitle = title;
    },
    updatePageTitle() {
      if (this.pageTitle) {
        this.pageTitle = this.pageTitle;
      } else {
        this.pageTitle = 'Home';
      }
    },
    async fetchNotifications() {
      try {
        console.log('Buscando notificações...');
        const result = await this.notification.fetchNotifications();
        console.log('Notificações retornadas no componente:', result);
        console.log('State das notificações:', this.notification.notifications);
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    },
    async markAsRead(notification) {
      try {
        await this.notification.acknowledge({ id: notification.id });
        await this.fetchNotifications();
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
      }
    },
    async markAllAsRead() {
      try {
        await this.notification.acknowledgeAll({});
        await this.fetchNotifications();
      } catch (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
      }
    },
    logout() {
      if (this.auth && typeof this.auth.logout === 'function') {
        this.auth.logout();
      } else {
        this.$router.push('/login');
      }
    },
  },
};
</script>

<style scoped>
.v-main {
  background-color: #f5f5f5;
}

.notification-item {
  border-bottom: 1px solid #e0e0e0;
}

.notification-item:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .v-navigation-drawer {
    position: fixed !important;
  }
}
</style>
