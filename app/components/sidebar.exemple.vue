<template>
  <v-navigation-drawer v-model="sidebar.isOpen" location="right" temporary width="600">
    <v-toolbar flat>
      <v-toolbar-title>Adicionar item</v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" @click="sidebar.close()" />
    </v-toolbar>

    <v-divider />

    <v-container>
      <v-text-field label="Nome" variant="outlined" class="mb-3" />
      <v-text-field label="Estoque" variant="outlined" type="number" class="mb-3" />
      <v-btn color="primary" block>Salvar</v-btn>
    </v-container>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useSidebarStore } from '~/stores/sidebar';
const sidebar = useSidebarStore();
</script>
