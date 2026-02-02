# Flow Engineering 实现计划与评估

**文档日期**: 2026-02-02  
**目标**: 将 `AIReportAnalyzer` 从「一次性全量 LLM」重构为「Map-Reduce + LangGraph」流式分析

---

## 一、计划评估

### 1.1 你的方案优点

| 维度 | 评估 |
|------|------|
| **架构** | Map-Reduce 分治可显著降低单次上下文长度，避免粗暴截断导致的信息丢失。 |
| **模型分层** | Extract 用 gpt-4o-mini、Generate 用 gpt-4o，符合成本与质量平衡。 |
| **技术选型** | LangGraph + TypedDict 状态、Pydantic 输出，便于可观测与调试。 |
| **分步设计** | State → Extractor → Aggregator → Generator 与现有数据流（文档/邮件/群聊/会议）对齐。 |

### 1.2 风险与补充点

| 风险 | 说明 | 应对 |
|------|------|------|
| **会议与多维表格** | 当前计划只写了 docs/emails/chats 三个 Extractor，未明确 events 与 bitables。 | 增加 `extract_events_node`；bitables 仅元数据无正文，可并入 docs 作为「文档名+空内容」或单独轻量节点。 |
| **输出契约** | 下游 `report_generator.py`、`app.py`、`scheduler.py` 依赖 `analyze_data()` 的返回结构。 | 重构后的 Graph 最终输出必须转换为现有格式：`date`, `summary`, `projects`, `today_todos`, `document_updates`。 |
| **并行粒度** | 若「每个文档一条 LLM 调用」会爆炸。 | 文档按批处理（例如每批 5～8 篇，每篇截断 600 字符），单次调用输出一批 WorkItem；邮件/群聊同理分批。 |
| **聚类一致性** | 纯按 `project_name` 字符串聚类，「API重构」与「后端重构」可能被拆成两项。 | Aggregator 中可用简单规则（同义词/包含关系）或轻量 LLM 做 project 名归一化（可选）。 |

### 1.3 与现有代码的对齐

- **数据入口**：仍使用 `DataCollector.collect_yesterday_data()` 的返回结构，不修改 `feishu_app.db`。
- **接口**：`AIReportAnalyzer.analyze_data(collected_data) -> Dict` 签名与返回结构不变，内部改为「跑 Graph → 将 `ReportState.final_report` 及聚类结果转成现有 Dict」。
- **配置**：API Key、Base URL、模型名继续从环境变量读取；可新增 `EXTRACT_MODEL`、`GENERATE_MODEL` 等可选配置。

---

## 二、状态与数据结构定义

### 2.1 ReportState (TypedDict)

```python
from typing import TypedDict, List, Dict, Any

class ReportState(TypedDict, total=False):
    input_data: Dict[str, Any]       # 原始 collected_data
    extracted_items: List[dict]      # List[WorkItem] 的 dict 表示
    clustered_projects: Dict[str, List[dict]]  # project_name -> [WorkItem]
    final_report: str                # 最终 HTML/Markdown（若 Generator 直接出）
    # 兼容现有下游：也可在 Graph 结束后由「转换节点」生成
    analysis_result: Dict[str, Any]   # 与现有 analyze_data 返回值同构
```

说明：LangGraph 的 state 更新是「合并式」的，各 Extractor 可分别 append 到 `extracted_items`，因此用 `List[dict]` 便于序列化；内部仍用 Pydantic 校验。

### 2.2 WorkItem (Pydantic)

用于各 Extractor 输出、Aggregator 输入，保证 JSON 可解析与类型安全。

```python
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class WorkItemType(str, Enum):
    PROJECT = "project"
    PROGRESS = "progress"
    TODO = "todo"
    RISK = "risk"
    DECISION = "decision"
    HIGHLIGHT = "highlight"

class WorkItem(BaseModel):
    project_name: str                # 所属/关联项目名，用于聚类
    type: WorkItemType
    summary: str                      # 一句话描述
    status: Optional[str] = None      # 如 "completed" / "in_progress"
    priority: Optional[str] = None    # 高/中/低
    source: str                       # "doc" | "email" | "chat" | "event"
    source_id: Optional[str] = None   # 文档名/邮件 subject/群名/会议标题
    raw_ref: Optional[dict] = None    # 原始引用（url、时间等）供 enrich 使用
    # 仅 type==TODO 时使用
    assignee: Optional[str] = None
    deadline: Optional[str] = None
```

Extractor 的 Prompt 要求严格输出上述 JSON 数组，用 Pydantic 解析；解析失败则记录日志并返回空列表，不中断图。

