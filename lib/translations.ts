import en from "@/locales/en.json";
import it from "@/locales/it.json";

type Locale = "en" | "it";

const fallbackLocale: Locale = "en";
const envLocale = (process.env.NEXT_PUBLIC_LOCALE || "").toLowerCase() as Locale;
export const defaultLocale: Locale = envLocale === "it" ? "it" : fallbackLocale;

export function getTranslations(locale: string = defaultLocale) {
   switch (locale.toLowerCase()) {
      case "it":
         return it;
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
