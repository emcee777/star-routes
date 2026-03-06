// ============================================================
// Star Routes - Star System Name Generation
// ============================================================

export const STAR_PREFIXES = [
    'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
    'Nova', 'Sol', 'Vega', 'Rigel', 'Altair', 'Sirius', 'Polaris',
    'Cygnus', 'Draco', 'Orion', 'Lyra', 'Aquila', 'Corvus', 'Hydra',
    'Phoenix', 'Serpens', 'Vulpes', 'Ara', 'Pavo', 'Grus', 'Lupus',
];

export const STAR_SUFFIXES = [
    'Prime', 'Minor', 'Major', 'Reach', 'Gate', 'Haven', 'Point',
    'Station', 'Junction', 'Nexus', 'Hub', 'Crossing', 'Port',
    'Outpost', 'Beacon', 'Anchorage', 'Terminal', 'Landing',
];

export const STAR_NAMES = [
    'Arcturus', 'Betelgeuse', 'Canopus', 'Deneb', 'Fomalhaut',
    'Hadar', 'Izar', 'Kochab', 'Lesath', 'Menkib',
    'Nunki', 'Phad', 'Rasalhague', 'Sabik', 'Thuban',
    'Unukalhai', 'Vindemiatrix', 'Wezen', 'Zaniah', 'Achernar',
    'Aldebaran', 'Capella', 'Dubhe', 'Electra', 'Gacrux',
    'Mimosa', 'Naos', 'Procyon', 'Regulus', 'Spica',
    'Tarazed', 'Avior', 'Bellatrix', 'Castor', 'Diphda',
    'Enif', 'Hamal', 'Alhena', 'Ankaa', 'Suhail',
    'Markab', 'Schedar', 'Mirfak', 'Algieba', 'Kaus',
    'Mizar', 'Alkaid', 'Merak', 'Phecda', 'Alioth',
    'Maia', 'Merope', 'Celaeno', 'Taygeta', 'Asterope',
    'Mintaka', 'Alnilam', 'Alnitak', 'Saiph', 'Acamar',
];

export const STATION_ADJECTIVES = [
    'Central', 'Outer', 'Deep', 'High', 'Low', 'Far', 'Near',
    'Old', 'New', 'Free', 'Grand', 'Royal', 'Shadow', 'Iron',
    'Silver', 'Gold', 'Crystal', 'Crimson', 'Azure', 'Emerald',
];

export const DESCRIPTIONS_BY_INDUSTRY: Record<string, string[]> = {
    mining: [
        'Asteroid miners carve wealth from the void.',
        'Mining rigs orbit shattered moons, extracting ore day and night.',
        'The dull thrum of heavy machinery echoes through every corridor.',
    ],
    agriculture: [
        'Vast biodomes produce food for dozens of systems.',
        'Green fields stretch beneath transparent domes. A breath of fresh air.',
        'Hydroponic farms feed the sector from this pastoral world.',
    ],
    manufacturing: [
        'Factories churn out everything from ship parts to consumer goods.',
        'The industrial heart of the region. Smokestacks and assembly lines.',
        'Manufactured goods roll off production lines around the clock.',
    ],
    tech: [
        'Research labs and tech startups cluster around the university.',
        'The cutting edge of technology development in this sector.',
        'Scientists and engineers push the boundaries of what\'s possible.',
    ],
    military: [
        'Warships patrol the perimeter. This is a fortress, not a port.',
        'Military precision governs every aspect of station life.',
        'Armed to the teeth. Don\'t cause trouble here.',
    ],
    trading_hub: [
        'Merchants from every faction haggle in the bustling bazaar.',
        'The galaxy\'s marketplace. If it exists, someone sells it here.',
        'Credits flow like water through this commercial nexus.',
    ],
    refinery: [
        'Ore goes in, refined materials come out. Simple as that.',
        'Chemical plants process raw materials into useful compounds.',
        'The air smells of ozone and industry.',
    ],
    medical: [
        'The sector\'s premier medical facility. Patients come from far away.',
        'Biotech labs develop new treatments and cures.',
        'Healing is big business here.',
    ],
    luxury: [
        'Opulence drips from every surface. Only the wealthy dock here.',
        'Fine dining, rare goods, and exclusive entertainment.',
        'A playground for the rich among the stars.',
    ],
    frontier: [
        'A rough-and-tumble outpost on the edge of known space.',
        'Hard people live here. Harder people pass through.',
        'The last stop before the unknown.',
    ],
};
