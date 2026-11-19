(function (root) {
  "use strict";

  // Artwork is loaded only after a player enters a world. All thirteen worlds
  // use their final, owner-approved images; thematic CSS fallbacks are
  // presentation-only.
  const backgrounds = {
    moneybasics: {
      theme: "Magical golden financial kingdom",
      imageUrl: "assets/worlds/money-basics.jpg",
      position: "center center",
      mobilePosition: "56% center",
      accent: "#f2b84b",
      atmosphere: "gold",
    },
    credit: {
      theme: "Sapphire crystal fortress",
      imageUrl: "assets/worlds/credit-foundations.jpg",
      position: "center center",
      mobilePosition: "62% center",
      accent: "#6bc8ff",
      atmosphere: "sapphire",
    },
    crypto: {
      theme: "Futuristic cryptocurrency city",
      imageUrl: "assets/worlds/crypto-foundations.jpg",
      position: "center center",
      mobilePosition: "center center",
      accent: "#8b7cff",
      atmosphere: "violet",
    },
    banking: {
      theme: "Grand enchanted bank",
      imageUrl: "assets/worlds/banking-basics.jpg",
      position: "center center",
      mobilePosition: "center center",
      accent: "#f2b84b",
      atmosphere: "gold",
    },
    investing: {
      theme: "Magical investment garden",
      imageUrl: "assets/worlds/investing-basics.jpg",
      position: "center center",
      mobilePosition: "center center",
      accent: "#58e0a6",
      atmosphere: "emerald",
    },
    coins: {
      theme: "Golden treasure vault",
      imageUrl: "assets/worlds/coins-currency-approved.jpg",
      position: "center center",
      mobilePosition: "center center",
      accent: "#ffca52",
      atmosphere: "gold",
    },
    ai_technology: {
      theme: "Futuristic AI city",
      imageUrl: "assets/worlds/ai-technology.jpg",
      position: "center center",
      mobilePosition: "center center",
      accent: "#63dcff",
      atmosphere: "cyan",
    },
    real_estate: {
      theme: "Enchanted village and luxury homes",
      imageUrl: "assets/worlds/real-estate.jpg",
      position: "center center",
      mobilePosition: "center center",
      accent: "#7ae4a8",
      atmosphere: "emerald",
    },
    taxes: {
      theme: "Royal treasury and library",
      imageUrl: "assets/worlds/taxes.jpg",
      position: "center center",
      mobilePosition: "center center",
      accent: "#f0c66a",
      atmosphere: "gold",
    },
    insurance: {
      theme: "Glowing protective shield surrounding a home and car",
      imageUrl: "assets/worlds/insurance-protection-approved.jpg",
      position: "center center",
      mobilePosition: "center center",
      accent: "#55e4cc",
      atmosphere: "emerald",
    },
    business: {
      theme: "Magical business marketplace",
      imageUrl: "assets/worlds/business-entrepreneurship.jpg",
      position: "center center",
      mobilePosition: "center center",
      accent: "#f2b84b",
      atmosphere: "gold",
    },
    social_media: {
      theme: "Neon digital creator and gaming studio",
      imageUrl: "assets/worlds/social-media-approved.jpg",
      position: "center center",
      mobilePosition: "center center",
      accent: "#df65ff",
      atmosphere: "violet",
    },
    retirement: {
      theme: "Tropical fantasy paradise",
      imageUrl: "assets/worlds/retirement-wealth-planning.jpg",
      position: "center center",
      mobilePosition: "center center",
      accent: "#62e3ca",
      atmosphere: "emerald",
    },
  };

  root.FINLIT_WORLD_BACKGROUNDS = Object.freeze(backgrounds);
})(typeof globalThis !== "undefined" ? globalThis : this);
