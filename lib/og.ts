import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Anton (SIL Open Font License, see assets/OFL.txt) for share-card headlines.
export const anton = readFile(join(process.cwd(), "assets/Anton-Regular.ttf"));

export const ogFonts = async () => [{ name: "Anton", data: await anton, style: "normal" as const, weight: 400 as const }];
