
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Toolbar elements
const charSelect = document.getElementById('char-select');
const swordsDisplay = document.getElementById('swords-display');
const treasureDisplay = document.getElementById('treasure-display');
const playerPFP = document.getElementById('player-pfp');
const npcPFP = document.getElementById('npc-pfp');
const npcDialogue = document.getElementById('npc-dialogue');

// Game constants
const TILE_SIZE = 40;
const MAP_WIDTH = canvas.width / TILE_SIZE;
const MAP_HEIGHT = canvas.height / TILE_SIZE;
ctx.font = `${TILE_SIZE * 0.9}px sans-serif`;

// --- AUDIO CONTEXT ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!audioCtx || audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    switch (type) {
        case 'collect':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
            break;
        case 'combat':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.4);
            break;
        case 'levelChange':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(130.81, audioCtx.currentTime); // C3
            oscillator.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.5); // G5
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
            break;
        case 'denied':
             oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
             gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
            break;
    }

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
}


// --- EMOJI AND DATA MAPS ---
const EMOJIS = {
    terrain: {
        tree: ['🌳', '🌲', '🌴'],
        mountain: '⛰️',
        grass: '🌾',
        wall: '🧱',
        stairDown: '🪜',
        stairUp: '⬆️',
        water: '🌊',
        bridge: '🌉',
        cable_car: '🚡',
        building: '🏢',
        sand: '🏖️',
        cactus: '🌵',
        palm: '🌴',
        star: '⭐',
        moon: '🌙',
        cloud: '☁️',
        road: '🛣️',
        traffic_light: '🚦',
        desk: '🪑',
        book: '📚',
        board: '📋',
        // Underworld terrain
        lava: '🌋',
        bones: '🦴',
        skull: '💀',
        fire: '🔥',
        crystal: '💎',
        portal: '🌀',
        tombstone: '🪦',
        candle: '🕯️',
        chain: '⛓️',
        gate: '🚪',
        bloodPool: '🩸',
        soulWell: '🕳️',
        cursedTree: '🌚',
        demonThrone: '👹',
        // House interiors
        couch: '🛋️',
        tv: '📺',
        bed: '🛏️',
        toilet: '🚽',
        bathtub: '🛁',
        stove: '🔥',
        fridge: '🧊',
        plant: '🪴',
        mirror: '🪞',
        window: '🪟',
        door: '🚪',
        painting: '🖼️',
        clock: '🕰️',
        lamp: '💡',
        rug: '🟫',
        // Vibey locations
        mushroom: '🍄',
        flower: '🌸',
        butterfly: '🦋',
        rainbow_road: '🌈',
        disco_ball: '🪩',
        neon_sign: '💜',
        ferris_wheel: '🎡',
        carousel: '🎠',
        fountain: '⛲',
        statue: '🗿',
        totem: '🪬',
        altar: '🛕',
        crystal_cave: '💎',
        glowshroom: '🍄',
        aurora: '🌌',
        vortex: '🌀',
        dreamGate: '✨'
    },
    collectibles: {
        weapons: ['⚔️', '🗡️', '🔪', '🤺', '🪓', '🏹'],
        legendaryWeapons: {
            excalibur: { emoji: '⚔️', name: 'Excalibur', damage: 5, special: 'heal' },
            mjolnir: { emoji: '🔨', name: 'Mjolnir', damage: 4, special: 'lightning' },
            trident: { emoji: '🔱', name: 'Poseidon\'s Trident', damage: 4, special: 'tsunami' },
            staff: { emoji: '🪄', name: 'Arcane Staff', damage: 3, special: 'magic' },
            katana: { emoji: '⚔️', name: 'Shadow Blade', damage: 4, special: 'stealth' }
        },
        coin: '🪙',
        diamond: '💎',
        sourdough: '🥖',
        coffee: '☕',
        water_bottle: '💧',
        sunscreen: '🧴',
        shell: '🐚',
        pearl: '🦪',
        pizza: '🍕',
        taco: '🌮',
        apple: '🍎',
        pencil: '✏️',
        boba: '🧋',
        potion: '🧪',
        // Secret items
        crown: '👑',
        ring: '💍',
        gem: '💎',
        scroll: '📜',
        key: '🗝️',
        map: '🗺️',
        compass: '🧭',
        hourglass: '⏳',
        crystal_ball: '🔮',
        lucky_clover: '🍀',
        golden_egg: '🥚',
        magic_lamp: '🪔',
        ancient_rune: '🪬',
        phoenix_feather: '🪶',
        dragon_scale: '🐉',
        unicorn_horn: '🦄',
        star_fragment: '✨'
    },
    party: {
        ray: '👦🏽',
        amara: '👧🏻',
        ruby: '👶🏽'
    },
    animals: {
        fox: { emoji: '🦊', dialogue: 'I love chasing digital butterflies!' },
        bear: { emoji: '🐻', dialogue: 'This forest has the best honey.' },
        rabbit: { emoji: '🐰', dialogue: 'Wanna race to that big tree?' }
    },
    sfNpcs: {
        techie: { emoji: '👩‍💻', dialogue: 'Just shipped my latest app!' },
        tourist: { emoji: '📸', dialogue: 'Have you seen the Golden Gate Bridge?' },
        surfer: { emoji: '🏄‍♂️', dialogue: 'Waves are gnarly at Ocean Beach today!' },
        artist: { emoji: '🎨', dialogue: 'Check out my street art in the Mission!' }
    },
    desertNpcs: {
        camel: { emoji: '🐪', dialogue: 'Water is precious in the desert!' },
        nomad: { emoji: '🧙‍♂️', dialogue: 'The oasis is to the east, traveler.' },
        merchant: { emoji: '💰', dialogue: 'Fresh dates and figs for sale!' }
    },
    islandNpcs: {
        mermaid: { emoji: '🧜‍♀️', dialogue: 'The pearls glow brightest at midnight!' },
        pirate: { emoji: '🏴‍☠️', dialogue: 'Arr, buried treasure lies beneath!' },
        owl: { emoji: '🦉', dialogue: 'Hoo... the night reveals many secrets.' }
    },
    cityNpcs: {
        cop: { emoji: '👮', dialogue: 'Keep the streets safe, kid!' },
        vendor: { emoji: '🌭', dialogue: 'Best hot dogs in the city!' },
        businessman: { emoji: '💼', dialogue: 'Time is money!' }
    },
    schoolNpcs: {
        teacher: { emoji: '👩‍🏫', dialogue: 'Don\'t forget your homework!' },
        student: { emoji: '🧑‍🎓', dialogue: 'I\'m studying for the big test!' },
        janitor: { emoji: '🧹', dialogue: 'Keep the halls clean, please!' }
    },
    enemies: {
        goblin: '👺',
        scorpion: '🦂',
        snake: '🐍',
        ghost: '👻',
        bat: '🦇',
        spider: '🕷️',
        rat: '🐀',
        bully: '👊',
        test: '📝',
        // Underworld enemies
        skeleton: '💀',
        demon: '👹',
        wraith: '👤',
        vampire: '🧛',
        zombie: '🧟',
        // Bosses
        dragon: '🐲',
        kraken: '🐙',
        phoenix: '🔥',
        minotaur: '🐂',
        cerberus: '🐕'
    },
    pets: {
        cat: { emoji: '🐈', name: 'Whiskers', bonus: 'luck', followOffset: {x: -1, y: 0} },
        dog: { emoji: '🐕', name: 'Buddy', bonus: 'loyalty', followOffset: {x: 1, y: 0} },
        bird: { emoji: '🦜', name: 'Polly', bonus: 'vision', followOffset: {x: 0, y: -1} },
        fairy: { emoji: '🧚', name: 'Twinkle', bonus: 'magic', followOffset: {x: -1, y: -1} },
        dragon_baby: { emoji: '🐉', name: 'Spark', bonus: 'fire', followOffset: {x: 1, y: 1} },
        ghost_cat: { emoji: '👻', name: 'Spooky', bonus: 'phase', followOffset: {x: 0, y: 1} },
        mushroom: { emoji: '🍄', name: 'Fungi', bonus: 'poison_resist', followOffset: {x: -1, y: 1} },
        star: { emoji: '⭐', name: 'Stella', bonus: 'light', followOffset: {x: 1, y: -1} },
        flame: { emoji: '🔥', name: 'Ember', bonus: 'burn', followOffset: {x: 0, y: 0} },
        crystal: { emoji: '💎', name: 'Prism', bonus: 'shield', followOffset: {x: -0.5, y: -0.5} },
        butterfly: { emoji: '🦋', name: 'Flutter', bonus: 'speed', followOffset: {x: 0.5, y: -0.5} },
        skull: { emoji: '💀', name: 'Bones', bonus: 'undead', followOffset: {x: -0.5, y: 0.5} }
    },
    underworldNpcs: {
        reaper: { emoji: '💀', dialogue: 'Welcome to the realm of shadows...' },
        witch: { emoji: '🧙‍♀️', dialogue: 'I can teach you dark magic... for a price.' },
        ferryman: { emoji: '🚣', dialogue: 'Need passage across the river Styx?' },
        oracle: { emoji: '🔮', dialogue: 'Your fate is written in the stars...' },
        merchant: { emoji: '🧛', dialogue: 'Rare artifacts from the depths!' }
    },
    portals: {
        shop: {emoji: '🏪', name: 'Shop'},
        boba: {emoji: '🥤', name: 'Boba Shop'},
        desert: {emoji: '🏜️', name: 'Desert'},
        island: {emoji: '🏝️', name: 'Night Island'},
        city: {emoji: '🏙️', name: 'City'},
        asia: {emoji: '🏯', name: 'Asia'},
        sf: {emoji: '🌉', name: 'San Francisco'},
        school: {emoji: '🏫', name: 'School'},
        house1: {emoji: '🏠', name: 'Cozy Cottage'},
        house2: {emoji: '🏚️', name: 'Haunted Manor'},
        house3: {emoji: '🏡', name: 'Garden Home'},
        mushroom_kingdom: {emoji: '🍄', name: 'Mushroom Kingdom'},
        crystal_caves: {emoji: '💎', name: 'Crystal Caves'},
        dreamscape: {emoji: '🌈', name: 'Dreamscape'},
        carnival: {emoji: '🎪', name: 'Eternal Carnival'},
        void: {emoji: '⚫', name: 'The Void'}
    }
};

