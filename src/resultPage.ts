import { ValidChar, isValidChar, modChar } from "./validChar";
import { Chart } from "chart.js/auto";
import annotationPlugin from "chartjs-plugin-annotation";
import { rivalRandomChars } from "./rivals";
import { getResultComment } from "./resultComment";
Chart.register(annotationPlugin);

const url = new URL(window.location.href);
const resultCSV = url.searchParams.get("result");
if (!resultCSV) {
    const resultComment = document.getElementById("resultComment") as HTMLElement;
    resultComment.style.paddingTop = "50px";
    resultComment.innerHTML = "結果を表示できませんでした。<br>Retry を押すとゲームを始められます。";
    throw new Error();
}

const playerRandomTexts: string[] = resultCSV.split(",");
const chars = playerRandomTexts.map((t) => t.split("")).flat() as ValidChar[];

// 乱数を表示する
const generatedTexts = document.getElementById("generatedTexts") as HTMLElement;
playerRandomTexts.map((t) => {
    generatedTexts.innerHTML += `
    <div class="generatedText screenText-mini-tt">
        <tt>
            ${t}
        </tt>
    </div>
`;
});

const PorkerPatterns = ["allDifferent", "onePair", "twoPairs", "treeOfKind", "fullHouse", "fourOfKind+"] as const;

// https://thescipub.com/pdf/jcssp.2012.1353.1357.pdf
const ExpectedPorkerPatterns: { [K in typeof PorkerPatterns[number]]: number } = {
    allDifferent: 0.3024,
    onePair: 0.504,
    twoPairs: 0.108,
    treeOfKind: 0.072,
    fullHouse: 0.009,
    "fourOfKind+": 0.0046, // 0.0045(four of a kind) + 0.0001(five of a kind)
};

type Scores = {
    porker: number;
    freq: number;
    pair: number;
    total: number;
};

class Evaluator {
    // pair, poker 検定では
    // パターンを 36 -> x に圧縮する
    private readonly pairCompressTo = 9;
    private readonly pokerCompressTo = 9;
    readonly scores: Scores;

    constructor(readonly name: string, private chars: ValidChar[], readonly isPlayer: boolean) {
        for (const c of chars) {
            if (!isValidChar(c)) {
                throw new Error(`Invalid: ${name} given ${c}`);
            }
        }
        this.scores = this.calcScores();
    }

