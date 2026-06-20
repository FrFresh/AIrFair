import { ShowcaseMode } from '../types/showcase';

export type SilhouetteId = 'aj1' | 'aj3' | 'aj12';

export type PE = {
  athlete: string;
  /** Team / affiliation shown next to the athlete name, e.g. "Los Angeles Lakers". */
  team: string;
  /** Tracked date headline — names the moment, e.g. "2017 · The Ten". */
  moment: string;
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
  /** True when the GLTF holds a single shoe that should be mirrored into a pair. */
  singleShoeModel?: boolean;
  /** True when the GLTF ships as a pair but only one shoe should be displayed. */
  singleFromPair?: boolean;
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
    singleFromPair: true,
    pe: { athlete: 'Virgil Abloh', peName: 'The Ten · Off-White™', year: 2017, summary: '' },
    pes: [
      {
        athlete: 'Virgil Abloh',
        team: 'Off-White™',
        moment: '2017 · The Ten',
        peName: 'The Ten · Off-White™ AJ1',
        year: 2017,
        colorway: 'White / Black / Varsity Red',
        summary: 'Virgil Abloh never laced the Air Jordan 1 on a court — he took it apart on a workbench. For 2017\'s "The Ten," a ten-shoe Nike collaboration, he chose the Chicago AJ1 as his anchor and deconstructed it: exposed foam at the collar, an oversized off-center Swoosh, stripped stitching, "AIR" set on the midsole, "SHOELACES" printed on the laces, and a medial side stamped "Off-White for Nike … Beaverton, Oregon, USA © 1985." Finished with his signature zip tie, the $190 release blurred product and art — and lit the fuse on the entire collaboration era that followed.',
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
    pe: { athlete: 'Kobe Bryant', peName: 'Kobe Lakers PE', year: 2003, summary: '' },
    pes: [
      {
        athlete: 'Kobe Bryant',
        team: 'Los Angeles Lakers',
        moment: '2002–03 · Sneaker Free Agency',
        peName: 'Kobe Lakers PE',
        year: 2003,
        colorway: 'White / Purple / Gold',
        summary: 'In the summer of 2002 Kobe Bryant walked away from adidas and spent the entire 2002–03 season as a rare sneaker free agent — no contract, free to lace whatever he wanted. He chose the Air Jordan 3. Jordan Brand built him a Lakers PE in white tumbled leather with purple-and-gold elephant print, and Kobe made it legend: 44 points the night he debuted them, then a 52-point double-overtime eruption against Houston capped by a baseline dunk over Yao Ming. He signed with Nike soon after — but for one untethered season, the Mamba flew in Tinker Hatfield\'s 3s.',
        playerImage: '/images/athletes/kobe-aj3.png',
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
    pe: { athlete: 'Carmelo Anthony', peName: 'Melo PE', year: 2004, summary: '' },
    pes: [
      {
        athlete: 'Carmelo Anthony',
        team: 'Denver Nuggets',
        moment: '2003–04 · Nuggets Rookie PE',
        peName: 'Melo PE',
        year: 2004,
        colorway: 'White / University Blue',
        summary: 'Carmelo Anthony signed with Jordan Brand as a rookie in 2003 — handed wider latitude than any Air Jordan ambassador before him, which fueled a near-endless rotation of personal Air Jordan 12 PEs. The signature pair was this one: a white-and-University-Blue 12 in his Denver Nuggets colors with "Melo" stitched at the heel, laced through his rookie season in the Mile High City. It made him a cornerstone of the brand\'s post-MJ generation almost from the day he arrived.',
        playerImage: '/images/athletes/carmelo-aj12.jpg',
      },
    ],
  },
];