// --- GAME STATE ---
let party = [
    { id: 'ray', name: 'Ray', x: 3, y: 3, emoji: EMOJIS.party.ray, health: 10, maxHealth: 10 },
    { id: 'amara', name: 'Amara', x: 2, y: 3, emoji: EMOJIS.party.amara, health: 10, maxHealth: 10 },
    { id: 'ruby', name: 'Ruby', x: 3, y: 2, emoji: EMOJIS.party.ruby, health: 10, maxHealth: 10 }
];
let currentPlayerId = 'ray';
let inventory = { 
    weapons: [], 
    legendaryWeapon: null,
    coins: 0, 
    diamonds: 0,
    secrets: [],
    keys: 0
};
let levels = {};
let currentLevel = 'overworld';
let combatMessage = '';
let combatMessageTimer = null;
let lastKeyPress = 0;
const KEY_DEBOUNCE = 100; // Minimum ms between key presses
let currentPets = [];
let maxPets = 3;
let petPositions = [];
let timeOfDay = 'day'; // day, night, twilight
let secretsFound = 0;
let bossesDefeated = [];

// --- HELPER FUNCTIONS ---
function placeEnemiesSafely(map, entities, enemyTypes, count) {
    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 100;
    
    while (placed < count && attempts < maxAttempts) {
        attempts++;
        let x = Math.floor(Math.random() * MAP_WIDTH);
        let y = Math.floor(Math.random() * MAP_HEIGHT);
        const allEntities = party.concat(entities);
        
        if (!isOccupied(map, allEntities, x, y)) {
            const enemyType = enemyTypes[placed % enemyTypes.length];
            entities.push({ 
                id: `${enemyType}-${placed}`, 
                type: enemyType, 
                x, y,
                health: 3
            });
            placed++;
        }
    }
    
    if (attempts >= maxAttempts) {
        console.warn(`Could only place ${placed}/${count} enemies`);
    }
}

