<template>
  <header
    class="flex justify-between items-center py-4 border-b border-gray-200 dark:border-gray-800"
  >
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">MoreAndNFT</h1>
    <div class="flex items-center gap-4">
      <UButton
        v-if="!isConnected"
        @click="emit('connectWallet')"
        icon="i-heroicons-wallet"
        label="Connect Wallet"
      />
      <UButton
        v-else
        @click="emit('openUploadModal')"
        icon="i-heroicons-arrow-up-tray"
        label="Upload NFT"
      />
      <ClientOnly>
        <UColorModeButton />
      </ClientOnly>
    </div>
  </header>
</template>

<script setup>
const props = defineProps({
  isConnected: Boolean,
});

const emit = defineEmits(["connectWallet", "openUploadModal"]);
</script>
