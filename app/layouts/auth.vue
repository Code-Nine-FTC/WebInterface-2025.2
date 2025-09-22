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

<style lang="scss" scoped>
.v-main {
  background-color: var(--color-primary, #1976d2) !important;
}
</style>