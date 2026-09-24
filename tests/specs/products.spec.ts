import { test, expect } from "@playwright/test";
import { ProductsPage } from "../pages/ProductsPage";
import { products } from "../../src/lib/data";

test.describe('Katalog & Suche Funktionalität', () => {

    test.describe('1. Kategorie-Filter (Data-Driven für alle Kategorien)', () => {
        const categories = ['Electronics', 'Accessories', 'Office', 'Home'];

        for (const category of categories) {
            test(`Kategorie "${category}": Filtert korrekt und zeigt passende Produkte`, async ({ page }) => {
                const productsPage = new ProductsPage(page);
                await productsPage.goto();

                // Kategorie auswählen
                await productsPage.selectCategory(category);
                await expect(page).toHaveURL(new RegExp(`category=${category}`, 'i'));

                // Alle sichtbaren Produktkarten prüfen: Haben sie das korrekte Kategorie-Label?
                const cards = page.locator('.grid-products .card');
                const count = await cards.count();
                expect(count).toBeGreaterThan(0);

                for (let i = 0; i < count; i++) {
                    await expect(cards.nth(i)).toContainText(category);
                }
            });
        }
    });

    test.describe('2. Produktsuche (Data-Driven für ALLE 26 Produkte im Shop)', () => {
        // Wir iterieren über ALLE 26 Produkte direkt aus der Datenbank
        for (const product of products) {
            test(`Produkt ID ${product.id}: "${product.name}" auffindbar mit korrektem Preis ($${product.price})`, async ({ page }) => {
                const productsPage = new ProductsPage(page);
                await productsPage.goto();

                // Nach dem exakten Produktnamen suchen
                await productsPage.search(product.name);

                // 1. Die Karte des gesuchten Produkts MUSS auf der Seite angezeigt werden
                const card = productsPage.getProductCard(product.id);
                await expect(card).toBeVisible();

                // 2. Der angezeigte Name muss exakt übereinstimmen
                await expect(page.getByTestId(`product-name-${product.id}`)).toHaveText(product.name);

                // 3. Der Preis muss korrekt formatiert angezeigt werden
                await expect(page.getByTestId(`product-price-${product.id}`)).toContainText(`${product.price}`);
            });
        }
    });

    test.describe('3. Filter-Reset & Visuelle Prüfung', () => {
        test('Filter wieder zurücksetzen (Clear Filters)', async ({ page }) => {
            const productsPage = new ProductsPage(page);
            await productsPage.goto();
            await productsPage.search('Watch');

            await productsPage.clearFiltersButton.click();

            await expect(page).toHaveURL('/');
            await expect(productsPage.getProductCard(1)).toBeVisible();
            await expect(productsPage.getProductCard(2)).toBeVisible();
        });

        test('Visuelle Prüfung: Smartphone Stand (Screenshot-Vergleich)', async ({ page }) => {
            const productsPage = new ProductsPage(page);
            await productsPage.goto();

            await productsPage.search('Smartphone Stand');
            const standCard = productsPage.getProductCard(11);
            await expect(standCard).toBeVisible();

            await expect(standCard).toHaveScreenshot('smartphone-stand.png');
        });
    });

    test.describe('4. Negativ-Tests (Katalog & Detailansicht)', () => {
        test('Negativ-Test: Suche nach nicht existierendem Produkt zeigt "No products found."', async ({ page }) => {
            const productsPage = new ProductsPage(page);
            await productsPage.goto();

            // Suche nach einem Fantasie-Begriff
            await productsPage.search('FantasieProdukt99999XYZ');

            // Keine Produktkarten dürfen gerendert werden
            const count = await page.locator('.grid-products .card').count();
            expect(count).toBe(0);

            // Hinweistext muss sichtbar sein
            await expect(page.getByText('No products found.')).toBeVisible();
        });

        test('Negativ-Test: Aufruf einer ungültigen Produkt-ID zeigt "Product not found"', async ({ page }) => {
            // Ungültige Produkt-ID direkt in der URL ansteuern
            await page.goto('/products/88888');

            // 404-Fehlertext auf der Seite prüfen
            await expect(page.getByText('Product not found')).toBeVisible();
        });
    });

});
