"use client";

type Props = {
  image: string;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  imageClass?: string;
};

export function HomeFeatureCard({
  image,
  title,
  description,
  buttonText,
  onClick,
  imageClass,
}: Props) {
  return (
    <article className="card home-feature-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className={imageClass} />
      <div className="card-content">
        <h2>{title}</h2>
        <p>{description}</p>
        <button type="button" className="button button-primary" onClick={onClick}>
          {buttonText}
        </button>
      </div>
    </article>
  );
}
