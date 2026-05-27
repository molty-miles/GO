import fs from "node:fs";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

export default function DocPage() {
  const filePath = path.join(process.cwd(), "GO_Market_Documentation.md");
  const content = fs.readFileSync(filePath, "utf-8");

  return (
    <div className="min-h-screen w-full">
      <div className="doc-content prose prose-sm md:prose-base prose-zinc dark:prose-invert max-w-4xl mx-auto px-4 py-6 md:py-10 break-words">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
