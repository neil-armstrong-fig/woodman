export const ABILITY_IDS = ["cat", "ai", "language"] as const;

export type AbilityId = (typeof ABILITY_IDS)[number];

export interface Ability {
  readonly id: AbilityId;
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly bonus: number;
}

export interface ArgumentChoice {
  readonly label: string;
  readonly score: number;
}

export interface ArgumentRound {
  readonly prompt: string;
  readonly choices: readonly ArgumentChoice[];
}

export interface Encounter {
  readonly id: string;
  readonly npc: string;
  readonly role: string;
  readonly topic: string;
  readonly position: readonly [number, number, number];
  readonly intro: string;
  readonly win: string;
  readonly unlock?: AbilityId;
  readonly rounds: readonly ArgumentRound[];
}

export const ABILITIES: Readonly<Record<AbilityId, Ability>> = {
  cat: {
    id: "cat",
    name: "Cat Photo",
    icon: "CAT",
    description: "Derail the exchange with a huge phone and an excellent cat.",
    bonus: 18,
  },
  ai: {
    id: "ai",
    name: "Dubious Chatbot",
    icon: "AI?",
    description: "Request instant confidence from a deeply unreliable assistant.",
    bonus: 22,
  },
  language: {
    id: "language",
    name: "Language Feint",
    icon: "WAS?",
    description: "Temporarily become mysteriously unfamiliar with English.",
    bonus: 24,
  },
};

export const ENCOUNTERS: readonly Encounter[] = [
  {
    id: "gravy",
    npc: "Inge",
    role: "Schnitzel purist",
    topic: "Gravy on schnitzel",
    position: [-11, 0, -7],
    intro: "Inge has noticed what you are pouring on a perfectly crisp schnitzel.",
    win: "Inge has not agreed, but has left to lie down. This counts.",
    unlock: "cat",
    rounds: [
      {
        prompt: "“The whole point is that it stays crisp.”",
        choices: [
          {label: "Reframe crispness as a bourgeois constraint.", score: 24},
          {label: "Say gravy makes it travel-ready.", score: 12},
          {label: "Ask whether soup is just confident sauce.", score: -7},
        ],
      },
      {
        prompt: "“But it becomes soggy immediately.”",
        choices: [
          {label: "Call sogginess a more inclusive texture.", score: 22},
          {label: "Insist the plate needs visual drama.", score: 9},
          {label: "Repeat ‘moisture is flavour’ much louder.", score: 4},
        ],
      },
      {
        prompt: "“This is not how my grandmother made it.”",
        choices: [
          {label: "Announce that tradition must survive adaptation.", score: 25},
          {label: "Ask to see peer-reviewed grandmother data.", score: 17},
          {label: "Change the subject to dumplings.", score: -5},
        ],
      },
    ],
  },
  {
    id: "bavaria",
    npc: "Sepp",
    role: "Regional historian",
    topic: "Bavarians are actually Austrian",
    position: [12, 0, -12],
    intro: "Sepp owns twelve history books and has made the mistake of mentioning Bavaria.",
    win: "Sepp is drawing borders in the gravel. Walk away before he finishes.",
    unlock: "ai",
    rounds: [
      {
        prompt: "“Bavaria is quite clearly in Germany.”",
        choices: [
          {label: "Point vaguely south and say ‘culturally, though’.", score: 20},
          {label: "Describe borders as paperwork with mountains.", score: 24},
          {label: "Claim lederhosen are a passport.", score: 3},
        ],
      },
      {
        prompt: "“Language similarity does not change sovereignty.”",
        choices: [
          {label: "Deploy the phrase ‘soft cultural annexation’.", score: 23},
          {label: "Show him a pretzel and wait.", score: 8},
          {label: "Say all dialects are basically one big village.", score: 14},
        ],
      },
      {
        prompt: "“You have ignored two centuries of history.”",
        choices: [
          {label: "Counter with three centuries of vibes.", score: 25},
          {label: "Request a source, then reject its font.", score: 18},
          {label: "Pretend a cowbell has interrupted you.", score: -4},
        ],
      },
    ],
  },
  {
    id: "onewheel",
    npc: "Lukas",
    role: "Sensible cyclist",
    topic: "Two wheels on one axle are one wheel",
    position: [14, 0, 10],
    intro: "“How do you like my one wheel?” asks the Woodman, arriving on two unmistakable tyres.",
    win: "Lukas is staring silently at the axle. The Woodman accepts this as total agreement.",
    unlock: "language",
    rounds: [
      {
        prompt: "“Your ‘one wheel’ clearly has two wheels.”",
        choices: [
          {label: "Explain that one axle makes them one wheel collectively.", score: 24},
          {label: "Call them two halves of a wider wheel.", score: 19},
          {label: "Ask him not to get trapped by visible reality.", score: 11},
        ],
      },
      {
        prompt: "“An axle connects wheels. It does not merge them.”",
        choices: [
          {label: "Describe the axle as a wheel unification device.", score: 25},
          {label: "Insist separation is merely a manufacturing detail.", score: 20},
          {label: "Count ‘wheel’ very slowly while pointing at both.", score: 2},
        ],
      },
      {
        prompt: "“By that logic, a bicycle is one wheel because both share a frame.”",
        choices: [
          {label: "Reject frames as non-axial and therefore irrelevant.", score: 24},
          {label: "Announce that bicycles may actually be one wheel too.", score: 18},
          {label: "Conclude that all transport is one enormous wheel.", score: 7},
        ],
      },
    ],
  },
  {
    id: "healthcare",
    npc: "Dr. Marta",
    role: "Village doctor",
    topic: "Women get worse healthcare outcomes",
    position: [-14, 0, 13],
    intro: "Dr. Marta already knows the evidence. The challenge is resisting the urge to explain her own field to her.",
    win: "You listened for almost forty seconds. A personal best—and a useful conversation.",
    rounds: [
      {
        prompt: "“Yes. Diagnostic bias and under-representation are well documented.”",
        choices: [
          {label: "Ask what action would help locally, then listen.", score: 28},
          {label: "Begin a twelve-part explanation of bias.", score: -8},
          {label: "Say your chatbot had the same conclusion.", score: 5},
        ],
      },
      {
        prompt: "“Women’s symptoms are too often dismissed.”",
        choices: [
          {label: "Acknowledge the pattern without making it about you.", score: 27},
          {label: "Mention one article you skimmed in 2019.", score: 2},
          {label: "Interrupt to define the word systemic.", score: -10},
        ],
      },
      {
        prompt: "“Better evidence and listening both matter.”",
        choices: [
          {label: "Agree, ask for a reading list, and stop talking.", score: 30},
          {label: "Offer to make a very long infographic.", score: 12},
          {label: "Declare victory because she agrees with the premise.", score: -6},
        ],
      },
    ],
  },
];
