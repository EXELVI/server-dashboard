//header
import React from "react";
import { OnlineStatus } from "./utilities/OnlineStatus";
import { getTranslations } from "@/lib/translations";

interface HeaderProps {
   hostname: string;
   demoMode: boolean;
}

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

const Header: React.FC<HeaderProps> = ({ hostname, demoMode }) => {
   return (
      <header className="py-2 px-2 mb-2">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-xl font-sans font-light tracking-wide">
                  <span className="text-gray-400 font-normal">{translations.header.server}</span>
                  <span className="text-white mx-1">/</span>
                  <span className="text-white mr-1">{translations.header.dashboard}</span>
                  {demoMode && (
                     <StripedText className="max-w-3xl mx-auto rounded-lg border border-dashed border-amber-400 bg-amber-500/10 px-2" />
                  )}
               </h1>
            </div>
            <div className="flex items-center">
               <div className="flex items-center text-text-secondary text-xs gap-4">
                  <OnlineStatus isOnline={true} />
                  <div className="text-text-tertiary">|</div>
                  <div>
                     <span className="text-text-tertiary">{translations.common.hostname}</span>{" "}
                     <span className="text-white font-mono">{hostname}</span>
                  </div>
               </div>
            </div>
         </div>
      </header>
   );
};

export default Header;

function StripedText({ children = translations.header.demo, className = "" }) {
   const label = children || translations.header.demo;
   return (
      <span
         className={["font-extrabold text-transparent bg-clip-text", className].join(" ")}
         style={{
            backgroundImage: "repeating-linear-gradient(100deg, #606060ff 0 10px, #FFD400 10px 20px)"
         }}>
         {label}
      </span>
   );
}
