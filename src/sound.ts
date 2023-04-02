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
export const typeWriter = new SoundManager("./static/typewriter.mp3", 0.4);
export const enter = new SoundManager("./static/enter.mp3", 1);
export const generated = new SoundManager("./static/generated.mp3", 0.5);
export const sending = new SoundManager("./static/sending.mp3", 1);
export const timeout = new SoundManager("./static/error.mp3", 1);
export const gameStart = new SoundManager("./static/gameStart.mp3", 1);
