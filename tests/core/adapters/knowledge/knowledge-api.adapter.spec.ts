import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { KnowledgeApiAdapter } from '@/app/core/adapters/knowledge/knowledge-api.adapter';
import { URLConfig } from '@/app/core/constants/url.config';

describe('KnowledgeApiAdapter', () => {
  let adapter: KnowledgeApiAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        KnowledgeApiAdapter,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    adapter = TestBed.inject(KnowledgeApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getTopics should fetch topics from correct URL', async () => {
    const mockTopics = [{ id: '1', name: 'Topic 1', icon: 'Folder', desc: 'Desc' }];
    const promise = adapter.getTopics();

    const req = httpMock.expectOne(`${URLConfig.KNOWLEDGE.BASE}/topics`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTopics);

    const topics = await promise;
    expect(topics.length).toBe(1);
    expect(topics[0].name).toBe('Topic 1');
  });

  it('uploadDocument should post to upload URL', async () => {
    const mockDoc = { id: 'd1', topicId: 't1', title: 'test.pdf', status: 'READY', author: 'User' };
    const file = new File([''], 'test.pdf');
    const promise = adapter.uploadDocument('t1', file);

    const req = httpMock.expectOne(URLConfig.KNOWLEDGE.UPLOAD);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockDoc);

    const doc = await promise;
    expect(doc.id).toBe('d1');
  });

  it('startIngestTask should post to ingest URL', async () => {
    const promise = adapter.startIngestTask('d1', { size: 100 });

    const req = httpMock.expectOne(`${URLConfig.KNOWLEDGE.BASE}/documents/d1/ingest`);
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'ok' });

    const res = await promise;
    expect(res.status).toBe('ok');
  });
});
