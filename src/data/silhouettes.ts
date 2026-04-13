import { ShowcaseMode } from '../types/showcase';

export type SilhouetteId = 'aj1' | 'aj3' | 'aj12';

export type PE = {
  athlete: string;
  peName: string;
  year: number;
  colorway: string;
  summary: string;
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
    pe: { athlete: 'Carmelo Anthony', peName: 'Melo PE', year: 2003, summary: '' },
    pes: [
      {
        athlete: 'Carmelo Anthony',
        peName: 'Melo PE',
        year: 2003,
        colorway: 'Black / Gold',
        summary: 'A bold PE celebrating Melo\'s arrival as the No. 3 overall pick. The gold accents echoed his Syracuse legacy and the scoring brilliance that would define his 19-year career.',
      },
      {
        athlete: 'Nate Robinson',
        peName: 'Nate Robinson PE',
        year: 2006,
        colorway: 'Black / Royal Blue',
        summary: 'Three-time Slam Dunk champion Nate Robinson received a custom AJ1 in SuperSonics colorway. At 5\'9", no one flew higher. The shoe matched his fearless, sky-high style perfectly.',
      },
      {
        athlete: 'Spike Lee',
        peName: 'Mars Blackmon PE',
        year: 1985,
        colorway: 'Black / Red',
        summary: 'Film director and sneaker prophet Spike Lee, as Mars Blackmon, starred alongside MJ in the original Nike ads. His PE is one of the most culturally significant pairs in Jordan history.',
      },
      {
        athlete: 'Jordan Clarkson',
        peName: 'JC PE',
        year: 2016,
        colorway: 'Lakers Gold / Purple',
        summary: 'Lakers guard Jordan Clarkson brought West Coast royalty energy with this purple and gold AJ1 PE — a nod to the franchise\'s championship bloodline.',
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
    pe: { athlete: 'Kobe Bryant', peName: 'Kobe PE', year: 2002, summary: '' },
    pes: [
      {
        athlete: 'Kobe Bryant',
        peName: 'Kobe PE',
        year: 2002,
        colorway: 'White / Gold / Purple',
        summary: 'Before Kobe had his own signature line, Jordan Brand laced him in this Lakers-colorway AJ3 PE. A rare artifact from the peak of his first three-peat run. One of the most coveted PEs ever created.',
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
    // Model file: drop /public/models/aj12-ray-allen.glb to enable 3D lightbox view
    modelPath: '/models/aj12-ray-allen.glb',
    pe: { athlete: 'Ray Allen', peName: 'Sugar Ray PE', year: 2008, summary: '' },
    pes: [
      {
        athlete: 'Ray Allen',
        peName: 'Sugar Ray PE — Celtics Championship',
        year: 2008,
        colorway: 'White / Celtics Green / Black',
        summary: 'Ray Allen signed with Jordan Brand early in his career and accumulated more PEs than nearly any player in the brand\'s history. This white and Celtics green AJ12 was worn during Boston\'s 2007–08 championship run — the season Allen, Paul Pierce, and Kevin Garnett formed the Big Three. Clean colorway. Cleaner jump shot. Banner season.',
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
