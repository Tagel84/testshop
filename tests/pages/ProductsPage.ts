import { Page, Locator } from "@playwright/test";

export class ProductsPage {
    readonly page: Page;
    readonly searchInput: Locator;
    readonly searchSubmitButton: Locator;
    readonly clearFiltersButton: Locator;
    readonly productsGrid: Locator;

    constructor(page: Page) {
        this.page = page;

        // Suchleiste und Filter
        this.searchInput = page.getByTestId('search-input');
        this.searchSubmitButton = page.getByTestId('search-submit');
        this.clearFiltersButton = page.getByTestId('clear-filters');
        this.productsGrid = page.locator('.grid-products');
    }

    // Zur Katalog-Startseite navigieren
    async goto() {
        await this.page.goto('/');
    }

    // Nach einem Produktbegriff suchen
    async search(term: string) {
        await this.searchInput.fill(term);
        await this.searchSubmitButton.click();
    }

    // Nach Kategorie filtern (z.B. 'accessories', 'electronics', 'office', 'home')
    async selectCategory(categoryName: string) {
        const categoryButton = this.page.getByTestId(`category-${categoryName.toLowerCase()}`);
        await categoryButton.click();
    }

    // Spezifische Produktkarte anhand der ID abrufen
    getProductCard(productId: number): Locator {
        return this.page.getByTestId(`product-card-${productId}`);
    }

    // Liefert alle aktuell angezeigten Produktnamen zurück
    async getAllProductTitles(): Promise<string[]> {
        return await this.page.getByTestId(/^product-name-/).allInnerTexts();
    }

    // Ein Produkt anhand der ID in den Warenkorb legen
    async addToCart(productId: number) {
        await this.page.getByTestId(`add-to-cart-${productId}`).click();
    }
}