// --- LEVEL GENERATION ---
function generateLevel(levelType) {
    let map = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(null));
    let entities = [];

    if (levelType === 'overworld') {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                    map[y][x] = { type: 'mountain', emoji: EMOJIS.terrain.mountain };
                } else {
                    if (Math.random() < 0.1) map[y][x] = { type: 'tree', emoji: EMOJIS.terrain.tree[Math.floor(Math.random() * EMOJIS.terrain.tree.length)] };
                    else if (Math.random() < 0.05) map[y][x] = { type: 'mountain', emoji: EMOJIS.terrain.mountain };
                    else if (Math.random() < 0.2) map[y][x] = { type: 'grass', emoji: EMOJIS.terrain.grass };
                }
            }
        }
        placeItems(map, 'weapon', EMOJIS.collectibles.weapons, 5);
        placeItems(map, 'coin', EMOJIS.collectibles.coin, 20);
        placeItems(map, 'diamond', EMOJIS.collectibles.diamond, 3);
        entities = placeEntities(map, 'animal', Object.keys(EMOJIS.animals), 3);
        
        // Secret grove with legendary weapon
        const groveX = Math.floor(Math.random() * (MAP_WIDTH - 10)) + 5;
        const groveY = Math.floor(Math.random() * (MAP_HEIGHT - 10)) + 5;
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                if (Math.abs(dx) === 2 || Math.abs(dy) === 2) {
                    const x = groveX + dx;
                    const y = groveY + dy;
                    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                        map[y][x] = { type: 'tree', emoji: '🌲' };
                    }
                }
            }
        }
        map[groveY][groveX] = { type: 'lucky_clover', emoji: EMOJIS.collectibles.lucky_clover };
        
        // Hidden fairy that gives you a pet
        entities.push({ 
            id: 'secret-fairy', 
            type: 'fairy', 
            x: groveX + 1, 
            y: groveY,
            emoji: '🧚',
            dialogue: 'You found me! Take this companion as a reward!',
            givePet: 'fairy'
        });
        
        // Wild pets that can be befriended
        entities.push({
            id: 'wild-cat',
            type: 'wild_pet',
            petType: 'cat',
            x: Math.floor(Math.random() * MAP_WIDTH),
            y: Math.floor(Math.random() * MAP_HEIGHT),
            emoji: '🐈',
            dialogue: 'Meow! (Feed me fish to befriend me!)'
        });
        
        entities.push({
            id: 'wild-butterfly',
            type: 'wild_pet',
            petType: 'butterfly',
            x: Math.floor(Math.random() * MAP_WIDTH),
            y: Math.floor(Math.random() * MAP_HEIGHT),
            emoji: '🦋',
            dialogue: 'Flutter flutter... (I love flowers!)'
        });
        
        // Place portals
        const portalKeys = Object.keys(EMOJIS.portals);
        placeItems(map, 'portal', portalKeys.map(k => EMOJIS.portals[k].emoji), portalKeys.length, true);

    } else if (levelType === 'dungeon') {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                     map[y][x] = { type: 'wall', emoji: EMOJIS.terrain.wall };
                }
            }
        }
        for(let y = 5; y < 10; y++) { for(let x = 5; x < 15; x++) { map[y][x] = null; } }
        placeItems(map, 'coin', EMOJIS.collectibles.coin, 10);
        placeItems(map, 'diamond', EMOJIS.collectibles.diamond, 5);
        entities = placeEntities(map, 'goblin', ['goblin'], 3);
        map[3][10] = { type: 'stairUp', emoji: EMOJIS.terrain.stairUp, target: { level: 'overworld', x: 10, y: 10 } };
    } else if (levelType === 'sf') {
        // San Francisco level - create the bay and city
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                // Bay water on the left
                if (x < 5) {
                    map[y][x] = { type: 'water', emoji: EMOJIS.terrain.water };
                }
                // City buildings on the right
                else if (x > MAP_WIDTH - 8 && Math.random() < 0.6) {
                    map[y][x] = { type: 'building', emoji: EMOJIS.terrain.building };
                }
                // Hills in the middle
                else if (x > 8 && x < 12 && Math.random() < 0.3) {
                    map[y][x] = { type: 'mountain', emoji: EMOJIS.terrain.mountain };
                }
            }
        }
        
        // Add Golden Gate Bridge
        for (let y = 3; y < 6; y++) {
            map[y][4] = { type: 'bridge', emoji: EMOJIS.terrain.bridge };
        }
        
        // Add cable car tracks
        for (let x = 10; x < 15; x++) {
            if (Math.random() < 0.5) {
                map[7][x] = { type: 'cable_car', emoji: EMOJIS.terrain.cable_car };
            }
        }
        
        // Place SF-specific collectibles
        placeItems(map, 'sourdough', EMOJIS.collectibles.sourdough, 5);
        placeItems(map, 'coffee', EMOJIS.collectibles.coffee, 8);
        placeItems(map, 'coin', EMOJIS.collectibles.coin, 15);
        placeItems(map, 'diamond', EMOJIS.collectibles.diamond, 2);
        
        // Place SF NPCs
        entities = placeEntities(map, 'sfNpc', Object.keys(EMOJIS.sfNpcs), 4);
        
        // Add exit portal back to overworld
        map[MAP_HEIGHT - 2][MAP_WIDTH - 2] = { type: 'stairUp', emoji: EMOJIS.terrain.stairUp, target: { level: 'overworld', x: 5, y: 5 } };
    } else if (levelType === 'desert') {
        // Desert level
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                // Sand everywhere
                map[y][x] = { type: 'sand', emoji: EMOJIS.terrain.sand };
                
                // Add cacti
                if (Math.random() < 0.1) {
                    map[y][x] = { type: 'cactus', emoji: EMOJIS.terrain.cactus };
                }
                
                // Oasis in the center
                if (Math.abs(x - MAP_WIDTH/2) < 3 && Math.abs(y - MAP_HEIGHT/2) < 3) {
                    map[y][x] = { type: 'water', emoji: EMOJIS.terrain.water };
                }
            }
        }
        
        // Add palm trees around oasis
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const x = Math.floor(MAP_WIDTH/2 + Math.cos(angle) * 4);
            const y = Math.floor(MAP_HEIGHT/2 + Math.sin(angle) * 4);
            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                map[y][x] = { type: 'palm', emoji: EMOJIS.terrain.palm };
            }
        }
        
        placeItems(map, 'water_bottle', EMOJIS.collectibles.water_bottle, 8);
        placeItems(map, 'sunscreen', EMOJIS.collectibles.sunscreen, 5);
        placeItems(map, 'coin', EMOJIS.collectibles.coin, 10);
        placeItems(map, 'diamond', EMOJIS.collectibles.diamond, 3);
        
        entities = placeEntities(map, 'desertNpc', Object.keys(EMOJIS.desertNpcs), 3);
        placeEnemiesSafely(map, entities, ['scorpion', 'snake'], 6);
        
        map[1][1] = { type: 'stairUp', emoji: EMOJIS.terrain.stairUp, target: { level: 'overworld', x: 5, y: 5 } };
        
    } else if (levelType === 'island') {
        // Night Island level
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                // Water border
                if (x < 2 || x > MAP_WIDTH - 3 || y < 2 || y > MAP_HEIGHT - 3) {
                    map[y][x] = { type: 'water', emoji: EMOJIS.terrain.water };
                } else {
                    // Sandy island
                    map[y][x] = { type: 'sand', emoji: EMOJIS.terrain.sand };
                }
            }
        }
        
        // Add stars and moon
        for (let i = 0; i < 10; i++) {
            let x = Math.floor(Math.random() * MAP_WIDTH);
            let y = Math.floor(Math.random() * MAP_HEIGHT);
            if (map[y][x] && map[y][x].type === 'sand') {
                map[y][x] = { type: 'star', emoji: EMOJIS.terrain.star };
            }
        }
        map[4][MAP_WIDTH - 4] = { type: 'moon', emoji: EMOJIS.terrain.moon };
        
        placeItems(map, 'shell', EMOJIS.collectibles.shell, 10);
        placeItems(map, 'pearl', EMOJIS.collectibles.pearl, 5);
        placeItems(map, 'potion', EMOJIS.collectibles.potion, 3);
        placeItems(map, 'diamond', EMOJIS.collectibles.diamond, 5);
        
        entities = placeEntities(map, 'islandNpc', Object.keys(EMOJIS.islandNpcs), 3);
        placeEnemiesSafely(map, entities, ['ghost', 'bat'], 5);
        
        map[MAP_HEIGHT - 3][MAP_WIDTH/2] = { type: 'stairUp', emoji: EMOJIS.terrain.stairUp, target: { level: 'overworld', x: 5, y: 5 } };
        
    } else if (levelType === 'city') {
        // City level
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                // Roads in a grid pattern
                if (x % 5 === 0 || y % 4 === 0) {
                    map[y][x] = { type: 'road', emoji: EMOJIS.terrain.road };
                }
                // Buildings
                else if (Math.random() < 0.4) {
                    map[y][x] = { type: 'building', emoji: EMOJIS.terrain.building };
                }
            }
        }
        
        // Traffic lights at intersections
        for (let y = 0; y < MAP_HEIGHT; y += 4) {
            for (let x = 0; x < MAP_WIDTH; x += 5) {
                if (x < MAP_WIDTH && y < MAP_HEIGHT) {
                    map[y][x] = { type: 'traffic_light', emoji: EMOJIS.terrain.traffic_light };
                }
            }
        }
        
        placeItems(map, 'pizza', EMOJIS.collectibles.pizza, 8);
        placeItems(map, 'taco', EMOJIS.collectibles.taco, 6);
        placeItems(map, 'coin', EMOJIS.collectibles.coin, 15);
        
        entities = placeEntities(map, 'cityNpc', Object.keys(EMOJIS.cityNpcs), 3);
        placeEnemiesSafely(map, entities, ['rat', 'spider'], 4);
        
        map[1][1] = { type: 'stairUp', emoji: EMOJIS.terrain.stairUp, target: { level: 'overworld', x: 5, y: 5 } };
        
    } else if (levelType === 'school') {
        // School level
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                // Classroom walls
                if ((x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) ||
                    (x === 10 && y > 2 && y < MAP_HEIGHT - 3)) {
                    map[y][x] = { type: 'wall', emoji: EMOJIS.terrain.wall };
                }
            }
        }
        
        // Add desks
        for (let y = 3; y < MAP_HEIGHT - 3; y += 2) {
            for (let x = 2; x < 9; x += 2) {
                map[y][x] = { type: 'desk', emoji: EMOJIS.terrain.desk };
            }
        }
        
        // Blackboard
        for (let x = 2; x < 8; x++) {
            map[1][x] = { type: 'board', emoji: EMOJIS.terrain.board };
        }
        
        // Library section
        for (let y = 3; y < MAP_HEIGHT - 3; y += 2) {
            for (let x = 12; x < MAP_WIDTH - 2; x += 3) {
                map[y][x] = { type: 'book', emoji: EMOJIS.terrain.book };
            }
        }
        
        placeItems(map, 'apple', EMOJIS.collectibles.apple, 10);
        placeItems(map, 'pencil', EMOJIS.collectibles.pencil, 8);
        placeItems(map, 'coin', EMOJIS.collectibles.coin, 10);
        
        entities = placeEntities(map, 'schoolNpc', Object.keys(EMOJIS.schoolNpcs), 3);
        placeEnemiesSafely(map, entities, ['bully', 'test'], 4);
        
        map[MAP_HEIGHT - 2][MAP_WIDTH/2] = { type: 'stairUp', emoji: EMOJIS.terrain.stairUp, target: { level: 'overworld', x: 5, y: 5 } };
        
    } else if (levelType === 'boba') {
        // Boba Shop
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                    map[y][x] = { type: 'wall', emoji: EMOJIS.terrain.wall };
                }
            }
        }
        
        // Counter
        for (let x = 2; x < MAP_WIDTH - 2; x++) {
            map[3][x] = { type: 'desk', emoji: EMOJIS.terrain.desk };
        }
        
        // Boba displays
        placeItems(map, 'boba', EMOJIS.collectibles.boba, 20);
        placeItems(map, 'potion', EMOJIS.collectibles.potion, 5);
        
        entities = [{ id: 'shopkeeper', type: 'shopkeeper', x: MAP_WIDTH/2, y: 2, 
                     emoji: '🧑‍💼', dialogue: 'Welcome to Boba Paradise! Boba heals 3 HP!' }];
        
        map[MAP_HEIGHT - 2][MAP_WIDTH/2] = { type: 'stairUp', emoji: EMOJIS.terrain.stairUp, target: { level: 'overworld', x: 5, y: 5 } };
        
    } else if (levelType === 'underworld') {
        // Epic Underworld level - even more insane!
        timeOfDay = 'night';
        
        // Fill with cursed ground
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const rand = Math.random();
                if (rand < 0.08) {
                    map[y][x] = { type: 'bones', emoji: EMOJIS.terrain.bones };
                } else if (rand < 0.12) {
                    map[y][x] = { type: 'skull', emoji: EMOJIS.terrain.skull };
                } else if (rand < 0.15) {
                    map[y][x] = { type: 'tombstone', emoji: EMOJIS.terrain.tombstone };
                } else if (rand < 0.17) {
                    map[y][x] = { type: 'cursedTree', emoji: EMOJIS.terrain.cursedTree };
                }
            }
        }
        
        // River of lava with multiple branches
        for (let x = 0; x < MAP_WIDTH; x++) {
            const yBase = Math.floor(MAP_HEIGHT / 2);
            const yWave = Math.sin(x * 0.3) * 3;
            for (let dy = -2; dy <= 2; dy++) {
                const y = Math.floor(yBase + yWave + dy);
                if (y >= 0 && y < MAP_HEIGHT) {
                    if (Math.abs(dy) <= 1) {
                        map[y][x] = { type: 'lava', emoji: EMOJIS.terrain.lava };
                    } else if (Math.random() < 0.5) {
                        map[y][x] = { type: 'fire', emoji: EMOJIS.terrain.fire };
                    }
                }
            }
        }
        
        // Multiple bridges of bones
        for (let bridgeX = 3; bridgeX < MAP_WIDTH; bridgeX += 6) {
            for (let y = 0; y < MAP_HEIGHT; y++) {
                if (map[y][bridgeX] && map[y][bridgeX].type === 'lava') {
                    map[y][bridgeX] = { type: 'bridge', emoji: '🦴' };
                }
            }
        }
        
        // Blood pools of power
        for (let i = 0; i < 3; i++) {
            const poolX = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
            const poolY = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= 1) {
                        map[poolY + dy][poolX + dx] = { type: 'bloodPool', emoji: EMOJIS.terrain.bloodPool };
                    }
                }
            }
        }
        
        // Soul wells (mysterious portals)
        for (let i = 0; i < 2; i++) {
            let x = Math.floor(Math.random() * MAP_WIDTH);
            let y = Math.floor(Math.random() * MAP_HEIGHT);
            if (!map[y][x] || map[y][x].type === 'bones') {
                map[y][x] = { type: 'soulWell', emoji: EMOJIS.terrain.soulWell };
            }
        }
        
        // Demon throne room (expanded boss area)
        for (let y = 1; y < 7; y++) {
            for (let x = MAP_WIDTH - 10; x < MAP_WIDTH - 1; x++) {
                if (y === 1 || y === 6 || x === MAP_WIDTH - 10 || x === MAP_WIDTH - 2) {
                    map[y][x] = { type: 'fire', emoji: EMOJIS.terrain.fire };
                } else if (y === 4 && x === MAP_WIDTH - 6) {
                    map[y][x] = { type: 'demonThrone', emoji: EMOJIS.terrain.demonThrone };
                } else {
                    map[y][x] = null;
                }
            }
        }
        
        // Hidden treasure chamber (needs key)
        for (let y = MAP_HEIGHT - 6; y < MAP_HEIGHT - 2; y++) {
            for (let x = 2; x < 8; x++) {
                if (y === MAP_HEIGHT - 6 || y === MAP_HEIGHT - 3 || x === 2 || x === 7) {
                    map[y][x] = { type: 'chain', emoji: EMOJIS.terrain.chain };
                } else {
                    map[y][x] = null;
                }
            }
        }
        map[MAP_HEIGHT - 3][2] = { type: 'gate', emoji: EMOJIS.terrain.gate, locked: true };
        
        // Crystal formations create protective circles
        for (let i = 0; i < 3; i++) {
            const centerX = Math.floor(Math.random() * (MAP_WIDTH - 6)) + 3;
            const centerY = Math.floor(Math.random() * (MAP_HEIGHT - 6)) + 3;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                const x = Math.floor(centerX + Math.cos(angle) * 2);
                const y = Math.floor(centerY + Math.sin(angle) * 2);
                if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT && !map[y][x]) {
                    map[y][x] = { type: 'crystal', emoji: EMOJIS.terrain.crystal };
                }
            }
        }
        
        // Mystical candles in pentagram formation
        const pentX = Math.floor(MAP_WIDTH / 3);
        const pentY = Math.floor(MAP_HEIGHT / 3);
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const x = Math.floor(pentX + Math.cos(angle) * 3);
            const y = Math.floor(pentY + Math.sin(angle) * 3);
            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT && !map[y][x]) {
                map[y][x] = { type: 'candle', emoji: EMOJIS.terrain.candle };
            }
        }
        
        // Place legendary weapon (Mjolnir) on throne
        map[4][MAP_WIDTH - 6] = { 
            type: 'legendary', 
            emoji: EMOJIS.collectibles.legendaryWeapons.mjolnir.emoji,
            weapon: 'mjolnir'
        };
        
        // Secret items
        placeItems(map, 'ancient_rune', EMOJIS.collectibles.ancient_rune, 3);
        placeItems(map, 'phoenix_feather', EMOJIS.collectibles.phoenix_feather, 1);
        placeItems(map, 'dragon_scale', EMOJIS.collectibles.dragon_scale, 2);
        placeItems(map, 'key', EMOJIS.collectibles.key, 3);
        placeItems(map, 'scroll', EMOJIS.collectibles.scroll, 3);
        placeItems(map, 'potion', EMOJIS.collectibles.potion, 5);
        placeItems(map, 'diamond', EMOJIS.collectibles.diamond, 10);
        placeItems(map, 'crystal_ball', EMOJIS.collectibles.crystal_ball, 2);
        placeItems(map, 'magic_lamp', EMOJIS.collectibles.magic_lamp, 1);
        
        // Underworld NPCs
        entities = placeEntities(map, 'underworldNpc', Object.keys(EMOJIS.underworldNpcs), 5);
        
        // Ghost pet that can be befriended
        entities.push({
            id: 'ghost-pet',
            type: 'wild_pet',
            petType: 'ghost_cat',
            x: pentX,
            y: pentY,
            emoji: '👻',
            dialogue: 'Boo... I am lonely in this realm... Show me kindness?'
        });
        
        // Regular enemies
        placeEnemiesSafely(map, entities, ['skeleton', 'wraith', 'vampire', 'zombie', 'demon'], 12);
        
        // Boss: Cerberus guards the exit
        entities.push({ 
            id: 'cerberus-boss', 
            type: 'cerberus', 
            x: MAP_WIDTH - 6, 
            y: 4,
            health: 25,
            isBoss: true,
            drops: ['crown', 'diamond', 'diamond', 'diamond', 'unicorn_horn']
        });
        
        // Exit portal (behind boss)
        map[1][MAP_WIDTH - 2] = { type: 'portal', emoji: EMOJIS.terrain.portal, target: { level: 'overworld', x: 5, y: 5 } };
        
    } else if (levelType === 'house1') {
        // Cozy Cottage
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                    map[y][x] = { type: 'wall', emoji: EMOJIS.terrain.wall };
                }
            }
        }
        
        // Living room
        map[3][3] = { type: 'couch', emoji: EMOJIS.terrain.couch };
        map[3][4] = { type: 'couch', emoji: EMOJIS.terrain.couch };
        map[3][6] = { type: 'tv', emoji: EMOJIS.terrain.tv };
        map[5][5] = { type: 'rug', emoji: EMOJIS.terrain.rug };
        
        // Kitchen
        map[8][2] = { type: 'stove', emoji: EMOJIS.terrain.stove };
        map[8][3] = { type: 'fridge', emoji: EMOJIS.terrain.fridge };
        
        // Bedroom
        map[2][MAP_WIDTH - 3] = { type: 'bed', emoji: EMOJIS.terrain.bed };
        map[3][MAP_WIDTH - 3] = { type: 'lamp', emoji: EMOJIS.terrain.lamp };
        
        // Decorations
        map[1][5] = { type: 'painting', emoji: EMOJIS.terrain.painting };
        map[1][8] = { type: 'clock', emoji: EMOJIS.terrain.clock };
        map[6][2] = { type: 'plant', emoji: EMOJIS.terrain.plant };
        
        // Collectibles
        placeItems(map, 'coin', EMOJIS.collectibles.coin, 5);
        placeItems(map, 'apple', EMOJIS.collectibles.apple, 3);
        
        // Friendly NPC
        entities = [{ id: 'grandma', type: 'grandma', x: 5, y: 5, 
                     emoji: '👵', dialogue: 'Welcome to my home! Have some cookies!' }];
        
        // Pet cat wandering around
        entities.push({
            id: 'house-cat',
            type: 'wild_pet',
            petType: 'cat',
            x: 7,
            y: 7,
            emoji: '🐈',
            dialogue: 'Purr... I live here but I could join you!'
        });
        
        map[MAP_HEIGHT - 2][MAP_WIDTH/2] = { type: 'door', emoji: EMOJIS.terrain.door, target: { level: 'overworld', x: 5, y: 5 } };
        
    } else if (levelType === 'house2') {
        // Haunted Manor
        timeOfDay = 'night';
        
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                    map[y][x] = { type: 'wall', emoji: '🕸️' };
                }
            }
        }
        
        // Spooky furniture
        map[4][4] = { type: 'couch', emoji: '🛋️' };
        map[2][2] = { type: 'mirror', emoji: EMOJIS.terrain.mirror };
        map[7][7] = { type: 'candle', emoji: EMOJIS.terrain.candle };
        map[3][8] = { type: 'skull', emoji: EMOJIS.terrain.skull };
        
        // Hidden basement entrance
        map[10][10] = { type: 'stairDown', emoji: '🕳️', target: { level: 'underworld', x: 2, y: 2 } };
        
        // Ghosts and spooky items
        placeItems(map, 'crystal_ball', EMOJIS.collectibles.crystal_ball, 2);
        placeItems(map, 'magic_lamp', EMOJIS.collectibles.magic_lamp, 1);
        placeItems(map, 'ancient_rune', EMOJIS.collectibles.ancient_rune, 2);
        
        entities = [];
        placeEnemiesSafely(map, entities, ['ghost', 'bat'], 5);
        
        // Ghost pet
        entities.push({
            id: 'manor-ghost',
            type: 'wild_pet',
            petType: 'ghost_cat',
            x: 5,
            y: 5,
            emoji: '👻',
            dialogue: 'OoOoOo... I haunt this place... but I\'m friendly!'
        });
        
        map[MAP_HEIGHT - 2][1] = { type: 'door', emoji: EMOJIS.terrain.door, target: { level: 'overworld', x: 5, y: 5 } };
        
    } else if (levelType === 'house3') {
        // Garden Home
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                    if (Math.random() < 0.3) {
                        map[y][x] = { type: 'flower', emoji: EMOJIS.terrain.flower };
                    } else {
                        map[y][x] = { type: 'wall', emoji: '🌿' };
                    }
                }
            }
        }
        
        // Indoor garden
        for (let i = 0; i < 10; i++) {
            let x = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
            let y = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
            map[y][x] = { type: 'plant', emoji: EMOJIS.terrain.plant };
        }
        
        // Fountain in center
        map[MAP_HEIGHT/2][MAP_WIDTH/2] = { type: 'fountain', emoji: EMOJIS.terrain.fountain };
        
        // Butterflies
        entities = [];
        for (let i = 0; i < 3; i++) {
            entities.push({
                id: `butterfly-${i}`,
                type: 'butterfly',
                x: Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1,
                y: Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1,
                emoji: EMOJIS.terrain.butterfly
            });
        }
        
        // Butterfly pet
        entities.push({
            id: 'garden-butterfly',
            type: 'wild_pet',
            petType: 'butterfly',
            x: MAP_WIDTH/2 + 1,
            y: MAP_HEIGHT/2,
            emoji: '🦋',
            dialogue: 'Flutter... I love this garden!'
        });
        
        placeItems(map, 'flower', EMOJIS.terrain.flower, 5);
        placeItems(map, 'lucky_clover', EMOJIS.collectibles.lucky_clover, 1);
        
        map[MAP_HEIGHT - 2][MAP_WIDTH/2] = { type: 'door', emoji: EMOJIS.terrain.door, target: { level: 'overworld', x: 5, y: 5 } };
        
    } else if (levelType === 'mushroom_kingdom') {
        // Mushroom Kingdom - surreal and vibey
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (Math.random() < 0.15) {
                    map[y][x] = { type: 'mushroom', emoji: EMOJIS.terrain.mushroom };
                } else if (Math.random() < 0.1) {
                    map[y][x] = { type: 'glowshroom', emoji: '🍄' };
                }
            }
        }
        
        // Giant mushroom circles
        for (let i = 0; i < 3; i++) {
            const centerX = Math.floor(Math.random() * (MAP_WIDTH - 6)) + 3;
            const centerY = Math.floor(Math.random() * (MAP_HEIGHT - 6)) + 3;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
                const x = Math.floor(centerX + Math.cos(angle) * 3);
                const y = Math.floor(centerY + Math.sin(angle) * 3);
                if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                    map[y][x] = { type: 'mushroom', emoji: '🍄' };
                }
            }
        }
        
        // Mushroom pet
        entities = [{
            id: 'mushroom-pet',
            type: 'wild_pet',
            petType: 'mushroom',
            x: MAP_WIDTH/2,
            y: MAP_HEIGHT/2,
            emoji: '🍄',
            dialogue: 'Spore spore... I am one with the mycelium!'
        }];
        
        placeItems(map, 'potion', EMOJIS.collectibles.potion, 8);
        placeItems(map, 'star_fragment', EMOJIS.collectibles.star_fragment, 3);
        
        map[1][1] = { type: 'portal', emoji: EMOJIS.terrain.vortex, target: { level: 'overworld', x: 5, y: 5 } };
        
    } else if (levelType === 'crystal_caves') {
        // Crystal Caves - magical and sparkling
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                    map[y][x] = { type: 'crystal', emoji: EMOJIS.terrain.crystal };
                } else if (Math.random() < 0.2) {
                    map[y][x] = { type: 'crystal', emoji: '💎' };
                }
            }
        }
        
        // Crystal formations
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
            const y = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
            map[y][x] = { type: 'crystal_cave', emoji: EMOJIS.terrain.crystal_cave };
        }
        
        // Crystal pet
        entities = [{
            id: 'crystal-pet',
            type: 'wild_pet',
            petType: 'crystal',
            x: MAP_WIDTH/2,
            y: MAP_HEIGHT/2,
            emoji: '💎',
            dialogue: 'Shimmer shimmer... I reflect your inner light!'
        }];
        
        placeItems(map, 'diamond', EMOJIS.collectibles.diamond, 15);
        placeItems(map, 'gem', EMOJIS.collectibles.gem, 5);
        
        map[MAP_HEIGHT - 2][MAP_WIDTH - 2] = { type: 'portal', emoji: '✨', target: { level: 'overworld', x: 5, y: 5 } };
        
    } else if (levelType === 'dreamscape') {
        // Dreamscape - surreal rainbow world
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const wave = Math.sin(x * 0.5 + y * 0.5) * 0.5 + 0.5;
                if (wave < 0.2) {
                    map[y][x] = { type: 'rainbow_road', emoji: EMOJIS.terrain.rainbow_road };
                } else if (wave < 0.4) {
                    map[y][x] = { type: 'cloud', emoji: EMOJIS.terrain.cloud };
                } else if (wave < 0.6) {
                    map[y][x] = { type: 'star', emoji: EMOJIS.terrain.star };
                }
            }
        }
        
        // Aurora effects
        for (let i = 0; i < 10; i++) {
            let x = Math.floor(Math.random() * MAP_WIDTH);
            let y = Math.floor(Math.random() * MAP_HEIGHT);
            map[y][x] = { type: 'aurora', emoji: EMOJIS.terrain.aurora };
        }
        
        // Dream gates
        map[5][5] = { type: 'dreamGate', emoji: EMOJIS.terrain.dreamGate };
        map[10][10] = { type: 'dreamGate', emoji: EMOJIS.terrain.dreamGate };
        
        // Star pet
        entities = [{
            id: 'star-pet',
            type: 'wild_pet',
            petType: 'star',
            x: 7,
            y: 7,
            emoji: '⭐',
            dialogue: 'Twinkle twinkle... Make a wish!'
        }];
        
        placeItems(map, 'star_fragment', EMOJIS.collectibles.star_fragment, 10);
        placeItems(map, 'unicorn_horn', EMOJIS.collectibles.unicorn_horn, 2);
        
        map[MAP_HEIGHT/2][1] = { type: 'portal', emoji: EMOJIS.terrain.vortex, target: { level: 'overworld', x: 5, y: 5 } };
        
    } else if (levelType === 'carnival') {
        // Eternal Carnival - fun and chaotic
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if ((x + y) % 4 === 0) {
                    map[y][x] = { type: 'neon_sign', emoji: EMOJIS.terrain.neon_sign };
                } else if ((x + y) % 4 === 2) {
                    map[y][x] = { type: 'disco_ball', emoji: EMOJIS.terrain.disco_ball };
                }
            }
        }
        
        // Rides
        map[3][3] = { type: 'ferris_wheel', emoji: EMOJIS.terrain.ferris_wheel };
        map[MAP_HEIGHT - 4][MAP_WIDTH - 4] = { type: 'carousel', emoji: EMOJIS.terrain.carousel };
        
        // Flame pet
        entities = [{
            id: 'flame-pet',
            type: 'wild_pet',
            petType: 'flame',
            x: MAP_WIDTH/2,
            y: MAP_HEIGHT/2,
            emoji: '🔥',
            dialogue: 'Burn bright! The carnival never ends!'
        }];
        
        placeItems(map, 'pizza', EMOJIS.collectibles.pizza, 10);
        placeItems(map, 'taco', EMOJIS.collectibles.taco, 10);
        placeItems(map, 'coin', EMOJIS.collectibles.coin, 20);
        
        map[1][MAP_WIDTH/2] = { type: 'portal', emoji: '🎪', target: { level: 'overworld', x: 5, y: 5 } };
        
    } else if (levelType === 'void') {
        // The Void - mysterious emptiness
        // Mostly empty with floating platforms
        for (let i = 0; i < 15; i++) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);
            const size = Math.floor(Math.random() * 3) + 1;
            for (let dy = -size; dy <= size; dy++) {
                for (let dx = -size; dx <= size; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= size) {
                        const px = x + dx;
                        const py = y + dy;
                        if (px >= 0 && px < MAP_WIDTH && py >= 0 && py < MAP_HEIGHT) {
                            map[py][px] = { type: 'vortex', emoji: EMOJIS.terrain.vortex };
                        }
                    }
                }
            }
        }
        
        // Skull pet - the void guardian
        entities = [{
            id: 'void-skull',
            type: 'wild_pet',
            petType: 'skull',
            x: MAP_WIDTH/2,
            y: MAP_HEIGHT/2,
            emoji: '💀',
            dialogue: 'In the void, all becomes nothing... Join me?'
        }];
        
        // Rare items floating in void
        placeItems(map, 'golden_egg', EMOJIS.collectibles.golden_egg, 3);
        placeItems(map, 'hourglass', EMOJIS.collectibles.hourglass, 2);
        placeItems(map, 'compass', EMOJIS.collectibles.compass, 2);
        
        map[MAP_HEIGHT/2][MAP_WIDTH/2] = { type: 'portal', emoji: '⚫', target: { level: 'overworld', x: 5, y: 5 } };
    }
    return { map, entities };
}

