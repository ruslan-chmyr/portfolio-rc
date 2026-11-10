import portraitSrc from '../../../assets/me/portrait.png'

export function AboutPortrait() {
  return (
    <figure className="about-portrait">
      <div className="about-portrait__frame">
        <img
          className="about-portrait__image"
          src={portraitSrc}
          alt="Ruslan Chmyr"
          width={400}
          height={500}
          decoding="async"
          draggable={false}
        />
      </div>
      <figcaption className="visually-hidden">Portrait of Ruslan Chmyr</figcaption>
    </figure>
  )
}
