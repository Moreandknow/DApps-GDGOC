<template>
  <UCard>
    <template #header>
      <div class="aspect-w-1 aspect-h-1 w-full overflow-hidden">
        <img
          :src="nft.image"
          :alt="nft.name"
          class="w-full h-full object-cover"
        />
      </div>
    </template>
    <h3 class="font-bold text-lg truncate">{{ nft.name }}</h3>
    <p class="text-gray-500 dark:text-gray-400 text-sm mt-1 h-10 line-clamp-2">
      {{ nft.description }}
    </p>
  </UCard>
</template>

<script setup>
defineProps({
  nft: {
    id: String,
    name: String,
    description: String,
    image: String,
  },
});
</script>
