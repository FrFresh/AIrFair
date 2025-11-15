import { Silhouette } from '../data/silhouettes';

type Props = {
  current: Silhouette;
};

export default function SneakerRoom({ current }: Props) {
  return (
    <div className="storyPanel">
      <div className="pe">{current.title} — {current.pe.peName}</div>
      <h3>{current.pe.athlete}</h3>
      <p>{current.pe.summary}</p>
    </div>
  );
}




