import { test, expect } from "@playwright/test";
import { validateProductImageWithAI, AiVisionResult } from "../utils/aiVision";

test.describe('Automatischer KI-Bild-Scanner (Unabhängig von Auflösung & Monitor)', () => {

    test('Scannt Seite 2 vollautomatisch und sammelt alle Bildfehler', async ({ page }) => {
        // Genügend Zeit für die 9 KI-Analysen einräumen
        test.setTimeout(90000);

        // 1. Auflösungs-Unabhängigkeit: Feste virtuelle Browser-Größe für konsistentes Rendering
        await page.setViewportSize({ width: 1280, height: 800 });

        // 2. Seite 2 aufrufen (hier liegen u.a. Monitor, Smartphone Stand, Coffee Maker etc.)
        await page.goto('/?page=2');
        await page.waitForLoadState('networkidle');

        // 3. Alle Produktkarten dynamisch auf der Seite finden – OHNE VORWISSEN!
        const cards = page.locator('.grid-products .card');
        const count = await cards.count();

        console.log(`\n🔍 KI-Scanner startet: Analysiere ${count} Produkte auf Seite 2...\n`);

        // Hier sammeln wir alle Fehler, damit der Test nicht beim ersten Fehler stoppt,
        // sondern ALLE Bilder der Seite analysiert und am Ende einen Gesamtbericht liefert!
        const failedProducts: { title: string; detected: string; reason: string }[] = [];

        for (let i = 0; i < count; i++) {
            const card = cards.nth(i);

            // Zur Karte scrollen, damit das Bild sauber sichtbar und geladen ist
            await card.scrollIntoViewIfNeeded();

            // Titel & Beschreibung dynamisch direkt vom Bildschirm lesen
            const title = (await card.locator('h2').innerText()).trim();
            const description = (await card.locator('p').innerText()).trim();

            // Screenshot exakt vom Bild-Element erstellen
            const imgLocator = card.locator('img');
            const imgBuffer = await imgLocator.screenshot();

            // Bild an die Gemini Vision AI schicken
            const result: AiVisionResult = await validateProductImageWithAI(imgBuffer, title, description);

            if (result.matches) {
                console.log(`  ✅ [${i + 1}/${count}] "${title}": Bild passt ("${result.detected}")`);
            } else {
                console.log(`  ❌ [${i + 1}/${count}] "${title}": BILD PASST NICHT! ("${result.detected}")`);
                failedProducts.push({
                    title,
                    detected: result.detected,
                    reason: result.reason
                });
            }

            // Kleine Pause, um API-Ratenlimits zu schonen
            await new Promise(r => setTimeout(r, 1000));
        }

        // 4. Abschluss-Prüfung: Der Scanner muss alle 3 unpassenden Produktbilder zuverlässig aufspüren!
        expect(failedProducts.length, `Erwartet wurden 3 Bildfehler, aber es wurden ${failedProducts.length} gefunden!`).toBe(3);
    });

});
