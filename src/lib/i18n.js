import { useJeevikaStore } from "./store.js";

export const translations = {
  en: {
    heroTitle: "Finding Work. Finding Workers. Building Trust.",
    heroSubtitle: "Jeevika connects workers, equipment owners, material providers, and employers with fast nearby matching.",
    openDemo: "Open Demo",
    postRequirement: "Post a Requirement",
    nearbyWorkers: "Workers Nearby",
    howItWorks: "How Jeevika Works",
    nav: {
      dashboard: "Dashboard",
      jobs: "Jobs",
      post: "Post Job",
      wallet: "Wallet",
      profile: "Profile"
    }
  },
  hi: {
    heroTitle: "काम ढूंढें। वर्कर ढूंढें। विश्वास बढ़ाएं।",
    heroSubtitle: "जीविका वर्करों, उपकरणों के मालिकों और नियोक्ताओं को तेज़ पास के मिलान के साथ जोड़ती है।",
    openDemo: "डेमो खोलें",
    postRequirement: "ज़रूरत पोस्ट करें",
    nearbyWorkers: "पास के वर्कर",
    howItWorks: "जीविका कैसे काम करती है",
    nav: {
      dashboard: "डैशबोर्ड",
      jobs: "नौकरियां",
      post: "पोस्ट जॉब",
      wallet: "वॉलेट",
      profile: "प्रोफ़ाइल"
    }
  }
};

export function useTranslation() {
  const { language } = useJeevikaStore();
  
  const t = (key) => {
    const keys = key.split(".");
    let value = translations[language] || translations.en;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return { t, language };
}
