import fs from "node:fs";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function DocPage() {
  const filePath = path.join(process.cwd(), "GO_Market_Documentation.md");
  const content = fs.readFileSync(filePath, "utf-8");

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-4xl mx-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
