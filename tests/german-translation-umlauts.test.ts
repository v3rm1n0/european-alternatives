import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = new URL("..", import.meta.url);

const asciiUmlautFallbackPattern =
  /\b(?:fuer|unterstuetz|verfueg|verschluess|schluess|vollstaend|standardmaess|groess|gross|ausser|oeff|ueber|aender|primaer|sphaer|souveraen|foeder|domaen|erklaer|pruef|faeh|moeg|geraet|rueck|gaeng|laeuf|waehr|koenn|fuehr|fueg|erfuell|frueh|spaet|loesch|loes|zugaeng|abhaeng|traeg|geschaeft|schuetz|guelt|itaet|saech|schraenk|haeufig|vorschlaeg|temporaer|verkaeuf|gelaend|anfaeng|sued|europae|naech|foerm|koenig|jaehr|stuend|populaer|woech|koerb|koern|schaetz|bloeck|binaer|werkstaett|erzaehl|titelsprueng|anhaeng|bestaet|kanael|raeum|paed|prae|persoen|plaetz|wuerd|spruech|saetz|oepnv|behoerd|laess|hoer|mueh|guet|kuen|abzueg|fluess|stuerz|gruen|gerae|huell|regulaer|unerwuensch|gebuehr|stuetz|massstab|massnahm|massgeschneid|fuss|strass)\w*/gi;

function listFiles(relativeDirectory: string, extension: string): string[] {
  const absoluteDirectory = new URL(`${relativeDirectory}/`, repositoryRoot);

  return readdirSync(absoluteDirectory)
    .filter((fileName) => fileName.endsWith(extension))
    .map((fileName) => join(relativeDirectory, fileName))
    .sort();
}

function lineNumberForIndex(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}

describe("German translations", () => {
  it("use native umlauts and eszett in locale and migration sources", () => {
    const files = [
      ...listFiles("src/i18n/locales/de", ".json"),
      ...listFiles("scripts/migrations", ".sql"),
    ];

    const matches = files.flatMap((file) => {
      const text = readFileSync(new URL(file, repositoryRoot), "utf8");

      return [...text.matchAll(asciiUmlautFallbackPattern)].map(
        (match) => `${file}:${lineNumberForIndex(text, match.index ?? 0)} ${match[0]}`,
      );
    });

    expect(matches).toEqual([]);
  });

  it("updates already-applied matrix metadata rows", () => {
    const asciiFallbackExample = ["Unter", "stu", "etzte Kennungen"].join("");
    const migration = readFileSync(
      new URL("scripts/migrations/052-fix-german-umlauts-in-matrix.sql", repositoryRoot),
      "utf8",
    );

    expect(migration).toContain("Unterstützte Kennungen");
    expect(migration).not.toContain(asciiFallbackExample);
    expect(migration).toContain(
      "VALUES ('052-fix-german-umlauts-in-matrix')",
    );
  });
});
