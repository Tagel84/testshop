import { test, expect } from "@playwright/test";
import { ShopLoginPage } from "../pages/LoginPage";

test.describe('Login Funktionalität', () => {

    test('Szenario 1: Erfolgreicher Login (Happy Path)', async ({ page }) => {
        // 1. Arrange (Vorbereitung)
        const loginPage = new ShopLoginPage(page);
        await loginPage.goto();

        // 2. Act (Einloggen mit gültigen Daten)
        await loginPage.login('consultant', 'pwd');

        // 3. Assert (Prüfen: Startseite erreicht & Benutzername sichtbar)
        await expect(page).toHaveURL('/');
        await expect(page.getByTestId('nav-user-menu')).toContainText('consultant');
    });

    test('Szenario 2: Fehlgeschlagener Login mit falschem Passwort (Negativ-Test)', async ({ page }) => {
        // 1. Arrange (Vorbereitung)
        const loginPage = new ShopLoginPage(page);
        await loginPage.goto();

        // 2. Act (Einloggen mit falschem Passwort)
        await loginPage.login('consultant', 'falsches-passwort');

        // 3. Assert (Prüfen: Fehlermeldung sichtbar & weiterhin auf Login-Seite)
        await expect(loginPage.errorMessage).toBeVisible();
        await expect(page).toHaveURL('/login');
    });

    test('Szenario 3: Erfolgreicher Logout', async ({ page }) => {
        // 1. Arrange: Erst einloggen und sicherstellen, dass wir angemeldet sind
        const loginPage = new ShopLoginPage(page);
        await loginPage.goto();
        await loginPage.login('consultant', 'pwd');
        await expect(loginPage.userMenu).toBeVisible();

        // 2. Act: Logout durchführen
        await loginPage.logout();

        // 3. Assert: Prüfen, dass der Login-Link wieder da ist und das User-Menü weg ist
        await expect(loginPage.loginNavButton).toBeVisible();
        await expect(loginPage.userMenu).not.toBeVisible();
    });

    test('Szenario 4: Fehlgeschlagener Login mit unbekanntem Benutzer (Negativ-Test)', async ({ page }) => {
        const loginPage = new ShopLoginPage(page);
        await loginPage.goto();

        await loginPage.login('nicht-existierender-user', 'irgendein-passwort');

        await expect(loginPage.errorMessage).toBeVisible();
        await expect(page).toHaveURL('/login');
    });

    test('Szenario 5: Leere Eingabefelder verhindern Login durch Pflichtfeld-Prüfung (Negativ-Test)', async ({ page }) => {
        const loginPage = new ShopLoginPage(page);
        await loginPage.goto();

        // Klick auf Sign In ohne Eingabe von Daten
        await loginPage.loginButton.click();

        // URL bleibt /login und HTML5 Formularvalidierung verhindert das Absenden
        await expect(page).toHaveURL('/login');
        const isUsernameInvalid = await loginPage.usernameInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
        expect(isUsernameInvalid).toBe(true);
    });

});