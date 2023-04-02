import { ValidChar } from "./validChar";
import { getRandomInt } from "./random";
import { enter, generated, sending, timeout, typeWriter } from "./sound";

const RANDOM_TEXT_LENGTH = 40;
const RANDOM_TEXT_COUNT = 5;
const GAME_TIME_LIMIT_MS = 20_000;

class KeyBuffer {
    private keys: string[] = [];
    push(key: string): void {
        this.keys.push(key);
    }

    take(): string | undefined {
        const topKey = this.keys[0];
        this.keys = this.keys.slice(1);
        return topKey;
    }

    clear(): void {
        this.keys = [];
    }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const keyBuffer = new KeyBuffer();
window.addEventListener("keydown", (event) => {
    keyBuffer.push(event.key);
});

async function waitKey(...expectedKeys: string[]): Promise<string> {
    while (true) {
        await sleep(1);
        const key = keyBuffer.take()?.toLowerCase();
        if (!key) {
            continue;
        }
        if (!expectedKeys || expectedKeys.includes(key)) {
            return key;
        }
    }
}

async function prologue(): Promise<void> {
    const instruction = document.getElementById("instruction") as HTMLElement;
    const caption = document.getElementById("caption") as HTMLElement;
    const prologueScreen = document.getElementById("prologueScreen") as HTMLElement;

    prologueScreen.style.display = "block";

    // スタート画面
    instruction.textContent = "> はい（Enter）";

    const pid = getRandomInt(1, 65536);
    const captionTexts: string[] = [
        "あなたは乱数生成器ですか？",
        `そうですよね、あなたは立派な乱数生成器です。<br><br>もう少しすると、PID=${pid} のプログラムさんから乱数の生成を頼まれそうです、手伝ってもらえますか？`,
        "ありがとうございます！<br><br>では、これから制限時間以内にランダムな文字列を生成してくださいね。<br><br>いい感じの乱数列を期待してますよ！！！",
    ];

    for (const t of captionTexts) {
        caption.innerHTML = t;
        await waitKey("enter");
        enter.playAsSE();
    }

    // カウントダウン
    caption.innerHTML = "<br><br><br>もうそろそろ、リクエストが来そうです...";
    const waitSecs = 3;
    for (let i = 0; i < waitSecs * 10 + 1; i++) {
        const st = new Date().getTime();
        const remainingSecs = waitSecs - i / 10;
        instruction.textContent = `残り ${remainingSecs.toFixed(1)} 秒`;
        await sleep(100 - (new Date().getTime() - st));
    }

    caption.textContent = "";
    instruction.textContent = "";
    prologueScreen.style.display = "none";
}

async function evaluating(): Promise<void> {
    const evaluatingScreen = document.getElementById("evaluatingScreen") as HTMLElement;
    evaluatingScreen.style.display = "block";
    await sleep(3_000);
    evaluatingScreen.style.display = "none";
}

async function game(): Promise<ValidChar[][]> {
    const mainScreen = document.getElementById("mainScreen") as HTMLElement;
    const generatedTexts = document.getElementById("generatedTexts") as HTMLElement;
    const currentGeneratingText = document.getElementById("currentGeneratingText") as HTMLElement;
    const gameTimerBar = document.getElementById("gameTimerBar") as HTMLElement;

    const startTime = new Date().getTime();
    const remainingMs = () => Math.max(0, new Date().getTime() - startTime);

    // バックグラウンドでタイマー表示する
    let succeeded = false;
    const timer = async (): Promise<void> => {
        const timeIsOver = document.getElementById("timeIsOver") as HTMLElement;
        while (true) {
            const percent = 100 - (remainingMs() / GAME_TIME_LIMIT_MS) * 100;
            gameTimerBar.style.width = `${percent.toFixed(2)}%`;

            if (percent <= 60) {
                gameTimerBar.style.backgroundColor = "orange";
            }

            if (percent <= 20) {
                gameTimerBar.style.backgroundColor = "red";
            }

            if (percent <= 0) {
                break;
            }
            await sleep(10);
        }

        if (succeeded) {
            return;
        }

        // タイムオーバー！
        mainScreen.style.display = "none";
        timeIsOver.style.display = "block";
        timeout.playAsSE();
    };
    timer();

    // ゲーム処理
    keyBuffer.clear(); // 前の入力を廃棄しておく

    mainScreen.style.display = "block";
    const playerRandomTexts: ValidChar[][] = [];
    for (let i = 0; i < RANDOM_TEXT_COUNT; i++) {
        const currentRandomText: ValidChar[] = [];
        while (currentRandomText.length < RANDOM_TEXT_LENGTH) {
            const key = (await waitKey(...ValidChar)) as ValidChar;
            typeWriter.playAsSE();
            currentRandomText.push(key);
            currentGeneratingText.innerHTML = `<tt>${currentRandomText.join("")}</tt>`;
        }
        currentGeneratingText.textContent = "";
        playerRandomTexts.push(currentRandomText);

        generatedTexts.innerHTML = "";
        playerRandomTexts.map((t) => {
            generatedTexts.innerHTML += `
            <div class="generatedText">
                <span class="generatedTextMark">
                ✅ 
                </span>
                <tt>
                    ${t.join("")}
                </tt>
            </div>
        `;
        });
        generated.playAsSE();
    }
    succeeded = true;

    await sleep(1000);

    sending.playAsSE();

    mainScreen.style.display = "none";
    return playerRandomTexts;
}

async function main(): Promise<void> {
    await prologue();
    const playerRandomTexts = await game();
    await evaluating();

    const result = playerRandomTexts.map((chars) => chars.join("")).join(",");

    console.log(result);
    window.location.href = `result.html?result=${result}`;
}
main();
