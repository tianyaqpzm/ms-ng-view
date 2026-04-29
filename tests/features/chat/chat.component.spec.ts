import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChatComponent } from '@/app/features/chat/chat.component';
import { DeleteConfirmDialogComponent } from '@/app/features/chat/delete-confirm-dialog.component';
import { ChatUseCase } from '@/app/core/use-cases/chat/chat.usecase';
import { KnowledgeUseCase } from '@/app/core/use-cases/knowledge/knowledge.usecase';
import { UserService } from '@/app/core/services/user.service';
import { ThemeService } from '@/app/core/services/theme.service';
import { AuthService } from '@/app/core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { signal } from '@angular/core';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let useCaseMock: any;
  let knowledgeUseCaseMock: any;
  let dialogMock: any;
  let paramsSubject: Subject<any>;

  beforeEach(async () => {
    paramsSubject = new Subject();
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
      switchSession: jest.fn(),
      deleteSession: jest.fn()
    };

    knowledgeUseCaseMock = {
      topics: signal([]),
      selectedTopic: signal(null),
      selectedTopicId: signal(null),
      refreshTopics: jest.fn().mockResolvedValue([])
    };

    dialogMock = {
      open: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ChatComponent, TranslateModule.forRoot(), MatDialogModule, NoopAnimationsModule],
      providers: [
        { provide: ChatUseCase, useValue: useCaseMock },
        { provide: KnowledgeUseCase, useValue: knowledgeUseCaseMock },
        { provide: UserService, useValue: { currentUser: signal(null) } },
        { provide: ThemeService, useValue: { isDarkMode: signal(false), toggleTheme: jest.fn() } },
        { provide: AuthService, useValue: { logout: jest.fn() } },
        { provide: TranslateService, useValue: { instant: jest.fn().mockReturnValue('') } },
        { 
          provide: ActivatedRoute, 
          useValue: { params: paramsSubject.asObservable() } 
        },
        { provide: MatDialog, useValue: dialogMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    
    // Pushing initial value before detectChanges so it's captured in constructor
    paramsSubject.next({ sessionId: '123' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadHistory on init with sessionId', () => {
    expect(useCaseMock.loadHistory).toHaveBeenCalledWith('123');
  });

  it('should have sidebar open by default', () => {
    expect((component as any).isSidebarOpen()).toBe(true);
  });

  it('should reset state when sessionId is missing', () => {
    // Manually trigger the subscription with empty params
    paramsSubject.next({});
    
    expect(useCaseMock.activeSessionId()).toBe('');
    expect(useCaseMock.messages()).toEqual([]);
  });

  it('onDeleteSession should open dialog and call usecase on confirm', () => {
    const sessionId = '123';
    const stopPropagationSpy = jest.fn();
    const event = { stopPropagation: stopPropagationSpy } as any;
    const dialogRefMock = {
      afterClosed: jest.fn().mockReturnValue(of(true))
    };
    dialogMock.open.mockReturnValue(dialogRefMock);
    
    (component as any).onDeleteSession(event, sessionId);
    
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(dialogMock.open).toHaveBeenCalledWith(DeleteConfirmDialogComponent, expect.any(Object));
    expect(useCaseMock.deleteSession).toHaveBeenCalledWith(sessionId);
  });
});