function placeItems(map, itemType, emojiList, count, isPortal = false) {
    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 100; // Prevent infinite loops
    
    while (placed < count && attempts < maxAttempts) {
        attempts++;
        let x = Math.floor(Math.random() * MAP_WIDTH);
        let y = Math.floor(Math.random() * MAP_HEIGHT);
        if (!map[y][x] && !isOccupied(map, [], x, y)) {
            const emoji = Array.isArray(emojiList) ? emojiList[placed] : emojiList;
            const portalData = isPortal ? Object.values(EMOJIS.portals)[placed] : {};
            map[y][x] = { type: itemType, emoji: emoji, name: portalData.name };
            placed++;
        }
    }
    
    if (attempts >= maxAttempts) {
        console.warn(`Could only place ${placed}/${count} items of type ${itemType}`);
    }
}

function placeEntities(map, entityType, typeList, count) {
    let entities = [];
    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 100;
    
    while (placed < count && attempts < maxAttempts) {
        attempts++;
        let x = Math.floor(Math.random() * MAP_WIDTH);
        let y = Math.floor(Math.random() * MAP_HEIGHT);
        if (!isOccupied(map, party, x, y)) {
            const type = typeList[Math.floor(Math.random() * typeList.length)];
            entities.push({ id: `${entityType}-${placed}`, type, x, y });
            placed++;
        }
    }
    
    if (attempts >= maxAttempts) {
        console.warn(`Could only place ${placed}/${count} entities of type ${entityType}`);
    }
    return entities;
}

