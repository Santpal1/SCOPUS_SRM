import {  AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { default as dev1, default as dev2, default as dev3 } from "../assets/react.svg";
import logoImg from "../assets/srmist-logo.png";
import styles from "../components/HomePage.module.css";
import axios from 'axios';
import { BookOpen, Globe2, Star, Clock } from 'lucide-react';
import { FaChartBar, FaGlobe, FaBullseye, FaHandshake } from "react-icons/fa";


// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.18 } } };
const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.1 } },
};
const scaleIn = {
    hidden: { opacity: 0, scale: 0.7 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.7 } },
};

const slideVariant = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.6 } },
  exit: { x: -100, opacity: 0, transition: { duration: 0.5 } },
};

// Animated counter hook
const useCountUp = (end: number, duration: number = 1.5): number => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const increment = end / (duration * 60); // ~60 FPS
        let rafId: number;
        const update = () => {
            start += increment;
            if (start < end) {
                setCount(Math.floor(start));
                rafId = requestAnimationFrame(update);
            } else {
                setCount(end);
            }
        };
        rafId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(rafId);
    }, [end, duration]);
    return count;
};

// Developer Data
const developers = [
  {
    name: "Piyush",
    img: dev2,
    role: "Frontend & Backend",
    linkedin: "https://linkedin.com/in/-piyush-raj",
    github: "https://github.com/Piyush7R"
  },
  {
    name: "Santpal",
    img: dev3,
    role: "Frontend & Backend",
    linkedin: "https://linkedin.com/in/santpal",
    github: "https://github.com/Santpal1"
  }
];



const FacultyLandingPage = () => {
    const navigate = useNavigate();

    // Animated stats
    const departments = ("C.Tech");
    const faculties = useCountUp(200);
    const papers = useCountUp(4000);
    const [carouselStats, setCarouselStats] = useState<{ title: string, description: string }[]>([]);

    
    useEffect(() => {
  axios.get('http://localhost:5001/api/homepage-stats')
    .then(({ data }) => {
      const stats = [
        {
          title: "Total Citations",
          description: `${data.totalCitations.toLocaleString()} citations received by our faculty publications.`,
        },
        {
          title: "Top SDGs",
          description: data.topSDGs.map(s => `${s.sdg} (${s.count})`).join(', '),
        },
        {
          title: "Top Collaborating Countries",
          description: data.topCountries.map(c => `${c.country} (${c.count})`).join(', '),
        },
        {
          title: "Q1 Publications (Last 3 Years)",
          description: `${data.recentQ1Papers} Q1 papers published in the last 3 years.`,
        },
        {
          title: "Recent Publications (Last 1 Year)",
          description: `${data.recentPublications} total papers published in the last 1 year.`,
        },
        {
          title: "Top Journal",
          description: `${data.topJournal.publication_name} with ${data.topJournal.count} publications.`,
        },
      ];
      setCarouselStats(stats);
    })
    .catch(err => {
      console.error('Failed to fetch homepage stats:', err);
    });
}, []);

    // Carousel
   const [carouselIdx, setCarouselIdx] = useState(0);
   const carouselIdxRef = useRef(0);


const nextCarousel = () => {
  const newIdx = (carouselIdxRef.current + 1) % carouselStats.length;
  carouselIdxRef.current = newIdx;
  setCarouselIdx(newIdx);
};

const prevCarousel = () => {
  const newIdx = (carouselIdxRef.current - 1 + carouselStats.length) % carouselStats.length;
  carouselIdxRef.current = newIdx;
  setCarouselIdx(newIdx);
};


const intervalRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (carouselStats.length === 0) return;

 intervalRef.current = setInterval(() => {
  nextCarousel();
}, 3000);

return () => {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
};

}, [carouselStats.length]);


const pauseAutoScroll = () => {
  if (intervalRef.current) clearInterval(intervalRef.current);
};

const resumeAutoScroll = () => {
  if (intervalRef.current) clearInterval(intervalRef.current);
  intervalRef.current = setInterval(() => {
    nextCarousel();
  }, 3000); // match with your default speed
};



