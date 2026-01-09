import en from "@/locales/en.json";
import it from "@/locales/it.json";
import vec from "@/locales/vec.json";

type Locale = "en" | "it" | "vec";

const fallbackLocale: Locale = "en";
const envLocale = (process.env.NEXT_PUBLIC_LOCALE || "").toLowerCase() as Locale;
export const defaultLocale: Locale = envLocale === "en" || envLocale === "it" || envLocale === "vec" ? envLocale : fallbackLocale;

export function getTranslations(locale: string = defaultLocale) {
   switch (locale.toLowerCase()) {
      case "it":
         return it;
      case "vec":
         return vec;
      case "en":
      default:
         return en;
   }
}

export function getFormattedTranslation(template: string, replacements: Record<string, string>) {
   if (!template) return "";

   return template.replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = replacements[key];
      return value === undefined || value === null ? "" : String(value);
   });
}