// --- UI AND PFP FUNCTIONS ---
function updatePlayerPFP() {
    const player = party.find(p => p.id === currentPlayerId);
    playerPFP.textContent = player.emoji;
}

function showCombatMessage(message) {
    combatMessage = message;
    if (combatMessageTimer) clearTimeout(combatMessageTimer);
    combatMessageTimer = setTimeout(() => {
        combatMessage = '';
    }, 3000);
}

function updateNpcPFP(entity = null, message = '') {
    if (entity) {
        let emoji = '?';
        let dialogue = message;
        
        // Check all NPC types
        if (EMOJIS.animals[entity.type]) {
            emoji = EMOJIS.animals[entity.type].emoji;
            dialogue = EMOJIS.animals[entity.type].dialogue;
        } else if (EMOJIS.sfNpcs[entity.type]) {
            emoji = EMOJIS.sfNpcs[entity.type].emoji;
            dialogue = EMOJIS.sfNpcs[entity.type].dialogue;
        } else if (EMOJIS.desertNpcs[entity.type]) {
            emoji = EMOJIS.desertNpcs[entity.type].emoji;
            dialogue = EMOJIS.desertNpcs[entity.type].dialogue;
        } else if (EMOJIS.islandNpcs[entity.type]) {
            emoji = EMOJIS.islandNpcs[entity.type].emoji;
            dialogue = EMOJIS.islandNpcs[entity.type].dialogue;
        } else if (EMOJIS.cityNpcs[entity.type]) {
            emoji = EMOJIS.cityNpcs[entity.type].emoji;
            dialogue = EMOJIS.cityNpcs[entity.type].dialogue;
        } else if (EMOJIS.schoolNpcs[entity.type]) {
            emoji = EMOJIS.schoolNpcs[entity.type].emoji;
            dialogue = EMOJIS.schoolNpcs[entity.type].dialogue;
        } else if (entity.emoji) {
            emoji = entity.emoji;
            dialogue = entity.dialogue || message;
        } else if (EMOJIS.enemies[entity.type]) {
            emoji = EMOJIS.enemies[entity.type];
            dialogue = `A wild ${entity.type}!`;
        }
        
        npcPFP.textContent = emoji;
        npcDialogue.textContent = dialogue;
    } else {
        npcPFP.textContent = '?';
        npcDialogue.textContent = message;
    }
}

