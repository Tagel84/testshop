import { Page, Locator } from "@playwright/test";

export class ShopLoginPage {

    // 1. Variablen deklarieren
    readonly page: Page;
    readonly usernameInput: Locator;
    readonly passwortInput: Locator;
    readonly loginButton: Locator;
    readonly errorMessage: Locator;
    readonly logoutButton: Locator;
    readonly userMenu: Locator;
    readonly loginNavButton: Locator;

    // 2. Der Konstruktor
    constructor(page: Page) {
        this.page = page;

        // Formular-Elemente
        this.usernameInput = page.getByTestId('username-input');
        this.passwortInput = page.getByTestId('password-input');
        this.loginButton = page.getByTestId('login-btn');
        this.errorMessage = page.getByText('Invalid credentials');

        // Navigation / Auth-Status
        this.logoutButton = page.getByTestId('nav-logout');
        this.userMenu = page.getByTestId('nav-user-menu');
        this.loginNavButton = page.getByTestId('nav-login');
    }

    // 3. Aktionen (Methoden)
    async goto() {
        await this.page.goto('/login');
    }

    async login(user: string, pass: string) {
        await this.usernameInput.fill(user);
        await this.passwortInput.fill(pass);
        await this.loginButton.click();
    }

    async logout() {
        await this.logoutButton.click();
    }



} //