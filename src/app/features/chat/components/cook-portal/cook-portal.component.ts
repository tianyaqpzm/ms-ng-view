import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cook-portal',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './cook-portal.component.html',
  styleUrl: './cook-portal.component.css'
})
export class CookPortalComponent {
  /** 菜系分类选择事件 */
  public selectCategory = output<string>();

  protected cookCategories = [
    { id: 1, name: '四川火锅', image: '/assets/images/cook/szechuan.png', pos: '0 0' },
    { id: 2, name: '广式点心', image: '/assets/images/cook/szechuan.png', pos: '100% 0' },
    { id: 3, name: '鲁菜/东坡肉', image: '/assets/images/cook/szechuan.png', pos: '0 100%' },
    { id: 4, name: '苏菜/清蒸鲈鱼', image: '/assets/images/cook/szechuan.png', pos: '100% 100%' },
    { id: 5, name: '浙菜', image: '/assets/images/cook/zhejiang.png', pos: '0 0' },
    { id: 6, name: '佛跳墙', image: '/assets/images/cook/zhejiang.png', pos: '100% 0' },
    { id: 7, name: '剁椒鱼头', image: '/assets/images/cook/zhejiang.png', pos: '0 100%' },
    { id: 8, name: '徽菜', image: '/assets/images/cook/zhejiang.png', pos: '100% 100%' },
    { id: 9, name: '意大利面', image: '/assets/images/cook/western.png', pos: '0 0' },
    { id: 10, name: '日式寿司', image: '/assets/images/cook/western.png', pos: '100% 0' },
    { id: 11, name: '法式舒芙蕾', image: '/assets/images/cook/western.png', pos: '0 100%' },
    { id: 12, name: '水果奶昔', image: '/assets/images/cook/western.png', pos: '100% 100%' }
  ];

  protected recommendedRecipes = [
    { id: 1, name: '玉米肉沫拌饭', difficulty: '中等', difficultyColor: 'orange', image: '/assets/images/cook/szechuan.png', pos: '0 0' },
    { id: 2, name: '五彩冰粉', difficulty: '困难', difficultyColor: 'red', image: '/assets/images/cook/szechuan.png', pos: '100% 0' },
    { id: 3, name: '奶香玉米汁', difficulty: '简单', difficultyColor: 'green', image: '/assets/images/cook/western.png', pos: '100% 100%' }
  ];

  protected onSelect(name: string) {
    this.selectCategory.emit(name);
  }

  protected onSelectRecipe(name: string) {
    this.selectCategory.emit(name);
  }
}
