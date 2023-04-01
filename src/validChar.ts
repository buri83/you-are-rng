export const ValidChar = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
] as const;
export type ValidChar = typeof ValidChar[number];

export function isValidChar(char: string): char is ValidChar {
    return ValidChar.some((c) => c === char);
}

export function modChar(char: ValidChar, n: number): ValidChar {
    const index = ValidChar.findIndex((c) => c === char);
    const modIndex = index % n;
    return ValidChar[modIndex];
}
