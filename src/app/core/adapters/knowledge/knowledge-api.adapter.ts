import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { KnowledgeDocument, KnowledgeRepository, Topic } from '../../domain/knowledge/knowledge.model';
import { URLConfig } from '../../constants/url.config';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeApiAdapter implements KnowledgeRepository {
  private http = inject(HttpClient);
  private baseUrl = URLConfig.KNOWLEDGE.BASE;

  async getTopics(): Promise<Topic[]> {
    const data = await firstValueFrom(this.http.get<Topic[]>(`${this.baseUrl}/topics`));
    // map description to desc for the UI mapping
    return data.map(t => ({ ...t, desc: t.description || t.desc || null }));
  }

  async createTopic(topic: Topic): Promise<Topic> {
    const payload = { ...topic };
    if (payload.desc && !payload.description) {
      payload.description = payload.desc;
    }
    return firstValueFrom(this.http.post<Topic>(`${this.baseUrl}/topics`, payload));
  }

  async updateTopic(id: string, topic: Partial<Topic>): Promise<Topic> {
    const payload = { ...topic };
    if (payload.desc && !payload.description) {
      payload.description = payload.desc;
    }
    return firstValueFrom(this.http.put<Topic>(`${this.baseUrl}/topics/${id}`, payload));
  }

  async deleteTopic(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/topics/${id}`));
  }

  async getDocuments(topicId: string): Promise<KnowledgeDocument[]> {
    const docs = await firstValueFrom(this.http.get<KnowledgeDocument[]>(`${this.baseUrl}/documents?topicId=${topicId}`));
    return docs.map(doc => ({ ...doc, id: String(doc.id) }));
  }

  async uploadDocument(topicId: string, file: File): Promise<KnowledgeDocument> {
    const formData = new FormData();
    formData.append('topicId', topicId);
    formData.append('file', file);
    return firstValueFrom(this.http.post<KnowledgeDocument>(URLConfig.KNOWLEDGE.UPLOAD, formData));
  }

  async deleteDocument(documentId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/documents/${documentId}`));
  }

  async startIngestTask(documentId: string, configPayload: any): Promise<any> {
    return firstValueFrom(this.http.post(`${this.baseUrl}/documents/${documentId}/ingest`, configPayload));
  }

  getDocumentPreviewUrl(documentId: string): string {
    return `${this.baseUrl}/documents/${documentId}/file`;
  }
}
