import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * 知识库配置 - 步骤3：检索优化组件
 * 负责配置检索参数，如召回数量 (Top-K)、分值阈值以及混合检索策略。
 */
@Component({
  selector: 'app-kl-step-retrieval',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kl-step-retrieval.component.html'
})
export class KlStepRetrievalComponent {
  /** 检索召回数量 */
  topK = input.required<number>();
  /** 相似度分值阈值 */
  scoreThreshold = input.required<number>();
  /** 是否开启混合检索 */
  enableHybridSearch = input.required<boolean>();
  /** 权重比例 (Alpha) */
  alphaWeight = input.required<number>();

  topKChange = output<number>();
  scoreThresholdChange = output<number>();
  enableHybridSearchChange = output<boolean>();
  alphaWeightChange = output<number>();

  /**
   * 处理 Top-K 变更事件
   * @param value 新的召回数量
   */
  onTopKChange(value: number) {
    this.topKChange.emit(value);
  }

  onScoreThresholdChange(value: number) {
    this.scoreThresholdChange.emit(value);
  }

  onHybridSearchChange(value: boolean) {
    this.enableHybridSearchChange.emit(value);
  }

  /**
   * 处理 Alpha 权重变更事件
   * @param value 新的权重值
   */
  onAlphaWeightChange(value: number) {
    this.alphaWeightChange.emit(value);
  }
}