---

## 三、节点与图设计

### 3.1 总体流程

```
Start
  → [extract_docs_node, extract_emails_node, extract_chats_node, extract_events_node]
  → aggregate_node (纯 Python)
  → generate_report_node (gpt-4o，输出 summary + projects + today_todos)
  → convert_to_legacy_node (将 state 转为现有 analyze_data 返回结构，并做 enrich)
  → End
```

说明：`final_report` 若仅指「正文 HTML/Markdown」，可由 `report_generator` 继续用 `analysis_result` 渲染；若希望 Generator 直接出 HTML，也可在 `analysis_result` 中带 `raw_markdown` 等字段，由下游选用。

### 3.2 Extractor 节点（Map 阶段）

- **extract_docs_node**
  - 输入：`state["input_data"]["documents"]` + bitables 转成的 doc 项。
  - 策略：分批（如每批 5 篇），每篇 name + content[:600]；单次 LLM 输入一批，输出 `List[WorkItem]`（project_name, type, summary, priority, source="doc", source_id=name, raw_ref={url, modified_time}）。
  - 模型：gpt-4o-mini；严格 JSON 数组，Pydantic 解析。

- **extract_emails_node**
  - 输入：`state["input_data"]["emails"]`。
  - 策略：分批（如每批 10 封），每封 subject + body[:500]；输出 WorkItem（含 type=decision/risk/todo 等）。
  - 模型：gpt-4o-mini；JSON 数组 + Pydantic。

- **extract_chats_node**
  - 输入：`state["input_data"]["messages"]`。
  - 策略：按 chat_name 分组，每组取最近 N 条拼接；或整体分批。输出讨论结论、行动项（WorkItem type=todo 时带 assignee/deadline 若能从文本推断）。
  - 模型：gpt-4o-mini；JSON 数组 + Pydantic。

- **extract_events_node**
  - 输入：`state["input_data"]["events"]`。
  - 策略：会议列表直接格式化（title + description + time），一批送入 LLM，提取与项目/待办相关的 WorkItem（project_name 可从会议主题推断）。
  - 模型：gpt-4o-mini；JSON 数组 + Pydantic。

错误处理：单节点内 try/except，解析失败返回 [] 并 logger.warning；不 raise，保证图继续执行。

### 3.3 Aggregator 节点（Shuffle 阶段）

- 输入：`state["extracted_items"]`。
- 逻辑：
  - 按 `project_name` 分组（可先做简单归一化：去空格、转小写、或匹配「包含」合并相似名）。
  - 输出 `clustered_projects: Dict[str, List[WorkItem]]`。
- 无 LLM，纯 Python。

### 3.4 Generator 节点（Reduce 阶段）

- 输入：`state["clustered_projects"]`、可选 `state["extracted_items"]` 中 type=highlight 的项。
- 任务：生成与现有格式一致的 `summary`（overview + key_highlights）、`projects`（含 progress、key_milestones、focus_areas）、`today_todos`。
- 模型：gpt-4o；Prompt 明确输出 JSON schema（与当前 `identify_and_aggregate_projects` 返回结构一致），便于直接填入 `analysis_result`。

### 3.5 转换与 Enrich 节点（兼容层）

- 输入：Generator 输出的 JSON + `state["input_data"]`。
- 逻辑：
  - 将 `projects` 做 `_enrich_projects_with_docs`：按项目名匹配 related_documents、related_chats、related_events、related_emails（与现有 `ai_analyzer._enrich_projects_with_docs` 一致）。
  - 组装 `document_updates`（与现有 `_extract_document_updates` 一致）。
  - 写入 `state["analysis_result"]`，包含 `date`, `summary`, `projects`, `today_todos`, `document_updates`。

这样 `analyze_data()` 只需返回 `state["analysis_result"]`，下游无需改动。

---

## 四、LangGraph 构建要点

- 使用 `StateGraph(ReportState)`，节点函数签名为 `(state: ReportState) -> Partial[ReportState]`（或 Async 版本）。
- 并行：用 `add_conditional_edges` 或 LangGraph 的并行分支将四个 Extractor 同时执行，然后合并到 `extracted_items`（注意线程安全：先各自返回 partial updates，由框架 merge）。
- 合并策略：LangGraph 默认对 list 是 replace；若希望「每个 Extractor 往 state.extracted_items 追加」，需在 state 中设计为「每个节点返回 `{"extracted_items": self_items}"`，再在总图中用 reducer 将多路 `extracted_items` 合并为一条 list（或用一个「收集节点」接收多路输入并拼接）。
- 更简单做法：四个 Extractor 分别返回 `extracted_docs`, `extracted_emails`, `extracted_chats`, `extracted_events`，然后加一个 `merge_extracted_node` 合并为 `extracted_items`，再进入 Aggregate。

