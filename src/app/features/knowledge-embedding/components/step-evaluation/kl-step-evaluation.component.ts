import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * 知识库配置 - 步骤5：系统评估组件
 * 负责开启 RAG 评估功能并选择具体的评估指标（如准确性、相关性等）。
 */
@Component({
  selector: 'app-kl-step-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kl-step-evaluation.component.html'
})
export class KlStepEvaluationComponent {
  /** 是否开启自动评估 */
  enableEvaluation = input.required<boolean>();
  /** 选中的评估指标列表 */
  evaluationMetrics = input.required<string[]>();

  enableEvaluationChange = output<boolean>();
  evaluationMetricsChange = output<string[]>();

  onEnableChange(value: boolean) {
    this.enableEvaluationChange.emit(value);
  }

  /**
   * 切换评估指标的选中状态
   * @param metric 指标名称
   */
  toggleMetric(metric: string) {
    const current = this.evaluationMetrics();
    const next = current.includes(metric)
      ? current.filter(m => m !== metric)
      : [...current, metric];
    this.evaluationMetricsChange.emit(next);
  }
}
