<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <h2 class="text-xl font-bold">Upload & Mint NFT Baru</h2>
      </template>

      <UFormGroup label="Nama NFT" class="mb-4">
        <UInput v-model="form.name" placeholder="Contoh: My Cool Cat" />
      </UFormGroup>

      <UFormGroup label="Deskripsi" class="mb-4">
        <UTextarea
          v-model="form.description"
          placeholder="Deskripsikan NFT Anda..."
          autoresize
        />
      </UFormGroup>

      <UFormGroup label="File Gambar">
        <input
          type="file"
          @change="onFileChange"
          accept="image/*"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/50 dark:file:text-primary-400 dark:hover:file:bg-primary-900"
        />
      </UFormGroup>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            @click="isOpen = false"
            color="gray"
            variant="ghost"
            label="Batal"
          />
          <UButton
            @click="handleSubmit"
            :loading="isLoading"
            label="Upload & Mint"
          />
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
import { ref } from "vue";

const isOpen = defineModel("isOpen");
const isLoading = defineModel("isLoading");

const form = ref({
  name: "",
  description: "",
  file: null,
});

const emit = defineEmits(["submit"]);

function onFileChange(e) {
  const target = e.target;
  if (target.files && target.files[0]) {
    form.value.file = target.files[0];
  }
}

function handleSubmit() {
  emit("submit", { ...form.value });
}
</script>
