export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'korbazar_products');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/ufteavlh/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Cloudinary response:', errText);
      throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};
