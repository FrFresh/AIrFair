import { ShowcaseMode } from '../types/showcase';

export type SilhouetteId = 'aj1' | 'aj3' | 'aj12';

export type PE = {
  athlete: string;
  peName: string;
  year: number;
  colorway: string;
  summary: string;
  /** Path under /public, e.g. "/images/athletes/carmelo-aj1.jpg" */
  playerImage?: string;
  /** True for designer collabs (e.g. Virgil) — shows a "Designer Edition" badge. */
  designer?: boolean;
};

export type Silhouette = {
  id: SilhouetteId;
  title: string;
  subtitle: string;
  year: number;
  description: string;
  pedestalColor: string;
  accentColor: string;
  shoeColor: string;
  pes: PE[];
  modelPath?: string;
  showcaseMode: ShowcaseMode;
  videoPath?: string;
  reference?: string;
  /** Path under /public, e.g. "/images/shoes/aj1.png" — transparent PNG works best */
  shoeImage?: string;
  // legacy compat
  pe: { athlete: string; peName: string; year?: number; summary: string };
};

export const SILHOUETTES: Silhouette[] = [
  {
    id: 'aj1',
    title: 'Air Jordan 1',
    subtitle: 'The Original',
    year: 1985,
    description: 'The shoe that started it all. Banned by the NBA, fined $5,000 per game, worn by a legend. No sneaker carries more cultural weight than the AJ1.',
    pedestalColor: '#1a0808',
    accentColor: '#D31F30',
    shoeColor: '#D31F30',
    showcaseMode: ShowcaseMode.Scrim,
    modelPath: '/models/aj1/scene.gltf',
    pe: { athlete: 'Virgil Abloh', peName: 'The Ten · Off-White™', year: 2017, summary: '' },
    pes: [
      {
        athlete: 'Virgil Abloh',
        peName: 'The Ten · Off-White™ AJ1',
        year: 2017,
        colorway: 'White / Black / Cone Red',
        summary: 'The only designer ever given his own ongoing collection with Nike. For 2017\'s "The Ten," Virgil Abloh deconstructed the Air Jordan 1 down to its bones — exposed foam, a raw Swoosh stitched in relief, the signature Off-White™ zip tie, helvetica "AIR," and hand-scrawled text. It blurred the line between product and art, turned the sneaker into a cultural object, and ignited the entire collaboration era that followed. No single release changed the game for sneakers more.',
        playerImage: '/images/athletes/virgil-aj1.jpg',
        designer: true,
      },
    ],
  },
  {
    id: 'aj3',
    title: 'Air Jordan 3',
    subtitle: 'The Elephant',
    year: 1988,
    description: 'Tinker Hatfield\'s first Jordan design introduced the iconic elephant print and the first visible Air unit. MJ nearly left Nike — until he saw this shoe.',
    pedestalColor: '#111111',
    accentColor: '#aaaaaa',
    shoeColor: '#e8e4de',
    showcaseMode: ShowcaseMode.Panels,
    modelPath: '/models/aj3/scene.gltf',
    pe: { athlete: 'Kobe Bryant', peName: 'Kobe PE', year: 2002, summary: '' },
    pes: [
      {
        athlete: 'Kobe Bryant',
        peName: 'Kobe PE',
        year: 2002,
        colorway: 'White / Gold / Purple',
        summary: 'Before Kobe had his own signature line, Jordan Brand laced him in this Lakers-colorway AJ3 PE. A rare artifact from the peak of his first three-peat run. One of the most coveted PEs ever created.',
        playerImage: '/images/athletes/kobe-aj3.png',
      },
      {
        athlete: 'Quentin Richardson',
        peName: 'Q-Rich PE',
        year: 2001,
        colorway: 'Black / White / Cement',
        summary: 'Phoenix Suns sharpshooter Q-Rich wore this clean cement PE during his breakout seasons. Understated and elite — just like his off-screen reputation around the league.',
      },
      {
        athlete: 'Jason Williams',
        peName: 'White Chocolate PE',
        year: 2002,
        colorway: 'Sacramento Purple / Black',
        summary: 'Point guard Jason "White Chocolate" Williams ran the most entertaining show in Sacramento history. His AJ3 PE in Kings purple captures an era of no-look passes and full-arena mayhem.',
      },
      {
        athlete: 'Dwyane Wade',
        peName: 'Flash PE',
        year: 2004,
        colorway: 'Miami Red / Black / White',
        summary: 'Before D-Wade had his own line, Jordan Brand outfitted the rookie in this Heat-themed AJ3 PE. A glimpse of the Flash before the whole world knew his name.',
      },
      {
        athlete: 'Russell Westbrook',
        peName: 'Westbrook OKC PE',
        year: 2012,
        colorway: 'Thunder Blue / Orange / White',
        summary: 'A Jordan Brand cornerstone, Westbrook received this AJ3 PE in Oklahoma City\'s signature blue and orange during one of the most explosive offensive seasons in Thunder history. Russ in full flight — unstoppable.',
        playerImage: '/images/athletes/westbrook-aj3.jpg',
      },
    ],
  },
  {
    id: 'aj12',
    title: 'Air Jordan 12',
    subtitle: 'The Flu Game',
    year: 1996,
    description: 'Inspired by the Rising Sun of Japan, the AJ12 became legend when MJ scored 38 points in Game 5 of the 1997 Finals while visibly ill. Ray Allen — one of Jordan Brand\'s most decorated PE recipients with 15+ exclusives across an 18-year career — wore the 12 in both Seattle Sonics and Boston Celtics colors.',
    pedestalColor: '#091409',
    accentColor: '#006534',
    shoeColor: '#f0f0f0',
    showcaseMode: ShowcaseMode.Lightbox,
    modelPath: '/models/aj12/scene.gltf',
    pe: { athlete: 'Ray Allen', peName: 'Sugar Ray PE', year: 2008, summary: '' },
    pes: [
      {
        athlete: 'Ray Allen',
        peName: 'Sugar Ray PE — Celtics Championship',
        year: 2008,
        colorway: 'White / Celtics Green / Black',
        summary: 'Ray Allen signed with Jordan Brand early in his career and accumulated more PEs than nearly any player in the brand\'s history. This white and Celtics green AJ12 was worn during Boston\'s 2007–08 championship run — the season Allen, Paul Pierce, and Kevin Garnett formed the Big Three. Clean colorway. Cleaner jump shot. Banner season.',
        playerImage: '/images/athletes/ray-allen-aj12.jpg',
      },
      {
        athlete: 'Ray Allen',
        peName: 'Sugar Ray PE — Sonics Alternate',
        year: 2003,
        colorway: 'Green / Gold / White',
        summary: 'Before Boston, Ray Allen was the face of the Seattle SuperSonics franchise. This AJ12 PE in Sonics alternate colors with orange-gold accents captures the era when Allen averaged 23+ points a night in the Pacific Northwest — and was quietly building one of the deepest Jordan Brand PE collections in NBA history.',
      },
      {
        athlete: 'Gary Payton',
        peName: 'The Glove PE',
        year: 2002,
        colorway: 'Black / Sonics Green / White',
        summary: 'The best defensive point guard of his generation. Gary Payton\'s AJ12 PE in SuperSonics black and green is as relentless and locked-in as his on-ball defense. Nine-time All-Defensive First Team. One shoe to match the legacy.',
      },
      {
        athlete: 'Carmelo Anthony',
        peName: 'Melo PE',
        year: 2004,
        colorway: 'Black / Gold / White',
        summary: 'Fresh off a historic rookie year in Denver, Melo received this sleek black and gold AJ12 PE in his second season. Already a cornerstone of the Jordan Brand family before turning 21 — the gold accents nodding to his Olympic and Syracuse bloodlines.',
        playerImage: '/images/athletes/carmelo-aj12.jpg',
      },
      {
        athlete: 'Mike Bibby',
        peName: 'Bibby PE',
        year: 2002,
        colorway: 'Sacramento Purple / White / Black',
        summary: 'Mike Bibby orchestrated one of the most entertaining Kings dynasties from the point. Sacramento\'s 2001–02 team came within a controversial Game 6 of the NBA Finals. His royal purple AJ12 PE is one of the rarest and most sought-after exclusives of that era.',
      },
    ],
  },
];
