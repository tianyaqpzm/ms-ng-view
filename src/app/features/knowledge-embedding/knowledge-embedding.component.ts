import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { KnowledgeUseCase } from '../../core/use-cases/knowledge/knowledge.usecase';
import { KlStepPreparationComponent } from './components/step-preparation/kl-step-preparation.component';
import { KlStepIndexingComponent } from './components/step-indexing/kl-step-indexing.component';
import { KlStepRetrievalComponent } from './components/step-retrieval/kl-step-retrieval.component';
import { KlStepGenerationComponent } from './components/step-generation/kl-step-generation.component';
import { KlStepEvaluationComponent } from './components/step-evaluation/kl-step-evaluation.component';

/**
 * 知识库嵌入与配置主组件
 * 采用分步工作流引导用户配置 RAG 全链路策略：
 * 1. 数据准备 -> 2. 构建索引 -> 3. 检索优化 -> 4. 生成集成 -> 5. 系统评估
 * 
 * 组件通过 Angular Signals 进行状态管理，并协调 5 个 KL 子组件的配置同步。
 */
@Component({
  selector: 'app-knowledge-embedding',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    KlStepPreparationComponent,
    KlStepIndexingComponent,
    KlStepRetrievalComponent,
    KlStepGenerationComponent,
    KlStepEvaluationComponent
  ],
  templateUrl: './knowledge-embedding.component.html'
})
export class KnowledgeEmbeddingComponent implements OnInit {
  private useCase = inject(KnowledgeUseCase);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Document context
  documentId = signal<string | null>(null);
  documentName = signal<string>('当前选中知识文档'); // Can load from backend
// ... (rest of signals remain same as they are UI-local for this specific form)
  chunkSize = signal<number>(1000);
  chunkOverlap = signal<number>(200);
  separators = signal<{ value: string, label: string, checked: boolean }[]>([
    { value: '\\n\\n', label: '按段落分割 (\\n\\n)', checked: true },
    { value: '\\n', label: '按换行分割 (\\n)', checked: true },
    { value: '。', label: '按句号分割 (。)', checked: false },
    { value: ';', label: '按分号分割 (;)', checked: false },
  ]);

  embeddingModel = signal<string>('text-embedding-3-small');
  vectorStore = signal<string>('pgvector');

  topK = signal<number>(5);
  scoreThreshold = signal<number>(0.7);
  enableHybridSearch = signal<boolean>(true);
  alphaWeight = signal<number>(0.5); // 0.0=BM25, 1.0=Vector

  // Generation Settings
  generationModel = signal<string>('gpt-4o-mini');
  temperature = signal<number>(0.7);
  maxTokens = signal<number>(1000);
  systemPrompt = signal<string>('你是一个专业的智能助手。请基于提供的上下文回答用户的问题。如果上下文中没有相关信息，请诚实告知。');

  // Evaluation Settings
  enableEvaluation = signal<boolean>(true);
  evaluationMetrics = signal<string[]>(['Faithfulness', 'Answer Relevancy', 'Context Precision']);

  isBuilding = signal<boolean>(false);
  buildProgress = signal<number>(0);
  buildLogs = signal<string[]>([]);

  // Navigation
  currentStep = signal<number>(1);
  steps = [
    { id: 1, title: '数据准备', subtitle: 'Data Preparation', icon: 'FileText', description: '处理并加载多格式文档（如 PDF、TXT 等），然后执行文本分块（Chunking），优化切分策略以保留上下文语义' },
    { id: 2, title: '构建索引', subtitle: 'Indexing', icon: 'Database', description: '利用文本或多模态向量化技术（Embeddings）将分块数据转换为向量，并存入向量数据库中完成索引构建与性能调优' },
    { id: 3, title: '检索优化', subtitle: 'Retrieval', icon: 'Search', description: '涉及稠密与稀疏结合的“混合检索”、智能查询理解与重构（Query Building）、以及自然语言转 SQL (Text2SQL) 等高级检索算法' },
    { id: 4, title: '生成与集成', subtitle: 'Generation', icon: 'Cpu', description: '将检索得到的高质量内容作为上下文输入给大语言模型，并进行结构化输出与格式控制' },
    { id: 5, title: '系统评估', subtitle: 'Evaluation', icon: 'CheckCircle', description: '引入一套标准的方法论、常用评估工具与指标，对 RAG 系统的整体回答质量进行量化验证' }
  ];