function updateInventoryDisplay() {
    swordsDisplay.innerHTML = '';
    inventory.weapons.forEach(weapon => {
        swordsDisplay.innerHTML += `<span class="item-icon">${weapon}</span>`;
    });
    
    // Show legendary weapon
    if (inventory.legendaryWeapon) {
        swordsDisplay.innerHTML += `<span class="item-icon" title="${inventory.legendaryWeapon.name}">${inventory.legendaryWeapon.emoji}✨</span>`;
    }
    
    treasureDisplay.innerHTML = '';
    treasureDisplay.innerHTML += `<span class="item-icon">${EMOJIS.collectibles.coin} ${inventory.coins}</span>`;
    treasureDisplay.innerHTML += `<span class="item-icon">${EMOJIS.collectibles.diamond} ${inventory.diamonds}</span>`;
    treasureDisplay.innerHTML += `<span class="item-icon">🗝️ ${inventory.keys}</span>`;
    
    // Update health display
    const player = party.find(p => p.id === currentPlayerId);
    treasureDisplay.innerHTML += `<span class="item-icon">❤️ ${player.health}/${player.maxHealth}</span>`;
    
    // Show pet
    if (currentPet) {
        treasureDisplay.innerHTML += `<span class="item-icon" title="${currentPet.name}">${currentPet.emoji}</span>`;
    }
    
    // Show secrets count
    if (secretsFound > 0) {
        treasureDisplay.innerHTML += `<span class="item-icon">🔮 ${secretsFound}</span>`;
    }
}

