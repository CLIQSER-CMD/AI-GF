import { MemoryPoint } from "./types";

export const MEMORY_SCRAPBOOK: MemoryPoint[] = [
  {
    id: "letter",
    title: "The Misunderstood Letter",
    location: "Our Society Gate, Borivali",
    year: "2020",
    description: "The note you wrote for Maggie's parents to clarify your intentions. Her brother intercepted it, leading to family anger and massive misunderstandings that tore both of you apart six years ago.",
    bgColor: "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-300"
  },
  {
    id: "marine-drive",
    title: "Monsoon Cut-Chai Walk",
    location: "Marine Drive, Mumbai",
    year: "2018",
    description: "Sharing one cutting chai cups in torrential rains under a single broken umbrella, watching the Arabian sea waves break. She wore a bright pink raincoat.",
    bgColor: "bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200 border-sky-300"
  },
  {
    id: "candies",
    title: "Our Burger Spot",
    location: "Candies, Bandra",
    year: "2019",
    description: "Maggie's ultimate happy place. You saved up pocket money for a week just to buy her favorite double-cheese burger with pink milkshakes. She smiled so bright.",
    bgColor: "bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border-rose-300"
  },
  {
    id: "colaba",
    title: "The Pink Charm Bracelet",
    location: "Colaba Causeway Street",
    year: "2017",
    description: "Bargaining with street vendors for a simple silver-plated bracelet with a pink glass charm. You saved it in your pocket, but she guessed it immediately because your hands were shaking.",
    bgColor: "bg-pink-100 dark:bg-pink-950 text-pink-900 dark:text-pink-200 border-pink-300"
  },
  {
    id: "college",
    title: "St. Xavier's Rainy Corridors",
    location: "St. Xavier's College Hallway",
    year: "2019",
    description: "Maggie sitting on the grand stone staircases, skipping a lecture to listen to your wild trade and stock market business ideas. She actually listened and believed in you.",
    bgColor: "bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border-purple-300"
  }
];

export const MOCK_SOUNDTRACKS = [
  { id: "rain", title: "Mumbai Monsoon Rain (Lo-fi)", duration: "Continuous", path: "rain" },
  { id: "chai", title: "Borivali Tea Stall Morning", duration: "3:40", path: "chai" },
  { id: "marine", title: "Sunset Waves & Lofi Violin", duration: "4:12", path: "marine" }
];

export const TRADING_ALERTS = [
  {
    label: "💸 Share Big Trade Win Plan",
    text: "Yaar, look! I analyzed the stock charts all night and made a profitable trade simulate winner of ₹25,000 on Nifty options today! Step by step I'll reach my goals."
  },
  {
    label: "🎓 Mention Exam Preparation",
    text: "Studied technical analysis book till 4 AM today. Maggie, business and economics are tough, but I am staying fully focused on building our future."
  },
  {
    label: "🍔 Offer Burger Treat Plan",
    text: "Hey, since I closed today in profit, I want to treat you to the absolute biggest double cheese burger in Bandra today. Do you have time?"
  },
  {
    label: "💌 Mention the 6-Year Gap",
    text: "Maggie, I still have that silver pink bracelet in my drawer. In six years, I never forgot you... not even for a single day."
  }
];
