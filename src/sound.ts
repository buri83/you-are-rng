class SoundManager {
    private audio: HTMLAudioElement;
    constructor(path: string, volume: number) {
        this.audio = new Audio(path);
        this.audio.volume = volume;
    }

    playAsSE(): void {
        this.audio.currentTime = 0;
        this.audio.play();
    }
}

// https://soundeffect-lab.info/sound/button/
export const typeWriter = new SoundManager("./typewriter.mp3", 0.4);
export const enter = new SoundManager("./enter.mp3", 1);
export const generated = new SoundManager("./generated.mp3", 0.5);
export const sending = new SoundManager("./sending.mp3", 1);
export const timeout = new SoundManager("./error.mp3", 1);