const statIcons = [
  <BookOpen size={28} key="icon-0" />,    // Total Citations
  <Globe2 size={28} key="icon-1" />,       // Top SDGs
  <Star size={28} key="icon-2" />,         // Top Collaborating Countries
  <Clock size={28} key="icon-3" />,        // Q1 Publications (Last 3 Years)
  <BookOpen size={28} key="icon-4" />,     // Recent Publications (reuse or swap)
  <Globe2 size={28} key="icon-5" />,       // Top Journal (reuse or swap)
];
    return (
        <div className={styles.fullPageContainer}>
            {/* NAVBAR */}
            <motion.div
                className={styles.navbar}
                initial={{ y: -70, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className={styles.logo}>
                    <img
                        src={logoImg}
                        alt="SRM Logo"
                        className={styles.navbarLogo}
                    />
                    <span>SRM SP</span>
                </div>

                <div className={styles.authButtons}>
                    <motion.button
                        className={styles.login}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate('/login')}
                    >
                        Login
                    </motion.button>
                    <motion.button
                        className={styles.signup}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate('/signup')}
                    >
                        SignUp
                    </motion.button>
                </div>
            </motion.div>

            <div className={styles.mainContent}>
                {/* HERO SECTION */}
<motion.section
    className={styles.heroSection}
    initial={false}
    whileInView="visible"
    viewport={{ once: true, amount: 0.6 }}
    variants={stagger}
>
    <motion.h1 variants={fadeInUp}>
        Faculty Research Analytics Dashboard
    </motion.h1>
    <motion.p variants={fadeInUp}>
        Comprehensive research performance tracking powered by Scopus and SciVal data. 
        Monitor publications, citations, collaborations, and impact metrics for academic excellence.
    </motion.p>
    
    {/* Add some key feature highlights */}
    <motion.div 
        className={styles.heroFeatures}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
    >
        <motion.div className={styles.featureItem} variants={fadeInUp}>
            <BookOpen size={24} />
            <span>Publication Tracking</span>
        </motion.div>
        <motion.div className={styles.featureItem} variants={fadeInUp}>
            <Star size={24} />
            <span>Citation Analysis</span>
        </motion.div>
        <motion.div className={styles.featureItem} variants={fadeInUp}>
            <Globe2 size={24} />
            <span>Global Collaboration</span>
        </motion.div>
        <motion.div className={styles.featureItem} variants={fadeInUp}>
            <Clock size={24} />
            <span>Real-time Metrics</span>
        </motion.div>
    </motion.div>
</motion.section>
                
                {/* STATS SECTION (unchanged, always visible) */}
                <motion.section
                    className={styles.statsSection}
                    initial={false}

                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    variants={stagger}
                >
                    <motion.div variants={fadeInUp}>
                        <span>{departments}</span>
                        Department
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                        <span>{faculties}+</span>
                        Faculties
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                        <span>{papers}+</span>
                        Research Papers
                    </motion.div>
                </motion.section>

                {/* CAROUSEL SECTION */}
{carouselStats.length > 0 && (
 <motion.section
  className={styles.carousel}
  initial={false}
  whileInView="visible"
  viewport={{ once: true, amount: 0.3 }}
  variants={fadeIn}
  onMouseEnter={pauseAutoScroll}
  onMouseLeave={resumeAutoScroll}
>

    <motion.button
      className={styles.carouselBtn}
      whileHover={{ scale: 1.1, backgroundColor: "#5fd0f3", color: "#ffe066" }}
      whileTap={{ scale: 0.95 }}
      onClick={prevCarousel}
    >
      ← Previous
    </motion.button>

    <div className={styles.carouselContent}>
      <AnimatePresence mode="wait">
  <motion.div
    key={carouselIdx} // triggers exit/enter on index change
    className={styles.carouselQuoteBox}
    variants={slideVariant}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    <div className={styles.leftAccent}></div>
    <div className={styles.carouselQuote}>
      <div className={styles.statIcon}>
        {statIcons[carouselIdx]}
      </div>
      <h3>{carouselStats[carouselIdx].title}</h3>
      <hr className={styles.quoteDivider} />
      <p>{carouselStats[carouselIdx].description}</p>
    </div>
  </motion.div>
</AnimatePresence>

    </div>

    <motion.button
      className={styles.carouselBtn}
      whileHover={{ scale: 1.1, backgroundColor: "#5fd0f3", color: "#ffe066" }}
      whileTap={{ scale: 0.95 }}
      onClick={nextCarousel}
    >
      Next →
    </motion.button>
  </motion.section>
)}

{/* DEVELOPERS SECTION */}
<motion.section
  className={styles.developers}
  initial={false}
  whileInView="visible"
  viewport={{ once: true, amount: 0.3 }}
  variants={fadeIn}
>
  {/* Animated background elements */}
  <div className={styles.backgroundElements}>
    <div className={styles.floatingCircle1}></div>
    <div className={styles.floatingCircle2}></div>
    <div className={styles.floatingCircle3}></div>
    <div className={styles.gridPattern}></div>
  </div>

  <div className={styles.devContentWrapper}>
    <motion.div
      className={styles.devTitleWrapper}
      initial={{ y: 50, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className={styles.titleContainer}>
        <motion.div 
          className={styles.titleAccent}
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          transition={{ duration: 1, delay: 0.3 }}
        ></motion.div>
        <h2 className={styles.verticalText}>Meet The Developers</h2>

      </div>
    </motion.div>

    <motion.div className={styles.devCards} variants={stagger}>
      {developers.map((dev, i) => (
        <motion.div
          key={i}
          className={styles.devCard}
          variants={fadeInUp}
          whileHover={{ 
            scale: 1.08, 
            rotateY: 5,
            transition: { duration: 0.3 }
          }}
          initial={{ rotateX: 0, rotateY: 0 }}
        >
          {/* Card glow effect */}
          <div className={styles.cardGlow}></div>
          
          {/* Floating particles */}
          <div className={styles.particles}>
            <div className={styles.particle1}></div>
            <div className={styles.particle2}></div>
            <div className={styles.particle3}></div>
          </div>

          <div className={styles.devImageWrapper}>
            <motion.div 
              className={styles.imageContainer}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <div className={styles.imageBorder}>
                <img
                  src={dev.img}
                  alt={dev.name}
                  className={styles.devImage}
                />
              </div>
            </motion.div>

            {/* Status indicator */}
            <motion.div 
              className={styles.statusIndicator}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            ></motion.div>
          </div>

          <motion.div 
            className={styles.devCardContent}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className={styles.nameContainer}>
              <motion.div 
                className={styles.devName}
                whileHover={{ scale: 1.05 }}
              >
                {dev.name}
              </motion.div>
              <motion.div 
                className={styles.nameUnderline}
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 0.6, delay: 0.8 + i * 0.1 }}
              ></motion.div>
            </div>
            
            <motion.div 
              className={styles.devRole}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
            >
              <span className={styles.roleIcon}>⚡</span>
              {dev.role}
            </motion.div>

            {/* Skill badges */}
            <motion.div 
              className={styles.skillBadges}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 + i * 0.1 }}
            >
              <span className={styles.skillBadge}>React</span>
              <span className={styles.skillBadge}>Node.js</span>
              <span className={styles.skillBadge}>TypeScript</span>
            </motion.div>

            {/* Social Icons */}
            <motion.div 
              className={styles.socialIcons}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 + i * 0.1 }}
            >
              <motion.a
                href={dev.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${dev.name} LinkedIn`}
                whileHover={{ scale: 1.3, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
              >
                <i className="fab fa-linkedin"></i>
              </motion.a>
              <motion.a
                href={dev.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${dev.name} GitHub`}
                whileHover={{ scale: 1.3, rotate: -15 }}
                whileTap={{ scale: 0.9 }}
              >
                <i className="fab fa-github"></i>
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Hover effect overlay */}
          <div className={styles.hoverOverlay}></div>
        </motion.div>
      ))}
    </motion.div>
  </div>
