const handleResize = () => {
  const screenHeight = window.innerHeight;
  const takeSize = document.querySelector(".takeSize");

  if (takeSize) {
    takeSize.style.height = screenHeight + "px";
  }
};

const ScreenSize = () => {
  handleResize();
  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
};

export default ScreenSize;
