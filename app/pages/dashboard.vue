<template>
	<div class="pa-6">
		<v-alert type="info" variant="tonal">
			A página de Dashboard foi removida.
		</v-alert>
	</div>
</template>

<script setup>
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
