import { test, expect } from "@playwright/test";
import { ProductsPage } from "../pages/ProductsPage";
import { CartPage } from "../pages/CartPage";
import { ShopLoginPage } from "../pages/LoginPage";

test.describe('Warenkorb & Checkout Suite', () => {

    test.describe('1. Warenkorb-Mathematik & Mengenänderung', () => {

        test('Menge erhöhen verdoppelt den Preis, verringern halbiert ihn', async ({ page }) => {
            const productsPage = new ProductsPage(page);
            const cartPage = new CartPage(page);

            // 1. Arrange: Minimalist Watch (ID 2, Preis: $149.50) in den Warenkorb legen
            await productsPage.goto();
            await productsPage.addToCart(2);

            // 2. Act: Zum Warenkorb gehen
            await cartPage.goto();
            await expect(cartPage.cartTotal).toHaveText('$149.50');

            // 3. Act: Menge um 1 erhöhen (auf 2 Stück)
            await cartPage.increaseQuantity(2);

            // 4. Assert: Preis muss sich auf $299.00 verdoppeln
            await expect(cartPage.cartTotal).toHaveText('$299.00');

            // 5. Act: Menge wieder um 1 verringern (auf 1 Stück)
            await cartPage.decreaseQuantity(2);

            // 6. Assert: Preis wieder $149.50
            await expect(cartPage.cartTotal).toHaveText('$149.50');
        });

        test('Produkt komplett entfernen leert den Warenkorb', async ({ page }) => {
            const productsPage = new ProductsPage(page);
            const cartPage = new CartPage(page);

            await productsPage.goto();
            await productsPage.addToCart(2);

            await cartPage.goto();
            await expect(page.getByTestId('cart-item-2')).toBeVisible();

            // Produkt löschen
            await cartPage.removeItem(2);

            // Warenkorb muss leer sein
            await expect(cartPage.emptyCartMessage).toBeVisible();
            await expect(page.getByTestId('cart-item-2')).not.toBeVisible();
        });

    });

    test.describe('2. Gutschein-Logik (Positiv- & Negativ-Tests)', () => {

        test.beforeEach(async ({ page }) => {
            // Vor jedem Gutschein-Test: Kopfhörer ($299.99) in den Warenkorb legen
            const productsPage = new ProductsPage(page);
            await productsPage.goto();
            await productsPage.addToCart(1);
        });

        test('Negativ-Test: Ungültiger Gutscheincode wird abgewiesen', async ({ page }) => {
            const cartPage = new CartPage(page);
            await cartPage.goto();

            // Falschen Code eingeben
            await cartPage.applyVoucher('FAKEREBATT100');

            // Fehlermeldung muss erscheinen und kein Rabatt abgezogen werden
            await expect(cartPage.voucherError).toBeVisible();
            await expect(cartPage.cartTotal).toHaveText('$299.99');
        });

        test('Positiv-Test: Gutschein "SAVE10" zieht 10% Rabatt ab', async ({ page }) => {
            const cartPage = new CartPage(page);
            await cartPage.goto();

            // SAVE10 anwenden (10% von 299.99 = 29.999 -> neuer Preis: $269.99)
            await cartPage.applyVoucher('SAVE10');

            await expect(cartPage.discountSuccess).toBeVisible();
            await expect(cartPage.cartTotal).toHaveText('$269.99');
        });

        test('Positiv-Test: Gutschein "TEST20" zieht 20% Rabatt ab', async ({ page }) => {
            const cartPage = new CartPage(page);
            await cartPage.goto();

            // TEST20 anwenden (20% von 299.99 = 59.998 -> neuer Preis: $239.99)
            await cartPage.applyVoucher('TEST20');

            await expect(cartPage.discountSuccess).toBeVisible();
            await expect(cartPage.cartTotal).toHaveText('$239.99');
        });

    });

    test.describe('3. Checkout & Berechtigungen (Security & Happy Path)', () => {

        test('Negativ-Test (Gast): Unangemeldete Nutzer dürfen nicht direkt zur Kasse', async ({ page }) => {
            const productsPage = new ProductsPage(page);
            const cartPage = new CartPage(page);

            await productsPage.goto();
            await productsPage.addToCart(1);
            await cartPage.goto();

            // "Proceed to Checkout" darf NICHT existieren
            await expect(cartPage.checkoutInitBtn).not.toBeVisible();

            // Stattdessen MUSS der Login-Hinweis angezeigt werden
            await expect(cartPage.loginToCheckoutBtn).toBeVisible();
        });

        test('Happy Path: Vollständiger Kaufabschluss für angemeldeten Kunden', async ({ page }) => {
            // 1. Arrange: Login
            const loginPage = new ShopLoginPage(page);
            await loginPage.goto();
            await loginPage.login('consultant', 'pwd');
            await expect(page).toHaveURL('/');

            // 2. Produkt in den Warenkorb
            const productsPage = new ProductsPage(page);
            await productsPage.addToCart(2); // Watch

            // 3. Zur Kasse gehen
            const cartPage = new CartPage(page);
            await cartPage.goto();
            await expect(cartPage.checkoutInitBtn).toBeVisible();
            await cartPage.checkoutInitBtn.click();

            // 4. Lieferadresse ausfüllen
            await cartPage.fillShippingDetails({
                name: 'Max Mustermann',
                address: 'Musterstraße 42',
                city: 'München',
                zip: '80331',
                email: 'max@mustermann.de'
            });

            // 5. Bestellung verbindlich absenden
            await cartPage.placeOrder();

            // 6. Assert: Erfolgsseite mit Bestätigung
            await expect(page.locator('h1')).toHaveText('Order Confirmed!');
            await expect(page.locator('body')).toContainText('Thank you for your purchase');
            await expect(page.getByText(/ORDER-/)).toBeVisible();
        });

        test('Edge Case (Fehlerbehandlung): Produkt ID 999 verursacht Server-Fehler beim Checkout', async ({ page }) => {
            // Dialog-Handler für die Fehlermeldung registrieren
            let dialogMessage = '';
            page.on('dialog', async dialog => {
                dialogMessage = dialog.message();
                await dialog.dismiss();
            });

            // 1. Login
            const loginPage = new ShopLoginPage(page);
            await loginPage.goto();
            await loginPage.login('consultant', 'pwd');
            await expect(page).toHaveURL('/');

            // 2. Glitchy Gadget (ID 999) direkt aufrufen und hinzufügen
            await page.goto('/products/999');
            await page.getByTestId('add-to-cart-large').click();
            await expect(page.getByTestId('nav-cart-count')).toHaveText('1');

            // 3. Checkout versuchen
            const cartPage = new CartPage(page);
            await cartPage.goto();
            await cartPage.checkoutInitBtn.click();
            await cartPage.fillShippingDetails({
                name: 'Test Tester',
                address: 'Testweg 1',
                city: 'Hamburg',
                zip: '20095',
                email: 'test@example.com'
            });

            await cartPage.placeOrder();

            // 4. Assert: Dialog muss den Server-Fehler enthalten haben und App darf nicht abstürzen
            await expect.poll(() => dialogMessage).toContain('Internal Server Error: processing failed for item 999');
            await expect(cartPage.submitOrderBtn).toBeVisible();
        });

        test('Negativ-Test (Validierung): Ungültige Postleitzahl blockiert die Bestellung', async ({ page }) => {
            // 1. Login
            const loginPage = new ShopLoginPage(page);
            await loginPage.goto();
            await loginPage.login('consultant', 'pwd');
            await expect(page).toHaveURL('/');

            // 2. Produkt in den Warenkorb
            const productsPage = new ProductsPage(page);
            await productsPage.addToCart(1);

            // 3. Zur Kasse gehen
            const cartPage = new CartPage(page);
            await cartPage.goto();
            await cartPage.checkoutInitBtn.click();

            // 4. Formular mit UNGÜLTIGER PLZ ausfüllen ("123" statt 5 Ziffern)
            await cartPage.fillShippingDetails({
                name: 'Max Mustermann',
                address: 'Musterstraße 42',
                city: 'München',
                zip: '123', // Fehler: Muss 5 Ziffern lang sein (pattern="\d{5}")
                email: 'max@mustermann.de'
            });

            // 5. Absenden versuchen
            await cartPage.placeOrder();

            // 6. Assert: Das PLZ-Feld ist HTML5-ungültig und keine Auftragsbestätigung erfolgt
            const isZipInvalid = await cartPage.zipInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
            expect(isZipInvalid).toBe(true);
            await expect(page.locator('h1')).not.toHaveText('Order Confirmed!');
        });

        test('Negativ-Test (Leerer Warenkorb): Checkout-Button wird bei leerem Warenkorb nicht angeboten', async ({ page }) => {
            const cartPage = new CartPage(page);
            await cartPage.goto();

            // Leerer Warenkorb zeigt Hinweistext
            await expect(cartPage.emptyCartMessage).toBeVisible();

            // Checkout-Buttons dürfen gar nicht existieren
            await expect(cartPage.checkoutInitBtn).not.toBeVisible();
            await expect(cartPage.loginToCheckoutBtn).not.toBeVisible();
        });

    });

});
