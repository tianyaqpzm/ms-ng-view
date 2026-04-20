import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { KnowledgeService } from '../../core/services/knowledge.service';

@Component({
  selector: 'app-knowledge-embedding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knowledge-embedding.component.html'
})
export class KnowledgeEmbeddingComponent implements OnInit {
  private knowledgeService = inject(KnowledgeService);

  // Document context
  documentId = signal<string | null>(null);
  documentName = signal<string>('当前选中知识文档'); // Can load from backend

  // Section: Chunking
  chunkSize = signal<number>(1000);
  chunkOverlap = signal<number>(200);
  separators = signal<{ value: string, label: string, checked: boolean }[]>([
    { value: '\\n\\n', label: '按段落分割 (\\n\\n)', checked: true },
    { value: '\\n', label: '按换行分割 (\\n)', checked: true },
    { value: '。', label: '按句号分割 (。)', checked: false },
    { value: ';', label: '按分号分割 (;)', checked: false },
  ]);

  // Section: Indexing & Model
  embeddingModel = signal<string>('text-embedding-3-small');
  vectorStore = signal<string>('pgvector');

  // Section: Retrieval Strategy
  topK = signal<number>(5);
  scoreThreshold = signal<number>(0.7);
  enableHybridSearch = signal<boolean>(true);
  alphaWeight = signal<number>(0.5); // 0.0=BM25, 1.0=Vector

  // Status
  isBuilding = signal<boolean>(false);
  buildProgress = signal<number>(0);
  buildLogs = signal<string[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.documentId.set(id);
      }
    });
  }

  toggleSeparator(index: number) {
    this.separators.update(seps =>
      seps.map((s, i) => i === index ? { ...s, checked: !s.checked } : s)
    );
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

  async buildIndex() {
    if (this.isBuilding() || !this.documentId()) return;

    this.isBuilding.set(true);
    this.buildProgress.set(0);
    this.buildLogs.set(['开始向调度中心提交任务...', '准备加载分块策略与文档元数据...']);

    try {
      // 提取勾选的分隔符
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
        alphaWeight: this.alphaWeight()
      };

      // 异步模拟进度与真实调用的并发
      const progressTimer = setInterval(() => {
        this.buildProgress.update(p => p < 90 ? p + Math.floor(Math.random() * 10) : p);
        if (this.buildProgress() === 30) this.buildLogs.update(logs => [...logs, `传递分隔符并切块 (Size: ${this.chunkSize()})`]);
        if (this.buildProgress() === 60) this.buildLogs.update(logs => [...logs, `向量化并调用: ${this.embeddingModel()}`]);
      }, 500);

      // 发起真正的 API 调用
      const res = await this.knowledgeService.startIngestTask(this.documentId()!, payload);

      clearInterval(progressTimer);
      this.buildProgress.set(100);
      this.buildLogs.update(logs => [...logs, `系统返回: ${JSON.stringify(res).substring(0, 100)}...`, '索引构建完成。检索策略已生效！']);
    } catch (e: any) {
      this.buildProgress.set(100);
      this.buildLogs.update(logs => [...logs, `[ERROR] 任务失败: ${e.message}`, '请检查 Python Agent 是否在线']);
    } finally {
      setTimeout(() => {
        this.isBuilding.set(false);
      }, 3000);
    }
  }
}
