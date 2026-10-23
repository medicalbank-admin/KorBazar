export type Product = {
  id: string;
  title: string;
  price: number;
  storeName: string;
  isPremium: boolean;
  rating: number;
  category: string;
  image: string;
};

export const categories = [
  "Cakes & Bakes", "Handmade Jewelry", "Crafts & Decor", "Embroidered Items", "Candles", "Gift Hampers"
];

export const mockProducts: Product[] = Array.from({ length: 20 }).map((_, i) => {
  const isPremium = i < 15;
  return {
    id: `prod-${i + 1}`,
    title: isPremium ? `Premium Handmade Item ${i + 1}` : `Standard Local Good ${i + 1}`,
    price: Math.floor(Math.random() * 2000) + 300,
    storeName: isPremium ? "Ayesha's Bakes" : "Sara's Crafts",
    isPremium,
    rating: Number((Math.random() * (5 - 3.5) + 3.5).toFixed(1)),
    category: categories[Math.floor(Math.random() * categories.length)],
    image: `https://placehold.co/400x400/E8F5E9/118A36?text=Product+${i + 1}`
  };
});
