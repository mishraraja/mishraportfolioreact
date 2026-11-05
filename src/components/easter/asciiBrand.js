const letters = {
  R: [" ____  ", "|  _ \\ ", "| |_) |", "|  _ < ", "|_| \\_\\"],
  A: ["    _    ", "   / \\   ", "  / _ \\  ", " / ___ \\ ", "/_/   \\_\\"],
  J: ["     _ ", "    | |", " _  | |", "| |_| |", " \\___/ "],
  M: [" __  __ ", "|  \\/  |", "| |\\/| |", "| |  | |", "|_|  |_|"],
  I: [" ___ ", "|_ _|", " | | ", " | | ", "|___|"],
  S: [" ____ ", "/ ___|", "\\___ \\", " ___) |", "|____/ "],
  H: [" _   _ ", "| | | |", "| |_| |", "|  _  |", "|_| |_|"],
};

export function asciiWord(word) {
  return Array.from({ length: 5 }, (_, row) => [...word].map((letter) => {
    const glyph = letters[letter];
    return glyph[row].padEnd(Math.max(...glyph.map((line) => line.length)));
  }).join(" ")).join("\n");
}

export const ASCII_BRAND = asciiWord("RAJA") + "\n\n" + asciiWord("MISHRA");
