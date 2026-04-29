import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EventApiAdapter } from '@/app/core/adapters/event/event-api.adapter';
import { TimeLimitedEvent } from '@/app/core/domain/event/event.model';
import { URLConfig } from '@/app/core/constants/url.config';

describe('EventApiAdapter', () => {
  let adapter: EventApiAdapter;
  let httpMock: HttpTestingController;

  const mockEvent: TimeLimitedEvent = {
    id: '1',
    title: 'Test Event',
    category: 'Birthday',
    date: new Date(),
    time: '12:00',
    repeatYearly: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventApiAdapter,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    adapter = TestBed.inject(EventApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAllEvents should fetch from correct URL', () => {
    adapter.getAllEvents().subscribe(events => {
      expect(events.length).toBe(1);
    });

    const req = httpMock.expectOne(URLConfig.EVENTS.BASE);
    expect(req.request.method).toBe('GET');
    req.flush([mockEvent]);
  });

  it('createEvent should post to correct URL', () => {
    adapter.createEvent(mockEvent).subscribe(event => {
      expect(event.title).toBe(mockEvent.title);
    });

    const req = httpMock.expectOne(URLConfig.EVENTS.BASE);
    expect(req.request.method).toBe('POST');
    req.flush(mockEvent);
  });
});
