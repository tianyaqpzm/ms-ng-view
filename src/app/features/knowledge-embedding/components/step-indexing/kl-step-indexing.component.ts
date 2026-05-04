import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * 知识库配置 - 步骤2：构建索引组件
 * 负责选择向量化模型（Embedding Model）以及向量数据库（Vector Store）。
 */
@Component({
  selector: 'app-kl-step-indexing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kl-step-indexing.component.html'
})
export class KlStepIndexingComponent {
  /** 向量化模型名称 */
  embeddingModel = input.required<string>();
  /** 向量数据库类型 */
  vectorStore = input.required<string>();

  embeddingModelChange = output<string>();
  vectorStoreChange = output<string>();

  /**
   * 处理模型变更事件
   * @param value 新的模型名称
   */
  onModelChange(value: string) {
    this.embeddingModelChange.emit(value);
  }

  /**
   * 处理存储引擎变更事件
   * @param value 新的存储引擎名称
   */
  onStoreChange(value: string) {
    this.vectorStoreChange.emit(value);
  }
}
