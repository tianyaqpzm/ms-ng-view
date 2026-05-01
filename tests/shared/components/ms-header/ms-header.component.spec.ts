import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsHeaderComponent } from '../../../../src/app/shared/components/ms-header/ms-header.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ThemeService } from '../../../../src/app/core/services/theme.service';
import { UserService } from '../../../../src/app/core/services/user.service';
import { LanguageService } from '../../../../src/app/core/services/language.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('MsHeaderComponent (Global Header)', () => {
  let component: MsHeaderComponent;
  let fixture: ComponentFixture<MsHeaderComponent>;
  
  // Mock services
  const mockThemeService = {
    isDarkMode: signal(false),
    toggleTheme: jest.fn()
  };
  
  const mockUserService = {
    currentUser: signal({ name: 'Test User', avatar: '' })
  };
  
  const mockLanguageService = {
    currentLang: signal('zh'),
    toggleLanguage: jest.fn()
  };

  const mockRouter = {
    events: of({}),
    url: '/',
    navigate: jest.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MsHeaderComponent, 
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        { provide: UserService, useValue: mockUserService },
        { provide: LanguageService, useValue: mockLanguageService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MsHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('应该显示品牌名称 "ms-ng-view AI"', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('ms-ng-view AI');
  });

  it('当用户登录时，应显示用户名', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test User');
  });

  it('点击语言切换按钮应调用 toggleLanguage', () => {
    const langButton = fixture.nativeElement.querySelector('button'); // First button is lang
    langButton.click();
    expect(mockLanguageService.toggleLanguage).toHaveBeenCalled();
  });

  it('点击主题切换按钮应调用 toggleTheme', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const themeButton = buttons[1]; // Second button is theme
    themeButton.click();
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });

  it('当 visible 为 false 时，不应渲染 header', () => {
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('header');
    expect(header).toBeNull();
  });
});