推荐边定义：

- `add_node("extract_docs", extract_docs_node)`，同理 emails/chats/events。
- `add_node("merge_extracted", merge_extracted_node)`
- `add_node("aggregate", aggregate_node)`
- `add_node("generate_report", generate_report_node)`
- `add_node("convert_to_legacy", convert_to_legacy_node)`
- 入口：`add_conditional_edges(START, [extract_docs_node, ...])` 指向四个并行节点；四条边都指向 `merge_extracted`；之后顺序 aggregate → generate_report → convert_to_legacy → END。

（若 LangGraph 版本支持「多起点并行」，则 START 可同时进 4 个 extract；否则用单节点内 asyncio.gather 调用 4 个 extract 子逻辑再合并到 state。）

---

## 五、配置与依赖

- **依赖**：`langgraph`、`langchain-openai`（或 `langchain-core` + OpenAI 兼容接口）、`pydantic>=2`。现有 `requirements.txt` 已有 pydantic 可兼容，新增 langgraph、langchain-openai。
- **环境变量**：沿用 `API_KEY`、`BASE_URL`；可选 `EXTRACT_MODEL=gpt-4o-mini`、`GENERATE_MODEL=gpt-4o`。
- **错误与日志**：Extractor/Generator 内所有 LLM 与 JSON 解析均 try/except，失败时记录并返回空或默认结构，保证图不中断。

---

## 六、实施顺序建议

1. **Phase 1**：在 `utils/` 下新增 `report_flow/`，实现 `state.py`（ReportState、WorkItem）、`nodes/extract_*.py`、`nodes/aggregate.py`、`nodes/generate_report.py`、`nodes/convert_to_legacy.py`，以及 `graph.py` 组装图。（**已完成**）
2. **Phase 2**：在 `AIReportAnalyzer.analyze_data()` 中默认使用 Flow；环境变量 `USE_FLOW_ENGINEERING=0`（或 `false`/`no`）时回退到原有一次性 LLM。（**已完成**）
3. **Phase 3**：对比两种路径的输出质量与耗时，再决定是否逐步移除旧逻辑。

**关闭 Flow Engineering**：在 `.env` 中设置 `USE_FLOW_ENGINEERING=0` 可回退到原有一次性 LLM。

---

## 七、输出契约（供实现时对照）

`analyze_data(collected_data)` 的返回值必须保持为：

```python
{
    "date": str,                    # ISO 日期
    "summary": {
        "overview": str,
        "key_highlights": List[str]
    },
    "projects": [
        {
            "name": str,
            "priority": str,
            "progress": str,
            "key_milestones": List[str],
            "focus_areas": List[str],
            "related_documents": List[dict],
            "related_chats": List[dict],
            "related_events": List[dict],
            "related_emails": List[dict]
        }
    ],
    "today_todos": [
        {"task": str, "assignee": str, "deadline": str, "priority": str, "source": str}
    ],
    "document_updates": List[dict]
}
```

Graph 的 `convert_to_legacy_node` 与 enrich 逻辑需保证上述结构完整，以便 `report_generator` 与定时任务无需修改。

---

## 八、运行与配置

### 8.1 需要配置的项

| 配置项 | 说明 | 示例 |
|--------|------|------|
| **API_KEY** | LLM 接口密钥（必填） | 已在 `.env` 中配置 |
| **BASE_URL** | LLM 接口地址（必填） | `https://api.openai.com/v1` |
| **MODEL** | 默认模型，Extract 未单独配置时也会用 | `gpt-4o-mini` |
| **EXTRACT_MODEL** | 可选。抽取阶段模型，不设则用 `MODEL` 或 gpt-4o-mini | `gpt-4o-mini` |
| **GENERATE_MODEL** | 可选。生成简报阶段模型，不设则用 gpt-4o | `gpt-4o` |
| **USE_FLOW_ENGINEERING** | 可选。默认 `1` 即用 Flow；设为 `0` 回退到一次性 LLM | `1` 或 `0` |

当前 `.env` 已有 `API_KEY`、`BASE_URL`、`MODEL` 即可跑 Flow；若希望「抽取用小模型、生成用大模型」，可在 `.env` 增加：

```env
EXTRACT_MODEL=gpt-4o-mini
GENERATE_MODEL=gpt-4o
```

