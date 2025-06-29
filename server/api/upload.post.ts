import { readFiles } from "h3-formidable";

export default defineEventHandler(async (event) => {
  const { files, fields } = await readFiles(event, {
    // Opsi formidable bisa ditambahkan di sini
  });

  const imageFile = files.image ? files.image[0] : null;
  const name = fields.name ? fields.name[0] : "";
  const description = fields.description ? fields.description[0] : "";

  if (!imageFile || !name || !description) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name, description, and image file are required.",
    });
  }

  try {
    // 1. Upload gambar ke Pinata
    const imageFormData = new FormData();
    imageFormData.append(
      "file",
      new Blob([imageFile.content], {
        type: imageFile.mimetype || "application/octet-stream",
      }),
      imageFile.originalFilename || "file"
    );
    imageFormData.append(
      "pinataMetadata",
      JSON.stringify({ name: `${name} Image` })
    );

    const imageUploadRes = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
        body: imageFormData,
      }
    );

    if (!imageUploadRes.ok) {
      throw new Error(
        `Failed to pin image to IPFS: ${await imageUploadRes.text()}`
      );
    }

    const imageData = await imageUploadRes.json();
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageData.IpfsHash}`;

    // 2. Upload metadata JSON ke Pinata
    const metadata = {
      name,
      description,
      image: imageUrl,
    };

    const jsonUploadRes = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: { name: `${name} Metadata` },
        }),
      }
    );

    if (!jsonUploadRes.ok) {
      throw new Error(
        `Failed to pin JSON to IPFS: ${await jsonUploadRes.text()}`
      );
    }

    const jsonBody = await jsonUploadRes.json();
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${jsonBody.IpfsHash}`;

    return {
      success: true,
      metadataUrl,
    };
  } catch (e: any) {
    console.error("Upload error:", e);
    throw createError({
      statusCode: 500,
      statusMessage: e.message,
    });
  }
});
