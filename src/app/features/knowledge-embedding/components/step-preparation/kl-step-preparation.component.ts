import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * 知识库配置 - 步骤1：数据准备组件
 * 负责配置文档切块（Chunking）策略，包括块大小、重叠度及分隔符。
 */
@Component({
  selector: 'app-kl-step-preparation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kl-step-preparation.component.html'
})
export class KlStepPreparationComponent {
  /** 文本块大小 */
  chunkSize = input.required<number>();
  /** 文本块重叠大小 */
  chunkOverlap = input.required<number>();
  /** 分隔符配置列表 */
  separators = input.required<{ value: string, label: string, checked: boolean }[]>();

  chunkSizeChange = output<number>();
  chunkOverlapChange = output<number>();
  separatorsChange = output<{ value: string, label: string, checked: boolean }[]>();

  /**
   * 处理块大小变更事件
   * @param value 新的块大小数值
   */
  onChunkSizeChange(value: number) {
    this.chunkSizeChange.emit(value);
  }

  /**
   * 处理重叠度变更事件
   * @param value 新的重叠度数值
   */
  onChunkOverlapChange(value: number) {
    this.chunkOverlapChange.emit(value);
  }

  /**
   * 切换分隔符的启用状态
   * @param index 被操作的分隔符索引
   */
  toggleSeparator(index: number) {
    const newSeps = this.separators().map((s, i) => 
      i === index ? { ...s, checked: !s.checked } : s
    );
    this.separatorsChange.emit(newSeps);
  }
}
