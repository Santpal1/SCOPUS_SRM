import React, { useState, useEffect } from "react";
import styles from "../components/AdminHomepage.module.css";
import { Search } from "lucide-react";
import logoimage from "../assets/srm_logo.jpeg";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AdminHomepage: React.FC = () => {
  const [researchCount, setResearchCount] = useState(0);
  const [conferenceCount, setConferenceCount] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    let researchInterval = setInterval(() => {
      setResearchCount((prev) => (prev < 1500 ? prev + 10 : 1500));
    }, 50);

    let conferenceInterval = setInterval(() => {
      setConferenceCount((prev) => (prev < 300 ? prev + 2 : 300));
    }, 50);

    return () => {
      clearInterval(researchInterval);
      clearInterval(conferenceInterval);
    };
  }, []);

  const carouselItems = ["Lorem Ipsum 1", "Lorem Ipsum 2", "Lorem Ipsum 3"];

  const prevSlide = () => {
    setCarouselIndex((prev) =>
      prev === 0 ? carouselItems.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setCarouselIndex((prev) =>
      prev === carouselItems.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section className={styles.fullPageContainer}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logocontainer}>
          <img src={logoimage} alt="SRM_LOGO" className={styles.logoimage} />
          <h1 className={styles.logo}>SRM SP</h1>
        </div>
        <div className={styles.navLinks}>
          <button className={styles.loginButton}>Login</button>
        </div>
      </nav>

      {/* Title, Subtitle & Search Bar */}
      <div className={styles.headerSection}>
        <div className={styles.textContainer}>
          <h3 className={styles.heroTitle}>
            Manage & Monitor Faculty Performance
          </h3>
          <p className={styles.heroText}>
            Access reports, analyze faculty data, and optimize university
            operations efficiently.
          </p>
        </div>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search Records"
            className={styles.searchInput}
          />
          <Search className={styles.searchIcon} />
        </div>
      </div>

      {/* Empty Carousel */}
      <div className={styles.carouselContainer}>
        <button className={styles.carouselButton} onClick={prevSlide}>
          <ChevronLeft />
        </button>
        <div className={styles.carouselItem}>
          {carouselItems[carouselIndex]}
          <img src="#" alt="#" className={styles.imagePlaceholder}></img>
        </div>
        <button className={styles.carouselButton} onClick={nextSlide}>
          <ChevronRight />
        </button>
      </div>
      <div className={styles.carouselDots}>
        {carouselItems.map((_, index) => (
          <span
            key={index}
            className={`${styles.dot} ${
              index === carouselIndex ? styles.activeDot : ""
            }`}
            onClick={() => setCarouselIndex(index)}
          ></span>
        ))}
      </div>

      {/* Statistics Carousel */}
      <div className={styles.statsCarousel}>
        <div className={styles.statItem}>
          <h2 className={styles.statNumber}>{researchCount}+</h2>
          <p className={styles.statLabel}>Research Papers</p>
        </div>
        <div className={styles.statItem}>
          <h2 className={styles.statNumber}>{conferenceCount}+</h2>
          <p className={styles.statLabel}>Conferences Attended</p>
        </div>
        <div className={styles.statItem}>
          <h2 className={styles.statNumber}>500+</h2>
          <p className={styles.statLabel}>Workshops Conducted</p>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>
          Contact Us: xyz@srmist.edu.in |{" "}
          <a
            href="https://www.srmist.edu.in"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.srmist.edu.in
          </a>
        </p>
      </footer>
    </section>
  );
};

export default AdminHomepage;
