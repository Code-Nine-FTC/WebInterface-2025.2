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
  name: "auth",
};
</script>

<style lang="scss" scoped>
.v-main {
  background: linear-gradient(-45deg, #0a3d62, #3c6382, #82ccdd, #0c2461);
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
}

@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
