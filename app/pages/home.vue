<template>
  <div>
    <h1 class="text-h4 mb-4">Bem-vindo à sua Home Page!</h1>

    <v-card>
      <v-card-title>Conteúdo da Home</v-card-title>
      <v-card-text>
        <p>Adicionar Conteúdo</p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({ layout: "default", middleware: "auth" });
</script>

<script>
export default {
  name: "home",
  layout: "default",
};
</script>

<style scoped></style>
