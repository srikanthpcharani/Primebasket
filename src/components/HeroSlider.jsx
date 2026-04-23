// src/components/HeroSlider.jsx
import { useState, useEffect, useRef } from "react";
import { useT } from "../i18n/translations";

export default function HeroSlider({ language = "en" }) {
  const t = useT(language);
  
  const slides = [
    {
      title: t.hero[0].title,
      desc: t.hero[0].desc,
      img: "assets/fruits.png",
      alt: "Fresh fruits pile",
    },
    {
      title: t.hero[1].title,
      desc: t.hero[1].desc,
      img: "assets/fresh&clean.png",
      alt: "Organic vegetables arrangement",
    },
    {
      title: t.hero[2].title,
      desc: t.hero[2].desc,
      img: "assets/tropical-fruits.png",
      alt: "Tropical fruits pile",
    },
    {
      title: t.hero[3].title,
      desc: t.hero[3].desc,
      img: "assets/dairy-needs.png",
      alt: "Eggs",
    },
  ];

  const [current, setCurrent] = useState(0);
  const autoSlideRef = useRef(null);

  const startAutoSlide = () => {
    autoSlideRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
  };

  const stopAutoSlide = () => clearInterval(autoSlideRef.current);

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, [slides.length]);

  const goToSlide = (index) => {
    stopAutoSlide();
    setCurrent(index);
    startAutoSlide();
  };

  return (
    <div
      className="slider"
      onMouseEnter={stopAutoSlide}
      onMouseLeave={startAutoSlide}
    >
      {slides.map((slide, i) => (
        <div key={i} className={`slide${i === current ? " active" : ""}`}>
          <div className="content">
            <h1>
              {slide.title.split("\n").map((line, j) => (
                <span key={j}>{line}{j === 0 && <br />}</span>
              ))}
            </h1>
            <p>{slide.desc}</p>
            <form className="subscribe" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder={t.home.emailPlaceholder} required />
              <button type="submit">{t.home.subscribe}</button>
            </form>
          </div>
          <div className="image-container">
            <img src={slide.img} alt={slide.alt} />
          </div>
        </div>
      ))}

      <div className="dots">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`dot${i === current ? " active" : ""}`}
            onClick={() => goToSlide(i)}
          ></div>
        ))}
      </div>
    </div>
  );
}
