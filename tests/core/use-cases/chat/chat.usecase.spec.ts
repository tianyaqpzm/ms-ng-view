import { TestBed } from '@angular/core/testing';
import { ChatUseCase } from '@/app/core/use-cases/chat/chat.usecase';
import { ChatApiAdapter } from '@/app/core/adapters/chat/chat-api.adapter';
import { MediaDeviceAdapter } from '@/app/core/adapters/device/media-device.adapter';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('ChatUseCase', () => {
  let usecase: ChatUseCase;
  let chatApiMock: any;
  let mediaAdapterMock: any;
  let routerMock: any;

  beforeEach(() => {
    chatApiMock = {
      getHistory: jest.fn().mockReturnValue(of([])),
      getSessions: jest.fn().mockReturnValue(of([])),
      sendMessageStream: jest.fn()
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

  it('createNewSession should navigate to a new UUID', () => {
    usecase.createNewSession();
    expect(routerMock.navigate).toHaveBeenCalledWith(
      expect.arrayContaining(['/chat', expect.any(String)]),
      expect.any(Object)
    );
  });
});
