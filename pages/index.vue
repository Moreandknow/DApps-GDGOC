<template>
  <UContainer>
    <FeatureHeader
      :is-connected="isConnected"
      @connect-wallet="connectWallet"
      @open-upload-modal="isModalOpen = true"
    />

    <main class="py-8">
      <div v-if="isConnected">
        <div
          v-if="isLoading && nfts.length === 0"
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          <USkeleton v-for="i in 8" :key="i" class="h-80" />
        </div>
        <div
          v-else-if="nfts.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          <FeatureNftCard v-for="nft in nfts" :key="nft.id" :nft="nft" />
        </div>
        <div v-else-if="!isLoading" class="text-center py-16">
          <UIcon
            name="i-heroicons-archive-box-x-mark"
            class="text-5xl text-gray-400 mx-auto"
          />
          <p class="mt-4 text-gray-500 dark:text-gray-400">
            Anda belum memiliki NFT.
          </p>
          <UButton
            @click="isModalOpen = true"
            class="mt-4"
            label="Mulai Upload NFT Pertama Anda"
          />
        </div>
      </div>
      <div v-else class="text-center py-20">
        <h2 class="text-3xl font-bold">Selamat Datang!</h2>
        <p class="mt-2 text-lg text-gray-500 dark:text-gray-400">
          Hubungkan wallet Anda untuk melihat koleksi NFT.
        </p>
        <UButton
          @click="connectWallet"
          class="mt-6"
          size="xl"
          label="Connect Wallet"
        />
      </div>
    </main>

    <ModalUpload
      v-model:is-open="isModalOpen"
      v-model:is-loading="isLoading"
      @submit="handleUploadAndMint"
    />
  </UContainer>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { contractAbi } from "~/contracts/abi";
import { ethers } from "ethers";

const account = ref(null);
const nfts = ref([]);
const isLoading = ref(false);
const isModalOpen = ref(false);
const toast = useToast();

const contractAddress = "0xa4Cd2bB688483DA3326cCbbeFF0E8dD0Dc442e86";

const isConnected = computed(() => !!account.value);
const provider = computed(() => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
});

const connectWallet = async () => {
  if (!provider.value) {
    toast.add({
      title: "Error",
      description: "MetaMask tidak terinstal.",
      color: "red",
    });
    return;
  }
  try {
    const accounts = await provider.value.send("eth_requestAccounts", []);
    account.value = accounts[0];
    toast.add({
      title: "Sukses",
      description: "Wallet terhubung!",
      icon: "i-heroicons-check-circle",
    });
    fetchNfts();
  } catch (error) {
    console.error("Error connecting wallet:", error);
    toast.add({
      title: "Error",
      description: "Gagal menghubungkan wallet.",
      color: "red",
    });
  }
};

const checkConnection = async () => {
  if (!provider.value) return;
  const accounts = await provider.value.listAccounts();
  if (accounts.length > 0) {
    account.value = accounts[0].address;
    fetchNfts();
  }
};

const fetchNfts = async () => {
  if (!provider.value || !account.value) return;
  isLoading.value = true;
  nfts.value = [];
  try {
    const contract = new ethers.Contract(
      contractAddress,
      contractAbi,
      provider.value
    );

    const balance = await contract.balanceOf(account.value);
    if (balance.toString() === "0") return;

    const tokenPromises = [];
    for (let i = 0; i < balance; i++) {
      tokenPromises.push(contract.tokenOfOwnerByIndex(account.value, i));
    }
    const ownedTokens = await Promise.all(tokenPromises);

    const nftData = await Promise.all(
      ownedTokens.map(async (tokenId) => {
        const tokenURI = await contract.tokenURI(tokenId);
        const response = await fetch(
          tokenURI.replace(/^ipfs:\/\//, "https://gateway.pinata.cloud/ipfs/")
        );
        const metadata = await response.json();
        return {
          id: tokenId.toString(),
          name: metadata.name,
          description: metadata.description,
          image: metadata.image.replace(
            /^ipfs:\/\//,
            "https://gateway.pinata.cloud/ipfs/"
          ),
        };
      })
    );
    nfts.value = nftData;
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    toast.add({
      title: "Error",
      description: "Gagal mengambil data NFT.",
      color: "red",
    });
  } finally {
    isLoading.value = false;
  }
};

const handleUploadAndMint = async (formData) => {
  if (!formData.file || !formData.name || !formData.description) {
    toast.add({
      title: "Error",
      description: "Harap isi semua field.",
      color: "red",
    });
    return;
  }

  isLoading.value = true;
  const fd = new FormData();
  fd.append("name", formData.name);
  fd.append("description", formData.description);
  fd.append("image", formData.file);

  try {
    const result = await $fetch("/api/upload", { method: "POST", body: fd });

    if (result.success && provider.value) {
      toast.add({
        title: "Upload Sukses",
        description: "Metadata diunggah, memulai proses minting...",
      });

      const signer = await provider.value.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
      );
      const tx = await contract.mintMemeNFT(result.metadataUrl);

      toast.add({
        title: "Menunggu Konfirmasi",
        description: "Transaksi minting sedang diproses.",
        color: "blue",
      });
      await tx.wait();

      toast.add({
        title: "Minting Berhasil!",
        description: "NFT Anda telah berhasil dibuat.",
        icon: "i-heroicons-check-circle",
      });
      isModalOpen.value = false;
      await fetchNfts();
    }
  } catch (e) {
    console.error("Upload/Mint Error:", e);
    toast.add({
      title: "Error",
      description: e.data?.message || "Terjadi kesalahan.",
      color: "red",
    });
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle hook
onMounted(() => {
  checkConnection();
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts) => {
      account.value = accounts[0] || null;
      if (account.value) fetchNfts();
      else nfts.value = [];
    });
  }
});
</script>

<style scoped></style>
