import React, { useCallback } from "react";
import { loadSlim } from "tsparticles-slim";
import Particles from "react-tsparticles";
import styled from "styled-components";

const ParticlesContainer = styled.div`
  position: absolute;
  width: "100%"};
  height: "100%"};
  overflow: hidden; // Ensures no overflow if canvas is somehow larger
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
`;

const ParralaxEffect = (props) => {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    return Promise.resolve();
  }, []);

  return (
    <ParticlesContainer width="100%" height="100%">
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          autoPlay: true,
          backgroundMask: {
            composite: "destination-out",
            cover: {
              color: {
                value: "#fff",
              },
              opacity: 1,
            },
            enable: false,
          },
          fpsLimit: 120,
          fullScreen: {
            enable: true,
            zIndex: 0,
          },
          interactivity: {
            detectsOn: "window",
            events: {
              onClick: {
                enable: false,
                mode: "push",
              },
              onHover: {
                enable: true,
                mode: "grab",
                parallax: {
                  enable: true,
                  force: 60,
                  smooth: 10,
                },
              },
              resize: true,
            },
            modes: {
              grab: {
                distance: 400,
                links: {
                  opacity: 0.5,
                },
              },
              bubble: {
                distance: 400,
                duration: 2,
                opacity: 0.8,
                size: 40,
              },
              repulse: {
                distance: 200,
                duration: 0.4,
                factor: 100,
                speed: 1,
                maxSpeed: 50,
              },
            },
          },
          particles: {
            color: {
              value: "#ffffff",
            },
            links: {
              color: "#c663ff",
              distance: 80,
              enable: true,
              opacity: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "out",
              },
              speed: 2,
            },
            number: {
              value: 80,
            },
            opacity: {
              value: 0.7,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 7 },
            },
          },
          detectRetina: true,
        }}
        style={{
          width: "100%", // Ensures canvas fills the width of its container
          height: "100%", // Ensures canvas fills the height of its container
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
      <ContentWrapper>{props.children}</ContentWrapper>
    </ParticlesContainer>
  );
};
export default ParralaxEffect;
