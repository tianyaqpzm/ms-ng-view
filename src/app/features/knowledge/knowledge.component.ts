import { CommonModule } from '@angular/common';
import { Component, computed, inject, Inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { KnowledgeDocument, KnowledgeService, Topic } from '../../core/services/knowledge.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="m-0 text-lg font-medium">{{ data.title }}</h2>
    <mat-dialog-content class="mt-4">
      <p class="text-neutral-600">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="mb-2 mr-2">
      <button mat-button mat-dialog-close class="mr-2">取消</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">删除</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, message: string }
  ) { }
}

@Component({
  selector: 'app-knowledge',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatDialogModule],
  templateUrl: './knowledge.component.html'
})
export class KnowledgeComponent implements OnInit {
  private knowledgeService = inject(KnowledgeService);
  private dialog = inject(MatDialog);

  topics = signal<Topic[]>([]);
  documents = signal<KnowledgeDocument[]>([]);

  selectedTopicId = signal<string | null>(null);
  editingTopicId = signal<string | null>(null);
  isCreateModalOpen = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  searchQuery = signal<string>('');

  newTopicName = signal('');
  newTopicDesc = signal('');
  newTopicVisibility = signal('全员公开');
  newTopicTemplate = signal('空白模板');

  selectedTopic = computed(() => {
    return this.topics().find(t => t.id === this.selectedTopicId()) || (this.topics().length > 0 ? this.topics()[0] : { id: '', name: '无主题', icon: 'Folder', desc: '请先新建主题' });
  });

  filteredDocuments = computed(() => {
    const topicId = this.selectedTopicId();
    const query = this.searchQuery().toLowerCase();

    return this.documents().filter(doc =>
      doc.topicId === topicId &&
      doc.title.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.refreshTopics();
  }

  async refreshTopics() {
    try {
      const data = await this.knowledgeService.getTopics();
      // map description to desc for the UI mapping
      const mappedTopics = data.map(t => ({ ...t, desc: t.description || t.desc }));
      this.topics.set(mappedTopics);
      if (mappedTopics.length > 0 && !this.selectedTopicId()) {
        this.selectTopic(mappedTopics[0].id!);
      }
    } catch (e) {
      console.error('Failed to load topics', e);
    }
  }

  async selectTopic(id: string) {
    this.selectedTopicId.set(id);
    this.searchQuery.set('');
    try {
      const docs = await this.knowledgeService.getDocuments(id);
      this.documents.set(docs.map(doc => ({ ...doc, id: String(doc.id) })));
    } catch (e) {
      console.error('Failed to load documents', e);
    }
  }

  openCreateModal() {
    this.resetForm();
    this.editingTopicId.set(null);
    this.isCreateModalOpen.set(true);
  }

  openEditModal(topic: Topic) {
    this.editingTopicId.set(topic.id || null);
    this.newTopicName.set(topic.name);
    this.newTopicDesc.set(topic.desc || topic.description || '');
    this.newTopicVisibility.set(topic.visibleScope || '全员公开');
    this.newTopicTemplate.set(topic.templateName || '空白模板');
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal() {
    this.isCreateModalOpen.set(false);
    this.resetForm();
  }

  async confirmCreate() {
    if (this.isSubmitting() || !this.newTopicName().trim()) return;

    this.isSubmitting.set(true);
    try {
      const isEdit = !!this.editingTopicId();
      const payload = {
        name: this.newTopicName(),
        icon: 'Folder',
        desc: this.newTopicDesc(),
        description: this.newTopicDesc(),
        visibleScope: this.newTopicVisibility(),
        templateName: this.newTopicTemplate()
      };

      if (isEdit) {
        await this.knowledgeService.updateTopic(this.editingTopicId()!, payload);
        await this.refreshTopics();
        this.selectTopic(this.editingTopicId()!);
      } else {
        const created = await this.knowledgeService.createTopic(payload);
        await this.refreshTopics();
        if (created.id) {
          this.selectTopic(created.id);
        }
      }
      this.closeCreateModal();
    } catch (e) {
      console.error(this.editingTopicId() ? 'Failed to update topic' : 'Failed to create topic', e);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async deleteTopic(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '删除专题',
        message: '您确定要删除该专题吗？这将一并删除该专题归属下的所有文档元数据记录，且不可恢复！'
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.knowledgeService.deleteTopic(id);
          if (this.selectedTopicId() === id) {
            this.selectedTopicId.set(null);
            this.documents.set([]);
          }
          await this.refreshTopics();
        } catch (e) {
          console.error('Failed to delete topic', e);
        }
      }
    });
  }

  async deleteDocument(documentId: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '删除文档',
        message: '您确定要彻底删除该文档吗？这将从服务器上永久抹除这个物理文件，如果您已经将本文件进行了向量化索引，索引中的旧切片需要您后续前往重构索引处理。'
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.knowledgeService.deleteDocument(documentId);
          // Refresh document list
          await this.selectTopic(this.selectedTopicId()!);
        } catch (e) {
          console.error('Failed to delete document', e);
        }
      }
    });
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    const topicId = this.selectedTopicId();
    if (!file || !topicId || this.isUploading()) return;

    this.isUploading.set(true);
    try {
      await this.knowledgeService.uploadDocument(topicId, file);
      // reset file input
      event.target.value = '';
      // Refresh documents
      await this.selectTopic(topicId);
    } catch (e) {
      console.error('Failed to upload document', e);
    } finally {
      this.isUploading.set(false);
    }
  }

  previewDocument(documentId: string) {
    const url = this.knowledgeService.getDocumentPreviewUrl(documentId);
    window.open(url, '_blank');
  }

  resetForm() {
    this.newTopicName.set('');
    this.newTopicDesc.set('');
    this.newTopicVisibility.set('全员公开');
    this.newTopicTemplate.set('空白模板');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case '进行中': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50';
      case '已审阅': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50';
      case '已发布': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700/50';
    }
  }
}
