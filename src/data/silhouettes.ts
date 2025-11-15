import { ShowcaseMode } from '../types/showcase';

export type SilhouetteId = 'aj1' | 'aj3' | 'aj12';

export type Silhouette = {
  id: SilhouetteId;
  title: string;
  pe: { athlete: string; peName: string; year?: number; summary: string };
  pedestalColor?: string;
  modelPath?: string; // future glb
  showcaseMode: ShowcaseMode;
  videoPath?: string; // for scrim mode
  description?: string; // Additional context
  reference?: string; // Source URL
};

/**
 * Array of Jordan Silhouettes and associated Player Exclusive (PE) moments.
 * Video assets are external URLs - CORS must be configured on the video server.
 */
export const SILHOUETTES: Silhouette[] = [
  {
    id: 'aj1',
    title: 'Air Jordan 1',
    pe: { 
      athlete: 'Carmelo Anthony', 
      peName: 'Melo PE', 
      year: 2003,
      summary: 'A bold player exclusive echoing Melo\'s scoring flair and early-era swagger.' 
    },
    pedestalColor: '#1b1b1b',
    showcaseMode: ShowcaseMode.Scrim,
    videoPath: 'https://sample-videos.com/video123/mp4/720/carmelo-anthony-aj1.mp4',
    description: 'Player exclusive celebrating Carmelo Anthony\'s scoring prowess and early 2000s style.',
  },
  {
    id: 'aj3',
    title: 'Air Jordan 3',
    pe: { 
      athlete: 'Kobe Bryant', 
      peName: 'Kobe PE', 
      year: 2008,
      summary: 'Tinker Hatfield\'s first Jordan design, featuring the famous elephant print, with player exclusives for elite athletes.' 
    },
    pedestalColor: '#171717',
    showcaseMode: ShowcaseMode.Panels,
    videoPath: 'https://sample-videos.com/video123/mp4/720/kobe-aj3.mp4',
    description: 'Air Jordan 3 Player Exclusives, featuring iconic elephant print and signature Jumpman branding.',
    reference: 'https://www.sneakerfiles.com/air-jordan-3-pe-player-exclusive/',
  },
  {
    id: 'aj12',
    title: 'Air Jordan 12',
    pe: { 
      athlete: 'Ray Allen', 
      peName: 'Sugar Ray PE', 
      year: 2008,
      summary: 'Classic white/green elegance—precision shooting meets championship poise. One of multiple AJ12 PEs including Gary Payton, Carmelo Anthony, and Mike Bibby.' 
    },
    pedestalColor: '#151515',
    showcaseMode: ShowcaseMode.Lightbox,
    modelPath: '/models/aj12-ray-allen.glb',
    videoPath: 'https://sample-videos.com/video123/mp4/720/ray-allen-aj12.mp4',
    description: 'Air Jordan 12 Player Exclusives worn by Hall of Fame shooters and elite athletes throughout the NBA.',
    reference: 'https://www.sneakerfiles.com/air-jordan-12-pe-player-exclusive/',
  }
];
