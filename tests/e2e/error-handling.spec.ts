import { test, expect } from '@playwright/test';

test.describe('Edge Case: Error Handling', () => {
    test('should handle buggy product id 999 gracefully', async ({ page }) => {
        // Setup listener for alert
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Internal Server Error');
            await dialog.dismiss();
        });

        // 1. Login (Required for checkout)
        await page.goto('/login');
        await page.getByTestId('username-input').fill('consultant');
        await page.getByTestId('password-input').fill('pwd');
        await page.getByTestId('login-btn').click();
        await expect(page).toHaveURL('/');

        // 2. Setup logic (add buggy product)
        // await page.goto('/'); // Already at home after login

        // Search for the glitchy gadget to ensure it's visible
        await page.waitForLoadState('networkidle');
        await page.getByTestId('search-input').fill('Glitchy Gadget');
        await page.getByTestId('search-submit').click();

        const productCard = page.getByTestId('product-card-999');
        await expect(productCard).toBeVisible();

        // Give a moment for component hydration after server render
        await page.waitForTimeout(1000);

        // Add to cart
        await productCard.getByTestId('add-to-cart-999').click();

        // Verify "Added!" state confirms click handler fired
        await expect(productCard.getByTestId('add-to-cart-999')).toHaveText('Added!', { timeout: 5000 });

        // Verify via Nav count (robust)
        await expect(page.getByTestId('nav-cart-count')).toHaveText('1');

        // 2. Proceed to checkout
        await page.goto('/cart');
        await expect(page.getByTestId('checkout-init-btn')).toBeVisible(); // Checkout init button

        await page.getByTestId('checkout-init-btn').click();

        // 3. Submit order
        await page.getByTestId('checkout-name').fill('Tester');
        await page.getByTestId('checkout-address').fill('Test Address');
        await page.getByTestId('checkout-city').fill('Test City');
        await page.getByTestId('checkout-zip').fill('12345');
        await page.getByTestId('checkout-email').fill('test@example.com');

        // Wait for potential alert when clicking submit
        await page.getByTestId('submit-order-btn').click();

        // 4. Verification included in dialog listener

        // 5. Verify App hasn't crashed (still on page)
        await expect(page.getByTestId('submit-order-btn')).toBeVisible();
    });
});
