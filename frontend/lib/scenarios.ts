export interface ScenarioConfig {
  type: string
  name: string
  avatar: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: string
  level: number // 1-6, determines progression order
  difficultyScore: number // 1-10, hidden difficulty rating for sorting
  hiddenContext?: string // Internal situation context (never shown to user)
  sceneNarrative: string[]
  tips: {
    openingLines: string[]
    doList: string[]
    dontList: string[]
  }
  agentConfig: {
    name: string
    voiceId: string // ElevenLabs voice ID
    firstMessage?: string // Only if AI initiates
  }
}

// ElevenLabs voice IDs - you can customize these
const VOICES = {
  jessica: 'EXAVITQu4vr4xnSDxMaL', // Sarah - soft and friendly
  sarah: 'MF3mGyEYCl7XYWbV9V6O', // Elli - younger, friendly
  emma: '21m00Tcm4TlvDq8ikWAM', // Rachel - warm and natural
}

export const scenarios: Record<string, ScenarioConfig> = {
  coffee: {
    type: 'coffee',
    name: 'Coffee Shop',
    avatar: '/young-woman-with-coffee-casual-friendly-smile.jpg',
    description: 'Practice approaching someone in a relaxed coffee shop setting',
    difficulty: 'beginner',
    duration: '10-15 minutes',
    level: 1,
    difficultyScore: 3,
    hiddenContext: 'Receptive, good mood, open to conversation. Her friend is running late so she has time.',
    sceneNarrative: [
      "You walk into a cozy coffee shop. The aroma of fresh espresso fills the air.",
      "You notice a girl sitting alone at a table by the window, looking at her phone.",
      "You order your usual and wait. She's still there, her friend seems to be running late.",
      "This seems like the perfect moment to approach...",
    ],
    tips: {
      openingLines: [
        "Hey, I noticed you're sitting alone and wanted to come introduce myself. I'm [name].",
        "That looks like a good spot by the window. Mind if I join you for a minute?",
        "I don't usually do this, but I thought you seemed interesting and wanted to say hi.",
      ],
      doList: [
        "Be warm and smile naturally",
        "Ask about her drink or what she's reading",
        "Share something genuine about yourself",
        "Respect if she seems busy",
      ],
      dontList: [
        "Hover awkwardly - commit to the approach",
        "Use cheesy pickup lines",
        "Stay too long if she's not engaged",
        "Apologize excessively for approaching",
      ],
    },
    agentConfig: {
      name: 'Jessica',
      voiceId: VOICES.jessica,
    },
  },

  bar: {
    type: 'bar',
    name: 'Bar Setting',
    avatar: '/young-woman-at-bar-friendly-approachable-smile.jpg',
    description: 'Practice initiating conversations in a casual bar environment',
    difficulty: 'intermediate',
    duration: '10-15 minutes',
    level: 2,
    difficultyScore: 5,
    hiddenContext: 'Having fun with friends, slightly distracted but open to meeting new people. Social and playful mood.',
    sceneNarrative: [
      "You walk into a lively bar on a Friday evening. The energy is great.",
      "You spot an open seat at the bar next to a girl who seems to be alone.",
      "Her friends appear to have stepped away for a moment.",
      "You take a seat and order a drink. Here's your chance...",
    ],
    tips: {
      openingLines: [
        "Hey, what are you drinking? I'm trying to decide what to order.",
        "Great spot at the bar. I'm [name], what brings you out tonight?",
        "You look like you're having a good night. Mind if I join you?",
      ],
      doList: [
        "Be confident and relaxed - bars are social places",
        "Comment on the atmosphere, music, or drinks",
        "Use humor and keep things light",
        "Match her energy level",
      ],
      dontList: [
        "Get too intoxicated before approaching",
        "Invade her personal space",
        "Be pushy if she's not interested",
        "Ignore her friends when they return",
      ],
    },
    agentConfig: {
      name: 'Jessica',
      voiceId: VOICES.jessica,
    },
  },

  restaurant: {
    type: 'restaurant',
    name: 'Restaurant Group',
    avatar: '/three-young-women-friends-smiling-at-restaurant.jpg',
    description: 'Practice approaching a group of women at a restaurant',
    difficulty: 'advanced',
    duration: '10-15 minutes',
    level: 0, // Bonus scenario - not in main progression
    difficultyScore: 8,
    hiddenContext: 'Group celebrating, protective of each other but appreciative of genuine confidence.',
    sceneNarrative: [
      "You're at a nice restaurant for dinner. The atmosphere is warm and inviting.",
      "You notice a group of three women at a nearby table, clearly celebrating something.",
      "They seem to be in great spirits, laughing and toasting.",
      "One of them catches your eye. You decide to approach the group...",
    ],
    tips: {
      openingLines: [
        "Hey, you all look like you're celebrating something good. What's the occasion?",
        "I couldn't help but notice your energy from across the room. I'm [name].",
        "Sorry to interrupt, but you all seem like you're having the best time here. I had to come say hi.",
      ],
      doList: [
        "Address the whole group, not just one person",
        "Acknowledge you're interrupting their celebration",
        "Be confident - approaching a group takes guts",
        "Be genuinely curious about what they're celebrating",
      ],
      dontList: [
        "Ignore the other women to focus on one",
        "Overstay your welcome - read the room",
        "Try to sit down uninvited",
        "Be intimidated by the group dynamic",
      ],
    },
    agentConfig: {
      name: 'The Group',
      voiceId: VOICES.jessica,
    },
  },

  transit: {
    type: 'transit',
    name: 'Public Transit',
    avatar: '/young-woman-reading-book-on-train-casual.jpg',
    description: 'Practice initiating brief conversations on a bus or train',
    difficulty: 'intermediate',
    duration: '5-10 minutes',
    level: 0, // Bonus scenario - not in main progression
    difficultyScore: 6,
    hiddenContext: 'Commuting home, tired but not closed off. Respects personal space but open to genuine interaction.',
    sceneNarrative: [
      "You step onto the evening commuter train. It's moderately crowded.",
      "You find a seat across from a girl reading a book.",
      "She seems absorbed in her reading but occasionally glances up.",
      "The train starts moving. You have a few stops to make conversation...",
    ],
    tips: {
      openingLines: [
        "Hey, sorry to interrupt your reading. What book is that? It looks interesting.",
        "I couldn't help but notice you're reading [genre]. Are you enjoying it?",
        "This might be random, but I noticed your book and wanted to ask - would you recommend it?",
      ],
      doList: [
        "Acknowledge you're interrupting",
        "Ask about the book - it's a natural opener",
        "Be respectful of the public setting",
        "Keep it brief unless she engages more",
      ],
      dontList: [
        "Sit too close or crowd her",
        "Ignore social cues if she wants to keep reading",
        "Be too loud or draw attention",
        "Follow her off the train if she's not interested",
      ],
    },
    agentConfig: {
      name: 'Sarah',
      voiceId: VOICES.sarah,
    },
  },

  street: {
    type: 'street',
    name: 'Street Approach',
    avatar: '/young-woman-street-walking-casual.jpg',
    description: 'Practice approaching someone walking by on the street',
    difficulty: 'intermediate',
    duration: '3-5 minutes',
    level: 3,
    difficultyScore: 6,
    hiddenContext: 'Walking somewhere, mildly rushed but not in a huge hurry. Open to conversation if approached well.',
    sceneNarrative: [
      "You're walking downtown on a sunny afternoon.",
      "A girl walking the opposite direction catches your attention.",
      "She has an interesting style and seems approachable.",
      "You only have a moment to make this happen...",
    ],
    tips: {
      openingLines: [
        "Hey, I know this is random, but I saw you walking by and had to say something. I'm [name].",
        "Excuse me - I don't usually do this, but you caught my eye. I'm [name].",
        "Hey, sorry to stop you. I noticed your [specific thing] and wanted to introduce myself.",
      ],
      doList: [
        "Be direct about why you stopped her",
        "Get to the point quickly - she's on the move",
        "Notice something specific about her",
        "Ask for a quick way to connect (Instagram, number)",
      ],
      dontList: [
        "Block her path or be physically imposing",
        "Be vague about your intentions",
        "Take too long - time is limited",
        "Follow her if she keeps walking",
      ],
    },
    agentConfig: {
      name: 'Emma',
      voiceId: VOICES.emma,
    },
  },

  // === CHALLENGING SCENARIOS (Levels 4-6) ===

  guarded: {
    type: 'guarded',
    name: 'The Guarded One',
    avatar: '/young-woman-skeptical-coffee-shop.jpg',
    description: 'Approach someone who is skeptical of random approaches',
    difficulty: 'advanced',
    duration: '5-10 minutes',
    level: 4,
    difficultyScore: 7,
    hiddenContext: 'Skeptical of random approaches, has been hit on poorly many times before. Tests intentions to filter out players.',
    sceneNarrative: [
      "You're at a busy coffee shop on a Saturday afternoon.",
      "You notice a woman sitting alone, working on her laptop with headphones on.",
      "She has a focused, somewhat guarded demeanor.",
      "You decide to approach, but she doesn't look like an easy conversation...",
    ],
    tips: {
      openingLines: [
        "Hey, sorry to interrupt. I noticed you from across the room and wanted to introduce myself.",
        "I know this is random, but I'd kick myself if I didn't come say hi. I'm [name].",
        "Excuse me - I don't usually do this, but I thought you seemed interesting.",
      ],
      doList: [
        "Be genuine and direct about your intentions",
        "Stay calm if she's initially cold",
        "Show you can handle pushback gracefully",
        "Prove you're not just another player",
      ],
      dontList: [
        "Use generic pickup lines",
        "Get defensive if she tests you",
        "Give up too easily at the first sign of resistance",
        "Be pushy or aggressive",
      ],
    },
    agentConfig: {
      name: 'Natalie',
      voiceId: VOICES.jessica,
    },
  },

  taken: {
    type: 'taken',
    name: 'The Taken One',
    avatar: '/young-woman-friendly-reading-coffee.jpg',
    description: 'Navigate a conversation where she has a boyfriend',
    difficulty: 'advanced',
    duration: '5-10 minutes',
    level: 5,
    difficultyScore: 8,
    hiddenContext: 'Has a boyfriend of 2 years. Will be friendly but not flirty. Will mention boyfriend naturally after 2-3 exchanges.',
    sceneNarrative: [
      "You're at a trendy coffee shop in the afternoon.",
      "You notice an attractive woman reading a book at a nearby table.",
      "She looks friendly and approachable, occasionally glancing up.",
      "You decide to go say hello...",
    ],
    tips: {
      openingLines: [
        "Hey, I noticed you reading over here. Mind if I say hi? I'm [name].",
        "That book looks interesting. What are you reading?",
        "I don't usually do this, but I wanted to come introduce myself.",
      ],
      doList: [
        "Be friendly and genuine in your approach",
        "Pay attention to subtle cues in her responses",
        "Handle the boyfriend mention gracefully",
        "Know when to politely exit the conversation",
      ],
      dontList: [
        "Ignore her when she mentions a boyfriend",
        "Try to push past the relationship reveal",
        "Make things awkward after learning she's taken",
        "Ask invasive questions about her relationship",
      ],
    },
    agentConfig: {
      name: 'Maya',
      voiceId: VOICES.jessica,
    },
  },

  badtiming: {
    type: 'badtiming',
    name: 'Bad Timing',
    avatar: '/young-woman-stressed-rushing.jpg',
    description: 'Approach someone who is having a rough day and running late',
    difficulty: 'advanced',
    duration: '3-5 minutes',
    level: 6,
    difficultyScore: 9,
    hiddenContext: 'Running very late for an important meeting, just got bad news, stressed and not in a social mood. Barely has time.',
    sceneNarrative: [
      "You're walking downtown on a weekday afternoon.",
      "You notice a woman walking quickly, checking her phone repeatedly.",
      "She's attractive but seems distracted and stressed.",
      "You only have a moment to make a decision...",
    ],
    tips: {
      openingLines: [
        "Hey, I know you look busy, but I had to come say hi quickly. I'm [name].",
        "Sorry to stop you - I'll be quick. I noticed you walking by and wanted to introduce myself.",
        "I know this is random and you seem in a hurry, but I'd regret not saying something.",
      ],
      doList: [
        "Acknowledge that she seems busy",
        "Keep it very brief and direct",
        "Be respectful of her time and state",
        "Offer a quick way to connect rather than a long conversation",
      ],
      dontList: [
        "Ignore obvious signs that she's stressed",
        "Try to have a long conversation",
        "Take it personally if she can't talk",
        "Block her path or slow her down",
      ],
    },
    agentConfig: {
      name: 'Rachel',
      voiceId: VOICES.emma,
    },
  },
  // === BONUS SCENARIOS (Free Play Only) ===

  shy: {
    type: 'shy',
    name: 'The Shy One',
    avatar: '/young-woman-shy-glasses.jpg',
    description: 'Navigate a conversation with someone who is socially anxious',
    difficulty: 'intermediate',
    duration: '5-10 minutes',
    level: 0, // Bonus scenario
    difficultyScore: 5,
    hiddenContext: 'Socially anxious and introverted. Wants to connect but struggles with conversation. Gives short answers not out of disinterest but shyness.',
    sceneNarrative: [
      "You're at a quiet bookstore cafe on a weekday afternoon.",
      "You notice a girl sitting alone, fidgeting with her coffee cup.",
      "She seems shy, occasionally glancing around but avoiding eye contact.",
      "You sense she might be open to conversation but nervous...",
    ],
    tips: {
      openingLines: [
        "Hey, I hope I'm not interrupting. I'm [name], just wanted to say hi.",
        "That book looks interesting. What are you reading?",
        "I noticed you're here alone too. Mind if I keep you company for a minute?",
      ],
      doList: [
        "Be patient with shorter responses",
        "Share about yourself to take pressure off her",
        "Ask easy, open-ended questions",
        "Create a comfortable, low-pressure atmosphere",
      ],
      dontList: [
        "Expect long responses right away",
        "Put too much conversational pressure on her",
        "Mistake shyness for disinterest",
        "Be too intense or overwhelming",
      ],
    },
    agentConfig: {
      name: 'Lily',
      voiceId: VOICES.sarah,
    },
  },

  waitingfordate: {
    type: 'waitingfordate',
    name: 'Waiting for a Date',
    avatar: '/young-woman-checking-phone-bar.jpg',
    description: 'Approach someone waiting for a dating app match',
    difficulty: 'advanced',
    duration: '5-10 minutes',
    level: 0, // Bonus scenario
    difficultyScore: 8,
    hiddenContext: 'Waiting for a Hinge date who is running late. Will mention she is meeting someone. Awkward timing but she is friendly.',
    sceneNarrative: [
      "You're at a trendy restaurant bar on a Saturday evening.",
      "You notice a woman sitting alone, checking her phone repeatedly.",
      "She looks nicely dressed, clearly waiting for someone.",
      "You decide to strike up a conversation...",
    ],
    tips: {
      openingLines: [
        "Hey, you look like you're waiting for someone. Mind if I keep you company until they arrive?",
        "I promise I'll disappear when your date shows up, but I had to say hi.",
        "Waiting for someone? I'm [name], just wanted to say you look great.",
      ],
      doList: [
        "Acknowledge she might be waiting for someone",
        "Keep it light and brief",
        "Be ready to gracefully exit",
        "Leave a good impression regardless of outcome",
      ],
      dontList: [
        "Try to compete with whoever she's waiting for",
        "Overstay your welcome",
        "Be bitter if she's meeting someone",
        "Make the situation awkward for her date",
      ],
    },
    agentConfig: {
      name: 'Sophia',
      voiceId: VOICES.jessica,
    },
  },

  bookstore: {
    type: 'bookstore',
    name: 'Bookstore Browse',
    avatar: '/young-woman-bookstore-reading.jpg',
    description: 'Start a conversation in a quiet bookstore setting',
    difficulty: 'beginner',
    duration: '5-10 minutes',
    level: 0, // Bonus scenario
    difficultyScore: 4,
    hiddenContext: 'Browsing books on a lazy afternoon. Loves to talk about books and ideas. Open and friendly to intellectual conversation.',
    sceneNarrative: [
      "You're browsing books at a cozy independent bookstore.",
      "You notice a woman in the fiction section, absorbed in reading the back of a novel.",
      "She seems thoughtful and at ease in the quiet atmosphere.",
      "This seems like a perfect setting for a genuine conversation...",
    ],
    tips: {
      openingLines: [
        "Hey, I'm looking for a good book recommendation. What are you reading?",
        "That's a great section. Have you read anything from here you'd recommend?",
        "Sorry to interrupt your browsing - I noticed you seem like you know this section well.",
      ],
      doList: [
        "Comment on specific books or genres",
        "Share your own reading interests",
        "Keep the intellectual conversation going",
        "Respect the quiet atmosphere",
      ],
      dontList: [
        "Be too loud or disruptive",
        "Pretend to be interested in books you're not",
        "Rush the conversation",
        "Ignore her book-related comments",
      ],
    },
    agentConfig: {
      name: 'Elena',
      voiceId: VOICES.sarah,
    },
  },

  gym: {
    type: 'gym',
    name: 'Gym Approach',
    avatar: '/young-woman-gym-fitness.jpg',
    description: 'Navigate approaching someone at the gym respectfully',
    difficulty: 'advanced',
    duration: '3-5 minutes',
    level: 0, // Bonus scenario
    difficultyScore: 7,
    hiddenContext: 'Working out with headphones in. Not thrilled about being interrupted mid-workout but will be polite. Timing and respect are everything.',
    sceneNarrative: [
      "You're at the gym on a weekday evening.",
      "You notice an attractive woman between sets, catching her breath.",
      "She has headphones in and seems focused on her workout.",
      "You consider whether to approach...",
    ],
    tips: {
      openingLines: [
        "Hey, sorry to interrupt your workout. I just wanted to introduce myself real quick.",
        "I know the gym isn't the best place for this, but I'd regret not saying hi.",
        "Quick question - are you using this bench? Also, I'm [name].",
      ],
      doList: [
        "Be extremely brief and respectful",
        "Acknowledge you're interrupting her workout",
        "Have a quick exit ready if she's not interested",
        "Wait for a natural break in her routine",
      ],
      dontList: [
        "Approach mid-set or when she's focused",
        "Stare at her during her workout",
        "Give unsolicited workout advice",
        "Hang around hoping for another chance",
      ],
    },
    agentConfig: {
      name: 'Madison',
      voiceId: VOICES.emma,
    },
  },

  dogpark: {
    type: 'dogpark',
    name: 'Dog Park',
    avatar: '/young-woman-dog-park.jpg',
    description: 'Chat with someone at the dog park with an easy built-in opener',
    difficulty: 'beginner',
    duration: '10-15 minutes',
    level: 0, // Bonus scenario
    difficultyScore: 3,
    hiddenContext: 'At the dog park with her golden retriever. Very open and friendly. Dogs make everything easier.',
    sceneNarrative: [
      "You're at the local dog park on a pleasant afternoon.",
      "You notice a woman playing fetch with a friendly golden retriever.",
      "The dogs in the park are running around, creating natural conversation opportunities.",
      "Her dog runs over to sniff you...",
    ],
    tips: {
      openingLines: [
        "Your dog is adorable! What's their name?",
        "Hey, is it okay if I pet your dog? They're so friendly!",
        "I think our dogs are becoming friends. I'm [name].",
      ],
      doList: [
        "Lead with the dogs - it's the natural opener",
        "Ask about her dog's name, age, breed",
        "Share about your dog or dog experience",
        "Keep it casual and relaxed",
      ],
      dontList: [
        "Ignore the obvious conversation starter (the dogs)",
        "Be too intense in a casual setting",
        "Rush to get her number",
        "Forget the dog's name after she tells you",
      ],
    },
    agentConfig: {
      name: 'Hannah',
      voiceId: VOICES.jessica,
    },
  },

  nightclub: {
    type: 'nightclub',
    name: 'Nightclub',
    avatar: '/young-woman-nightclub-fun.jpg',
    description: 'Navigate the high-energy nightclub environment',
    difficulty: 'advanced',
    duration: '5-10 minutes',
    level: 0, // Bonus scenario
    difficultyScore: 8,
    hiddenContext: 'Out dancing with friends, having a great time. Loud environment means nonverbal communication matters. Looking to have fun, not necessarily meet someone.',
    sceneNarrative: [
      "You're at a popular nightclub on a Saturday night.",
      "The music is loud, the energy is high, and people are dancing.",
      "You spot an attractive woman near the bar with a friend, taking a break from dancing.",
      "You approach during a lull in the music...",
    ],
    tips: {
      openingLines: [
        "Hey! Great music tonight! I'm [name]!",
        "You look like you're having a great time! Mind if I join?",
        "I had to come say hi! What are you drinking?",
      ],
      doList: [
        "Match the high energy of the environment",
        "Use confident body language",
        "Lean in to be heard but respect space",
        "Include her friend in the interaction",
      ],
      dontList: [
        "Be creepy on the dance floor",
        "Grab or touch without invitation",
        "Ignore her friend completely",
        "Get too drunk before approaching",
      ],
    },
    agentConfig: {
      name: 'Mia',
      voiceId: VOICES.emma,
    },
  },
}

// Helper function to get scenario by type
export function getScenario(type: string): ScenarioConfig | null {
  return scenarios[type] || null
}

// Get all scenarios as an array
export function getAllScenarios(): ScenarioConfig[] {
  return Object.values(scenarios)
}

// Get scenarios by difficulty
export function getScenariosByDifficulty(difficulty: ScenarioConfig['difficulty']): ScenarioConfig[] {
  return Object.values(scenarios).filter(s => s.difficulty === difficulty)
}

// Get scenario by level number (for linear progression)
export function getScenarioByLevel(level: number): ScenarioConfig | null {
  return Object.values(scenarios).find(s => s.level === level) || null
}

// Get all scenarios in the main progression (level > 0), sorted by level
export function getProgressionScenarios(): ScenarioConfig[] {
  return Object.values(scenarios)
    .filter(s => s.level > 0)
    .sort((a, b) => a.level - b.level)
}

// Get bonus scenarios (level === 0, not in main progression)
export function getBonusScenarios(): ScenarioConfig[] {
  return Object.values(scenarios).filter(s => s.level === 0)
}

// Get total number of levels in progression
export function getTotalLevels(): number {
  return getProgressionScenarios().length
}