### 8.2 运行方式

- **定时任务**：由 `scheduler` 触发的昨日简报会走 `analyze_data()`，默认即 Flow。
- **手动/API**：调用生成简报的接口（如 `app.py` 中触发展示）同样会走 `analyze_data()`。

无需改调用方，只要服务能连上 LLM 且 `.env` 正确即可。

### 8.3 需要关注的输出

1. **日志（INFO）**
   - `开始AI增强的数据分析`：进入分析流程。
   - `extract_docs_node: N documents -> M items`：文档抽取结果（N 篇文档 → M 条工作项）。
   - `extract_emails_node: N emails -> M items`：邮件抽取结果。
   - `extract_chats_node: N messages -> M items`：群聊抽取结果。
   - `extract_events_node: N events -> M items`：会议抽取结果。
   - `aggregate_node: N items -> M projects`：聚类结果（N 条工作项 → M 个项目）。
   - `Flow 分析完成: 识别到 X 个项目, 待办 Y 项`：Flow 成功结束，X/Y 即简报中的项目数与待办数。

2. **异常与回退**
   - 若出现 `LLM extract JSON decode error` 或 `LLM extract error`：某路抽取解析失败，该路返回空列表，**不中断**整图。
   - 若出现 `Flow 返回空结果，回退到原有逻辑`：Flow 返回的 `analysis_result` 为空，会自动用原有一次性 LLM 再跑一遍。

3. **结果**
   - 简报内容（飞书文档 / HTML / 机器人卡片）与之前结构一致，重点看「工作综述」「项目进展」「今日待办」是否正常、是否有遗漏。

---

## 九、Flow Engineering 已实现改动一览

| 层级 | 实现内容 | 位置 |
|------|----------|------|
| **状态** | `ReportState`（input_data、extracted_items 带 add 合并、clustered_projects、analysis_result）；`WorkItem`（Pydantic：project_name、type、summary、priority、source、assignee、deadline 等） | `utils/report_flow/state.py` |
| **Map 阶段** | 4 路 Extractor 并行：文档+多维表格、邮件、群聊、会议；每路分批送 LLM，输出 JSON 数组 → 解析为 `WorkItem`；解析失败返回 []，不中断 | `utils/report_flow/nodes/extract_*.py`、`_llm_extract.py` |
| **Shuffle 阶段** | Aggregator：纯 Python，按 `project_name` 归一化（去空格、小写）分组，无 LLM | `utils/report_flow/nodes/aggregate.py` |
| **Reduce 阶段** | Generator：输入 clustered_projects，用 gpt-4o 生成与现有格式一致的 summary + projects + today_todos JSON | `utils/report_flow/nodes/generate_report.py` |
| **兼容层** | Convert to Legacy：按项目名补充 related_documents/chats/events/emails，组装 document_updates，输出与 `analyze_data()` 同构 | `utils/report_flow/nodes/convert_to_legacy.py` |
| **图** | START → 4 个 Extractor（并行）→ Aggregate → Generate Report → Convert to Legacy → END | `utils/report_flow/graph.py` |
| **接入** | `AIReportAnalyzer.analyze_data()` 默认走 Flow（`USE_FLOW_ENGINEERING` 默认 1）；Flow 返回空时回退到原有一次性 LLM | `utils/ai_analyzer.py` |

**尚未实现**：Aggregator 中「按包含关系/同义词合并项目名」、独立 NER 模块（见下节）。

---

## 十、关于实体识别

**当前项目未实现传统意义上的「实体识别」（Named Entity Recognition，NER）。**

- **已有能力**：通过 LLM 从文档/邮件/群聊/会议中**语义识别**「项目名」（project_name）和「工作项类型」（project / progress / todo / risk / decision / highlight），以及可选的 assignee、deadline。这是**基于生成式模型的抽取**，不是基于 NER 模型的人名、组织、地点、时间等实体标注。
- **区别**：  
  - **NER**：通常指固定类型实体（人、组织、地点、时间、产品等）的边界与类型识别，多为序列标注或 span 分类。  
  - **当前实现**：由 LLM 按 prompt 输出结构化字段（project_name、type、summary 等），属于**项目/主题识别 + 工作项分类**，没有独立的实体识别模块或实体类型体系。
- **若要做实体识别**：需要单独设计，例如在 Extractor 之后增加 NER 节点（调用 NER 模型或 LLM 做实体抽取），将人名、组织、时间等写入 state，再供 Generator 或简报展示使用。

---

**文档结束。**
