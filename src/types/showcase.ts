export enum ShowcaseMode {
  Scrim = 'scrim',
  Panels = 'panels',
  Lightbox = 'lightbox',
}

export interface ModeConfig {
  mode: ShowcaseMode;
  component: any;
  props: any;
}




