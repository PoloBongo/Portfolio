// import React, { Suspense, useEffect, useState, useRef } from "react";
// import "../../css/Home.css";

// // Preview Minia Projects
// import backgroundProjectCeltic from "../../img/backgroundCeltic.webp";
// import backgroundProjectEko from "../../img/backgroundEko.webp";
// import backgroundProjectBAImmobilier from "../../img/backgroundBAImmobilier.webp";
// import pagePaiement from "../../img/pagePaiement.webp";
// import backgroundGoudGuys from "../../img/backgroundGoudGuys.webp";
// import backgroundReactApiMoovie from "../../img/backgroundReactApiMoovie.webp";
// import backgroundReactPortfolio from "../../img/backgroundReactPortfolio.webp";
// // Preview Video Projects
// import celticVideo from "./celticLaricheBasketPreview.mp4";
// import BAImmobilierVideo from "./BAImmobilierPreview.mp4";
// import ekoVideo from "./ekoWebsitePreview.mp4";
// import paymentPageVideo from "./paymentPagePreview.mp4";
// import reactAPIMoovie from "./reactAPIMoovie.mp4";
// // Icon
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
// import { faArrowDown } from "@fortawesome/free-solid-svg-icons";

// import NavbarProjects from "../../Component/NavbarProjects";

// // Traduction
// import { Loader } from "../../Component/ComponentTraduction";
// import { withTranslation } from "react-i18next";

// const ProjectsWebT = ({ t }) => {
//   useEffect(() => {
//     const targetHref1 = document.getElementsByClassName("noColorCeltic");
//     const targetHref2 = document.getElementsByClassName("noColorEko");
//     const targetHref3 = document.getElementsByClassName("noColorPaiement");
//     const targetHref4 = document.getElementsByClassName("noColorGoudGuys");
//     const targetHref5 = document.getElementsByClassName("noColorBAImmobilier");
//     const targetHref6 = document.getElementsByClassName("noColorReact");

//     // Permet de récupérer ce que je veux de ce qui est visible sur la fenêtre ( classe / id / attribute ect...)

//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             entry.target.classList.add("active");
//             Array.from(targetHref1).forEach((element) => {
//               element.style.textDecoration =
//                 entry.target.id === "Celtic" ? "underline" : "";
//             });
//             Array.from(targetHref2).forEach((element) => {
//               element.style.textDecoration =
//                 entry.target.id === "Eko" ? "underline" : "";
//             });
//             Array.from(targetHref3).forEach((element) => {
//               element.style.textDecoration =
//                 entry.target.id === "Paiement" ? "underline" : "";
//             });
//             Array.from(targetHref4).forEach((element) => {
//               element.style.textDecoration =
//                 entry.target.id === "GoudGuys" ? "underline" : "";
//             });
//             Array.from(targetHref5).forEach((element) => {
//               element.style.textDecoration =
//                 entry.target.id === "BAImmobilier" ? "underline" : "";
//             });
//             Array.from(targetHref6).forEach((element) => {
//               element.style.textDecoration =
//                 entry.target.id === "React" ? "underline" : "";
//             });
//           } else {
//             entry.target.classList.remove("active");
//           }
//         });
//       },
//       { threshold: 0.5 }
//     );

//     const projects = document.querySelectorAll(".projects");
//     projects.forEach((project) => {
//       observer.observe(project);
//     });

//     return () => {
//       projects.forEach((project) => {
//         observer.unobserve(project);
//       });
//     };
//   }, []);

//   const [showVideo, setShowVideo] = useState({});

//   const handlePreviewVideoProjects = (event, index) => {
//     const previewContainer = event.target.closest(".preview-div");
//     const video = previewContainer.querySelector(".preview-video");
//     let savedTime = 0;

//     if (video.paused && !showVideo[index]) {
//       video.style.opacity = 1;
//       video.play();
//       video.currentTime = savedTime;
//       setShowVideo((prevState) => ({ ...prevState, [index]: true }));
//     } else if (!video.paused && showVideo[index]) {
//       video.style.opacity = 0;
//       savedTime = video.currentTime;
//       video.pause();
//       setShowVideo((prevState) => ({ ...prevState, [index]: false }));
//     }
//   };

//   const [showNavbarBool, setShowNavbarBool] = useState(true);

//   const handleNavbarBtnClick = () => {
//     setShowNavbarBool(!showNavbarBool);
//   };

//   const scrollContainerRef = useRef(null);

//   const scrollNext = () => {
//     if (scrollContainerRef.current) {
//       const nextElement = scrollContainerRef.current.querySelector(
//         ".projects.active + .projects"
//       );
//       if (nextElement) {
//         nextElement.scrollIntoView({ behavior: "smooth", block: "start" });
//         updateActiveProject(nextElement);
//       }
//     }
//   };

