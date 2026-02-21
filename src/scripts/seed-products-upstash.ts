import { upsertProducts } from "@/lib/vector/upstash";
import beautyProductsJson from "@/data/beauty_products.json";

interface Product {
  id: string;
  Product_Name: string;
  Brand: string;
  Category: string;
  Usage_Frequency?: string;
  Price_USD: number;
  Rating: number;
  Number_of_Reviews?: number;
  Product_Size: string;
  Skin_Type: string;
  Gender_Target?: string;
  Packaging_Type?: string;
  Main_Ingredient?: string;
  Cruelty_Free?: boolean;
  Country_of_Origin?: string;
  content: string;
  imageUrl: string;
}

async function seedProducts() {
  console.log("🌱 Starting to seed products from local JSON to Upstash...");
  
  try {
    const products = beautyProductsJson as unknown as Product[];
    console.log(`📦 Found ${products.length} products to seed`);
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`\n📤 Upserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)} (${batch.length} products)...`);
      
      await upsertProducts(batch);
      
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} completed`);
    }
    
    console.log("\n🎉 All products seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    process.exit(1);
  }
}

seedProducts();
