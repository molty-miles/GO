"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

export default function DocPage() {
  const [content, setContent] = useState("");
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/GO_Market_Documentation.md")
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        const lines = text.split("\n");
        const headings: { id: string; text: string; level: number }[] = [];
        lines.forEach((line) => {
          const match = line.match(/^(#{1,3})\s+(.*)/);
          if (match) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-");
            headings.push({ id, text, level });
          }
        });
        setToc(headings);
      });
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-6 md:block sticky top-0 h-screen overflow-y-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight hover:text-primary transition-colors">
            GO Market
          </Link>
          <ThemeToggle />
        </div>
        
        <nav className="space-y-1">
          <div className="mb-4">
            <Link 
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Return to App
            </Link>
          </div>
          
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2">
            Documentation
          </p>
          {toc.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={cn(
                "w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                item.level === 1 ? "font-semibold" : "pl-4 text-muted-foreground"
              )}
            >
              {item.text}
            </button>
          ))}
        </nav>
      </aside>

      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md hover:bg-accent"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-semibold">Documentation</span>
        <ThemeToggle />
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div 
            className="absolute left-0 top-0 bottom-0 w-3/4 max-w-xs bg-background p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-bold">GO Market</span>
              <button onClick={() => setIsSidebarOpen(false)}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-1">
              <Link 
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-6"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return to App
              </Link>
              {toc.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={cn(
                    "w-full text-left px-2 py-2 text-sm rounded-md",
                    item.level === 1 ? "font-semibold" : "pl-4 text-muted-foreground"
                  )}
                >
                  {item.text}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 w-full overflow-x-hidden pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto p-6 md:p-12">
          <article className="prose prose-zinc dark:prose-invert max-w-none 
            prose-headings:scroll-mt-20 
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-pre:bg-muted prose-pre:text-muted-foreground
            prose-table:block prose-table:overflow-x-auto
            prose-img:rounded-xl">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")} {...props} />,
                h2: ({node, ...props}) => <h2 id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")} {...props} />,
                h3: ({node, ...props}) => <h3 id={props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")} {...props} />,
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </main>
    </div>
  );
}
