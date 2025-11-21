const paperContent = `
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>示例论文：人工智能与知识增强</title>
  <style>
    :root { --page-max: 900px; --accent: #2f5aa7; --muted: #666; --border: #e5e5e5; }
    * { box-sizing: border-box; }
    body { font-family: "Times New Roman", Georgia, serif; color: #222; line-height: 1.75; background: #fff; padding: 32px; }
    .paper { max-width: var(--page-max); margin: 0 auto; }
    .title { text-align: center; font-size: 32px; font-weight: 700; margin-bottom: 8px; }
    .meta { text-align: center; color: var(--muted); margin-bottom: 24px; }
    .divider { height: 1px; background: var(--border); margin: 16px 0 24px; }
    .abstract { background: #fafafa; border: 1px solid var(--border); padding: 16px; margin-bottom: 24px; }
    .abstract .label { font-weight: 700; }
    .keywords { color: var(--muted); font-size: 14px; margin-top: 8px; }
    h2 { font-size: 22px; font-weight: 700; margin: 24px 0 12px; }
    h3 { font-size: 18px; font-weight: 700; margin: 16px 0 8px; }
    figure { margin: 16px 0; border: 1px solid var(--border); padding: 8px; background: #fff; }
    figcaption { text-align: center; color: var(--muted); font-size: 14px; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid var(--border); padding: 8px 10px; text-align: left; }
    thead th { background: #f3f6fb; }
    .two-col { column-count: 2; column-gap: 32px; }
    .ref { font-size: 14px; color: var(--muted); }
    .footer { border-top: 1px solid var(--border); margin-top: 32px; padding-top: 12px; color: var(--muted); font-size: 13px; }
    .callout { border-left: 4px solid var(--accent); background: #f7fbff; padding: 12px; margin: 12px 0; }
  </style>
</head>
<body>
  <article class="paper">
    <header>
      <div class="title">人工智能与知识增强：检索增强生成的系统性研究</div>
      <div class="meta">作者：张三 李四 | 单位：某某大学计算机学院 | 日期：2025-11-20</div>
      <div class="divider"></div>
    </header>

    <section class="abstract">
      <span class="label">摘要：</span>
      本文系统性研究了检索增强生成（RAG）在通用知识问答与领域文档处理中的适用性与局限。我们提出一种层级检索融合策略（HRF），通过语义召回与结构化抽取的协同优化，提高事实一致性与引用可解释性。在两个公开数据集与一个企业文档集上的实验显示，HRF 在保持生成流畅性的同时，显著提升了可信引用率与细粒度事实准确率。
      <div class="keywords">关键词：人工智能；检索增强生成；知识图谱；事实一致性；引用可解释性</div>
    </section>

    <section>
      <h2>一、引言</h2>
      大语言模型在生成式任务中展现出强大的能力，但在事实性、时效性与可溯源性方面仍面临挑战。检索增强生成尝试通过检索外部知识来缓解这些问题，然而在复杂结构化文档与跨段落依赖场景下，现有方法的召回与融合仍不稳定。
      <div class="callout">本文关注“结构化检索—证据融合—生成引用”三阶段的协同优化。</div>
    </section>

    <section class="two-col">
      <h2>二、相关工作</h2>
      <h3>2.1 检索策略</h3>
      向量检索强调语义相似性，关键词检索强调词法匹配，混合检索在多域场景中表现更稳健。分层检索通过章节—段落—句子级别的逐步细化，提高证据的可定位性。
      <h3>2.2 融合与生成</h3>
      典型方法包括拼接证据、指令式引用、结构化提示等。近期工作尝试在生成过程中动态权衡证据片段。
      <h3>2.3 评估维度</h3>
      除 BLEU/ROUGE 外，事实一致性与引用可解释性正逐渐成为核心指标。
    </section>

    <section>
      <h2>三、方法</h2>
      <h3>3.1 层级检索融合（HRF）</h3>
      HRF 首先进行章节级粗检索，再在候选章节内进行段落级细检索，最终在句子级进行证据抽取与去冗。融合阶段引入权重分配与置信阈值，生成阶段以段落为单位进行逐步引用。
      <figure>
        <img src="https://images.unsplash.com/photo-1536880137181-7f5b6c5fbb53?w=1200" alt="方法框架" style="width:100%;height:280px;object-fit:cover;" />
        <figcaption>图1 方法总体框架示意</figcaption>
      </figure>
    </section>

    <section>
      <h2>四、实验</h2>
      <table>
        <thead>
          <tr>
            <th>数据集</th>
            <th>指标</th>
            <th>基线</th>
            <th>HRF</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>HotpotQA</td>
            <td>事实一致率</td>
            <td>74.2%</td>
            <td>81.5%</td>
          </tr>
          <tr>
            <td>GovDocs</td>
            <td>可信引用率</td>
            <td>62.8%</td>
            <td>77.9%</td>
          </tr>
          <tr>
            <td>EnterpriseDocs</td>
            <td>细粒度准确率</td>
            <td>68.1%</td>
            <td>79.6%</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>五、讨论</h2>
      HRF 在长文档与跨段落依赖场景中优势明显，但在多模态证据与表格密集型文档上仍存在不足。未来工作将引入结构化解析与多模态检索。
    </section>

    <section>
      <h2>参考文献</h2>
      <ol class="ref">
        <li>Lewis et al. Retrieval-Augmented Generation for Knowledge-Intensive NLP. NeurIPS, 2020.</li>
        <li>Izacard & Grave. Leveraging Passage Retrieval with Generative Models. arXiv, 2020.</li>
        <li>Yates et al. Document-Level Evidence Aggregation for QA. ACL, 2021.</li>
      </ol>
    </section>

    <div class="footer">本文模板适配全局 contenteditable 编辑模式与选区样式操作。</div>
  </article>
</body>
</html>`

export { paperContent }