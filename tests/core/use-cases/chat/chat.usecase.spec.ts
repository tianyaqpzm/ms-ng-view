import { TestBed } from '@angular/core/testing';
import { ChatUseCase } from '@/app/core/use-cases/chat/chat.usecase';
import { ChatApiAdapter } from '@/app/core/adapters/chat/chat-api.adapter';
import { MediaDeviceAdapter } from '@/app/core/adapters/device/media-device.adapter';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';

describe('ChatUseCase', () => {
  let usecase: ChatUseCase;
  let chatApiMock: any;
  let mediaAdapterMock: any;
  let routerMock: any;

  beforeEach(() => {
    chatApiMock = {
      getHistory: jest.fn().mockReturnValue(of([])),
      getSessions: jest.fn().mockReturnValue(of([])),
      sendMessageStream: jest.fn().mockReturnValue(of('')),
      deleteSession: jest.fn().mockReturnValue(of(void 0))
    };
    mediaAdapterMock = {
      getAudioStream: jest.fn(),
      getVideoStream: jest.fn()
    };
    routerMock = {
      navigate: jest.fn(),
      url: '/chat'
    };

    TestBed.configureTestingModule({
      providers: [
        ChatUseCase,
        { provide: ChatApiAdapter, useValue: chatApiMock },
        { provide: MediaDeviceAdapter, useValue: mediaAdapterMock },
        { provide: Router, useValue: routerMock }
      ]
    });
    usecase = TestBed.inject(ChatUseCase);
  });

  it('should be created', () => {
    expect(usecase).toBeTruthy();
  });

  it('loadHistory should update messages and activeSessionId', () => {
    const mockMessages = [{ role: 'user', content: 'hello' }];
    chatApiMock.getHistory.mockReturnValue(of(mockMessages));
    
    usecase.loadHistory('session-1');
    
    expect(usecase.activeSessionId()).toBe('session-1');
    expect(usecase.messages()).toEqual(mockMessages);
  });

  it('createNewSession should navigate to /chat', () => {
    usecase.createNewSession();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/chat']);
  });

  it('sendMessage should generate 16-char hex ID if current ID is empty', () => {
    usecase.activeSessionId.set('');
    usecase.sendMessage('Hello', null, (key) => key);
    
    expect(usecase.activeSessionId()).toMatch(/^[0-9a-f]{16}$/);
    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/chat', usecase.activeSessionId()],
      { replaceUrl: true }
    );
  });
  
  it('deleteSession should call API, update sessions, and navigate if active', () => {
    const sessionId = 'session-to-delete';
    const mockSessions = [
      { sessionId: 'session-to-delete', title: 'Deleted', lastActiveTime: '2023-01-01' },
      { sessionId: 'other-session', title: 'Other', lastActiveTime: '2023-01-02' }
    ];
    usecase.chatSessions.set(mockSessions);
    usecase.activeSessionId.set(sessionId);
    chatApiMock.deleteSession.mockReturnValue(of(void 0));
    
    usecase.deleteSession(sessionId);
    
    expect(chatApiMock.deleteSession).toHaveBeenCalledWith(sessionId);
    expect(usecase.chatSessions()).toEqual([mockSessions[1]]);
    expect(usecase.activeSessionId()).toBe('');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/chat']);
  });
});
