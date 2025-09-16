<template>
  <v-app>
    <v-main>
      <v-container class="fill-height d-flex align-center justify-center">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'auth'
}
</script>

<style scoped>
.v-application {
  background-color: #f5f7fa;
}
</style>