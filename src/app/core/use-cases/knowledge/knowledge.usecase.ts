import { Injectable, inject, signal, computed } from '@angular/core';
import { KnowledgeApiAdapter } from '../../adapters/knowledge/knowledge-api.adapter';
import { KnowledgeDocument, Topic } from '../../domain/knowledge/knowledge.model';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeUseCase {
  private adapter = inject(KnowledgeApiAdapter);

  // State
  topics = signal<Topic[]>([]);
  documents = signal<KnowledgeDocument[]>([]);
  selectedTopicId = signal<string | null>(null);
  
  isSubmitting = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  searchQuery = signal<string>('');

  // Computed
  selectedTopic = computed(() => {
    const id = this.selectedTopicId();
    if (!id) return null;
    return this.topics().find(t => t.id === id) || null;
  });

  filteredDocuments = computed(() => {
    const topicId = this.selectedTopicId();
    const query = this.searchQuery().toLowerCase();

    return this.documents().filter(doc =>
      doc.topicId === topicId &&
      doc.title.toLowerCase().includes(query)
    );
  });

  async refreshTopics() {
    try {
      const data = await this.adapter.getTopics();
      this.topics.set(data);
      if (data.length > 0 && !this.selectedTopicId()) {
        this.selectTopic(data[0].id!);
      }
    } catch (e) {
      console.error('Failed to load topics', e);
    }
  }

  async selectTopic(id: string) {
    this.selectedTopicId.set(id);
    this.searchQuery.set('');
    try {
      const docs = await this.adapter.getDocuments(id);
      this.documents.set(docs);
    } catch (e) {
      console.error('Failed to load documents', e);
    }
  }

  async saveTopic(id: string | null, payload: any) {
    this.isSubmitting.set(true);
    try {
      if (id) {
        await this.adapter.updateTopic(id, payload);
        await this.refreshTopics();
        this.selectTopic(id);
      } else {
        const created = await this.adapter.createTopic(payload);
        await this.refreshTopics();
        if (created.id) {
          this.selectTopic(created.id);
        }
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async deleteTopic(id: string) {
    await this.adapter.deleteTopic(id);
    if (this.selectedTopicId() === id) {
      this.selectedTopicId.set(null);
      this.documents.set([]);
    }
    await this.refreshTopics();
  }

  async deleteDocument(documentId: string) {
    await this.adapter.deleteDocument(documentId);
    if (this.selectedTopicId()) {
      await this.selectTopic(this.selectedTopicId()!);
    }
  }

  async startIngestTask(documentId: string, configPayload: any) {
    return this.adapter.startIngestTask(documentId, configPayload);
  }

  async uploadDocument(topicId: string, file: File) {
    this.isUploading.set(true);
    try {
      await this.adapter.uploadDocument(topicId, file);
      await this.selectTopic(topicId);
    } finally {
      this.isUploading.set(false);
    }
  }

  getDocumentPreviewUrl(documentId: string): string {
    return this.adapter.getDocumentPreviewUrl(documentId);
  }
}