// --- MOVEMENT AND INTERACTION ---
window.addEventListener('keydown', (e) => {
    // Debounce key presses
    const now = Date.now();
    if (now - lastKeyPress < KEY_DEBOUNCE) return;
    lastKeyPress = now;
    
    const player = party.find(p => p.id === currentPlayerId);
    if (!player) return; // Safety check
    
    let newX = player.x;
    let newY = player.y;
    const oldX = player.x;
    const oldY = player.y;

    switch (e.key) {
        case 'ArrowUp': newY--; break;
        case 'ArrowDown': newY++; break;
        case 'ArrowLeft': newX--; break;
        case 'ArrowRight': newX++; break;
        default: return;
    }

    // Safety checks
    if (!levels[currentLevel]) {
        console.error(`Current level ${currentLevel} not found`);
        return;
    }
    
    const { map, entities } = levels[currentLevel];
    if (!map || !entities) {
        console.error(`Invalid level data for ${currentLevel}`);
        return;
    }
    
    const targetTile = map[newY] ? map[newY][newX] : {type: 'boundary'};
    const allEntities = [...party, ...entities];
    const targetEntity = allEntities.find(e => e.x === newX && e.y === newY && e.id !== player.id);

    if (targetTile && (targetTile.type === 'stairDown' || targetTile.type === 'stairUp' || targetTile.type === 'door')) {
        playSound('levelChange');
        if (targetTile.target) {
            changeLevel(targetTile.target.level, targetTile.target.x, targetTile.target.y);
        }
        return;
    }
    
    if (targetTile && (targetTile.type === 'portal' || targetTile.type === 'vortex' || targetTile.type === 'dreamGate')) {
        playSound('levelChange');
        
        // For vortex and dreamGate with targets
        if (targetTile.target) {
            changeLevel(targetTile.target.level, targetTile.target.x, targetTile.target.y);
            return;
        }
        
        let targetLevel = null;
        let spawnX = 6, spawnY = 5;
        
        // Check all portal types
        Object.keys(EMOJIS.portals).forEach(portalKey => {
            if (targetTile.emoji === EMOJIS.portals[portalKey].emoji || targetTile.name === EMOJIS.portals[portalKey].name) {
                targetLevel = portalKey;
                
                // Set spawn positions for each level
                switch(portalKey) {
                    case 'desert': spawnX = 3; spawnY = 3; break;
                    case 'island': spawnX = MAP_WIDTH/2; spawnY = MAP_HEIGHT - 4; break;
                    case 'city': spawnX = 2; spawnY = 2; break;
                    case 'school': spawnX = MAP_WIDTH/2; spawnY = MAP_HEIGHT - 3; break;
                    case 'boba': spawnX = MAP_WIDTH/2; spawnY = MAP_HEIGHT - 3; break;
                    case 'house1': case 'house2': case 'house3': spawnX = MAP_WIDTH/2; spawnY = MAP_HEIGHT - 3; break;
                    case 'mushroom_kingdom': spawnX = 3; spawnY = 3; break;
                    case 'crystal_caves': spawnX = 3; spawnY = 3; break;
                    case 'dreamscape': spawnX = MAP_WIDTH/2; spawnY = MAP_HEIGHT/2; break;
                    case 'carnival': spawnX = MAP_WIDTH/2; spawnY = MAP_HEIGHT - 3; break;
                    case 'void': spawnX = MAP_WIDTH/2; spawnY = MAP_HEIGHT/2; break;
                    case 'asia':
                        playSound('denied');
                        updateNpcPFP(null, `${EMOJIS.portals[portalKey].name} - Coming Soon!`);
                        targetLevel = null;
                        break;
                }
            }
        });
        
        if (targetLevel) {
            if (!levels[targetLevel]) {
                levels[targetLevel] = generateLevel(targetLevel);
            }
            changeLevel(targetLevel, spawnX, spawnY);
        }
        return;
    }

    if (targetEntity && EMOJIS.enemies[targetEntity.type]) {
        // Combat!
        playSound('combat');
        
        // Calculate damage
        let damage = inventory.weapons.length > 0 ? 2 : 1;
        if (inventory.legendaryWeapon) {
            damage = inventory.legendaryWeapon.damage;
        }
        
        // Apply pet bonuses
        currentPets.forEach(pet => {
            switch(pet.bonus) {
                case 'fire': damage += 1; break;
                case 'burn': damage += 0.5; break;
                case 'magic': damage += inventory.diamonds > 0 ? 1 : 0; break;
                case 'loyalty': damage += 0.5; break;
                case 'undead': if (targetEntity.type === 'skeleton' || targetEntity.type === 'zombie') damage *= 2; break;
            }
        });
        
        // Apply legendary weapon special effects
        if (inventory.legendaryWeapon) {
            switch (inventory.legendaryWeapon.special) {
                case 'lightning':
                    // Lightning strikes all nearby enemies
                    entities.forEach(e => {
                        if (EMOJIS.enemies[e.type] && Math.abs(e.x - newX) <= 2 && Math.abs(e.y - newY) <= 2) {
                            e.health = (e.health || 3) - 2;
                            if (e.health <= 0) {
                                levels[currentLevel].entities = entities.filter(ent => ent.id !== e.id);
                            }
                        }
                    });
                    showCombatMessage('⚡ Lightning strikes nearby enemies!');
                    break;
                case 'heal':
                    player.health = Math.min(player.health + 1, player.maxHealth);
                    break;
                case 'stealth':
                    // Skip enemy turn
                    break;
            }
        }
        
        const enemyHealth = targetEntity.isBoss ? (targetEntity.health || 20) : (targetEntity.health || 3);
        targetEntity.health = (targetEntity.health || enemyHealth) - damage;
        
        if (targetEntity.health <= 0) {
            // Enemy defeated
            if (targetEntity.isBoss) {
                showCombatMessage(`BOSS DEFEATED! ${targetEntity.type} has fallen!`);
                bossesDefeated.push(targetEntity.type);
                // Drop boss loot
                if (targetEntity.drops) {
                    targetEntity.drops.forEach(drop => {
                        map[targetEntity.y][targetEntity.x] = { type: drop, emoji: EMOJIS.collectibles[drop] };
                    });
                }
            } else {
                inventory.coins += 2;
                showCombatMessage(`Defeated ${targetEntity.type}! +2 coins`);
            }
            levels[currentLevel].entities = entities.filter(e => e.id !== targetEntity.id);
        } else {
            // Enemy counter-attacks
            let enemyDamage = targetEntity.isBoss ? 3 : 1;
            // Dragon scale protection
            if (inventory.secrets.includes('scale')) {
                enemyDamage = Math.max(1, enemyDamage - 1);
            }
            player.health -= enemyDamage;
            showCombatMessage(`Hit ${targetEntity.type} for ${damage} damage! Took ${enemyDamage} damage!`);
            
            if (player.health <= 0) {
                // Phoenix feather revival
                if (inventory.secrets.includes('phoenix')) {
                    inventory.secrets = inventory.secrets.filter(s => s !== 'phoenix');
                    player.health = Math.floor(player.maxHealth / 2);
                    showCombatMessage('🔥 Phoenix Feather revives you!');
                } else {
                    showCombatMessage('Game Over! Respawning...');
                    player.health = player.maxHealth;
                    player.x = 3;
                    player.y = 3;
                }
            }
        }
        updateInventoryDisplay();
    } else if (!isOccupied(map, allEntities, newX, newY, player.id)) {
        player.x = newX;
        player.y = newY;
        moveFollowers(oldX, oldY);

        if (targetTile) {
            playSound('collect');
            if (targetTile.type === 'weapon') inventory.weapons.push(targetTile.emoji);
            if (targetTile.type === 'coin') inventory.coins++;
            if (targetTile.type === 'diamond') inventory.diamonds++;
            if (targetTile.type === 'sourdough') {
                inventory.coins += 2;
                updateNpcPFP(null, 'Delicious sourdough bread! +2 coins');
            }
            if (targetTile.type === 'coffee') {
                inventory.coins += 1;
                updateNpcPFP(null, 'Great coffee! +1 coin');
            }
            if (targetTile.type === 'potion') {
                player.health = Math.min(player.health + 5, player.maxHealth);
                updateNpcPFP(null, 'Health restored! +5 HP');
            }
            if (targetTile.type === 'apple') {
                player.health = Math.min(player.health + 2, player.maxHealth);
                updateNpcPFP(null, 'Healthy snack! +2 HP');
            }
            if (targetTile.type === 'water_bottle') {
                player.health = Math.min(player.health + 1, player.maxHealth);
                updateNpcPFP(null, 'Refreshing! +1 HP');
            }
            if (targetTile.type === 'boba') {
                player.health = Math.min(player.health + 3, player.maxHealth);
                updateNpcPFP(null, 'Delicious boba! +3 HP');
            }
            if (targetTile.type === 'pizza') {
                player.health = Math.min(player.health + 2, player.maxHealth);
                inventory.coins += 1;
                updateNpcPFP(null, 'Tasty pizza! +2 HP, +1 coin');
            }
            if (targetTile.type === 'taco') {
                player.health = Math.min(player.health + 2, player.maxHealth);
                inventory.coins += 1;
                updateNpcPFP(null, 'Spicy taco! +2 HP, +1 coin');
            }
            if (targetTile.type === 'shell') {
                inventory.coins += 3;
                updateNpcPFP(null, 'Beautiful shell! +3 coins');
            }
            if (targetTile.type === 'pearl') {
                inventory.diamonds += 1;
                updateNpcPFP(null, 'Shiny pearl! +1 diamond');
            }
            if (targetTile.type === 'sunscreen') {
                player.maxHealth += 1;
                player.health += 1;
                updateNpcPFP(null, 'Protected from sun! +1 max HP');
            }
            if (targetTile.type === 'pencil') {
                inventory.coins += 1;
                updateNpcPFP(null, 'Sharp pencil! +1 coin');
            }
            // Legendary weapons
            if (targetTile.type === 'legendary' && targetTile.weapon) {
                const weapon = EMOJIS.collectibles.legendaryWeapons[targetTile.weapon];
                inventory.legendaryWeapon = weapon;
                updateNpcPFP(null, `You found ${weapon.name}! Damage: ${weapon.damage}, Special: ${weapon.special}`);
                playSound('levelChange');
            }
            // Secret items
            if (targetTile.type === 'key') {
                inventory.keys++;
                updateNpcPFP(null, '🗝️ Found a key! Can unlock secret doors.');
            }
            if (targetTile.type === 'lucky_clover') {
                inventory.secrets.push('clover');
                secretsFound++;
                player.maxHealth += 2;
                player.health = player.maxHealth;
                updateNpcPFP(null, '🍀 Lucky! +2 Max HP and full heal!');
            }
            if (targetTile.type === 'ancient_rune') {
                inventory.secrets.push('rune');
                secretsFound++;
                updateNpcPFP(null, '🪬 Ancient power flows through you...');
            }
            if (targetTile.type === 'phoenix_feather') {
                inventory.secrets.push('phoenix');
                secretsFound++;
                updateNpcPFP(null, '🪶 Phoenix Feather! You\'ll revive once if defeated!');
            }
            if (targetTile.type === 'dragon_scale') {
                inventory.secrets.push('scale');
                secretsFound++;
                updateNpcPFP(null, '🐉 Dragon Scale! Take 1 less damage from enemies!');
            }
            if (targetTile.type === 'crown') {
                inventory.secrets.push('crown');
                secretsFound++;
                updateNpcPFP(null, '👑 You are the true champion!');
            }
            if (targetTile.type === 'scroll') {
                inventory.secrets.push('scroll');
                updateNpcPFP(null, '📜 Ancient wisdom reveals secret paths...');
            }
            
            // Special terrain interactions
            if (targetTile.type === 'bloodPool') {
                player.health = Math.max(1, player.health - 2);
                updateNpcPFP(null, '🩸 The blood pool drains your life force! -2 HP');
                // Has a chance to give vampire pet
                if (Math.random() < 0.1 && currentPets.length < maxPets) {
                    const vampPet = EMOJIS.pets.skull;
                    currentPets.push(vampPet);
                    showCombatMessage(`${vampPet.name} rises from the blood to join you!`);
                }
            }
            if (targetTile.type === 'soulWell') {
                // Soul wells teleport randomly
                player.x = Math.floor(Math.random() * MAP_WIDTH);
                player.y = Math.floor(Math.random() * MAP_HEIGHT);
                updateNpcPFP(null, '🌀 The soul well teleports you!');
                return;
            }
            if (targetTile.type === 'fountain') {
                player.health = player.maxHealth;
                updateNpcPFP(null, '⛲ The fountain fully restores your health!');
            }
            if (targetTile.type === 'gate' && targetTile.locked) {
                if (inventory.keys > 0) {
                    inventory.keys--;
                    map[newY][newX] = null;
                    updateNpcPFP(null, '🗝️ Unlocked the gate!');
                } else {
                    playSound('denied');
                    updateNpcPFP(null, '🔒 This gate is locked! You need a key.');
                    return;
                }
            }
            
            // Most collectibles clear the tile
            if (!['bloodPool', 'soulWell', 'fountain', 'gate'].includes(targetTile.type)) {
                map[newY][newX] = null;
            }
            if (inventory.weapons.length === 5 && currentLevel === 'overworld') {
                placeStairs();
            }
            updateInventoryDisplay();
        }
        moveEntities();
    }
    checkForNpcInteraction();
});

function moveFollowers(targetX, targetY) {
    let lastTargetX = targetX;
    let lastTargetY = targetY;
    party.forEach(p => {
        if (p.id !== currentPlayerId) {
            const currentX = p.x;
            const currentY = p.y;
            p.x = lastTargetX;
            p.y = lastTargetY;
            lastTargetX = currentX;
            lastTargetY = currentY;
        }
    });
}

