import { BubbleSortLevel } from './types';

export const BUBBLE_SORT_LEVELS: BubbleSortLevel[] = [
  // Level 1: Tournament Entrance (4 Categories = 16 Bubbles, 28 Moves)
  {
    levelNumber: 1,
    name: 'Coral Gateway',
    movesLimit: 28,
    initialVisibleCount: 16,
    categories: [
      { category: 'FRUITS', words: ['APPLE', 'BANANA', 'MANGO', 'PEACH'] },
      { category: 'SHAPES', words: ['CIRCLE', 'SQUARE', 'DIAMOND', 'OVAL'] },
      { category: 'ANIMALS', words: ['TIGER', 'ZEBRA', 'LION', 'GIRAFFE'] },
      { category: 'COLORS', words: ['BLUE', 'YELLOW', 'SCARLET', 'VIOLET'] },
    ],
  },

  // Level 2: Exact Match with Reference Video (8 Categories = 32 Bubbles, 39 Moves)
  {
    levelNumber: 2,
    name: 'Deep Reef Basin',
    movesLimit: 39,
    initialVisibleCount: 20,
    categories: [
      { category: 'FRUITS', words: ['GRAPE', 'APPLE', 'ORANGE', 'BANANA'] },
      { category: 'VEGETABLES', words: ['POTATO', 'CARROT', 'ONION', 'LETTUCE'] },
      { category: 'SHAPES', words: ['RECTANGLE', 'CIRCLE', 'TRIANGLE', 'SQUARE'] },
      { category: 'HOUSE', words: ['DOOR', 'BED', 'TABLE', 'CHAIR'] },
      { category: 'KITCHEN TOOLS', words: ['FORK', 'KNIFE', 'SPOON', 'PLATE'] },
      { category: 'TRAFFIC', words: ['CAR', 'ROAD', 'TRAFFIC', 'BRAKE'] },
      { category: 'NATURE', words: ['SKY', 'CLOUD', 'SOIL', 'HILL'] },
      { category: 'DESSERT', words: ['COOKIE', 'FUDGE', 'CANDY', 'BROWNIE'] },
    ],
  },

  // Level 3: Reference Video Stage (8 Categories, Extra Bubbles unlocked)
  {
    levelNumber: 3,
    name: 'Sunken Academy',
    movesLimit: 39,
    initialVisibleCount: 20,
    categories: [
      { category: 'TOYS', words: ['PUZZLE', 'KITE', 'DOLL', 'BALL'] },
      { category: 'SUBJECTS', words: ['MATH', 'SCIENCE', 'HISTORY', 'ART'] },
      { category: 'ANATOMY', words: ['LEG', 'EAR', 'EYE', 'HAND'] },
      { category: 'BREAKFAST', words: ['EGG', 'MILK', 'RICE', 'BREAD'] },
      { category: 'STATIONERY', words: ['PEN', 'DESK', 'BOOK', 'PENCIL'] },
      { category: 'ACCESSORIES', words: ['PURSE', 'RING', 'WATCH', 'BELT'] },
      { category: 'WATERS', words: ['SEA', 'OCEAN', 'RIVER', 'WAVE'] },
      { category: 'FOOTWEAR', words: ['BOOT', 'SNEAKER', 'SANDAL', 'HEEL'] },
    ],
  },

  // Level 4
  {
    levelNumber: 4,
    name: 'Emerald Trench',
    movesLimit: 38,
    initialVisibleCount: 20,
    categories: [
      { category: 'WEATHER', words: ['STORM', 'RAIN', 'THUNDER', 'SNOW'] },
      { category: 'MUSIC', words: ['PIANO', 'GUITAR', 'DRUM', 'VIOLIN'] },
      { category: 'TREES', words: ['OAK', 'PINE', 'MAPLE', 'PALM'] },
      { category: 'DRINKS', words: ['COFFEE', 'TEA', 'JUICE', 'SODA'] },
      { category: 'CLOTHING', words: ['SHIRT', 'JACKET', 'PANTS', 'COAT'] },
      { category: 'COSMOS', words: ['MOON', 'STAR', 'COMET', 'SUN'] },
      { category: 'INSECTS', words: ['BEE', 'ANT', 'WASP', 'MOTH'] },
      { category: 'METALS', words: ['GOLD', 'SILVER', 'COPPER', 'IRON'] },
    ],
  },

  // Level 5
  {
    levelNumber: 5,
    name: 'Lagoon of Whispers',
    movesLimit: 37,
    initialVisibleCount: 20,
    categories: [
      { category: 'BIRDS', words: ['EAGLE', 'HAWK', 'FALCON', 'OWL'] },
      { category: 'SPORTS', words: ['SOCCER', 'TENNIS', 'RUGBY', 'GOLF'] },
      { category: 'BUILDINGS', words: ['TOWER', 'CASTLE', 'CABIN', 'MANSION'] },
      { category: 'VEHICLES', words: ['TRAIN', 'BUS', 'TRUCK', 'SHIP'] },
      { category: 'JEWELRY', words: ['RUBY', 'PEARL', 'EMERALD', 'TOPAZ'] },
      { category: 'FEELINGS', words: ['JOY', 'PRIDE', 'HOPE', 'ANGER'] },
      { category: 'TIME', words: ['SECOND', 'MINUTE', 'HOUR', 'WEEK'] },
      { category: 'GRAINS', words: ['WHEAT', 'BARLEY', 'OATS', 'CORN'] },
    ],
  },

  // Level 6
  {
    levelNumber: 6,
    name: 'Bioluminescent Abyss',
    movesLimit: 38,
    initialVisibleCount: 20,
    categories: [
      { category: 'OCEAN LIFE', words: ['SHARK', 'WHALE', 'DOLPHIN', 'SEAL'] },
      { category: 'FLOWERS', words: ['ROSE', 'TULIP', 'DAISY', 'ORCHID'] },
      { category: 'BEDROOM', words: ['PILLOW', 'BLANKET', 'CLOSET', 'LAMP'] },
      { category: 'DOG BREEDS', words: ['HUSKY', 'POODLE', 'BEAGLE', 'BOXER'] },
      { category: 'DESSERTS', words: ['CAKE', 'PIE', 'PUDDING', 'TART'] },
      { category: 'LANDFORMS', words: ['CANYON', 'VALLEY', 'DESERT', 'CAVE'] },
      { category: 'TOOLS', words: ['HAMMER', 'WRENCH', 'PLIERS', 'SAW'] },
      { category: 'DAIRY', words: ['CHEESE', 'BUTTER', 'YOGURT', 'CREAM'] },
    ],
  },

  // Level 7
  {
    levelNumber: 7,
    name: 'Sapphire Atoll',
    movesLimit: 36,
    initialVisibleCount: 20,
    categories: [
      { category: 'PLANETS', words: ['MARS', 'VENUS', 'JUPITER', 'SATURN'] },
      { category: 'OFFICE', words: ['STAPLER', 'FOLDER', 'CLIP', 'PRINTER'] },
      { category: 'WILD CATS', words: ['PANTHER', 'LEOPARD', 'CHEETAH', 'JAGUAR'] },
      { category: 'SEASONS', words: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'] },
      { category: 'DANCES', words: ['SALSA', 'WALTZ', 'TANGO', 'BALLET'] },
      { category: 'CONTAINERS', words: ['BOTTLE', 'JAR', 'BOWL', 'BASKET'] },
      { category: 'FAST FOOD', words: ['BURGER', 'PIZZA', 'TACO', 'FRIES'] },
      { category: 'MEASURES', words: ['INCH', 'METER', 'YARD', 'MILE'] },
    ],
  },

  // Level 8
  {
    levelNumber: 8,
    name: 'Triton Cavern',
    movesLimit: 37,
    initialVisibleCount: 20,
    categories: [
      { category: 'HERBS', words: ['BASIL', 'MINT', 'THYME', 'ROSEMARY'] },
      { category: 'FARM ANIMALS', words: ['HORSE', 'SHEEP', 'COW', 'GOAT'] },
      { category: 'COMPUTERS', words: ['MOUSE', 'SCREEN', 'KEYBOARD', 'CHIP'] },
      { category: 'FOOTWEAR', words: ['SLIPPER', 'CLOG', 'LOAFER', 'MULE'] },
      { category: 'CRUSTACEANS', words: ['CRAB', 'LOBSTER', 'SHRIMP', 'PRAWN'] },
      { category: 'WEAPONS', words: ['SWORD', 'SHIELD', 'SPEAR', 'BOW'] },
      { category: 'ROADS', words: ['ALLEY', 'AVENUE', 'LANE', 'HIGHWAY'] },
      { category: 'SPICES', words: ['PEPPER', 'CLOVE', 'GINGER', 'CINNAMON'] },
    ],
  },

  // Level 9
  {
    levelNumber: 9,
    name: 'Sunken Galleon',
    movesLimit: 36,
    initialVisibleCount: 20,
    categories: [
      { category: 'PIRATES', words: ['HOOK', 'ANCHOR', 'COMPASS', 'TREASURE'] },
      { category: 'MONEY', words: ['COIN', 'NOTE', 'CHECK', 'BOND'] },
      { category: 'ROOMS', words: ['ATTIC', 'CELLAR', 'KITCHEN', 'PORCH'] },
      { category: 'REPTILES', words: ['SNAKE', 'LIZARD', 'GECKO', 'TURTLE'] },
      { category: 'BERRIES', words: ['CHERRY', 'PLUM', 'PEACH', 'APRICOT'] },
      { category: 'BATHROOM', words: ['TOWEL', 'SOAP', 'SHAMPOO', 'MIRROR'] },
      { category: 'METALS', words: ['COPPER', 'NICKEL', 'BRASS', 'BRONZE'] },
      { category: 'FABRICS', words: ['SILK', 'COTTON', 'WOOL', 'LINEN'] },
    ],
  },

  // Level 10
  {
    levelNumber: 10,
    name: 'Poseidon Sanctuary',
    movesLimit: 35,
    initialVisibleCount: 20,
    categories: [
      { category: 'MYTHOLOGY', words: ['ZEUS', 'HERA', 'APOLLO', 'ARES'] },
      { category: 'GOVERNANCE', words: ['SENATE', 'COURT', 'COUNCIL', 'PARLIAMENT'] },
      { category: 'SEAS', words: ['BALTIC', 'CASPIAN', 'RED', 'BLACK'] },
      { category: 'MEDICINE', words: ['PILL', 'SERUM', 'SYRUP', 'VACCINE'] },
      { category: 'DOCKS', words: ['PIER', 'WHARF', 'QUAY', 'HARBOR'] },
      { category: 'HEADWEAR', words: ['BERET', 'FEDORA', 'TURBAN', 'HELMET'] },
      { category: 'FURNITURE', words: ['COUCH', 'STOOL', 'BENCH', 'DRESSER'] },
      { category: 'MEAT', words: ['BEEF', 'CHICKEN', 'TURKEY', 'PORK'] },
    ],
  },

  // Level 11
  {
    levelNumber: 11,
    name: 'Kelp Forest Maze',
    movesLimit: 37,
    initialVisibleCount: 20,
    categories: [
      { category: 'TROPICAL BIRDS', words: ['TOUCAN', 'PARROT', 'MACAW', 'FLAMINGO'] },
      { category: 'GARDEN', words: ['SHOVEL', 'RAKE', 'HOSE', 'SHEARS'] },
      { category: 'NUT TYPES', words: ['WALNUT', 'PEANUT', 'ALMOND', 'CASHEW'] },
      { category: 'GEOMETRY', words: ['CYLINDER', 'SPHERE', 'CONE', 'PYRAMID'] },
      { category: 'COATS', words: ['TRENCH', 'PARKA', 'BLAZER', 'PONCHO'] },
      { category: 'RIVERS', words: ['NILE', 'AMAZON', 'DANUBE', 'THAMES'] },
      { category: 'FESTIVALS', words: ['CARNIVAL', 'FIESTA', 'GALA', 'PARADE'] },
      { category: 'BAKERY', words: ['BAGEL', 'CROISSANT', 'MUFFIN', 'SCONE'] },
    ],
  },

  // Level 12
  {
    levelNumber: 12,
    name: 'Volcanic Thermal Vent',
    movesLimit: 36,
    initialVisibleCount: 20,
    categories: [
      { category: 'GEOLOGY', words: ['MAGMA', 'BASALT', 'GRANITE', 'LAVA'] },
      { category: 'HEATERS', words: ['FURNACE', 'BOILER', 'STOVE', 'HEATER'] },
      { category: 'AIRCRAFT', words: ['GLIDER', 'JET', 'DRONE', 'ROCKET'] },
      { category: 'OPTICS', words: ['LENS', 'PRISM', 'MIRROR', 'LASER'] },
      { category: 'DRUMS', words: ['BONGO', 'CONGA', 'TIMPANI', 'SNARE'] },
      { category: 'COLD THINGS', words: ['ICE', 'FROST', 'GLACIER', 'HAIL'] },
      { category: 'SNAKES', words: ['COBRA', 'PYTHON', 'VIPER', 'MAMBA'] },
      { category: 'PASTRIES', words: ['DONUT', 'ECLAIR', 'DANISH', 'STRUDEL'] },
    ],
  },

  // Level 13
  {
    levelNumber: 13,
    name: 'Abyssal Ridge',
    movesLimit: 36,
    initialVisibleCount: 20,
    categories: [
      { category: 'ASTRONOMY', words: ['NEBULA', 'GALAXY', 'QUASAR', 'PULSAR'] },
      { category: 'POETRY', words: ['SONNET', 'HAIKU', 'STANZA', 'RHYME'] },
      { category: 'CHESS', words: ['BISHOP', 'KNIGHT', 'ROOK', 'PAWN'] },
      { category: 'AMPHIBIANS', words: ['FROG', 'TOAD', 'NEWT', 'SALAMANDER'] },
      { category: 'LIGHT SOURCES', words: ['TORCH', 'CANDLE', 'BEACON', 'FLARE'] },
      { category: 'BRIDGES', words: ['ARCH', 'BEAM', 'SUSPENSION', 'CABLE'] },
      { category: 'DOCKS', words: ['MARINA', 'JETTY', 'SLIPWAY', 'PORT'] },
      { category: 'LEGUMES', words: ['LENTIL', 'CHICKPEA', 'SOYBEAN', 'PEA'] },
    ],
  },

  // Level 14
  {
    levelNumber: 14,
    name: 'Pearl Lagoon',
    movesLimit: 35,
    initialVisibleCount: 20,
    categories: [
      { category: 'SEASHELLS', words: ['CONCH', 'CLAM', 'SCALLOP', 'OYSTER'] },
      { category: 'MINERALS', words: ['QUARTZ', 'MICA', 'TALC', 'GYPSUM'] },
      { category: 'ISLANDS', words: ['MALDIVES', 'FIJI', 'HAWAII', 'SAMOA'] },
      { category: 'SEAFARING', words: ['RUDDER', 'MAST', 'SAIL', 'KEEL'] },
      { category: 'MEDICINE', words: ['BANDAGE', 'GAUZE', 'CAST', 'SPLINT'] },
      { category: 'SWEETENERS', words: ['SUGAR', 'HONEY', 'STEVIA', 'SYRUP'] },
      { category: 'FASTENERS', words: ['BOLT', 'SCREW', 'RIVET', 'NAIL'] },
      { category: 'CARPETS', words: ['RUG', 'MAT', 'TAPESTRY', 'RUNNER'] },
    ],
  },

  // Level 15
  {
    levelNumber: 15,
    name: 'Deep Siren Trench',
    movesLimit: 36,
    initialVisibleCount: 20,
    categories: [
      { category: 'VOICES', words: ['SOPRANO', 'ALTO', 'TENOR', 'BASS'] },
      { category: 'STRING INSTRUMENTS', words: ['CELLO', 'HARP', 'LUTE', 'BANJO'] },
      { category: 'RODENTS', words: ['BEAVER', 'SQUIRREL', 'HAMSTER', 'GERBIL'] },
      { category: 'CRIMES', words: ['THEFT', 'FRAUD', 'FORGERY', 'TREASON'] },
      { category: 'LIQUIDS', words: ['VINEGAR', 'OIL', 'WATER', 'ALCOHOL'] },
      { category: 'PRINTS', words: ['STRIPES', 'DOTS', 'PLAID', 'CHECK'] },
      { category: 'FORESTS', words: ['JUNGLE', 'WOODS', 'TAIGA', 'GROVE'] },
      { category: 'ROOFING', words: ['TILE', 'SHINGLE', 'SLATE', 'THATCH'] },
    ],
  },

  // Level 16
  {
    levelNumber: 16,
    name: 'Coral Citadel',
    movesLimit: 35,
    initialVisibleCount: 20,
    categories: [
      { category: 'FORTRESS', words: ['RAMPART', 'MOAT', 'TURRET', 'BASTION'] },
      { category: 'KNIGHTS', words: ['ARMOR', 'LANCE', 'GAUNTLET', 'VISOR'] },
      { category: 'HORSE TACK', words: ['SADDLE', 'BRIDLE', 'STIRRUP', 'REIN'] },
      { category: 'ROYALTY', words: ['PRINCE', 'MONARCH', 'BARON', 'DUKE'] },
      { category: 'GRAVIES', words: ['SAUCE', 'BROTH', 'CURRY', 'DIP'] },
      { category: 'PENS', words: ['QUILL', 'ROLLER', 'BALLPOINT', 'FOUNTAIN'] },
      { category: 'CAR PARTS', words: ['CLUTCH', 'PISTON', 'MUFFLER', 'ENGINE'] },
      { category: 'CANINES', words: ['WOLF', 'FOX', 'JACKAL', 'COYOTE'] },
    ],
  },

  // Level 17
  {
    levelNumber: 17,
    name: 'Neptune Chasm',
    movesLimit: 35,
    initialVisibleCount: 20,
    categories: [
      { category: 'WIND INSTRUMENTS', words: ['FLUTE', 'CLARINET', 'OBOE', 'BASSOON'] },
      { category: 'BRASS', words: ['TRUMPET', 'TROMBONE', 'TUBA', 'CORNET'] },
      { category: 'WINDS', words: ['BREEZE', 'GALE', 'GUST', 'TYPHOON'] },
      { category: 'SHORELINES', words: ['BEACH', 'COAST', 'CLIFF', 'DUNE'] },
      { category: 'CAMPING', words: ['TENT', 'LANTERN', 'COOLER', 'CAMPFIRE'] },
      { category: 'CHEESES', words: ['CHEDDAR', 'BRIE', 'GOUDA', 'PARMESAN'] },
      { category: 'MONKEYS', words: ['BABOON', 'CHIMP', 'GIBBON', 'LEMUR'] },
      { category: 'FOOTWEAR', words: ['OXFORD', 'DERBY', 'BROGUE', 'MOCCASIN'] },
    ],
  },

  // Level 18
  {
    levelNumber: 18,
    name: 'Glacial Shelf',
    movesLimit: 34,
    initialVisibleCount: 20,
    categories: [
      { category: 'POLAR LIFE', words: ['PENGUIN', 'WALRUS', 'NARWHAL', 'PUFFIN'] },
      { category: 'FROZEN', words: ['ICEBERG', 'BLIZZARD', 'TUNDRA', 'PERMAFROST'] },
      { category: 'HEATING', words: ['RADIATOR', 'FIREPLACE', 'KILN', 'BRAZIER'] },
      { category: 'SCIENTIFIC UNITS', words: ['KELVIN', 'JOULE', 'PASCAL', 'WATT'] },
      { category: 'COFFEE DRINKS', words: ['LATTE', 'MOCHA', 'ESPRESSO', 'MACCHIATO'] },
      { category: 'PASTA', words: ['PENNE', 'FUSILLI', 'RAVIOLI', 'GNOCCHI'] },
      { category: 'SOUPS', words: ['BISQUE', 'CHOWDER', 'STEW', 'GUMBO'] },
      { category: 'PRECIOUS GEMS', words: ['DIAMOND', 'SAPPHIRE', 'AMETHYST', 'GARNET'] },
    ],
  },

  // Level 19
  {
    levelNumber: 19,
    name: 'Twilight Deep',
    movesLimit: 34,
    initialVisibleCount: 20,
    categories: [
      { category: 'ENERGY', words: ['SOLAR', 'NUCLEAR', 'WIND', 'THERMAL'] },
      { category: 'SENSORY', words: ['TASTE', 'SIGHT', 'HEARING', 'SMELL'] },
      { category: 'CARD SUITS', words: ['HEARTS', 'SPADES', 'CLUBS', 'DIAMONDS'] },
      { category: 'BOARD GAMES', words: ['SCRABBLE', 'CLUE', 'CHESS', 'CHECKERS'] },
      { category: 'FARM CROPS', words: ['COTTON', 'TOBACCO', 'SOY', 'CANOLA'] },
      { category: 'NIGHT LIFE', words: ['BAT', 'RACCOON', 'POSSUM', 'BADGER'] },
      { category: 'GLASSWARE', words: ['GOBLET', 'TUMBLER', 'FLUTE', 'CHALICE'] },
      { category: 'SPICES', words: ['TURMERIC', 'PAPRIKA', 'NUTMEG', 'SAFFRON'] },
    ],
  },

  // Level 20: Mid-Tournament Pinnacle
  {
    levelNumber: 20,
    name: 'Challenger Deep Apex',
    movesLimit: 33,
    initialVisibleCount: 20,
    categories: [
      { category: 'PHILOSOPHY', words: ['ETHICS', 'LOGIC', 'ONTOLOGY', 'AESTHETICS'] },
      { category: 'CLASSICAL ARTS', words: ['DRAMA', 'OPERA', 'SCULPTURE', 'FRESCO'] },
      { category: 'RELIGIONS', words: ['BUDDHISM', 'HINDUISM', 'JUDAISM', 'ISLAM'] },
      { category: 'ARCHAEOLOGY', words: ['FOSSIL', 'RELIC', 'SHARD', 'RUIN'] },
      { category: 'MICROSCOPY', words: ['CELL', 'AMOEBA', 'VIRUS', 'BACTERIA'] },
      { category: 'PRINTING', words: ['FONT', 'KERNING', 'SERIF', 'INDENT'] },
      { category: 'SAILING GEAR', words: ['HARNESS', 'PULLEY', 'WINCH', 'CLEAT'] },
      { category: 'CONDIMENTS', words: ['KETCHUP', 'MUSTARD', 'MAYO', 'RELISH'] },
    ],
  },

  // Level 21
  {
    levelNumber: 21,
    name: 'Crystal Geode Trench',
    movesLimit: 34,
    initialVisibleCount: 20,
    categories: [
      { category: 'CRYSTALS', words: ['AGATE', 'JASPER', 'OPAL', 'BISMUTH'] },
      { category: 'METALS', words: ['TITANIUM', 'PLATINUM', 'TUNGSTEN', 'URANIUM'] },
      { category: 'CHEMISTRY', words: ['PROTON', 'NEUTRON', 'ELECTRON', 'PHOTON'] },
      { category: 'REACTIONS', words: ['FUSION', 'FISSION', 'OXIDATION', 'DECAY'] },
      { category: 'BELLS', words: ['GONG', 'CHIME', 'CARILLON', 'CYMBAL'] },
      { category: 'PUPPETS', words: ['MARIONETTE', 'VENTRILOQUIST', 'SHADOW', 'FINGER'] },
      { category: 'SALADS', words: ['CAESAR', 'GREEK', 'WALDORF', 'COBB'] },
      { category: 'DESERTS', words: ['SAHARA', 'GOBI', 'MOJAVE', 'ATACAMA'] },
    ],
  },

  // Level 22
  {
    levelNumber: 22,
    name: 'Leviathan Spine',
    movesLimit: 34,
    initialVisibleCount: 20,
    categories: [
      { category: 'BONES', words: ['FEMUR', 'TIBIA', 'CRANIUM', 'PELVIS'] },
      { category: 'MUSCLES', words: ['BICEP', 'TRICEP', 'DELTOID', 'CALF'] },
      { category: 'ORGANS', words: ['LIVER', 'KIDNEY', 'HEART', 'LUNG'] },
      { category: 'DIGESTIVE', words: ['STOMACH', 'SPLEEN', 'PANCREAS', 'COLON'] },
      { category: 'HOSPITAL', words: ['CLINIC', 'WARD', 'ICU', 'TRIAGE'] },
      { category: 'MEDICAL TOOLS', words: ['SCALPEL', 'STETHOSCOPE', 'FORCEPS', 'SYRINGE'] },
      { category: 'BEDDING', words: ['DUVET', 'QUILT', 'SHEET', 'MATTRESS'] },
      { category: 'DORM', words: ['DESK', 'BUNK', 'LOCKER', 'FRIDGE'] },
    ],
  },

  // Level 23
  {
    levelNumber: 23,
    name: 'Sirens Hollow',
    movesLimit: 33,
    initialVisibleCount: 20,
    categories: [
      { category: 'FOLKLORE', words: ['MERMAID', 'KRAKEN', 'LEVIATHAN', 'SELKIE'] },
      { category: 'MAGIC', words: ['POTION', 'WAND', 'SPELL', 'SCROLL'] },
      { category: 'CREATURES', words: ['GRIFFIN', 'PHOENIX', 'PEGASUS', 'DRAGON'] },
      { category: 'BEASTS', words: ['HYDRA', 'MINOTAUR', 'CENTAUR', 'CERBERUS'] },
      { category: 'FORESTRY', words: ['TIMBER', 'LOGGING', 'SAPLING', 'CANOPY'] },
      { category: 'RICE VARIETIES', words: ['BASMATI', 'JASMINE', 'ARBORIO', 'WILD'] },
      { category: 'WINE TYPES', words: ['MERLOT', 'SHIRAZ', 'CHARDONNAY', 'PINOT'] },
      { category: 'BREADS', words: ['BAGUETTE', 'BRIOCHE', 'CIABATTA', 'PITA'] },
    ],
  },

  // Level 24
  {
    levelNumber: 24,
    name: 'Obsidian Abyss',
    movesLimit: 33,
    initialVisibleCount: 20,
    categories: [
      { category: 'DARK ROCKS', words: ['OBSIDIAN', 'SLATE', 'COAL', 'CHARCOAL'] },
      { category: 'SHADOWS', words: ['DUSK', 'ECLIPSE', 'TWILIGHT', 'MIDNIGHT'] },
      { category: 'SLEEP', words: ['DREAM', 'SLUMBER', 'NAP', 'TRANCE'] },
      { category: 'FOG', words: ['MIST', 'HAZE', 'SMOG', 'VAPOR'] },
      { category: 'CLOCKS', words: ['SUNDIAL', 'HOURGLASS', 'STOPWATCH', 'PENDULUM'] },
      { category: 'METRICS', words: ['DECIBEL', 'CELSIUS', 'AMPERE', 'VOLT'] },
      { category: 'SEEDS', words: ['CHIA', 'FLAX', 'SESAME', 'PUMPKIN'] },
      { category: 'BEANS', words: ['KIDNEY', 'PINTO', 'NAVY', 'LIMA'] },
    ],
  },

  // Level 25
  {
    levelNumber: 25,
    name: 'Sunken Colosseum',
    movesLimit: 32,
    initialVisibleCount: 20,
    categories: [
      { category: 'GLADIATORS', words: ['TRIDENT', 'NET', 'HELM', 'CHARIOT'] },
      { category: 'ARENAS', words: ['STADIUM', 'RING', 'CIRCUIT', 'DOME'] },
      { category: 'COMBAT', words: ['BOXING', 'JUDO', 'KARATE', 'FENCING'] },
      { category: 'TRACK', words: ['HURDLES', 'SPRINT', 'RELAY', 'JAVELIN'] },
      { category: 'BALLROOM', words: ['FOXTROT', 'RUMBA', 'SAMBA', 'MAMBO'] },
      { category: 'THEATER', words: ['STAGE', 'PROP', 'CURTAIN', 'BALCONY'] },
      { category: 'DRAMA ROLES', words: ['VILLAIN', 'HERO', 'SIDEKICK', 'NARRATOR'] },
      { category: 'GENRES', words: ['COMEDY', 'TRAGEDY', 'MYSTERY', 'ROMANCE'] },
    ],
  },

  // Level 26
  {
    levelNumber: 26,
    name: 'Prismatic Reef',
    movesLimit: 33,
    initialVisibleCount: 20,
    categories: [
      { category: 'SPECTRUM', words: ['INDIGO', 'TURQUOISE', 'MAGENTA', 'CYAN'] },
      { category: 'PAINTS', words: ['ACRYLIC', 'OIL', 'GOUACHE', 'WATERCOLOR'] },
      { category: 'ART STYLES', words: ['CUBISM', 'REALISM', 'IMPRESSIONISM', 'SURREALISM'] },
      { category: 'SCULPTURE', words: ['MARBLE', 'CLAY', 'PLASTER', 'WAX'] },
      { category: 'ARCHIVES', words: ['LEDGER', 'DOSSIER', 'INDEX', 'CATALOG'] },
      { category: 'OFFICE TOOLS', words: ['SHREDDER', 'SCANNER', 'BINDER', 'LAMINATOR'] },
      { category: 'TROPICAL FRUIT', words: ['PAPAYA', 'GUAVA', 'LYCHEE', 'PASSION'] },
      { category: 'CITRUS', words: ['LIME', 'LEMON', 'POMELO', 'TANGERINE'] },
    ],
  },

  // Level 27
  {
    levelNumber: 27,
    name: 'Magnetic Undercurrent',
    movesLimit: 32,
    initialVisibleCount: 20,
    categories: [
      { category: 'PHYSICS', words: ['GRAVITY', 'INERTIA', 'VELOCITY', 'MOMENTUM'] },
      { category: 'CIRCUITS', words: ['RESISTOR', 'CAPACITOR', 'DIODE', 'INDUCTOR'] },
      { category: 'LOGIC GATES', words: ['AND', 'NAND', 'XOR', 'NOT'] },
      { category: 'STORAGE', words: ['HARDWARE', 'FLASH', 'SERVER', 'CACHE'] },
      { category: 'CODING', words: ['ARRAY', 'POINTER', 'BOOLEAN', 'INTEGER'] },
      { category: 'NETWORKS', words: ['ROUTER', 'SWITCH', 'MODEM', 'FIREWALL'] },
      { category: 'PROTOCOLS', words: ['HTTP', 'TCP', 'UDP', 'DNS'] },
      { category: 'SECURITY', words: ['CIPHER', 'HASH', 'KEY', 'TOKEN'] },
    ],
  },

  // Level 28
  {
    levelNumber: 28,
    name: 'Nautilus Chambers',
    movesLimit: 33,
    initialVisibleCount: 20,
    categories: [
      { category: 'SPIRALS', words: ['GALAXY', 'WHIRLPOOL', 'SHELL', 'TORNADO'] },
      { category: 'SUBMARINES', words: ['PERISCOPE', 'TORPEDO', 'SONAR', 'BALLAST'] },
      { category: 'DEEP WATER', words: ['BATHYSPHERE', 'TRENCH', 'ABYSS', 'GULF'] },
      { category: 'MAPS', words: ['ATLAS', 'GLOBE', 'CHART', 'LEGEND'] },
      { category: 'COMPASS', words: ['NORTH', 'SOUTH', 'EAST', 'WEST'] },
      { category: 'WEATHER INSTRUMENTS', words: ['BAROMETER', 'ANEMOMETER', 'HYGROMETER', 'VANE'] },
      { category: 'CLOUDS', words: ['CIRRUS', 'STRATUS', 'CUMULUS', 'NIMBUS'] },
      { category: 'PRECIPITATION', words: ['DRIZZLE', 'SLEET', 'DOWNPOUR', 'FLURRY'] },
    ],
  },

  // Level 29
  {
    levelNumber: 29,
    name: 'Coral Catacombs',
    movesLimit: 32,
    initialVisibleCount: 20,
    categories: [
      { category: 'ANCIENT WONDERS', words: ['PYRAMID', 'LIGHTHOUSE', 'COLOSSUS', 'GARDENS'] },
      { category: 'MONUMENTS', words: ['OBELISK', 'STATUE', 'ARCH', 'CENOTAPH'] },
      { category: 'BURIAL', words: ['TOMB', 'CRYPT', 'VAULT', 'SARCOPHAGUS'] },
      { category: 'ARTIFACTS', words: ['AMULET', 'SCARAB', 'TALISMAN', 'IDOL'] },
      { category: 'TEXTILES', words: ['VELVET', 'SATIN', 'DENIM', 'CORDUROY'] },
      { category: 'SEWING', words: ['NEEDLE', 'THREAD', 'THIMBLE', 'BOBBIN'] },
      { category: 'CARPETS', words: ['KILIM', 'PERSIAN', 'BERBER', 'SHAG'] },
      { category: 'UPHOLSTERY', words: ['PADDING', 'SPRING', 'WEBBING', 'FOAM'] },
    ],
  },

  // Level 30: Grand Tournament Threshold
  {
    levelNumber: 30,
    name: 'Oceanic Sovereignty',
    movesLimit: 31,
    initialVisibleCount: 20,
    categories: [
      { category: 'DYNASTIES', words: ['EMPIRE', 'KINGDOM', 'REPUBLIC', 'REALM'] },
      { category: 'CROWNS', words: ['TIARA', 'DIADEM', 'CORONET', 'CORONA'] },
      { category: 'REGALIA', words: ['SCEPTRE', 'ORB', 'THRONE', 'ROBE'] },
      { category: 'NOBILITY', words: ['MARQUIS', 'VISCOUNT', 'EARL', 'COUNT'] },
      { category: 'LAW', words: ['STATUTE', 'CLAUSE', 'DECREE', 'EDICT'] },
      { category: 'VERDICTS', words: ['GUILTY', 'INNOCENT', 'ACQUITTAL', 'PAROLE'] },
      { category: 'LEGAL ROLES', words: ['JUDGE', 'JUROR', 'BAILIFF', 'COUNSEL'] },
      { category: 'OATHS', words: ['PLEDGE', 'VOW', 'COVENANT', 'AFFIDAVIT'] },
    ],
  },

  // Level 31: Elite Tier Begins
  {
    levelNumber: 31,
    name: 'Hydrothermal Apex',
    movesLimit: 32,
    initialVisibleCount: 20,
    categories: [
      { category: 'MINERALS', words: ['PYRITE', 'GALENA', 'FLUORITE', 'HEMATITE'] },
      { category: 'FRACTURES', words: ['FAULT', 'FISSURE', 'CHASM', 'CREVICE'] },
      { category: 'VOLCANO TYPES', words: ['CALDERA', 'SHIELD', 'STRATO', 'CINDER'] },
      { category: 'GASES', words: ['SULFUR', 'METHANE', 'HELIUM', 'ARGON'] },
      { category: 'FORENSICS', words: ['DNA', 'PRINT', 'BALLISTICS', 'TOXICOLOGY'] },
      { category: 'LAB TOOLS', words: ['BEAKER', 'PIPETTE', 'BURETTE', 'PETRI'] },
      { category: 'MEASURING CYLINDERS', words: ['FLASK', 'VIAL', 'AMPOULE', 'TEST TUBE'] },
      { category: 'SOLUTIONS', words: ['ACID', 'BASE', 'SOLVENT', 'REAGENT'] },
    ],
  },

  // Level 32
  {
    levelNumber: 32,
    name: 'Serpent Deep',
    movesLimit: 31,
    initialVisibleCount: 20,
    categories: [
      { category: 'VIPERS', words: ['COPPERHEAD', 'RATTLESNAKE', 'COTTONMOUTH', 'SIDEWINDER'] },
      { category: 'POISONS', words: ['VENOM', 'TOXIN', 'CURARE', 'ARSENIC'] },
      { category: 'ANTIDOTES', words: ['ANTIVENOM', 'ANTITOXIN', 'SERUM', 'CURE'] },
      { category: 'IMMUNITY', words: ['ANTIBODY', 'LEUKOCYTE', 'PHAGOCYTE', 'LYMPH'] },
      { category: 'RARE BIRDS', words: ['ALBATROSS', 'CONDOR', 'IBIS', 'SPOONBILL'] },
      { category: 'NESTS', words: ['EYRIE', 'BURROW', 'ROOKERY', 'WARREN'] },
      { category: 'WINGS', words: ['FEATHER', 'QUILL', 'PINION', 'TALON'] },
      { category: 'PREDATORS', words: ['KESTREL', 'HARRIER', 'MERLIN', 'OSPREY'] },
    ],
  },

  // Level 33
  {
    levelNumber: 33,
    name: 'Abyssal Geode',
    movesLimit: 31,
    initialVisibleCount: 20,
    categories: [
      { category: 'GEM CUTS', words: ['BRILLIANT', 'BAGUETTE', 'MARQUISE', 'PRINCESS'] },
      { category: 'JEWEL CRAFT', words: ['FACET', 'BEZEL', 'PRONG', 'LUSTER'] },
      { category: 'PRECIOUS METALS', words: ['PALLADIUM', 'RHODIUM', 'IRIDIUM', 'OSMIUM'] },
      { category: 'ASSAYS', words: ['KARAT', 'PURITY', 'WEIGHT', 'STAMP'] },
      { category: 'METALLURGY', words: ['SMELTER', 'FOUNDRY', 'ANVIL', 'FORGE'] },
      { category: 'SMITH TOOLS', words: ['TONGS', 'BELLOWS', 'CHISEL', 'HAMMER'] },
      { category: 'INGOTS', words: ['SLAB', 'BAR', 'BILLET', 'BLOCK'] },
      { category: 'SLAG', words: ['DROSS', 'RESIDUE', 'FLUX', 'ASH'] },
    ],
  },

  // Level 34
  {
    levelNumber: 34,
    name: 'Sub-Zero Trench',
    movesLimit: 30,
    initialVisibleCount: 20,
    categories: [
      { category: 'ARCTIC EXPEDITION', words: ['SLED', 'SNOWSHOES', 'CRAMPONS', 'PARKA'] },
      { category: 'SHELTER', words: ['IGLOO', 'YURT', 'CHALET', 'TIPI'] },
      { category: 'GLACIOLOGY', words: ['CREVASSE', 'MORAINE', 'ESKER', 'SERAC'] },
      { category: 'AVALANCHE', words: ['SLAB', 'POWDER', 'SLIDE', 'SNOWPACK'] },
      { category: 'ALPINE PEAKS', words: ['EVEREST', 'K2', 'MATTERHORN', 'KILIMANJARO'] },
      { category: 'MOUNTAINEERING', words: ['ROPES', 'CARABINER', 'BELAY', 'HARNESS'] },
      { category: 'CLIMBING MOVES', words: ['TRAVERSE', 'RAPPEL', 'SCRAMBLE', 'ASCENT'] },
      { category: 'GEAR', words: ['GAITERS', 'ICE AXE', 'HELMET', 'PACK'] },
    ],
  },

  // Level 35
  {
    levelNumber: 35,
    name: 'Bermuda Vertex',
    movesLimit: 30,
    initialVisibleCount: 20,
    categories: [
      { category: 'NAVAL ANOMALIES', words: ['FOG', 'VORTEX', 'ECHO', 'SQUALL'] },
      { category: 'SIGNALS', words: ['SOS', 'MAYDAY', 'FLARE', 'SIREN'] },
      { category: 'NAVIGATOR', words: ['SEXTANT', 'ASTROLABE', 'CHRONOMETER', 'DIVIDERS'] },
      { category: 'LONGITUDE', words: ['MERIDIAN', 'EQUATOR', 'LATITUDE', 'PARALLEL'] },
      { category: 'ASTRONOMICAL BODIES', words: ['ASTEROID', 'METEOR', 'METEORITE', 'METEOROID'] },
      { category: 'ORBITS', words: ['APOGEE', 'PERIGEE', 'ELLIPSE', 'ZENITH'] },
      { category: 'AERODYNAMICS', words: ['LIFT', 'THRUST', 'DRAG', 'WEIGHT'] },
      { category: 'FLIGHT SURFACES', words: ['RUDDER', 'AILERON', 'ELEVATOR', 'FLAP'] },
    ],
  },

  // Level 36
  {
    levelNumber: 36,
    name: 'Titan Monolith',
    movesLimit: 30,
    initialVisibleCount: 20,
    categories: [
      { category: 'MONOLITHS', words: ['DOLMEN', 'MENHIR', 'STELE', 'CAIRN'] },
      { category: 'ANCIENT WRITING', words: ['HIEROGLYPH', 'CUNEIFORM', 'RUNE', 'PAPYRUS'] },
      { category: 'SCRIBES', words: ['INKWELL', 'PARCHMENT', 'VELLUM', 'REED'] },
      { category: 'SEALS', words: ['CYLINDER', 'SIGNET', 'BULLA', 'CREST'] },
      { category: 'ANCIENT CITIES', words: ['BABYLON', 'SPARTA', 'THEBES', 'CARTHAGE'] },
      { category: 'FORTIFICATIONS', words: ['CITADEL', 'ACROPOLIS', 'PALISADE', 'BULWARK'] },
      { category: 'ANCIENT ARMIES', words: ['PHALANX', 'LEGION', 'COHORT', 'CENTURY'] },
      { category: 'SIEGE WEAPONS', words: ['CATAPULT', 'TREBUCHET', 'BALLISTA', 'RAM'] },
    ],
  },

  // Level 37
  {
    levelNumber: 37,
    name: 'Superluminal Trench',
    movesLimit: 29,
    initialVisibleCount: 20,
    categories: [
      { category: 'QUANTUM PHYSICS', words: ['ENTANGLEMENT', 'SUPERPOSITION', 'SPIN', 'TUNNELING'] },
      { category: 'PARTICLES', words: ['BOSON', 'FERMION', 'QUARK', 'LEPTON'] },
      { category: 'FORCES', words: ['STRONG', 'WEAK', 'ELECTROMAGNETIC', 'GRAVITATIONAL'] },
      { category: 'SPACETIME', words: ['WARP', 'SINGULARITY', 'HORIZON', 'WORMHOLE'] },
      { category: 'LIGHT SPECTRUM', words: ['INFRARED', 'ULTRAVIOLET', 'GAMMA', 'X-RAY'] },
      { category: 'OPTICAL DEVICES', words: ['INTERFEROMETER', 'SPECTROMETER', 'COLLIMATOR', 'POLARIZER'] },
      { category: 'WAVE PROPERTIES', words: ['AMPLITUDE', 'FREQUENCY', 'WAVELENGTH', 'PHASE'] },
      { category: 'INTERACTION', words: ['DIFFRACTION', 'REFRACTION', 'REFLECTION', 'DISPERSION'] },
    ],
  },

  // Level 38
  {
    levelNumber: 38,
    name: 'Abyssal Dragon Trench',
    movesLimit: 29,
    initialVisibleCount: 20,
    categories: [
      { category: 'MYTHIC DRAGONS', words: ['WYVERN', 'DRAKE', 'OUROBOROS', 'BASILISK'] },
      { category: 'DRAGON HOARDS', words: ['GOBLETS', 'CROWNS', 'CHALICES', 'SCEPTRES'] },
      { category: 'MYTHIC BLADES', words: ['EXCALIBUR', 'DURANDAL', 'GRAM', 'CALIBURN'] },
      { category: 'BLACKSMITHS', words: ['HEPHAESTUS', 'WAYLAND', 'VULCAN', 'ILMARINEN'] },
      { category: 'ANCIENT REALMS', words: ['AVALON', 'ATLANTIS', 'EL DORADO', 'SHAMBHALA'] },
      { category: 'CELESTIAL RIVERS', words: ['STYX', 'LETHE', 'ACHERON', 'COCYTUS'] },
      { category: 'UNDERWORLD GUARDIANS', words: ['CHARON', 'KERBEROS', 'MINOS', 'RHADAMANTHUS'] },
      { category: 'GREEK FATES', words: ['CLOTHO', 'LACHESIS', 'ATROPOS', 'ANANKE'] },
    ],
  },

  // Level 39: Grandmaster Penultimate
  {
    levelNumber: 39,
    name: 'Cosmic Abyssal Gateway',
    movesLimit: 28,
    initialVisibleCount: 20,
    categories: [
      { category: 'CONSTELLATIONS', words: ['ORION', 'CASSIOPEIA', 'ANDROMEDA', 'URSA'] },
      { category: 'ZODIAC SIGNS', words: ['ARIES', 'TAURUS', 'GEMINI', 'CANCER'] },
      { category: 'STELLAR PHASES', words: ['SUPERNOVA', 'RED GIANT', 'WHITE DWARF', 'NEUTRON'] },
      { category: 'TELESCOPES', words: ['HUBBLE', 'WEBB', 'KEPLER', 'CHANDRA'] },
      { category: 'LUNAR SEAS', words: ['TRANQUILITY', 'SERENITY', 'RAIN', 'CRISES'] },
      { category: 'SPACE MISSIONS', words: ['APOLLO', 'VOYAGER', 'PIONEER', 'ARTEMIS'] },
      { category: 'ROCKET STAGES', words: ['BOOSTER', 'PAYLOAD', 'FAIRING', 'NOZZLE'] },
      { category: 'CELESTIAL NAVIGATION', words: ['POLARIS', 'SIRIUS', 'VEGA', 'RIGEL'] },
    ],
  },

  // Level 40: Ultimate Grand Championship Final Level (Strictly no level 41!)
  {
    levelNumber: 40,
    name: 'Oceanic Sovereignty Final',
    movesLimit: 28,
    initialVisibleCount: 20,
    categories: [
      { category: 'WORLD OCEANS', words: ['PACIFIC', 'ATLANTIC', 'INDIAN', 'ARCTIC'] },
      { category: 'DEEP TRENCHES', words: ['MARIANA', 'TONGA', 'PUERTO RICO', 'JAVA'] },
      { category: 'OCEAN CURRENTS', words: ['GULF STREAM', 'KUROSHIO', 'HUMBOLDT', 'CANARY'] },
      { category: 'CORAL REEFS', words: ['GREAT BARRIER', 'BELIZE', 'APO', 'PALANCAR'] },
      { category: 'ISLAND NATIONS', words: ['ICELAND', 'MADAGASCAR', 'NEW ZEALAND', 'JAPAN'] },
      { category: 'NAVAL HISTORIES', words: ['ARMADA', 'TRAFALGAR', 'MIDWAY', 'SALAMIS'] },
      { category: 'CHAMPIONSHIP MEDALS', words: ['GOLD', 'SILVER', 'BRONZE', 'PLATINUM'] },
      { category: 'TOURNAMENT CROWNS', words: ['GRANDMASTER', 'CHAMPION', 'LEGEND', 'SOVEREIGN'] },
    ],
  },
];

export function getBubbleSortLevel(levelNum: number): BubbleSortLevel {
  const lvl = BUBBLE_SORT_LEVELS.find((l) => l.levelNumber === levelNum);
  return lvl || BUBBLE_SORT_LEVELS[0];
}
