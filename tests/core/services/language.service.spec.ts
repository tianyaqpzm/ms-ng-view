import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../src/app/core/services/language.service';
import { of } from 'rxjs';

describe('LanguageService (TL-01 ~ TL-03)', () => {
  let service: LanguageService;
  let translate: TranslateService;

  beforeEach(() => {
    // Mock TranslateService
    const translateSpy = {
      use: jest.fn().mockReturnValue(of({})),
      addLangs: jest.fn(),
      setDefaultLang: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: translateSpy }
      ]
    });

    service = TestBed.inject(LanguageService);
    translate = TestBed.inject(TranslateService);
    
    // Clear localStorage
    localStorage.clear();
  });

  it('should initialize with default language (TL-01)', () => {
    expect(service.currentLang()).toBe('zh');
    expect(service.isChinese()).toBe(true);
  });

  it('toggleLanguage should switch between zh and en (TL-02)', () => {
    // Default is zh
    service.toggleLanguage();
    expect(translate.use).toHaveBeenCalledWith('en');
    expect(service.currentLang()).toBe('en');
    expect(localStorage.getItem('lang')).toBe('en');

    // Switch back
    service.toggleLanguage();
    expect(translate.use).toHaveBeenCalledWith('zh');
    expect(service.currentLang()).toBe('zh');
    expect(localStorage.getItem('lang')).toBe('zh');
  });

  it('setLanguage should update state and localStorage (TL-03)', () => {
    service.setLanguage('en');
    expect(translate.use).toHaveBeenCalledWith('en');
    expect(service.currentLang()).toBe('en');
    expect(localStorage.getItem('lang')).toBe('en');
  });
});
