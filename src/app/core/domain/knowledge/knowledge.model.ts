export interface Topic {
  id?: string;
  name: string;
  icon: string;
  desc: string | null;
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

export interface KnowledgeRepository {
  getTopics(): Promise<Topic[]>;
  createTopic(topic: Topic): Promise<Topic>;
  updateTopic(id: string, topic: Partial<Topic>): Promise<Topic>;
  deleteTopic(id: string): Promise<void>;
  getDocuments(topicId: string): Promise<KnowledgeDocument[]>;
  uploadDocument(topicId: string, file: File): Promise<KnowledgeDocument>;
  deleteDocument(documentId: string): Promise<void>;
  startIngestTask(documentId: string, configPayload: any): Promise<any>;
}
