import { TestBed } from '@angular/core/testing';
import { EventUseCase } from '@/app/core/use-cases/event/event.usecase';
import { EventApiAdapter } from '@/app/core/adapters/event/event-api.adapter';
import { TimerService } from '@/app/core/services/timer.service';
import { of } from 'rxjs';
import { TimeLimitedEvent } from '@/app/core/domain/event/event.model';

describe('EventUseCase', () => {
  let useCase: EventUseCase;
  let adapterMock: jest.Mocked<EventApiAdapter>;

  const mockEvents: TimeLimitedEvent[] = [
    {
      id: '1',
      title: 'Event 1',
      category: 'Birthday',
      date: new Date(Date.now() + 100000),
      time: '12:00',
      repeatYearly: false,
      appearance: { type: 'color', value: '#000' },
      createdAt: new Date()
    }
  ];

  beforeEach(() => {
    adapterMock = {
      getAllEvents: jest.fn().mockReturnValue(of(mockEvents)),
      getEventById: jest.fn(),
      createEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn().mockReturnValue(of(void 0))
    } as any;

    TestBed.configureTestingModule({
      providers: [
        EventUseCase,
        { provide: EventApiAdapter, useValue: adapterMock },
        { provide: TimerService, useValue: { getTimeParts: jest.fn() } }
      ]
    });

    useCase = TestBed.inject(EventUseCase);
  });

  it('should load events', async () => {
    await useCase.loadEvents();
    expect(adapterMock.getAllEvents).toHaveBeenCalled();
    expect(useCase.allEvents().length).toBe(1);
  });
});
