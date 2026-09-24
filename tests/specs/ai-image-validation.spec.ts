import { test, expect } from "@playwright/test";
import { ProductsPage } from "../pages/ProductsPage";
import { validateProductImageWithAI } from "../utils/aiVision";

test.describe('KI-gestützte Bildvalidierung (Vision AI Testing)', () => {

    test('1. Gegenprobe: "Minimalist Watch" hat ein passendes Produktbild', async ({ page }) => {
        const productsPage = new ProductsPage(page);
        await productsPage.goto();

        // 1. Produkt aufrufen
        await productsPage.search('Minimalist Watch');
        const watchCard = productsPage.getProductCard(2);
        await expect(watchCard).toBeVisible();

        // 2. Playwright nimmt einen Screenshot nur vom Bild-Element
        const imageLocator = watchCard.locator('img');
        const imageBuffer = await imageLocator.screenshot();

        // 3. Bild an Gemini Vision AI senden
        const result = await validateProductImageWithAI(
            imageBuffer,
            'Minimalist Watch',
            'A timeless classic. This minimalist watch features a sapphire crystal face and a genuine leather strap.'
        );

        console.log(`[KI-Analyse Uhr]: Erkannt: "${result.detected}" | Passt: ${result.matches}`);

        // 4. Assertion: Die KI muss bestätigen, dass das Bild zum Produkt passt
        expect(result.matches, `KI meint Bild passt nicht: ${result.reason}`).toBe(true);
    });

    test('2. Bug-Detektor: "Smartphone Stand" hat ein falsches Produktbild (Grasfeld)', async ({ page }) => {
        const productsPage = new ProductsPage(page);
        await productsPage.goto();

        // 1. Smartphone Stand aufrufen
        await productsPage.search('Smartphone Stand');
        const standCard = productsPage.getProductCard(11);
        await expect(standCard).toBeVisible();

        // 2. Screenshot vom Bild machen
        const imageLocator = standCard.locator('img');
        const imageBuffer = await imageLocator.screenshot();

        // 3. Bild an Gemini Vision AI senden
        const result = await validateProductImageWithAI(
            imageBuffer,
            'Smartphone Stand',
            'Adjustable aluminum stand for your phone or tablet. Perfect for video calls and watching media.'
        );

        console.log(`[KI-Analyse Stand]: Erkannt: "${result.detected}" | Passt: ${result.matches} | Grund: "${result.reason}"`);

        // 4. Assertion: Die KI muss zuverlässig erkennen, dass das Bild NICHT zum Produkt passt!
        expect(result.matches, `KI hätte Mismatch erkennen müssen: ${result.reason}`).toBe(false);
    });

});
