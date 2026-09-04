import { Song, GenreCategory } from '../types/rockola';

export const GENRE_CATEGORIES: GenreCategory[] = [
  {
    id: 'favorites',
    name: 'My Favorites',
    nameEs: 'Favoritos',
    iconName: 'Heart',
    color: 'from-rose-600 to-red-800',
    badge: '♥ FAVS'
  },
  {
    id: 'current-singles',
    name: 'Official Current Singles',
    nameEs: 'Éxitos Actuales',
    iconName: 'Flame',
    color: 'from-pink-600 to-rose-700',
    badge: 'CHARTS'
  },
  {
    id: 'adele',
    name: 'Adele',
    nameEs: 'Adele Colección',
    iconName: 'Music',
    color: 'from-zinc-700 to-black',
    badge: 'ADELE'
  },
  {
    id: 'britpop',
    name: 'Blur vs Oasis (Britpop)',
    nameEs: 'Blur vs Oasis',
    iconName: 'Guitar',
    color: 'from-amber-700 to-amber-950',
    badge: 'BRITPOP'
  },
  {
    id: 'rock',
    name: 'Classic Rock & Metal',
    nameEs: 'Rock Clásico',
    iconName: 'Flame',
    color: 'from-red-600 to-red-900',
    badge: 'ROCK'
  },
  {
    id: 'grunge',
    name: '90s Alternative & Grunge',
    nameEs: 'Grunge & Alternativo',
    iconName: 'Radio',
    color: 'from-blue-600 to-indigo-800',
    badge: 'GRUNGE'
  },
  {
    id: 'latin',
    name: 'Latin & Salsa',
    nameEs: 'Latino y Cumbia',
    iconName: 'Music',
    color: 'from-emerald-600 to-teal-800',
    badge: 'LATIN'
  },
  {
    id: 'retro80s',
    name: '80s & 90s Retro Pop',
    nameEs: 'Retro 80s y 90s',
    iconName: 'Radio',
    color: 'from-fuchsia-600 to-purple-800',
    badge: 'RETRO'
  },
  {
    id: 'disco',
    name: 'Best of the 1970s',
    nameEs: 'Disco & 70s',
    iconName: 'Disc',
    color: 'from-orange-500 to-amber-700',
    badge: '70s'
  },
  {
    id: 'videos',
    name: 'Music Videos & Concerts',
    nameEs: 'Videos Musicales HD',
    iconName: 'Tv',
    color: 'from-violet-600 to-fuchsia-950',
    badge: 'VIDEOS'
  },
  {
    id: 'country',
    name: 'Country & Saloon Roots',
    nameEs: 'Country & Saloon',
    iconName: 'Guitar',
    color: 'from-amber-800 to-yellow-950',
    badge: 'COUNTRY'
  }
];

