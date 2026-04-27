import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@/environments/environment';
import { AuthService } from '@/app/core/services/auth.service';
import { apiUrlInterceptor } from '@/app/core/interceptors/base-url.interceptor';
import { DOCUMENT } from '@angular/common';

describe('apiUrlInterceptor (TI-01 ~ TI-03)', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let mockDocument: any;

  beforeEach(() => {
    mockDocument = {
      defaultView: {
        location: {
          href: 'http://localhost/current-page'
        }
      }
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiUrlInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            getToken: jest.fn().mockReturnValue(null),
            removeToken: jest.fn(),
            isRedirecting: false
          }
        },
        {
          provide: DOCUMENT,
          useValue: mockDocument
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    
    // Suppress logging noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    httpMock.verify();
    jest.restoreAllMocks();
  });

  it('should prepend baseUrl to relative urls (TI-01)', () => {
    httpClient.get('/test').subscribe();

    const req = httpMock.expectOne(`${environment.VITE_API_URL}/test`);
    expect(req.request.url).toContain(environment.VITE_API_URL);
  });

  it('should inject Authorization header when token exists (TI-02)', () => {
    (authService.getToken as jest.Mock).mockReturnValue('valid-token');
    httpClient.get('/test').subscribe();

    const req = httpMock.expectOne(`${environment.VITE_API_URL}/test`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
  });

  it('should handle 401 error and trigger redirect logic (TI-03)', () => {
    // 模拟 401 响应
    httpClient.get('/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
      }
    });

    const req = httpMock.expectOne(`${environment.VITE_API_URL}/test`);
    req.flush({ url: '/login-path' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.isRedirecting).toBe(true);
    expect(authService.removeToken).toHaveBeenCalled();
    
    // 验证跳转 URL
    const expectedRedirect = encodeURIComponent('http://localhost/current-page');
    expect(mockDocument.defaultView.location.href).toContain('/login-path');
    expect(mockDocument.defaultView.location.href).toContain(`redirect=${expectedRedirect}`);
  });
});
