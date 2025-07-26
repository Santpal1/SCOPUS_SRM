import {  AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { default as dev1, default as dev2, default as dev3 } from "../assets/react.svg";
import logoImg from "../assets/srm_logo.png";
import styles from "../components/HomePage.module.css";
import axios from 'axios';
import { BookOpen, Globe2, Star, Clock } from 'lucide-react';

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
        name: "Niranjan",
        img: dev1,
        quote: "Turning code into impact, one line at a time.",
    },
    {
        name: "Piyush",
        img: dev2,
        quote: "Design is intelligence made visible.",
    },
    {
        name: "Santpal",
        img: dev3,
        quote: "Innovation distinguishes between a leader and a follower.",
    },
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
                    variants={fadeInUp}
                >
                    <motion.h1 variants={fadeInUp}>
                        Manage & Monitor Faculty Performance
                    </motion.h1>
                    <motion.p variants={fadeInUp}>
                        A comprehensive platform designed to streamline the management and
                        monitoring of faculty performance, ensuring academic excellence.
                    </motion.p>
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
                    <div className={styles.devContentWrapper}>
                        <motion.div
                            className={styles.devTitleWrapper}
                            initial={{ x: 0, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <h2 className={styles.verticalText}>Meet The Developers</h2>
                        </motion.div>

                        <motion.div className={styles.devCards} variants={stagger}>
                            {developers.map((dev, i) => (
                                <motion.div
                                    key={i}
                                    className={styles.devCard}
                                    variants={fadeInUp}
                                    whileHover={{
                                        scale: 1.07,
                                        boxShadow: "0 12px 40px rgba(0,97,168,0.22)",
                                        transition: { duration: 0.3 },
                                    }}
                                >
                                    <div className={styles.devImageWrapper}>
                                        <img
                                            src={dev.img}
                                            alt={dev.name}
                                            className={styles.devImage}
                                        />
                                        <div className={styles.devOverlay}>{dev.name}</div>
                                    </div>
                                    <div className={styles.devCardContent}>
                                        <div className={styles.devQuote}>"{dev.quote}"</div>
                                    </div>
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
                        <div>To know more</div>
                        <div>
                            <p>
                                Welcome to our platform! Here you can discover detailed analytics, collaborate with peers, and access resources to help you excel. Our commitment is to empower educators and foster a thriving academic community. Stay tuned for more updates and features coming soon.
                            </p>
                            <p>
                                For further inquiries, please reach out to our support team or check back as we expand our documentation and resources to serve you better.
                            </p>
                        </div>
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
                <div className={styles.footerLinksContainer}>
                    <div className={styles.footerLeft}>
                        <a href="#">© 2025 SRM SP. All rights reserved.</a>
                    </div>
                    <div className={styles.footerRight}>
                        <a
                            href="https://linkedin.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="LinkedIn"
                        >
                            <svg
                                width="22"
                                height="22"
                                fill="#0061a8"
                                style={{ verticalAlign: "middle" }}
                            >
                                <path d="M19 0h-16c-1.65 0-3 1.35-3 3v16c0 1.65 1.35 3 3 3h16c1.65 0 3-1.35 3-3v-16c0-1.65-1.35-3-3-3zm-11 19h-3v-9h3v9zm-1.5-10.29c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.29h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.76 1.36-1.56 2.8-1.56 3 0 3.56 1.97 3.56 4.53v4.8z" />
                            </svg>
                        </a>
                        <a href="#" style={{ marginLeft: "1.2rem", color: "#0061a8" }}>
                            Visit Us
                        </a>
                    </div>
                </div>
            </motion.footer>
        </div>
    );
};

export default FacultyLandingPage;
