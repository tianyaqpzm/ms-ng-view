import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * 知识库配置 - 步骤4：生成与集成组件
 * 负责配置大语言模型 (LLM) 的生成参数，包括模型选择、温度值及系统提示词。
 */
@Component({
  selector: 'app-kl-step-generation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kl-step-generation.component.html'
})
export class KlStepGenerationComponent {
  /** 生成模型名称 */
  generationModel = input.required<string>();
  /** 生成随机性 (Temperature) */
  temperature = input.required<number>();
  /** 系统提示词 (System Prompt) */
  systemPrompt = input.required<string>();

  generationModelChange = output<string>();
  temperatureChange = output<number>();
  systemPromptChange = output<string>();

  onModelChange(value: string) {
    this.generationModelChange.emit(value);
  }

  onTemperatureChange(value: number) {
    this.temperatureChange.emit(value);
  }

  /**
   * 处理系统提示词变更事件
   * @param value 新的提示词内容
   */
  onPromptChange(value: string) {
    this.systemPromptChange.emit(value);
  }
}