export const DEFAULT_SONGS: Song[] = [
  // 1. ADELE (Matching Photo 1)
  {
    id: 'adele-1',
    code: 'A01',
    title: 'Hello',
    artist: 'Adele',
    album: '25 (2015)',
    genre: 'adele',
    year: 2015,
    duration: 295,
    coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    albumArtUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    audioUrl: 'synth:adele-hello',
    lyrics: [
      'Hello, its me',
      'I was wondering if after all these years youd like to meet',
      'To go over everything',
      'They say that times supposed to heal ya, but I aint done much healing'
    ],
    playCount: 420
  },
  {
    id: 'adele-2',
    code: 'A02',
    title: 'Rolling In The Deep',
    artist: 'Adele',
    album: '21 (2011)',
    genre: 'adele',
    year: 2011,
    duration: 228,
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    audioUrl: 'synth:adele-rolling',
    lyrics: [
      'There is a fire starting in my heart',
      'Reaching a fever pitch and its bringing me out the dark',
      'The scars of your love remind me of us'
    ],
    playCount: 388
  },
  {
    id: 'adele-3',
    code: 'A03',
    title: 'Someone Like You',
    artist: 'Adele',
    album: '21 (2011)',
    genre: 'adele',
    year: 2011,
    duration: 285,
    coverArt: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80',
    audioUrl: 'synth:adele-someone',
    lyrics: [
      'I heard that you are settled down',
      'That you found a girl and you are married now',
      'Never mind, Ill find someone like you',
      'I wish nothing but the best for you too'
    ],
    playCount: 360
  },
  {
    id: 'adele-4',
    code: 'A04',
    title: 'Easy On Me',
    artist: 'Adele',
    album: '30 (2021)',
    genre: 'adele',
    year: 2021,
    duration: 224,
    coverArt: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=400&q=80',
    audioUrl: 'synth:adele-easy',
    lyrics: [
      'Go easy on me, baby',
      'I was still a child',
      'Didnt get the chance to feel the world around me'
    ],
    playCount: 290
  },

  // 2. OFFICIAL CHARTS COMPANY / CURRENT SINGLES (Matching Photo 1)
  {
    id: 'charts-1',
    code: 'B01',
    title: 'Flowers (UK No. 1)',
    artist: 'Miley Cyrus',
    album: 'Official Charts Current Singles',
    genre: 'current-singles',
    year: 2023,
    duration: 200,
    coverArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
    audioUrl: 'synth:charts-flowers',
    lyrics: [
      'I can buy myself flowers',
      'Write my name in the sand',
      'Talk to myself for hours',
      'Say things you dont understand'
    ],
    playCount: 450
  },
  {
    id: 'charts-2',
    code: 'B02',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours Hits',
    genre: 'current-singles',
    year: 2020,
    duration: 200,
    coverArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80',
    audioUrl: 'synth:charts-blinding',
    lyrics: [
      'I said, ooh, Im blinded by the lights',
      'No, I cant sleep until I feel your touch',
      'I said, ooh, Im drowning in the night'
    ],
    playCount: 410
  },
  {
    id: 'charts-3',
    code: 'B03',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: 'Harrys House',
    genre: 'current-singles',
    year: 2022,
    duration: 167,
    coverArt: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80',
    audioUrl: 'synth:charts-asitwas',
    lyrics: [
      'Holdin me back',
      'Gravitys holdin me back',
      'You know it aint the same as it was'
    ],
    playCount: 375
  },
  {
    id: 'charts-4',
    code: 'B04',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    genre: 'current-singles',
    year: 2020,
    duration: 203,
    coverArt: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
    audioUrl: 'synth:charts-levitating',
    lyrics: [
      'If you wanna run away with me, I know a galaxy',
      'And I can take you for a ride',
      'I had a premonition that we fell into a rhythm'
    ],
    playCount: 340
  },

  // 3. BLUR VS OASIS (Matching Photo 1)
  {
    id: 'brit-1',
    code: 'C01',
    title: 'Wonderwall',
    artist: 'Oasis',
    album: '(Whats the Story) Morning Glory?',
    genre: 'britpop',
    year: 1995,
    duration: 258,
    coverArt: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80',
    audioUrl: 'synth:brit-wonderwall',
    lyrics: [
      'Today is gonna be the day that theyre gonna throw it back to you',
      'By now you shouldve somehow realized what you gotta do',
      'Because maybe, youre gonna be the one that saves me'
    ],
    playCount: 480
  },
  {
    id: 'brit-2',
    code: 'C02',
    title: 'Song 2 (Woo Hoo!)',
    artist: 'Blur',
    album: 'Blur (1997)',
    genre: 'britpop',
    year: 1997,
    duration: 122,
    coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    audioUrl: 'synth:brit-song2',
    lyrics: [
      'Woo-hoo! When I feel heavy-metal',
      'Woo-hoo! And Im pins and Im needles',
      'Woo-hoo! Well, I lie and Im easy'
    ],
    playCount: 395
  },
  {
    id: 'brit-3',
    code: 'C03',
    title: 'Dont Look Back In Anger',
    artist: 'Oasis',
    album: '(Whats the Story) Morning Glory?',
    genre: 'britpop',
    year: 1995,
    duration: 288,
    coverArt: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=80',
    audioUrl: 'synth:brit-anger',
    lyrics: [
      'Slip inside the eye of your mind',
      'Dont you know you might find a better place to play',
      'And so Sally can wait, she knows its too late as were walking on by'
    ],
    playCount: 355
  },
  {
    id: 'brit-4',
    code: 'C04',
    title: 'Parklife',
    artist: 'Blur',
    album: 'Parklife (1994)',
    genre: 'britpop',
    year: 1994,
    duration: 185,
    coverArt: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80',
    audioUrl: 'synth:brit-parklife',
    lyrics: [
      'Confidence is a preference for the habitual voyeur',
      'Of what is known as (Parklife!)',
      'All the people, so many people, they all go hand in hand'
    ],
    playCount: 280
  },

  // 4. CLASSIC ROCK & METAL
  {
    id: 'rock-1',
    code: 'D01',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera (1975)',
    genre: 'rock',
    year: 1975,
    duration: 354,
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    audioUrl: 'synth:rock-bohemian',
    lyrics: [
      'Is this the real life? Is this just fantasy?',
      'Caught in a landslide, no escape from reality',
      'Open your eyes, look up to the skies and see'
    ],
    playCount: 520
  },
  {
    id: 'rock-2',
    code: 'D02',
    title: 'Highway to Hell',
    artist: 'AC/DC',
    album: 'Highway to Hell (1979)',
    genre: 'rock',
    year: 1979,
    duration: 208,
    coverArt: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80',
    audioUrl: 'synth:rock-highway',
    lyrics: [
      'Living easy, living free',
      'Season ticket on a one-way ride',
      'Im on the highway to hell!'
    ],
    playCount: 430
  },
  {
    id: 'rock-3',
    code: 'D03',
    title: 'Sweet Child O Mine',
    artist: 'Guns N Roses',
    album: 'Appetite for Destruction (1987)',
    genre: 'rock',
    year: 1987,
    duration: 356,
    coverArt: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=400&q=80',
    audioUrl: 'synth:rock-roses',
    lyrics: [
      'Shes got a smile that it seems to me',
      'Reminds me of childhood memories',
      'Sweet child o mine!'
    ],
    playCount: 390
  },

  // 5. 90s ALTERNATIVE & GRUNGE
  {
    id: 'alt-1',
    code: 'E01',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    album: 'Nevermind (1991)',
    genre: 'grunge',
    year: 1991,
    duration: 301,
    coverArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80',
    audioUrl: 'synth:alt-nirvana',
    lyrics: [
      'Load up on guns, bring your friends',
      'Its fun to lose and to pretend',
      'With the lights out, its less dangerous',
      'Here we are now, entertain us'
    ],
    playCount: 490
  },
  {
    id: 'alt-2',
    code: 'E02',
    title: 'Everlong',
    artist: 'Foo Fighters',
    album: 'The Colour and the Shape (1997)',
    genre: 'grunge',
    year: 1997,
    duration: 250,
    coverArt: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80',
    audioUrl: 'synth:alt-everlong',
    lyrics: [
      'Hello, Ive waited here for you, everlong',
      'Tonight, I throw myself into, and out of the red, out of her head she sang',
      'Breathe out, so I can breathe you in'
    ],
    playCount: 420
  },
  {
    id: 'alt-3',
    code: 'E03',
    title: 'Californication',
    artist: 'Red Hot Chili Peppers',
    album: 'Californication (1999)',
    genre: 'grunge',
    year: 1999,
    duration: 329,
    coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    audioUrl: 'synth:alt-californication',
    lyrics: [
      'Psychic spies from China try to steal your minds elation',
      'And little girls from Sweden dream of silver screen quotation',
      'Dream of Californication'
    ],
    playCount: 460
  },
  {
    id: 'alt-4',
    code: 'E04',
    title: 'Alive',
    artist: 'Pearl Jam',
    album: 'Ten (1991)',
    genre: 'grunge',
    year: 1991,
    duration: 341,
    coverArt: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80',
    audioUrl: 'synth:alt-alive',
    lyrics: [
      'Son, she said, have I got a little story for you',
      'What you thought was your daddy was nothin but a',
      'While you were sittin home alone at age thirteen',
      'Oh, Im, oh, Im, still alive'
    ],
    playCount: 380
  },

  // 6. LATIN & SALSA
  {
    id: 'lat-1',
    code: 'F01',
    title: 'Despacito',
    artist: 'Luis Fonsi ft. Daddy Yankee',
    album: 'Vida (2017)',
    genre: 'latin',
    year: 2017,
    duration: 228,
    coverArt: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80',
    audioUrl: 'synth:lat-despacito',
    lyrics: [
      'Despacito',
      'Quiero respirar tu cuello despacito',
      'Deja que te diga cosas al oído'
    ],
    playCount: 460
  },
  {
    id: 'lat-2',
    code: 'F02',
    title: 'Cumbia Del Sol Peruano',
    artist: 'Los Reyes de la Rockola',
    album: 'Rockolas Peru Hits',
    genre: 'latin',
    year: 1994,
    duration: 182,
    coverArt: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80',
    audioUrl: 'synth:lat-cumbia',
    lyrics: [
      'Oye mi cumbia que suena en el bar',
      'Mete la moneda y ponte a bailar',
      'Rockola digital fenomenal!'
    ],
    playCount: 290
  },

  // 7. 80s & 90s RETRO
  {
    id: 'ret-1',
    code: 'G01',
    title: 'Take On Me',
    artist: 'A-ha',
    album: 'Hunting High and Low (1985)',
    genre: 'retro80s',
    year: 1985,
    duration: 225,
    coverArt: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
    audioUrl: 'synth:ret-takeonme',
    lyrics: [
      'Talking away, I dont know what Im to say',
      'Ill say it anyway, todays another day to find you',
      'Take on me (take on me), Take me on (take on me)'
    ],
    playCount: 415
  },
  {
    id: 'ret-2',
    code: 'G02',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    album: 'Thriller (1982)',
    genre: 'retro80s',
    year: 1982,
    duration: 294,
    coverArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
    audioUrl: 'synth:ret-billiejean',
    lyrics: [
      'Billie Jean is not my lover',
      'Shes just a girl who claims that I am the one',
      'But the kid is not my son'
    ],
    playCount: 470
  },

  // 8. BEST OF THE 1970s / DISCO
  {
    id: 'dis-1',
    code: 'H01',
    title: 'Stayin Alive',
    artist: 'Bee Gees',
    album: 'Saturday Night Fever (1977)',
    genre: 'disco',
    year: 1977,
    duration: 285,
    coverArt: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&q=80',
    audioUrl: 'synth:dis-stayin',
    lyrics: [
      'Well, you can tell by the way I use my walk',
      'Im a woman man, no time to talk',
      'Whether you are a brother or whether you are a mother, you are stayin alive'
    ],
    playCount: 390
  },
  {
    id: 'dis-2',
    code: 'H02',
    title: 'September',
    artist: 'Earth, Wind & Fire',
    album: 'The Best of Earth, Wind & Fire (1978)',
    genre: 'disco',
    year: 1978,
    duration: 215,
    coverArt: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=80',
    audioUrl: 'synth:dis-september',
    lyrics: [
      'Do you remember the 21st night of September?',
      'Love was changin the minds of pretenders',
      'While chasin the clouds away'
    ],
    playCount: 380
  },

  // 9. COUNTRY & SALOON
  {
    id: 'cou-1',
    code: 'J01',
    title: 'Ring of Fire',
    artist: 'Johnny Cash',
    album: 'Ring of Fire: The Best of Johnny Cash (1963)',
    genre: 'country',
    year: 1963,
    duration: 157,
    coverArt: 'https://images.unsplash.com/photo-1525994886773-080587e161c2?w=400&q=80',
    audioUrl: 'synth:cou-ring',
    lyrics: [
      'Love is a burning thing, and it makes a fiery ring',
      'Bound by wild desire, I fell into a ring of fire',
      'I fell into a burnin ring of fire'
    ],
    playCount: 310
  },
  {
    id: 'cou-2',
    code: 'J02',
    title: 'Take Me Home, Country Roads',
    artist: 'John Denver',
    album: 'Poems, Prayers & Promises (1971)',
    genre: 'country',
    year: 1971,
    duration: 198,
    coverArt: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&q=80',
    audioUrl: 'synth:cou-roads',
    lyrics: [
      'Country roads, take me home to the place I belong',
      'West Virginia, mountain mama',
      'Take me home, country roads'
    ],
    playCount: 340
  },
  {
    id: 'new-import-1',
    code: 'J03',
    title: 'Neon Nights (Unreleased Studio Master)',
    artist: 'Retro Arcade Syndicate',
    album: '2026 Jukebox Vault Imports',
    genre: 'current-singles',
    year: 2026,
    duration: 210,
    audioUrl: 'synth:retro-synth',
    isNewlyImported: true,
    isImported: true,
    playCount: 42,
    lyrics: [
      'Fashing neon in the midnight arcade haze',
      'Synthesizers ringing through the electric maze',
      'Rockola jukebox shining through the night'
    ]
  },
  {
    id: 'new-import-2',
    code: 'A05',
    title: 'Chasing Pavements (Acoustic Import)',
    artist: 'Adele',
    album: 'Studio Session Import',
    genre: 'adele',
    year: 2026,
    duration: 210,
    audioUrl: 'synth:adele-chasing',
    isNewlyImported: true,
    isImported: true,
    playCount: 88,
    lyrics: [
      'Should I give up, or should I just keep chasing pavements?',
      'Even if it leads nowhere',
      'Or would it be a waste of time?'
    ]
  },
  // ============================================
  // HD MUSIC VIDEOS & CONCERT VISUALS
  // ============================================
  {
    id: 'vid-tears-steel',
    code: 'V01',
    title: 'Tears of Steel (Synthwave OST)',
    artist: 'Blender & Sci-Fi Syndicate',
    album: 'Cyberpunk Soundscapes HD',
    genre: 'videos',
    year: 2024,
    duration: 734,
    coverArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
    albumArtUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
    audioUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    mediaType: 'video',
    mediaSource: 'built-in',
    playCount: 520,
    lyrics: [
      'Neon reflections on titanium rain',
      'Distant holographic echoes of the lost domain',
      'Synthesizers surge as the cinematic sky turns blue'
    ]
  },
  {
    id: 'vid-big-buck',
    code: 'V02',
    title: 'Big Buck Overture (Symphonic)',
    artist: 'Peach Studio Orchestra',
    album: 'Cinematic Concert Series',
    genre: 'videos',
    year: 2023,
    duration: 596,
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    albumArtUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    audioUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    mediaType: 'video',
    mediaSource: 'built-in',
    playCount: 380,
    lyrics: [
      'Morning sunlight in the animated glade',
      'Orchestral strings rising through the forest shade'
    ]
  },
  {
    id: 'vid-bigger-blazes',
    code: 'V03',
    title: 'Electric Stage Blaze (Live Rock)',
    artist: 'Chrome Overdrive',
    album: 'Live Arena Showcase',
    genre: 'rock',
    year: 2024,
    duration: 15,
    coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    albumArtUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    audioUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    mediaType: 'video',
    mediaSource: 'built-in',
    playCount: 640,
    lyrics: [
      'Strobe lights blasting through the arena smoke',
      'The amps ignite when the power chord spoke'
    ]
  },
  {
    id: 'vid-meltdowns',
    code: 'V04',
    title: 'Heavy Metal Meltdown (Guitar Solo)',
    artist: 'Midnight Thrashers',
    album: 'High Voltage Videos',
    genre: 'rock',
    year: 2024,
    duration: 15,
    coverArt: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&q=80',
    albumArtUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&q=80',
    audioUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    mediaType: 'video',
    mediaSource: 'built-in',
    playCount: 430,
    lyrics: [
      'Distortion roaring at the redline speed',
      'A blazing solo is all we need'
    ]
  },
  {
    id: 'vid-elephants-dream',
    code: 'V05',
    title: 'Elephants Dream (Electronic OST)',
    artist: 'Orange Synth Collective',
    album: 'Mechanical Symphony',
    genre: 'videos',
    year: 2023,
    duration: 653,
    coverArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80',
    albumArtUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80',
    audioUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    mediaType: 'video',
    mediaSource: 'built-in',
    playCount: 290,
    lyrics: [
      'Through copper corridors and gears of time',
      'Electronic frequencies align and climb'
    ]
  }
];