//   const scrollPrev = () => {
//     if (scrollContainerRef.current) {
//       const prevElement =
//         scrollContainerRef.current.querySelector(
//           ".projects.active"
//         ).previousElementSibling;
//       if (prevElement) {
//         prevElement.scrollIntoView({ behavior: "smooth", block: "start" });
//         updateActiveProject(prevElement);
//       }
//     }
//   };

//   const updateActiveProject = (element) => {
//     const allProjects =
//       scrollContainerRef.current.querySelectorAll(".projects");
//     allProjects.forEach((el) => el.classList.remove("active"));
//     element.classList.add("active");
//   };

//   return (
//     <div className="Home-header">
//       <div className="flex-projects">
//         <div>
//           <button className="btnDownloadCV" onClick={handleNavbarBtnClick}>
//             <div
//               className="bubbleProjectNavbar"
//               style={{
//                 width: showNavbarBool ? "50px" : "25px",
//                 height: showNavbarBool ? "50px" : "25px",
//                 zIndex: "1000",
//                 overflow: "hidden",
//                 transition: "all 1s ease",
//               }}
//             ></div>
//           </button>
//           <div
//             className="navbarProject"
//             style={{
//               display: showNavbarBool ? "none" : "block",
//               maxHeight: showNavbarBool ? "0" : "max-content",
//               overflow: "hidden",
//               transition: "all 1s ease",
//             }}
//           >
//             <div className="categoryProject">
//               <NavbarProjects />
//               <h5 className="sizeCategoryProjectGames fontsBold">
//                 {t("BottomNavBarProjects.Category")}
//               </h5>
//               <ul className="backgroundUnderCategory">
//                 <a href="#Celtic" className="noColorCeltic fontsRegular">
//                   Celtic La Riche Basket&nbsp;
//                   <strong className="green">(1)</strong>
//                 </a>
//               </ul>
//               <ul className="backgroundUnderCategory">
//                 <a href="#Eko" className="noColorEko fontsRegular">
//                   Eko&nbsp;
//                   <strong className="green">(1)</strong>
//                 </a>
//               </ul>
//               <ul className="backgroundUnderCategory">
//                 <a href="#Paiement" className="noColorPaiement fontsRegular">
//                   {t("BottomNavBarProjects.PaymentPage")}&nbsp;
//                   <strong className="green">(1)</strong>
//                 </a>
//               </ul>
//               <ul className="backgroundUnderCategory">
//                 <a href="#GoudGuys" className="noColorGoudGuys fontsRegular">
//                   Goud Guys&nbsp;
//                   <strong className="green">(1)</strong>
//                 </a>
//               </ul>
//               <ul className="backgroundUnderCategory">
//                 <a
//                   href="#BAImmobilier"
//                   className="noColorBAImmobilier fontsRegular"
//                 >
//                   B.A Immobilier&nbsp;
//                   <strong className="green">(1)</strong>
//                 </a>
//               </ul>
//               <ul className="backgroundUnderCategory">
//                 <a href="#React" className="noColorReact fontsRegular">
//                   React&nbsp;
//                   <strong className="green">(1)</strong>
//                 </a>
//               </ul>
//             </div>
//           </div>
//         </div>
//         <div className="divGlobalProjects" ref={scrollContainerRef}>
//           <div className="projects Celtic" id="Celtic">
//             <div className="flexIMG">
//               <div className="preview-div">
//                 <img
//                   src={backgroundProjectCeltic}
//                   alt="Site Internet Celtic La Riche Basket"
//                   className="sizeProjectIMG"
//                 ></img>
//                 <div className="pos-btn-video">
//                   <button
//                     className="btnStyleDiscoverProject fontsBold"
//                     onClick={(event) => handlePreviewVideoProjects(event, 1)}
//                   >
//                     {showVideo[1]
//                       ? t("VideoGamesProjects.stopVideo")
//                       : t("VideoGamesProjects.playVideo")}
//                   </button>
//                 </div>
//                 <video className="preview-video" loop muted>
//                   <source src={celticVideo} type="video/mp4" />
//                   Your browser does not support the video tag.
//                 </video>
//               </div>
//             </div>
//             <h4 className="HelluvaRevengeTitle fontsRegular">
//               Celtic La Riche Basket
//             </h4>
//             <p
//               className="pDescription fontsLight"
//               dangerouslySetInnerHTML={{
//                 __html: t("WebProjects.Celtic"),
//               }}
//             ></p>
//             <div className="btnDiscoverProject">
//               <a
//                 href="https://www.celticlarichebasket.fr/"
//                 target="_blank"
//                 rel="noreferrer"
//               >
//                 <button className="btnStyleDiscoverProject fontsBold">
//                   {t("WebProjects.learnMore")}
//                 </button>
//               </a>
//             </div>
//           </div>
//           <div className="projects Eko" id="Eko">
//             <div className="flexIMG">
//               <div className="preview-div">
//                 <img
//                   src={backgroundProjectEko}
//                   loading="lazy"
//                   alt="Site Internet Eko"
//                   className="sizeProjectIMG"
//                 ></img>
//                 <div className="pos-btn-video">
//                   <button
//                     className="btnStyleDiscoverProject fontsBold"
//                     onClick={(event) => handlePreviewVideoProjects(event, 2)}
//                   >
//                     {showVideo[2]
//                       ? t("VideoGamesProjects.stopVideo")
//                       : t("VideoGamesProjects.playVideo")}
//                   </button>
//                 </div>
//                 <video loading="lazy" className="preview-video" loop muted>
//                   <source src={ekoVideo} type="video/mp4" />
//                   Your browser does not support the video tag.
//                 </video>
//               </div>
//             </div>
//             <h4 className="HelluvaRevengeTitle fontsRegular">Eko</h4>
//             <p
//               className="pDescription fontsLight"
//               dangerouslySetInnerHTML={{
//                 __html: t("WebProjects.Eko"),
//               }}
//             ></p>
//             <div className="btnDiscoverProject">
//               <a
//                 href="https://www.baimmobilier.fr/eko/"
//                 target="_blank"
//                 rel="noreferrer"
//               >
//                 <button className="btnStyleDiscoverProject fontsBold">
//                   {t("WebProjects.learnMore")}
//                 </button>
//               </a>
//             </div>
//           </div>
//           <div className="projects Payment" id="Paiement">
//             <div className="flexIMG">
//               <div className="preview-div">
//                 <img
//                   src={pagePaiement}
//                   loading="lazy"
//                   alt="Page de Paiement"
//                   className="sizeProjectIMG"
//                 ></img>
//                 <div className="pos-btn-video">
//                   <button
//                     className="btnStyleDiscoverProject fontsBold"
//                     onClick={(event) => handlePreviewVideoProjects(event, 3)}
//                   >
//                     {showVideo[3]
//                       ? t("VideoGamesProjects.stopVideo")
//                       : t("VideoGamesProjects.playVideo")}
//                   </button>
//                 </div>
//                 <video loading="lazy" className="preview-video" loop muted>
//                   <source src={paymentPageVideo} type="video/mp4" />
//                   Your browser does not support the video tag.
//                 </video>
//               </div>
//             </div>
//             <h4 className="HelluvaRevengeTitle fontsRegular">
//               {t("BottomNavBarProjects.PaymentPage")}
//             </h4>
//             <p
//               className="pDescription fontsLight"
//               dangerouslySetInnerHTML={{
//                 __html: t("WebProjects.ShoppingSystem"),
//               }}
//             ></p>
//             <div className="btnDiscoverProject">
//               <a
//                 href="https://www.baimmobilier.fr/eko/stripe/categorie_produit/payment_process.php"
//                 target="_blank"
//                 rel="noreferrer"
//               >
//                 <button className="btnStyleDiscoverProject fontsBold">
//                   {t("WebProjects.learnMore")}
//                 </button>
//               </a>
//             </div>
//           </div>
//           <div className="projects GoudGuys" id="GoudGuys">
//             <div className="flexIMG">
//               <img
//                 src={backgroundGoudGuys}
//                 loading="lazy"
//                 alt="Site Internet Goud Guys"
//                 className="sizeProjectIMG"
//               ></img>
//             </div>
//             <h4 className="HelluvaRevengeTitle fontsRegular">Goud Guys</h4>
//             <p
//               className="pDescription fontsLight"
//               dangerouslySetInnerHTML={{
//                 __html: t("WebProjects.GoudGuys"),
//               }}
//             ></p>
//             <div className="btnDiscoverProject">
//               <a
//                 href="https://www.baimmobilier.fr/goodguys/"
//                 target="_blank"
//                 rel="noreferrer"
//               >
//                 <button className="btnStyleDiscoverProject fontsBold">
//                   {t("WebProjects.learnMore")}
//                 </button>
//               </a>
//             </div>
//           </div>
//           <div className="projects BAImmo" id="BAImmobilier">
//             <div className="flexIMG">
//               <div className="preview-div">
//                 <img
//                   src={backgroundProjectBAImmobilier}
//                   loading="lazy"
//                   alt="Site Internet B.A Immobilier"
//                   className="sizeProjectIMG"
//                 ></img>
//                 <div className="pos-btn-video">
//                   <button
//                     className="btnStyleDiscoverProject fontsBold"
//                     onClick={(event) => handlePreviewVideoProjects(event, 4)}
//                   >
//                     {showVideo[4]
//                       ? t("VideoGamesProjects.stopVideo")
//                       : t("VideoGamesProjects.playVideo")}
//                   </button>
//                 </div>
//                 <video loading="lazy" className="preview-video" loop muted>
//                   <source src={BAImmobilierVideo} type="video/mp4" />
//                   Your browser does not support the video tag.
//                 </video>
//               </div>
//             </div>
//             <h4 className="HelluvaRevengeTitle fontsRegular">B.A Immobilier</h4>
//             <p
//               className="pDescription fontsLight"
//               dangerouslySetInnerHTML={{
//                 __html: t("WebProjects.BAImmobilier"),
//               }}
//             ></p>
//             <div className="btnDiscoverProject">
//               <a
//                 href="https://baimmobilier.fr/"
//                 target="_blank"
//                 rel="noreferrer"
//               >
//                 <button className="btnStyleDiscoverProject fontsBold">
//                   {t("WebProjects.learnMore")}
//                 </button>
//               </a>
//             </div>
//           </div>
//           <div className="projects React" id="React">
//             <div className="flexIMG">
//               <div className="preview-div">
//                 <img
//                   src={backgroundReactApiMoovie}
//                   loading="lazy"
//                   alt="Site Internet Moovie API en React"
//                   className="sizeProjectIMG"
//                 ></img>
//                 <div className="pos-btn-video">
//                   <button
//                     className="btnStyleDiscoverProject fontsBold"
//                     onClick={(event) => handlePreviewVideoProjects(event, 5)}
//                   >
//                     {showVideo[5]
//                       ? t("VideoGamesProjects.stopVideo")
//                       : t("VideoGamesProjects.playVideo")}
//                   </button>
//                 </div>
//                 <video loading="lazy" className="preview-video" loop muted>
//                   <source src={reactAPIMoovie} type="video/mp4" />
//                   Your browser does not support the video tag.
//                 </video>
//               </div>
//             </div>
//             <h4 className="HelluvaRevengeTitle fontsRegular">React API</h4>
//             <p
//               className="pDescription fontsLight"
//               dangerouslySetInnerHTML={{
//                 __html: t("WebProjects.React"),
//               }}
//             ></p>
//             <div className="btnDiscoverProject">
//               <a
//                 href="https://github.com/PoloBongo/React-API-Moovie"
//                 target="_blank"
//                 rel="noreferrer"
//               >
//                 <button className="btnStyleDiscoverProject fontsBold">
//                   {t("WebProjects.learnMore")}
//                 </button>
//               </a>
//             </div>
//           </div>
//           <div className="projects React" id="React">
//             <div className="flexIMG">
//               <img
//                 src={backgroundReactPortfolio}
//                 alt="portfolio React"
//                 className="sizeProjectIMG"
//               ></img>{" "}
//             </div>
//             <h4 className="HelluvaRevengeTitle fontsRegular">Portfolio</h4>
//             <p
//               className="pDescription fontsLight"
//               dangerouslySetInnerHTML={{
//                 __html: t("WebProjects.ReactPortfolio"),
//               }}
//             ></p>
//             <div className="btnDiscoverProject">
//               <a
//                 href="https://github.com/PoloBongo/Portfolio"
//                 target="_blank"
//                 rel="noreferrer"
//               >
//                 <button className="btnStyleDiscoverProject fontsBold">
//                   {t("WebProjects.learnMore")}
//                 </button>
//               </a>
//             </div>
//           </div>
//         </div>
//         <div className="top-margin-btn-icon">
//           <button
//             onClick={scrollPrev}
//             className="btnStyleDiscoverProject btn-scroll-up-projects"
//           >
//             <FontAwesomeIcon icon={faArrowUp} />
//           </button>
//           <button
//             onClick={scrollNext}
//             className="btnStyleDiscoverProject btn-scroll-up-projects"
//           >
//             <FontAwesomeIcon icon={faArrowDown} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const TranslatedProjectsVideosGames = withTranslation()(ProjectsWebT);

// // here app catches the suspense from page in case translations are not yet loaded
// export default function ProjectsWeb() {
//   return (
//     <Suspense fallback={<Loader />}>
//       <TranslatedProjectsVideosGames />
//     </Suspense>
//   );
// }