</motion.section>

                {/* DESCRIPTION SECTION */}
<motion.section
    className={styles.description}
    initial={false}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.7 }}
>
    <div className={styles.footerContent}>
        <motion.div 
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
        >
            Discover Research Excellence
        </motion.div>
        
        <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
        >
            <motion.p variants={fadeInUp}>
                Our platform leverages Scopus and SciVal databases to provide comprehensive research analytics. 
                Track publication trends, analyze citation patterns, identify collaboration opportunities, and measure 
                research impact across multiple dimensions including SDG contributions and global partnerships.
            </motion.p>
            <motion.p variants={fadeInUp}>
                Stay ahead in academic research with real-time metrics, competitive benchmarking, and detailed 
                performance insights that help drive strategic decisions for faculty development and institutional growth.
            </motion.p>
        </motion.div>
        
        {/* Add key benefits section */}
        <motion.div 
  className={styles.benefitsGrid}
  variants={stagger}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
>
  <motion.div className={styles.benefitCard} variants={fadeInUp}>
    <div className={styles.benefitIcon}><FaChartBar size={32} color="#0077cc" /></div>
    <h4>Advanced Analytics</h4>
    <p>Deep insights into research performance with customizable dashboards and reports</p>
  </motion.div>

  <motion.div className={styles.benefitCard} variants={fadeInUp}>
    <div className={styles.benefitIcon}><FaBullseye size={32} color="#0077cc" /></div>
    <h4>SDG Mapping</h4>
    <p>Track contributions to UN Sustainable Development Goals through research impact</p>
  </motion.div>

  <motion.div className={styles.benefitCard} variants={fadeInUp}>
    <div className={styles.benefitIcon}><FaHandshake size={32} color="#0077cc" /></div>
    <h4>Collaboration Networks</h4>
    <p>Visualize and expand research partnerships across institutions and countries</p>
  </motion.div>
</motion.div>

    </div>
</motion.section>
            </div>

            {/* FOOTER SECTION */}
            <motion.footer
  className={styles.footer}
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.7 }}
>
  <div className={styles.centeredFooterText}>
    © 2025 SRM SP. All rights reserved.
  </div>
</motion.footer>


        </div>
    );
};

export default FacultyLandingPage;
