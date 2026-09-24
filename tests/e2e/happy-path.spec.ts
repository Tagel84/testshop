import { test, expect } from '@playwright/test';

test.describe('Happy Path: Customer Journey', () => {
    test('should allow a user to login, shop, and checkout', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.getByTestId('username-input').fill('consultant');
        await page.getByTestId('password-input').fill('pwd');
        await page.getByTestId('login-btn').click();

        await expect(page).toHaveURL('/');

        // 2. Search & Filter
        // Filter by Accessories
        await page.getByTestId('category-accessories').click();
        await expect(page.getByTestId('category-accessories')).toHaveClass(/btn-primary/);

        // Search for "Watch"
        await page.getByTestId('search-input').fill('Watch');
        await page.getByTestId('search-submit').click();

        // 3. Add to Cart
        // Wait for hydration/network to be sure
        await page.waitForLoadState('networkidle');

        const productCard = page.getByTestId('product-card-2');
        await expect(productCard).toBeVisible();
        await productCard.getByTestId('add-to-cart-2').click();

        // Verify Cart Badge updates to 1 (more robust than checking ephemeral "Added!" text)
        await expect(page.getByTestId('nav-cart-count')).toHaveText('1');

        // 4. Cart updates
        await page.goto('/cart');
        await expect(page.getByTestId('cart-item-2')).toBeVisible();

        const priceElement = page.getByTestId('cart-total');
        await expect(priceElement).toContainText('149.50');

        // Increase quantity to 2
        await page.getByTestId('increase-qty-2').click();

        await expect(priceElement).toContainText('299.00');

        // 5. Checkout flow
        // Open checkout form
        await page.getByTestId('checkout-init-btn').click();

        // Fill form
        await page.getByTestId('checkout-name').fill('John Doe');
        await page.getByTestId('checkout-address').fill('123 Test St');
        await page.getByTestId('checkout-city').fill('Test City');
        await page.getByTestId('checkout-zip').fill('12345');
        await page.getByTestId('checkout-email').fill('john@example.com');

        await page.getByTestId('submit-order-btn').click();

        // Verify success by text content on the page
        await expect(page.locator('h1')).toHaveText('Order Confirmed!');
        await expect(page.locator('body')).toContainText('Thank you for your purchase');
    });
});
