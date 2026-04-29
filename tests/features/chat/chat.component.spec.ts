import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from '@/app/features/chat/chat.component';
import { ChatUseCase } from '@/app/core/use-cases/chat/chat.usecase';
import { KnowledgeUseCase } from '@/app/core/use-cases/knowledge/knowledge.usecase';
import { UserService } from '@/app/core/services/user.service';
import { ThemeService } from '@/app/core/services/theme.service';
import { AuthService } from '@/app/core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let useCaseMock: any;
  let knowledgeUseCaseMock: any;

  beforeEach(async () => {
    useCaseMock = {
      messages: signal([]),
      selectedFiles: signal([]),
      isRecording: signal(false),
      isCameraOpen: signal(false),
      isThinking: signal(false),
      activeSessionId: signal(''),
      chatSessions: signal([]),
      responseRatings: signal(new Map()),
      loadHistory: jest.fn(),
      refreshSessionsListSilently: jest.fn().mockResolvedValue([]),
      createNewSession: jest.fn(),
      switchSession: jest.fn()
    };

    knowledgeUseCaseMock = {
      topics: signal([]),
      selectedTopic: signal(null),
      selectedTopicId: signal(null),
      refreshTopics: jest.fn().mockResolvedValue([])
    };

    await TestBed.configureTestingModule({
      imports: [ChatComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ChatUseCase, useValue: useCaseMock },
        { provide: KnowledgeUseCase, useValue: knowledgeUseCaseMock },
        { provide: UserService, useValue: { currentUser: signal(null) } },
        { provide: ThemeService, useValue: { isDarkMode: signal(false), toggleTheme: jest.fn() } },
        { provide: AuthService, useValue: { logout: jest.fn() } },
        { 
          provide: ActivatedRoute, 
          useValue: { params: of({ sessionId: '123' }) } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadHistory on init with sessionId', () => {
    expect(useCaseMock.loadHistory).toHaveBeenCalledWith('123');
  });
});