function moveEntities() {
    if (!levels[currentLevel]) return;
    
    const { map, entities } = levels[currentLevel];
    if (!map || !entities) return;
    
    // Only move enemies, not NPCs
    const enemies = entities.filter(e => EMOJIS.enemies[e.type]);
    
    // Combine entities once for collision checking
    const allEntities = party.concat(entities);

    enemies.forEach(entity => {
        // Only 60% chance to move each turn
        if (Math.random() > 0.6) return;
        
        let newX = entity.x;
        let newY = entity.y;
        const move = Math.floor(Math.random() * 4);
        
        switch(move) {
            case 0: newY--; break;
            case 1: newY++; break;
            case 2: newX--; break;
            case 3: newX++; break;
        }

        if (!isOccupied(map, allEntities, newX, newY, entity.id)) {
            entity.x = newX;
            entity.y = newY;
        }
    });
}

// Cache solid terrain types for performance
const SOLID_TERRAIN = new Set(['tree', 'mountain', 'wall', 'water', 'building', 'cactus', 'desk', 'book', 'board', 'lava', 'fire', 'chain', 'tombstone', 'couch', 'tv', 'bed', 'stove', 'fridge', 'mirror', 'demonThrone', 'ferris_wheel', 'carousel']);
const DAMAGING_TERRAIN = new Set(['lava', 'fire', 'bloodPool']);
const HEALING_TERRAIN = new Set(['fountain', 'soulWell']);
const TELEPORT_TERRAIN = new Set(['portal', 'vortex', 'dreamGate', 'stairUp', 'stairDown', 'door']);

function isOccupied(map, entities, x, y, movingEntityId = null) {
    // Boundary check
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return true;
    
    // Terrain check
    const tile = map[y]?.[x];
    if (tile && SOLID_TERRAIN.has(tile.type)) return true;

    // Entity collision check
    const movingPlayer = movingEntityId ? party.find(p => p.id === movingEntityId) : null;

    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        
        // Skip self
        if (entity.id === movingEntityId) continue;
        
        // Check position
        if (entity.x === x && entity.y === y) {
            // Allow party members to swap positions
            if (movingPlayer && party.some(p => p.id === entity.id)) {
                continue;
            }
            return true;
        }
    }

    return false;
}

function checkForNpcInteraction() {
    const entities = levels[currentLevel].entities;
    let foundAnimal = null;
    const player = party.find(p => p.id === currentPlayerId);

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const checkX = player.x + dx;
            const checkY = player.y + dy;
            const neighbor = entities.find(e => e.x === checkX && e.y === checkY);
            if (neighbor && (EMOJIS.animals[neighbor.type] || 
                           EMOJIS.sfNpcs[neighbor.type] || 
                           EMOJIS.desertNpcs[neighbor.type] || 
                           EMOJIS.islandNpcs[neighbor.type] || 
                           EMOJIS.cityNpcs[neighbor.type] || 
                           EMOJIS.schoolNpcs[neighbor.type] ||
                           EMOJIS.underworldNpcs[neighbor.type] ||
                           neighbor.type === 'shopkeeper' ||
                           neighbor.type === 'fairy')) {
                foundAnimal = neighbor;
                
                // Special interactions
                if (neighbor.givePet && currentPets.length < maxPets) {
                    const newPet = EMOJIS.pets[neighbor.givePet];
                    currentPets.push(newPet);
                    showCombatMessage(`${newPet.name} joins your party! Bonus: ${newPet.bonus}`);
                }
                
                // Wild pet befriending
                if (neighbor.type === 'wild_pet' && currentPets.length < maxPets) {
                    const petData = EMOJIS.pets[neighbor.petType];
                    if (petData && !currentPets.find(p => p.name === petData.name)) {
                        currentPets.push(petData);
                        showCombatMessage(`${petData.name} joins your party! Bonus: ${petData.bonus}`);
                        // Remove the pet from entities
                        levels[currentLevel].entities = entities.filter(e => e.id !== neighbor.id);
                    }
                }
                break;
            }
        }
        if (foundAnimal) break;
    }
    updateNpcPFP(foundAnimal);
}

function placeStairs() {
    const map = levels.overworld.map;
    let attempts = 0;
    while (attempts < 1000) {
        attempts++;
        let x = Math.floor(Math.random() * MAP_WIDTH);
        let y = Math.floor(Math.random() * MAP_HEIGHT);
        const allEntities = party.concat(levels.overworld.entities);
        if (!isOccupied(map, allEntities, x, y)) {
            map[y][x] = { type: 'stairDown', emoji: EMOJIS.terrain.stairDown, target: { level: 'underworld', x: 4, y: 4 } };
            showCombatMessage('A portal to the Underworld has opened! 💀');
            break;
        }
    }
}

function changeLevel(level, x, y) {
    currentLevel = level;
    const player = party.find(p => p.id === currentPlayerId);
    player.x = x;
    player.y = y;
    moveFollowers(x,y); // Move followers to the new spot
    updateNpcPFP(null);
}

charSelect.addEventListener('change', (e) => {
    currentPlayerId = e.target.value;
    updatePlayerPFP();
});

// --- GAME LOOP ---
function gameLoop() {
    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Safety check for current level
        if (!levels[currentLevel]) {
            ctx.fillText('Level not found!', canvas.width / 2, canvas.height / 2);
            requestAnimationFrame(gameLoop);
            return;
        }

        const { map, entities } = levels[currentLevel];
        
        if (!map || !entities) {
            ctx.fillText('Invalid level data!', canvas.width / 2, canvas.height / 2);
            requestAnimationFrame(gameLoop);
            return;
        }

        // Render map tiles
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tile = map[y] && map[y][x];
                if (tile && tile.emoji) {
                    ctx.fillText(tile.emoji, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                }
            }
        }

    entities.forEach(entity => {
        let emoji = '?';
        if (EMOJIS.enemies[entity.type]) {
            emoji = EMOJIS.enemies[entity.type];
        } else if (EMOJIS.animals[entity.type]) {
            emoji = EMOJIS.animals[entity.type].emoji;
        } else if (EMOJIS.sfNpcs[entity.type]) {
            emoji = EMOJIS.sfNpcs[entity.type].emoji;
        } else if (EMOJIS.desertNpcs[entity.type]) {
            emoji = EMOJIS.desertNpcs[entity.type].emoji;
        } else if (EMOJIS.islandNpcs[entity.type]) {
            emoji = EMOJIS.islandNpcs[entity.type].emoji;
        } else if (EMOJIS.cityNpcs[entity.type]) {
            emoji = EMOJIS.cityNpcs[entity.type].emoji;
        } else if (EMOJIS.schoolNpcs[entity.type]) {
            emoji = EMOJIS.schoolNpcs[entity.type].emoji;
        } else if (EMOJIS.underworldNpcs[entity.type]) {
            emoji = EMOJIS.underworldNpcs[entity.type].emoji;
        } else if (entity.emoji) {
            emoji = entity.emoji;
        }
        
        // Draw entity
        ctx.fillText(emoji, entity.x * TILE_SIZE + TILE_SIZE / 2, entity.y * TILE_SIZE + TILE_SIZE / 2);
        
        // Boss aura effect
        if (entity.isBoss) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(entity.x * TILE_SIZE + TILE_SIZE / 2, entity.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        }
    });

    party.forEach(p => {
        ctx.fillText(p.emoji, p.x * TILE_SIZE + TILE_SIZE / 2, p.y * TILE_SIZE + TILE_SIZE / 2);
    });
    
    // Draw pets following the party
    if (currentPets.length > 0) {
        const player = party.find(p => p.id === currentPlayerId);
        currentPets.forEach((pet, index) => {
            const angle = (index / maxPets) * Math.PI * 2;
            const distance = 0.7;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            ctx.globalAlpha = 0.8;
            ctx.fillText(pet.emoji, (player.x + offsetX) * TILE_SIZE + TILE_SIZE / 2, (player.y + offsetY) * TILE_SIZE + TILE_SIZE / 2);
            ctx.globalAlpha = 1;
        });
    }
    
    // Atmospheric effects
    if (currentLevel === 'underworld') {
        // Dark overlay
        ctx.fillStyle = 'rgba(30, 0, 50, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Floating embers
        ctx.fillStyle = 'orange';
        for (let i = 0; i < 20; i++) {
            const x = (Date.now() / 50 + i * 100) % canvas.width;
            const y = (Math.sin(Date.now() / 1000 + i) * 50) + 100 + i * 20;
            ctx.fillRect(x, y, 2, 2);
        }
    }
    
    if (currentLevel === 'island' || timeOfDay === 'night') {
        // Night overlay
        ctx.fillStyle = 'rgba(0, 0, 30, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    if (currentLevel === 'desert') {
        // Heat waves
        ctx.fillStyle = 'rgba(255, 200, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw combat message
    if (combatMessage) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(50, 250, 700, 100);
        ctx.fillStyle = 'white';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(combatMessage, 400, 300);
        ctx.font = `${TILE_SIZE * 0.9}px sans-serif`;
    }

    } catch (error) {
        console.error('Game loop error:', error);
        ctx.fillStyle = 'red';
        ctx.fillText('Game Error! Check console.', canvas.width / 2, canvas.height / 2);
    }
    
    requestAnimationFrame(gameLoop);
}

// --- INITIAL SETUP ---
levels.overworld = generateLevel('overworld');
levels.dungeon = generateLevel('dungeon');
updatePlayerPFP();
updateInventoryDisplay();
gameLoop();
