export type AiVisionResult = {
    matches: boolean;
    detected: string;
    reason: string;
};

// .env automatisch laden falls noch nicht geladen
try {
    if (typeof (process as any).loadEnvFile === 'function') {
        (process as any).loadEnvFile();
    }
} catch {
    // Ignorieren falls .env bereits geladen ist
}

/**
 * Sendet einen Bild-Screenshot zusammen mit den Produktdaten an die Google Gemini Vision AI
 * und prüft, ob das Bild plausibel zum Produkt passt.
 */
export async function validateProductImageWithAI(
    imageBuffer: Buffer,
    productName: string,
    description: string = ''
): Promise<AiVisionResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY wurde nicht gefunden! Bitte in der .env-Datei hinterlegen.");
    }

    const base64Image = imageBuffer.toString('base64');

    const prompt = `Du bist ein hochpräziser QA-Testbot für E-Commerce.
Analysiere das übergebene Produktbild.
Das Produkt im Webshop hat folgende Stammdaten:
- Name: "${productName}"
- Beschreibung: "${description}"

Entscheide streng: Zeigt das Bild plausibel diesen Gegenstand oder passt es thematisch exakt dazu?
Wenn das Bild etwas völlig anderes zeigt (z.B. Natur/Gras/Feld für ein technisches Zubehörteil oder einen falschen Gegenstand), setze "matches" zwingend auf false.

Antworte AUSSCHLIESSLICH als valides JSON nach diesem Schema:
{
  "matches": boolean,
  "detected": "Sehr kurze deutsche Beschreibung, was wirklich auf dem Bild zu sehen ist (max. 1 Satz)",
  "reason": "Präzise Begründung auf Deutsch, warum das Bild zum Produkt passt oder nicht passt"
}`;

    let lastError: any;

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    { text: prompt },
                                    {
                                        inlineData: {
                                            mimeType: 'image/png',
                                            data: base64Image
                                        }
                                    }
                                ]
                            }
                        ],
                        generationConfig: {
                            responseMimeType: 'application/json'
                        }
                    })
                }
            );

            if (response.status === 503 || response.status === 429) {
                const errText = await response.text().catch(() => '');
                lastError = new Error(`Gemini API überlastet / Rate-Limit (HTTP ${response.status}): ${errText}`);
                console.warn(`  ⏳ Gemini meldet ${response.status} (Warteversuch ${attempt}/4)...`);
                await new Promise(r => setTimeout(r, 2000 * attempt));
                continue;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini Vision API HTTP Fehler (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!candidateText) {
                throw new Error("Keine Antwort von der Gemini Vision API erhalten.");
            }

            return JSON.parse(candidateText) as AiVisionResult;
        } catch (err: any) {
            lastError = err;
            console.error(`  ⚠️ Versuch ${attempt} fehlgeschlagen:`, err?.message || err);
            await new Promise(r => setTimeout(r, 2000 * attempt));
        }
    }

    const errorMsg = lastError instanceof Error ? lastError.message : String(lastError || "Unbekannter Fehler");
    throw new Error(errorMsg);
}
