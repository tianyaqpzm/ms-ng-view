import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'citation',
  standalone: true
})
export class CitationPipe implements PipeTransform {
  /**
   * 将大模型返回的 [^1^] 格式替换为自定义的 HTML 标签
   * 格式: <span class="citation-tag" data-id="1">[1]</span>
   */
  transform(value: string | null): string {
    if (!value) return '';
    
    // 匹配 [^数字^] 格式
    const regex = /\[\^(\d+)\^\]/g;
    
    return value.replace(regex, (match, id) => {
      return `<span class="citation-tag" data-id="${id}">[${id}]</span>`;
    });
  }
}
