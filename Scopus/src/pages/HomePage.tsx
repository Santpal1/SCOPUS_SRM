import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import faculty1 from "../assets/faculty1.png";
import faculty2 from "../assets/faculty2.png";
import faculty3 from "../assets/faculty3.png";
import carouselImg from "../assets/image-1.avif";
import { default as dev1, default as dev2, default as dev3 } from "../assets/react.svg";
import logoImg from "../assets/srm_logo.png";
import styles from "../components/HomePage.module.css";


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

// Quotes for the carousel
const carouselQuotes = [
    { quote: "Empowering educators, inspiring excellence.", image: carouselImg },
    { quote: "Great teachers ignite the future.", image: faculty1 },
    { quote: "Innovation in education starts here.", image: faculty2 },
    { quote: "Together, we achieve academic brilliance.", image: faculty3 },
];

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
    const users = useCountUp(200);
    const papers = useCountUp(4000);


    // Carousel
    const [carouselIdx, setCarouselIdx] = useState(0);
    const nextCarousel = () =>
        setCarouselIdx((carouselIdx + 1) % carouselQuotes.length);
    const prevCarousel = () =>
        setCarouselIdx(
            (carouselIdx - 1 + carouselQuotes.length) % carouselQuotes.length
        );

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
                    initial="hidden"
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

                {/* Faculty Images - moved down to avoid overlap */}
                <section className={styles.facultyImagesSection}>
                    <div className={styles.facultyImages}>
                        <motion.img
                            src={faculty1}
                            alt="Faculty 1"
                            className={styles.facultyImg}
                            variants={scaleIn}
                            initial="hidden"
                            whileInView="visible"
                        />
                        <motion.img
                            src={faculty2}
                            alt="Faculty 2"
                            className={styles.facultyImg}
                            variants={scaleIn}
                            initial="hidden"
                            whileInView="visible"
                        />
                        <motion.img
                            src={faculty3}
                            alt="Faculty 3"
                            className={styles.facultyImg}
                            variants={scaleIn}
                            initial="hidden"
                            whileInView="visible"
                        />
                    </div>
                </section>

                {/* STATS SECTION (unchanged, always visible) */}
                <motion.section
                    className={styles.statsSection}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    variants={stagger}
                >
                    <motion.div variants={fadeInUp}>
                        <span>{departments}</span>
                        Departments
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                        <span>{faculties}+</span>
                        Faculties
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                        <span>{users}+</span>
                        Total Users
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                        <span>{papers}+</span>
                        Research Papers
                    </motion.div>
                </motion.section>

                {/* CAROUSEL SECTION */}
                <motion.section
                    className={styles.carousel}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeIn}
                    style={{ position: "relative" }}
                >
                    <motion.button
                        className={styles.carouselBtn}
                        whileHover={{
                            scale: 1.1,
                            backgroundColor: "#5fd0f3",
                            color: "#ffe066",
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={prevCarousel}
                    >
                        ← Previous
                    </motion.button>
                    <div className={styles.carouselContent}>
                        <img
                            src={carouselQuotes[carouselIdx].image}
                            alt="Carousel"
                            className={styles.carouselImage}
                        />
                        <div className={styles.carouselQuote}>
                            {carouselQuotes[carouselIdx].quote}
                        </div>
                    </div>
                    <motion.button
                        className={styles.carouselBtn}
                        whileHover={{
                            scale: 1.1,
                            backgroundColor: "#5fd0f3",
                            color: "#ffe066",
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={nextCarousel}
                    >
                        Next →
                    </motion.button>
                    {/* <div className={styles.carouselIndicators}>
                        {carouselQuotes.map((_, idx) => (
                            <span
                                key={idx}
                                className={carouselIdx === idx ? "active" : ""}
                                onClick={() => setCarouselIdx(idx)}
                            />
                        ))}
                    </div> */}
                </motion.section>

                {/* DEVELOPERS SECTION */}
                <motion.section
                    className={styles.developers}
                    initial="hidden"
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
                    initial={{ opacity: 0, y: 60 }}
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
