import fs from 'fs';
import path from 'path';

const LIPSTICK_IMAGES = [
    "https://i.ibb.co/xNJKzWC/evangeline-sarney-Nnsqp-Lji-A94-unsplash.jpg",
    "https://i.ibb.co/5gj8DTw0/laura-chouette-YMeu0da-A9-M-unsplash.jpg",
    "https://i.ibb.co/sd3J6Gjq/lipstick.avif",
    "https://i.ibb.co/B25hjFKL/lipstick2.avif"
];

const FACEMASK_IMAGES = [
    "https://i.ibb.co/Y4K15j70/laura-jaeger-DMf-TN5y-Y3-I8-unsplash.jpg",
    "https://i.ibb.co/Fk4rfDVp/laura-jaeger-LKh-UGHA0z54-unsplash.jpg"
];

const JSON_PATH = path.resolve(process.cwd(), 'src/data/beauty_products.json');

async function updateImages() {
    try {
        console.log("Reading beauty_products.json...");
        const fileContent = fs.readFileSync(JSON_PATH, 'utf-8');
        const data = JSON.parse(fileContent);

        console.log(`Updating ${data.length} products...`);

        data.forEach((product: any, index: number) => {
            const category = (product.Category || "").toLowerCase();
            const name = (product.Product_Name || "").toLowerCase();

            if (category.includes('lipstick') || name.includes('lipstick')) {
                product.imageUrl = LIPSTICK_IMAGES[index % LIPSTICK_IMAGES.length];
            } else if (category.includes('mask') || name.includes('mask')) {
                product.imageUrl = FACEMASK_IMAGES[index % FACEMASK_IMAGES.length];
            } else {
                // Fallback to lipstick as requested
                product.imageUrl = LIPSTICK_IMAGES[index % LIPSTICK_IMAGES.length];
            }
        });

        console.log("Writing updated data back to file...");
        fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
        console.log("✨ Successfully updated images in beauty_products.json");
    } catch (error) {
        console.error("❌ Failed to update images:", error);
    }
}

updateImages();
