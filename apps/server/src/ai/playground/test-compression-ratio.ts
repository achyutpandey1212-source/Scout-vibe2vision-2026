import { cleanDocument } from '../../discovery/context/langchain/cleaner';
import { chunkDocument } from '../../discovery/context/langchain/chunker';
import { scoreChunks } from '../../discovery/context/langchain/scorer';
import { compressChunks } from '../../discovery/context/langchain/compressor';
import { loadDocument } from '../../discovery/context/langchain/loader';
import { DEFAULT_OPTIMIZATION_PROFILE } from '../../discovery/context/metrics';

function runTest() {
  console.log('--- Context Compression Test Run ---');

  // Large document without markdown headings (representing flat page boilerplate)
  const paragraphs: string[] = [];
  for (let i = 0; i < 15; i++) {
    paragraphs.push(
      `Paragraph index ${i}: This is some unique content describing opportunity characteristics, requirements, eligibility rules, and deadline details. `.repeat(
        6,
      ),
    );
  }
  const rawContent = paragraphs.join('\n\n'); // ~10,000 characters

  const page = {
    url: 'https://startup-careers.com/jobs/123',
    title: 'Software Engineer Internship',
    markdown: rawContent,
    crawlTime: 120,
    fetchMethod: 'firecrawl',
    crawlReason: 'test',
    crawlStatus: 'SUCCESS' as const,
  };

  const doc = loadDocument(page as any, rawContent);
  const cleanRes = cleanDocument(doc);
  const chunks = chunkDocument(cleanRes.doc);
  const scored = scoreChunks(chunks);

  // Use a HUGE budget of 9000
  const profile = {
    ...DEFAULT_OPTIMIZATION_PROFILE,
    maxChars: 9000,
  };

  const compressRes = compressChunks(scored, profile);

  console.log(`Original Chars:  ${rawContent.length}`);
  console.log(`After Cleaner:   ${cleanRes.doc.pageContent.length}`);
  console.log(`Chunks Count:    ${chunks.length}`);
  console.log(`Final Chars:     ${compressRes.content.length}`);
  console.log(
    `Compression:     ${(((rawContent.length - compressRes.content.length) / rawContent.length) * 100).toFixed(1)}%`,
  );
}

runTest();