    private scan<T>(array: T[], chunkSize: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < array.length - chunkSize; i++) {
            result.push(array.slice(i, i + chunkSize));
        }
        return result;
    }

    /**
     * X^2 検定でスコアを求める
     */
    private calcScores(): Scores {
        const score = {
            porker: 0,
            freq: 0,
            pair: 0,
            total: 0,
        };

        {
            const freq = this.freq();
            const totalCount = freq.reduce((count, cur) => count + cur.count, 0);
            const expected = 1 / ValidChar.length;

            const freqError = freq
                .map((f) => (f.count / totalCount - expected) ** 2 / expected)
                .reduce((total, cur) => total + cur, 0);

            score.freq = freqError;
            score.total += freqError;
        }

        {
            const pair = this.pair();
            const totalCount = pair.reduce((count, cur) => count + cur.count, 0);
            const expected = 1 / this.pairCompressTo ** 2;

            const pairError = pair
                .map((p) => (p.count / totalCount - expected) ** 2 / expected)
                .reduce((total, cur) => total + cur, 0);

            score.pair = pairError;
            score.total += pairError;
        }

        {
            // ポーカー検定はグラフのわかりやすさのために、最初から (actual - expected) 計算されてる
            const poker = this.porker();
            const pokerError = poker
                .map((p) => p.count ** 2 / ExpectedPorkerPatterns[p.key])
                .reduce((total, cur) => total + cur, 0);

            // 他の指標よりも点数少なくなりがちなので、10倍にかさ増ししちゃう
            score.porker = pokerError * 10;
            score.total += pokerError * 10;
        }

        return score;
    }

    freq(): { key: ValidChar; count: number }[] {
        const charFreq = ValidChar.map((c) => {
            return {
                key: c,
                count: 0,
            };
        });

        for (const targetChar of ValidChar) {
            const count = this.chars.filter((c) => c === targetChar).length;
            const freq = charFreq.find((c) => c.key === targetChar);
            freq!.count = count;
        }
        return charFreq;
    }

    pair(): { key: string; count: number }[] {
        const getKey = (from: ValidChar, to: ValidChar): string => `${from} -> ${to}`;
        const result: { key: string; count: number }[] = ValidChar.slice(0, this.pairCompressTo)
            .map((cFrom) => {
                return ValidChar.slice(0, this.pairCompressTo).map((cTo) => {
                    return {
                        key: getKey(cFrom, cTo),
                        count: 0,
                    };
                });
            })
            .flat();

        const increment = (key: string): void => {
            const count = result.find((c) => c.key === key);
            count!.count++;
        };

        for (const p of this.scan(this.chars, 2)) {
            const [from, to] = p;

            // パターンを 36 -> 9 に圧縮する
            const key = getKey(modChar(from, this.pairCompressTo), modChar(to, this.pairCompressTo));
            increment(key);
        }

        return result;
    }

    porker(): { key: typeof PorkerPatterns[number]; count: number }[] {
        const patternCount = this.porkerCount(); // 期待値と比較して大きい・小さいが分かるようにしないと意味ない

        const totalCount = patternCount.reduce((count, cur) => count + cur.count, 0);
        const patternPercentage = patternCount.map((c) => {
            const expected = ExpectedPorkerPatterns[c.key];
            return {
                ...c,
                count: c.count / totalCount - expected,
            };
        });

        return patternPercentage;
    }

    private porkerCount(): { key: typeof PorkerPatterns[number]; count: number }[] {
        const patternCount = PorkerPatterns.map((key) => {
            return {
                key,
                count: 0,
            };
        });
        const increment = (key: typeof PorkerPatterns[number]): void => {
            const count = patternCount.find((c) => c.key === key);
            count!.count++;
        };

        // 前から5毎づつドローして、ペアの頻度を計算する
        for (const hand of this.scan(this.chars, 5)) {
            const countMap = new Map<ValidChar, number>();
            for (const c of hand) {
                const mc = modChar(c, this.pokerCompressTo);

                const cnt = countMap.get(mc);
                if (cnt) {
                    countMap.set(mc, cnt + 1);
                } else {
                    countMap.set(mc, 1);
                }
            }
            const maxDuplicate = Math.max(...Array.from(countMap.values()));

            switch (countMap.size) {
                case 5:
                    // 重複なし: ノーペア
                    increment("allDifferent");
                    break;

                case 4:
                    // 重複がひとつだけ: 1ペア
                    increment("onePair");
                    break;

                case 3:
                    // 2ペア
                    if (maxDuplicate === 2) {
                        increment("twoPairs");
                        break;
                    }

                    // 3カード
                    if (maxDuplicate === 3) {
                        increment("treeOfKind");
                        break;
                    }
                    throw new Error();

                case 2:
                    // フルハウス
                    if (maxDuplicate === 3) {
                        increment("fullHouse");
                        break;
                    }

                    // 4カード
                    if (maxDuplicate === 4) {
                        increment("fourOfKind+");
                        break;
                    }
                    throw new Error();
                case 1:
                    // 5カード
                    increment("fourOfKind+");
                    break;
            }
        }
        return patternCount;
    }
}

const ranking = document.getElementById("ranking") as HTMLElement;

