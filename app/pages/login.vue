<template>
  <div class="container">
    <v-img 
      :width="200" 
      :max-height="300"
      src="~/assets/icons/logo.svg" 
    />
    <v-sheet class="mx-auto" style="background-color: #1976D2;" width="300">
      <v-form fast-fail @submit.prevent>
        <v-text-field
          variant="solo-filled"
          v-model="firstName"
          :rules="firstNameRules"
          label="First name"
        ></v-text-field>

        <v-text-field
          variant="solo-filled"
          v-model="lastName"
          :rules="lastNameRules"
          label="Last name"
        ></v-text-field>
        <v-btn class="mt-2" type="submit" :onClick="handleSubmit" block>Entrar</v-btn>
      </v-form>
    </v-sheet>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth' })
</script>

<script>
export default {
  name: 'LoginPage',
  layout: 'auth',
  data(){
    return {
      firstName: '',
      lastName: '',
      firstNameRules: [
        value => {
          if (value?.length >= 3) return true
          return 'First name must be at least 3 characters.'
        },
      ],
      lastNameRules: [
        value => {
          if (/[^0-9]/.test(value)) return true
          return 'Last name can not contain digits.'
        },
      ]
    }
  },
  methods: {
    handleSubmit(){
      console.log('submit!', { firstName: this.firstName, lastName: this.lastName })
      this.$router.push('/home')
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
</style>