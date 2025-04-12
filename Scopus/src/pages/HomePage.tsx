import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoimage from "../assets/srm_logo.png";
import styles from "../components/AdminHomepage.module.css";

type Faculty = {
    name: string;
    scopusId: string;
    documents: number;
};

const AdminHomepage: React.FC = () => {
    const navigate = useNavigate();
    const [researchCount, setResearchCount] = useState(0);
    const [facultyCount, setFacultyCount] = useState(0);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [facultyData, setFacultyData] = useState<Faculty[]>([]);
    const [animationClass, setAnimationClass] = useState("");
    const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetch("http://localhost:5000/api/faculty")
            .then((response) => response.json())
            .then((data: any[]) => {
                const transformedData = data.map((faculty) => ({
                    name: faculty.name,
                    scopusId: faculty.scopus_id || "N/A",
                    documents: faculty.docs_count ?? 0,
                }));
                setFacultyData(transformedData);
            })
            .catch((error) => console.error("❌ Error fetching faculty data:", error));
    }, []);

    useEffect(() => {
        let researchInterval = setInterval(() => {
            setResearchCount((prev) => (prev < 3500 ? prev + 10 : 3500));
        }, 25);

        let facultyInterval = setInterval(() => {
            setFacultyCount((prev) => (prev < 200 ? prev + 1 : 200));
        }, 45);

        return () => {
            clearInterval(researchInterval);
            clearInterval(facultyInterval);
        };
    }, []);

    const startAutoSlide = () => {
        if (autoSlideRef.current) clearInterval(autoSlideRef.current);
        autoSlideRef.current = setInterval(() => {
            handleCarouselChange("next", false);
        }, 3000);
    };

    const handleCarouselChange = (direction: "prev" | "next", resetTimer: boolean = true) => {
        setAnimationClass(direction === "next" ? styles.slideRight : styles.slideLeft);
        setTimeout(() => {
            setCarouselIndex((prev) =>
                direction === "next"
                    ? (prev + 1) % facultyData.length
                    : (prev === 0 ? facultyData.length - 1 : prev - 1)
            );
        }, 100);

        if (resetTimer) {
            startAutoSlide();
        }
    };

    useEffect(() => {
        startAutoSlide();
        return () => {
            if (autoSlideRef.current) clearInterval(autoSlideRef.current);
        };
    }, [facultyData.length]);

    return (
        <section className={styles.fullPageContainer}>
            <nav className={styles.navbar}>
                <div className={styles.logocontainer}>
                    <img src={logoimage} alt="SRM_LOGO" className={styles.logoimage} />
                    <h1 className={styles.logo}>SRM SP</h1>
                </div>
                <div className={styles.navLinks}>
                    <button className={styles.loginButton} onClick={() => navigate("/login")}>
                        Login
                    </button>
                </div>
            </nav>

            <div className={styles.headerSection}>
                <div className={styles.textContainer}>
                    <h3 className={styles.heroTitle}>Manage & Monitor Faculty Performance</h3>
                    <p className={styles.heroText}>
                        Access reports, analyze faculty data, and optimize university operations efficiently.
                    </p>
                </div>
            </div>

            <div className={styles.carouselContainer}>
                <button className={styles.carouselButton} onClick={() => handleCarouselChange("prev")}>
                    <ChevronLeft />
                </button>
                {facultyData.length > 0 && (
                    <div key={carouselIndex} className={`${styles.carouselItem} ${animationClass}`}>
                        <h3>{facultyData[carouselIndex].name}</h3>
                        <p>Scopus ID: {facultyData[carouselIndex].scopusId || "N/A"}</p>
                        <p>No. of Documents: {facultyData[carouselIndex].documents}</p>
                    </div>
                )}
                <button className={styles.carouselButton} onClick={() => handleCarouselChange("next")}>
                    <ChevronRight />
                </button>
            </div>

            <div className={styles.statsCarousel}>
                <div className={styles.statItem}>
                    <h2 className={styles.statNumber}>C.Tech</h2>
                    <p className={styles.statLabel}>Department</p>
                </div>
                <div className={styles.statItem}>
                    <h2 className={styles.statNumber}>{facultyCount}+</h2>
                    <p className={styles.statLabel}>Number of Faculty</p>
                </div>
                <div className={styles.statItem}>
                    <h2 className={styles.statNumber}>{researchCount}+</h2>
                    <p className={styles.statLabel}>Research Papers</p>
                </div>
            </div>

            <footer className={styles.footer}>
                <p>
                    Contact Us: xyz@srmist.edu.in |{" "}
                    <a href="https://www.srmist.edu.in" target="_blank" rel="noopener noreferrer">
                        www.srmist.edu.in
                    </a>
                </p>
            </footer>
        </section>
    );
};

export default AdminHomepage;
