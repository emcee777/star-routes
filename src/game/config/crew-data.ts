// ============================================================
// Star Routes - Crew Name & Skill Data
// ============================================================

export const CREW_FIRST_NAMES = [
    'Kira', 'Jace', 'Mira', 'Vex', 'Sola', 'Ren', 'Nova', 'Drake',
    'Lyra', 'Kane', 'Zara', 'Orion', 'Thea', 'Cade', 'Elara', 'Finn',
    'Aria', 'Dex', 'Luna', 'Rex', 'Talia', 'Rook', 'Sera', 'Blaze',
    'Ivy', 'Hawk', 'Nyx', 'Cole', 'Jade', 'Ash', 'Petra', 'Storm',
    'Echo', 'Kai', 'Sage', 'Flint', 'Vale', 'Cruz', 'Haze', 'Wren',
];

export const CREW_LAST_NAMES = [
    'Voss', 'Chen', 'Reyes', 'Nkomo', 'Volkov', 'Tanaka', 'Singh',
    'Okonkwo', 'Santos', 'Kowalski', 'Brennan', 'Zhao', 'Diaz',
    'Petrov', 'Kim', 'Osei', 'Weber', 'Cruz', 'Ali', 'Nakamura',
    'Frost', 'Steele', 'Blackwood', 'Drake', 'Stone', 'Cross',
    'Marsh', 'Quinn', 'Blake', 'Sharp', 'Wolfe', 'Raven',
];

export const SKILL_DESCRIPTIONS: Record<string, string> = {
    navigation: 'Finds faster, safer routes between systems.',
    combat: 'Increases weapon damage and combat effectiveness.',
    trading: 'Gets better buy/sell prices at stations.',
    engineering: 'Improves fuel efficiency and ship repair.',
    diplomacy: 'Better faction reputation gains. Can negotiate in events.',
    stealth: 'Reduces chance of hostile encounters.',
    medicine: 'Heals crew morale faster. Bonus in medical events.',
    leadership: 'Boosts morale of all crew members.',
    piloting: 'Increases flee chance in combat. Better travel speed.',
    gunnery: 'Increases weapon accuracy and critical hits.',
    hacking: 'Can bypass some event requirements. Stealth bonus.',
    mining: 'Bonus yield from mining events and discoveries.',
    logistics: 'Increases effective cargo capacity.',
    scouting: 'Reveals more info about unexplored systems.',
    intimidation: 'Can scare off weaker pirates. Combat morale damage.',
};

export const CREW_SALARIES = {
    base: 10,        // base salary per day
    perSkillLevel: 3, // additional per total skill level
    perTrait: 5,      // additional per positive trait
};

export const POSITIVE_TRAITS = [
    'brave', 'loyal', 'lucky', 'charismatic', 'experienced',
    'mechanic', 'sharpshooter', 'negotiator', 'survivalist',
] as const;

export const NEGATIVE_TRAITS = [
    'cowardly', 'greedy', 'reckless', 'unlucky', 'antisocial', 'rookie',
] as const;
