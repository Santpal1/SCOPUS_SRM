import { Search } from "lucide-react";
import styles from "../components/HeroSection.module.css";

const HeroSection = () => {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContainer}>
        <nav className={styles.navbar}>
          <h1 className={styles.logo}>ResearchVault</h1>
          <div className={styles.navLinks}>
            <a href="#" className={styles.navLink}>
              Resources
            </a>
            <a href="#" className={styles.navLink}>
              Pricing
            </a>
          </div>
        </nav>

        {/* Content */}
        <div className={styles.heroContent}>
          {/* Left Side */}
          <div className={styles.textContainer}>
            <span className={styles.researchBadge}>
              Scopus-Indexed Research Hub
            </span>
            <h3 className={styles.heroTitle}>
              Uncover SRM's Scopus-Indexed Insights
            </h3>
            <p className={styles.heroText}>
              Dive into an extensive collection of scholarly publications,
              discover pioneering research from SRM's distinguished faculty.
            </p>
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search"
                className={styles.searchInput}
              />
              <Search className={styles.searchIcon} />
            </div>
          </div>

          {/* Right Side (Image Placeholder) */}
          <div className={styles.imagePlaceholder}></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;