function insertRanking(rank: number, evaluator: Evaluator): void {
    const rankingCard = document.createElement("div");
    rankingCard.className = "rankingCard";
    if (evaluator.isPlayer) {
        rankingCard.className += " playerRankingCard";
    }

    const scores = evaluator.scores;
    const cardTitle = document.createElement("div");
    cardTitle.textContent = `${rank}位: ${evaluator.name} (${scores.total.toFixed(3)}pt)`;
    cardTitle.className = "cardTitle";
    rankingCard.insertBefore(cardTitle, null);

    const charts = document.createElement("div");

    /**
     *  頻度検定
     * */
    {
        const freqEval = evaluator.freq();
        freqEval.sort((a, b) => b.count - a.count);
        const freqCanvas = document.createElement("canvas");
        new Chart(freqCanvas, {
            type: "doughnut",
            data: {
                labels: freqEval.map((f) => f.key),
                datasets: [
                    {
                        data: freqEval.map((f) => f.count),
                    },
                ],
            },
            options: {
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: `頻度検定 (${scores.freq.toFixed(3)}pt)`,
                        color: "black",
                        position: "top",
                        font: {
                            size: 16,
                        },
                    },
                },
            },
        });

        const chartDiv = document.createElement("div");
        chartDiv.className = "pie-chart";
        chartDiv.insertBefore(freqCanvas, null);
        charts.insertBefore(chartDiv, null);
    }

    /**
     *  継次検定
     * */
    {
        const pairEval = evaluator.pair();
        pairEval.sort((a, b) => b.count - a.count);
        const pairCanvas = document.createElement("canvas");
        pairCanvas.className = "chart";
        new Chart(pairCanvas, {
            type: "doughnut",
            data: {
                labels: pairEval.map((f) => f.key),
                datasets: [
                    {
                        data: pairEval.map((f) => f.count),
                    },
                ],
            },
            options: {
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: `継次検定 (${scores.pair.toFixed(3)}pt)`,
                        color: "black",
                        position: "top",
                        font: {
                            size: 16,
                        },
                    },
                },
            },
        });

        const chartDiv = document.createElement("div");
        chartDiv.className = "pie-chart";
        chartDiv.insertBefore(pairCanvas, null);
        charts.insertBefore(chartDiv, null);
    }

    /**
     *  ポーカー検定
     * */
    {
        const porkerEval = evaluator.porker();
        const porkerCanvas = document.createElement("canvas");
        new Chart(porkerCanvas, {
            type: "bar",
            data: {
                labels: porkerEval.map((f) => f.key),
                datasets: [
                    {
                        data: porkerEval.map((f) => f.count),
                    },
                ],
            },
            options: {
                indexAxis: "y",
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: `ポーカー検定 (${scores.porker.toFixed(3)}pt)`,
                        color: "black",
                        position: "top",
                        font: {
                            size: 16,
                        },
                    },
                    annotation: {
                        annotations: [
                            {
                                type: "line",
                                borderColor: "black",
                                borderWidth: 2,
                                scaleID: "x",
                                value: 0,
                            },
                        ],
                    },
                },
                maintainAspectRatio: false,
                scales: {
                    x: {
                        max: 0.1,
                        min: -0.1,
                    },
                },
            },
        });

        const chartDiv = document.createElement("div");
        chartDiv.className = "bar-chart";
        chartDiv.insertBefore(porkerCanvas, null);
        charts.insertBefore(chartDiv, null);
    }

    rankingCard.insertBefore(charts, null);
    ranking.insertBefore(rankingCard, null);
}

const player = new Evaluator("あなた", chars, true);
const totalScore = document.getElementById("totalScore") as HTMLElement;
const resultComment = document.getElementById("resultComment") as HTMLElement;
const shareButton = document.getElementById("shareButton") as HTMLElement;

totalScore.textContent = player.scores.total.toFixed(3);
const comment = getResultComment(player.scores.total);
resultComment.innerHTML = comment;
shareButton.setAttribute("data-text", `${comment} (${player.scores.total.toFixed(3)}pt)`);

const evaluators: Evaluator[] = [];
for (const rivalName in rivalRandomChars) {
    evaluators.push(new Evaluator(rivalName, rivalRandomChars[rivalName], false));
}
evaluators.push(player);

evaluators.sort((a, b) => a.scores.total - b.scores.total);
evaluators.map((e, index) => insertRanking(index + 1, e));
