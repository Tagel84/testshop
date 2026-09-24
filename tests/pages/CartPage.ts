import { Page, Locator } from "@playwright/test";

export class CartPage {
    readonly page: Page;
    readonly cartTotal: Locator;
    readonly voucherInput: Locator;
    readonly applyVoucherBtn: Locator;
    readonly voucherError: Locator;
    readonly discountSuccess: Locator;
    readonly emptyCartMessage: Locator;
    readonly checkoutInitBtn: Locator;
    readonly loginToCheckoutBtn: Locator;

    // Checkout Formularfelder
    readonly nameInput: Locator;
    readonly addressInput: Locator;
    readonly cityInput: Locator;
    readonly zipInput: Locator;
    readonly emailInput: Locator;
    readonly submitOrderBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        // Warenkorb Übersicht
        this.cartTotal = page.getByTestId('cart-total');
        this.voucherInput = page.getByTestId('voucher-input');
        this.applyVoucherBtn = page.getByTestId('apply-voucher-btn');
        this.voucherError = page.getByText('Invalid voucher code');
        this.discountSuccess = page.getByText('Discount applied!');
        this.emptyCartMessage = page.getByText('Your Cart is Empty');
        this.checkoutInitBtn = page.getByTestId('checkout-init-btn');
        this.loginToCheckoutBtn = page.getByText('Login to Checkout');

        // Formular
        this.nameInput = page.getByTestId('checkout-name');
        this.addressInput = page.getByTestId('checkout-address');
        this.cityInput = page.getByTestId('checkout-city');
        this.zipInput = page.getByTestId('checkout-zip');
        this.emailInput = page.getByTestId('checkout-email');
        this.submitOrderBtn = page.getByTestId('submit-order-btn');
    }

    async goto() {
        await this.page.goto('/cart');
    }

    // Mengen-Aktionen
    async increaseQuantity(productId: number) {
        await this.page.getByTestId(`increase-qty-${productId}`).click();
    }

    async decreaseQuantity(productId: number) {
        await this.page.getByTestId(`decrease-qty-${productId}`).click();
    }

    async removeItem(productId: number) {
        await this.page.getByTestId(`remove-item-${productId}`).click();
    }

    // Gutschein anwenden
    async applyVoucher(code: string) {
        await this.voucherInput.fill(code);
        await this.applyVoucherBtn.click();
    }

    // Checkout-Formular ausfüllen
    async fillShippingDetails(details: { name: string; address: string; city: string; zip: string; email: string }) {
        await this.nameInput.fill(details.name);
        await this.addressInput.fill(details.address);
        await this.cityInput.fill(details.city);
        await this.zipInput.fill(details.zip);
        await this.emailInput.fill(details.email);
    }

    // Bestellung absenden
    async placeOrder() {
        await this.submitOrderBtn.click();
    }
}
