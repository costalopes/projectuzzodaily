import { useState } from "react";

const QUOTES = [
  { text: "Foco no processo, não no resultado.", author: "mindset" },
  { text: "Código limpo é código que conta uma história.", author: "Robert C. Martin" },
  { text: "Primeiro faça funcionar, depois faça bonito.", author: "Kent Beck" },
  { text: "Simplicidade é a sofisticação suprema.", author: "Leonardo da Vinci" },
  { text: "Não é bug, é feature.", author: "todo dev" },
  { text: "Um commit por vez.", author: "sabedoria git" },
  { text: "Café + código = progresso.", author: "devlife" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "Debugging é como ser um detetive num filme de crime onde você também é o assassino.", author: "Filipe Deschamps" },
  { text: "O melhor código é aquele que você não precisa escrever.", author: "Jeff Atwood" },
];

export const CodeQuote = () => {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const quote = QUOTES[index];

  return (
    <button
      onClick={() => setIndex((i) => (i + 1) % QUOTES.length)}
      className="w-full text-center py-3 group cursor-pointer"
    >
      <p className="text-xs text-muted-foreground/60 italic font-mono leading-relaxed group-hover:text-muted-foreground transition-colors">
        "{quote.text}"
      </p>
      <p className="text-[10px] text-muted-foreground/40 mt-1 font-mono">
        — {quote.author}
      </p>
    </button>
  );
};
