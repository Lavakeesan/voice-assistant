import "./globals.css";

export const metadata = {
  title: "Aura AI | Next-Generation Voice Assistant",
  description: "Experience the future of conversation with Aura AI, a premium voice-enabled assistant powered by advanced language models.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="min-h-full flex flex-col selection:bg-indigo-500/30">
        {children}
      </body>
    </html>
  );
}

