import bellSound from "../sound/bell2.mp3";
import notiSound from "../sound/noti.mp3";

const sounds = {
    bell: new Audio(bellSound),
    noti: new Audio(notiSound),
};

// Cấu hình chung
Object.values(sounds).forEach(audio => {
    audio.preload = "auto";
});

export const playSystemSound = (soundName) => {
    const audio = sounds[soundName];
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn("Autoplay blocked:", e));
    }
};