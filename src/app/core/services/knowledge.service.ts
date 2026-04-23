import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Topic {
  id?: string;
  name: string;
  icon: string;
  desc: string | null; // Note: using desc in UI but db has description, mapping later
  description?: string;
  visibleScope?: string;
  templateName?: string;
}

export interface KnowledgeDocument {
  id?: string;
  topicId: string;
  title: string;
  status: string;
  author: string;
  filePath?: string;
  configJson?: any;
}

@Injectable({
  providedIn: 'root'
})
export class KnowledgeService {
  private http = inject(HttpClient);
  // Using direct /rest/dark/v1/knowledge which proxies directly to backend via proxy.conf.cjs
  private baseUrl = '/rest/dark/v1/knowledge';

  getTopics() {
    return firstValueFrom(this.http.get<Topic[]>(`${this.baseUrl}/topics`));
  }

  createTopic(topic: Topic) {
    if (topic.desc && !topic.description) {
      topic.description = topic.desc;
    }
    return firstValueFrom(this.http.post<Topic>(`${this.baseUrl}/topics`, topic));
  }

  updateTopic(id: string, topic: Partial<Topic>) {
    if (topic.desc && !topic.description) {
      topic.description = topic.desc;
    }
    return firstValueFrom(this.http.put<Topic>(`${this.baseUrl}/topics/${id}`, topic));
  }

  deleteTopic(id: string) {
    return firstValueFrom(this.http.delete(`${this.baseUrl}/topics/${id}`));
  }

  getDocuments(topicId: string) {
    return firstValueFrom(this.http.get<KnowledgeDocument[]>(`${this.baseUrl}/documents?topicId=${topicId}`));
  }

  getDocumentPreviewUrl(documentId: string): string {
    return `${this.baseUrl}/documents/${documentId}/file`;
  }

  uploadDocument(topicId: string, file: File) {
    const formData = new FormData();
    formData.append('topicId', topicId);
    formData.append('file', file);
    return firstValueFrom(this.http.post<KnowledgeDocument>(`/rest/dark/v1/upload/knowledge`, formData));
  }

  deleteDocument(documentId: string) {
    return firstValueFrom(this.http.delete(`${this.baseUrl}/documents/${documentId}`));
  }

  startIngestTask(documentId: string, configPayload: any) {
    return firstValueFrom(this.http.post(`${this.baseUrl}/documents/${documentId}/ingest`, configPayload));
  }
}
