import * as THREE from "three";

const CLIP_FPS = 30; // fréquence des boucles (public/clips)
let clipNow = 0; // date de l'image en cours (horodatage de requestAnimationFrame), partagée par les textures vidéo

// Texture d'une boucle vidéo. Le VideoTexture de Three met la texture à jour dans un rappel du fil principal
// (requestVideoFrameCallback) : dès que Lenis, ScrollTrigger ou React travaillent, ce rappel arrive en retard ou groupé
// et la vidéo avance par à-coups pendant le défilement. Ici l'envoi au GPU se décide dans le rendu, d'après l'horloge de
// la vidéo : une image envoyée par image de la vidéo, au bon moment, jamais plus. La texture a sa propre horloge, qui
// avance au pas régulier du rendu ; la lecture de currentTime, bruitée par le travail du fil principal, ne fait que la
// recaler doucement (sans quoi une image arrive tantôt après 1 rendu, tantôt après 3).
class ClipTexture extends THREE.Texture {
  constructor(video) {
    super(video);
    this.isVideoTexture = true; // le moteur n'alloue pas de stockage fixe et appelle update() à chaque rendu
    this.minFilter = THREE.LinearFilter;
    this.magFilter = THREE.LinearFilter;
    this.generateMipmaps = false;
    this.frame = -1; // index de l'image envoyée ; -1 tant qu'aucune ne l'a été
    this.time = -1; // horloge propre (secondes de vidéo)
    this.at = -1; // date de la dernière mise à jour de l'horloge
  }

  update() {
    const video = this.image;
    if (video.readyState < 2 || this.at === clipNow) return; // une fois par image, même si le moteur nous rappelle
    const dt = this.at < 0 ? 0 : (clipNow - this.at) / 1000;
    this.at = clipNow;
    const t = video.currentTime;
    if (video.paused || this.time < 0 || Math.abs(t - this.time) > 0.12) this.time = t; // arrêt, début, boucle ou saut
    else {
      this.time += dt;
      this.time += (t - this.time) * 0.03;
    }
    const frame = Math.floor(this.time * CLIP_FPS + 0.001);
    if (frame !== this.frame) {
      this.frame = frame;
      this.needsUpdate = true;
    }
  }
}

// Date de l'image en cours : à appeler au début de chaque rendu, avec l'horodatage de requestAnimationFrame
export const setClipNow = (now) => {
  clipNow = now;
};

export { ClipTexture };
