import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { importCarrotMarkdown, parseCarrotMarkdown } from "../../scripts/carrot-import-lib.mts";

const markdown = `
## 热门

<table>
  <tr>
    <td>1</td>
    <td><img src="https://icons.example/chatgpt.png"></td>
    <td><a href="https://chatgpt.com/" target="_blank">ChatGPT</a></td>
    <td>原站描述不应导入</td>
  </tr>
</table>

## 对话

<table>
  <tr>
    <td>1</td>
    <td><img src="https://icons.example/chatgpt.png"></td>
    <td><a href="https://chatgpt.com/" target="_blank">ChatGPT</a></td>
    <td>重复条目</td>
  </tr>
  <tr>
    <td>2</td>
    <td></td>
    <td><a href="https://example.ai/chat">Example AI</a></td>
    <td>另一个描述</td>
  </tr>
</table>
`;

describe("parseCarrotMarkdown", () => {
  it("deduplicates by normalized URL and keeps all upstream categories as tags", () => {
    const sites = parseCarrotMarkdown(markdown);

    expect(sites).toEqual([
      {
        id: "chatgpt",
        name: "ChatGPT",
        url: "https://chatgpt.com/",
        category: "热门",
        tags: ["热门", "对话"],
        source: { kind: "carrot", url: "https://github.com/xx025/carrot" },
      },
      {
        id: "example-ai",
        name: "Example AI",
        url: "https://example.ai/chat",
        category: "对话",
        tags: ["对话"],
        source: { kind: "carrot", url: "https://github.com/xx025/carrot" },
      },
    ]);
  });

  it("does not copy upstream descriptions or icon URLs", () => {
    const [site] = parseCarrotMarkdown(markdown);

    expect(site).not.toHaveProperty("description");
    expect(site).not.toHaveProperty("icon");
  });

  it("rejects a malformed candidate row instead of silently dropping it", () => {
    const malformed = `${markdown}\n## Agent\n<table><tr><td>1</td><td><a href="javascript:alert(1)">Broken</a></td></tr></table>`;

    expect(() => parseCarrotMarkdown(malformed)).toThrow(/Agent.*row 1.*URL/i);
  });

  it("reports and accepts only the exact known upstream duplicate anomaly", () => {
    const onWarning = vi.fn();
    const knownAnomaly = `
## 导航站
<table>
  <tr><td>1</td><td><a href=" TheBestTools.ai - 专业AI工具发现平台">TheBestTools.ai - 专业AI工具发现平台</a></td></tr>
  <tr><td>2</td><td><a href="https://thebesttools.ai">TheBestTools.ai - 专业AI工具发现平台</a></td></tr>
</table>`;

    expect(parseCarrotMarkdown(knownAnomaly, { onWarning })).toHaveLength(1);
    expect(onWarning).toHaveBeenCalledWith(expect.stringMatching(/known upstream anomaly.*导航站 row 1/i));

    const lookalike = knownAnomaly.replace(
      " TheBestTools.ai - 专业AI工具发现平台\"",
      " TheBestTools.ai\"",
    );
    expect(() => parseCarrotMarkdown(lookalike, { onWarning })).toThrow(/导航站.*row 1.*URL/i);
  });

  it("preserves the previous output when parsing fails", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "carrot-import-test-"));
    const outputPath = path.join(directory, "carrot.generated.yml");
    await writeFile(outputPath, "previous output\n", "utf8");

    await expect(
      importCarrotMarkdown(
        "## 热门\n<table><tr><td>1</td><td><a href=\"javascript:void(0)\">Broken</a></td></tr></table>",
        outputPath,
        1,
      ),
    ).rejects.toThrow(/热门.*row 1.*URL/i);
    await expect(readFile(outputPath, "utf8")).resolves.toBe("previous output\n");
  });
});
