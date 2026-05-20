import React, { createContext, useContext, useState, useMemo } from "react";
import { content } from "./content";

const LangContext = createContext({
  lang: "en",
  setLang: () => {},
  t: content.en,
});

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState("en");
  const value = useMemo(() => ({ lang, setLang, t: content[lang] }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

export const useLang = () => useContext(LangContext);