  /**
   * 初始化组件
   * 从路由参数中提取文档 ID
   */
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.documentId.set(id);
      }
    });
  }

  goBack() {
    this.router.navigate(['/knowledge']);
  }

  resetConfig() {
    this.chunkSize.set(1000);
    this.chunkOverlap.set(200);
    this.embeddingModel.set('text-embedding-3-small');
    this.topK.set(5);
    this.scoreThreshold.set(0.7);
    this.enableHybridSearch.set(true);
    this.alphaWeight.set(0.5);
  }

  /**
   * 核心业务逻辑：启动索引构建与配置同步任务
   * 1. 收集所有子组件同步上来的 Signals 状态。
   * 2. 构建符合后端接口标准的 Payload。
   * 3. 调用 UseCase 发起异步 Ingest 任务。
   * 4. 模拟并展示执行过程中的终端日志与进度。
   */
  async buildIndex() {
    if (this.isBuilding() || !this.documentId()) return;

    this.isBuilding.set(true);
    this.buildProgress.set(0);
    this.buildLogs.set(['开始向调度中心提交任务...', '准备加载分块策略与文档元数据...']);

    try {
      const selectedSeps = this.separators().filter(s => s.checked).map(s => s.value);

      const payload = {
        chunkSize: this.chunkSize(),
        chunkOverlap: this.chunkOverlap(),
        separators: selectedSeps,
        embeddingModel: this.embeddingModel(),
        vectorStore: this.vectorStore(),
        topK: this.topK(),
        scoreThreshold: this.scoreThreshold(),
        enableHybridSearch: this.enableHybridSearch(),
        alphaWeight: this.alphaWeight(),
        // Generation
        generationModel: this.generationModel(),
        temperature: this.temperature(),
        maxTokens: this.maxTokens(),
        systemPrompt: this.systemPrompt(),
        // Evaluation
        enableEvaluation: this.enableEvaluation(),
        evaluationMetrics: this.evaluationMetrics()
      };

      const progressTimer = setInterval(() => {
        this.buildProgress.update(p => p < 90 ? p + Math.floor(Math.random() * 10) : p);
        if (this.buildProgress() === 20) this.buildLogs.update(logs => [...logs, `1. 数据准备: 传递分隔符并切块 (Size: ${this.chunkSize()})`]);
        if (this.buildProgress() === 40) this.buildLogs.update(logs => [...logs, `2. 构建索引: 向量化并调用 ${this.embeddingModel()}`]);
        if (this.buildProgress() === 60) this.buildLogs.update(logs => [...logs, `3. 检索优化: 配置 ${this.enableHybridSearch() ? '混合检索' : '单向量检索'} 策略`]);
        if (this.buildProgress() === 80) this.buildLogs.update(logs => [...logs, `4. 生成集成: 绑定模型 ${this.generationModel()}`]);
      }, 500);

      // Delegate to UseCase
      const res = await this.useCase.startIngestTask(this.documentId()!, payload);

      clearInterval(progressTimer);
      this.buildProgress.set(100);
      
      if (this.enableEvaluation()) {
          this.buildLogs.update(logs => [...logs, '5. 系统评估: 正在启动异步自动评估流程...']);
      }
      
      this.buildLogs.update(logs => [...logs, '索引构建完成。RAG 全流程策略已生效！']);
    } catch (e: any) {
      this.buildProgress.set(100);
      this.buildLogs.update(logs => [...logs, `[ERROR] 任务失败: ${e.message}`, '请检查 ms-py-agent 是否在线']);
    } finally {
      setTimeout(() => {
        this.isBuilding.set(false);
      }, 3000);
    }
  }
}
