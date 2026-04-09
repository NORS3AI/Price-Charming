import { HirelingCard } from "./types";

/** Low-tier transformable hirelings. */

export const Hag: HirelingCard = {
  id: "hag",
  name: "Hag",
  kind: "hireling",
  tier: 1,
  tribe: "mischief",
  description: "A crooked old hag with dubious potions.",
  potions: [{ name: "Murky Brew", stock: 2, potency: 1, price: 1 }],
  castTime: 3,
  transformable: true,
};

export const Frog: HirelingCard = {
  id: "frog",
  name: "Frog",
  kind: "hireling",
  tier: 1,
  tribe: "woodland",
  description: "A small frog hoping for a kiss.",
  potions: [{ name: "Swamp Sip", stock: 2, potency: 1, price: 1 }],
  castTime: 2,
  transformable: true,
};

export const HiddenPrincess: HirelingCard = {
  id: "hidden-princess",
  name: "Hidden Princess",
  kind: "hireling",
  tier: 1,
  tribe: "royalty",
  description: "A princess in disguise, waiting to be revealed.",
  potions: [{ name: "Secret Elixir", stock: 2, potency: 1, price: 1 }],
  castTime: 4,
  transformable: true,
};

/** Tier-1 shop hirelings (non-transformable). */

export const LittlePiggy: HirelingCard = {
  id: "little-piggy",
  name: "Little Piggy",
  kind: "hireling",
  tier: 1,
  tribe: "culinary",
  description: "Sniffs out the finest ingredients.",
  potions: [{ name: "Truffle Tonic", stock: 3, potency: 1, price: 1 }],
  castTime: 2,
  transformable: false,
};

export const Teacups: HirelingCard = {
  id: "teacups",
  name: "Teacups",
  kind: "hireling",
  tier: 1,
  tribe: "enchanted",
  description: "Pours enchanted tea.",
  potions: [{ name: "Tea Brew", stock: 4, potency: 1, price: 1 }],
  castTime: 3,
  transformable: false,
};

export const PumpkinMouse: HirelingCard = {
  id: "pumpkin-mouse",
  name: "Pumpkin Mouse",
  kind: "hireling",
  tier: 1,
  tribe: "woodland",
  description: "A quick little brewer with surprisingly potent pumpkin potions.",
  potions: [{ name: "Pumpkin Juice", stock: 2, potency: 2, price: 1 }],
  castTime: 3,
  transformable: false,
};

/** Higher-tier transformation results (not directly purchasable). */

export const EvilRoyal: HirelingCard = {
  id: "evil-royal",
  name: "Evil Royal",
  kind: "hireling",
  tier: 2,
  tribe: "royalty",
  description: "A royal with a wicked streak and potent poisons.",
  potions: [
    { name: "Royal Venom", stock: 3, potency: 3, price: 2 },
    { name: "Crown Toxin", stock: 2, potency: 2, price: 2 },
  ],
  castTime: 3,
  transformable: false,
};

export const PoisonQueen: HirelingCard = {
  id: "poison-queen",
  name: "Poison Queen",
  kind: "hireling",
  tier: 2,
  tribe: "mischief",
  description: "She brews the deadliest draughts in the realm.",
  potions: [
    { name: "Queen's Bane", stock: 2, potency: 4, price: 2 },
    { name: "Apple Extract", stock: 3, potency: 2, price: 2 },
  ],
  castTime: 4,
  transformable: false,
};

export const RoyalFlyCatch: HirelingCard = {
  id: "royal-fly-catch",
  name: "Royal Fly Catch",
  kind: "hireling",
  tier: 2,
  tribe: "woodland",
  description: "A regal amphibian with a lightning-fast tongue.",
  potions: [
    { name: "Fly Fizz", stock: 4, potency: 2, price: 2 },
    { name: "Tongue Tonic", stock: 2, potency: 3, price: 2 },
  ],
  castTime: 1,
  transformable: false,
};

export const WartCoveredPrince: HirelingCard = {
  id: "wart-covered-prince",
  name: "Wart Covered Prince",
  kind: "hireling",
  tier: 2,
  tribe: "royalty",
  description: "A prince cursed with warts but blessed with charm.",
  potions: [
    { name: "Wartbrew", stock: 3, potency: 2, price: 2 },
    { name: "Prince's Perfume", stock: 2, potency: 3, price: 2 },
  ],
  castTime: 3,
  transformable: false,
};

export const SnowWhite: HirelingCard = {
  id: "snow-white",
  name: "Snow White",
  kind: "hireling",
  tier: 2,
  tribe: "royalty",
  description: "Fairest of them all, her potions enchant every customer.",
  potions: [
    { name: "Mirror Mist", stock: 3, potency: 3, price: 2 },
    { name: "Apple Blossom Dew", stock: 3, potency: 3, price: 2 },
  ],
  castTime: 3,
  transformable: false,
};

export const MasterPieMaker: HirelingCard = {
  id: "master-pie-maker",
  name: "Master Pie Maker",
  kind: "hireling",
  tier: 2,
  tribe: "culinary",
  description: "Bakes potions into irresistible pies.",
  potions: [
    { name: "Pie Potion", stock: 4, potency: 2, price: 2 },
    { name: "Crust Crumble Elixir", stock: 3, potency: 2, price: 2 },
  ],
  castTime: 2,
  transformable: false,
};

/** Upgrade results — obtained only by merging 3 identical hirelings. */

export const BigBadWolf: HirelingCard = {
  id: "big-bad-wolf",
  name: "Big Bad Wolf",
  kind: "hireling",
  tier: 2,
  tribe: "culinary",
  description: "Huffs, puffs, and brews.",
  potions: [
    { name: "Huff Brew", stock: 4, potency: 3, price: 2 },
    { name: "Puff Potion", stock: 3, potency: 3, price: 2 },
  ],
  castTime: 2,
  transformable: false,
};

export const MadameTeapot: HirelingCard = {
  id: "madame-teapot",
  name: "Madame Teapot",
  kind: "hireling",
  tier: 2,
  tribe: "enchanted",
  description: "Pours potions with elegance.",
  potions: [
    { name: "Grand Tea", stock: 5, potency: 3, price: 2 },
    { name: "Earl Elixir", stock: 4, potency: 2, price: 2 },
  ],
  castTime: 2,
  transformable: false,
};

export const ALL_HIRELINGS: HirelingCard[] = [
  Hag,
  Frog,
  HiddenPrincess,
  LittlePiggy,
  Teacups,
  PumpkinMouse,
  EvilRoyal,
  PoisonQueen,
  RoyalFlyCatch,
  WartCoveredPrince,
  SnowWhite,
  MasterPieMaker,
  BigBadWolf,
  MadameTeapot,
];
