import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { KnowledgeUseCase } from '../../core/use-cases/knowledge/knowledge.usecase';
import { Topic } from '../../core/domain/knowledge/knowledge.model';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { SettingsDialogComponent } from './settings-dialog.component';
import { ChatUseCase } from '../../core/use-cases/chat/chat.usecase';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatMenuModule,
        MatDividerModule,
        MatDialogModule,
        TranslateModule
    ],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent {
    @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
    @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

    protected isSidebarOpen = signal(true);
    protected userInput = signal('');
    protected suggestions = [
        { icon: 'recommend', text: 'CHAT.SUGGESTIONS.RECOMMEND', color: 'blue' },
        { icon: 'image', text: 'CHAT.SUGGESTIONS.IMAGE', color: 'green' },
        { icon: 'music_note', text: 'CHAT.SUGGESTIONS.MUSIC', color: 'red' },
        { icon: 'school', text: 'CHAT.SUGGESTIONS.STUDY', color: 'purple' },
        { icon: 'edit', text: 'CHAT.SUGGESTIONS.WRITE', color: 'indigo' },
        { icon: 'bolt', text: 'CHAT.SUGGESTIONS.ENERGY', color: 'orange' }
    ];

    public chatUseCase = inject(ChatUseCase);
    protected get messages() { return this.chatUseCase.messages; }
    protected get selectedFiles() { return this.chatUseCase.selectedFiles; }
    protected get isRecording() { return this.chatUseCase.isRecording; }
    protected get isCameraOpen() { return this.chatUseCase.isCameraOpen; }
    protected get isThinking() { return this.chatUseCase.isThinking; }
    protected get activeSessionId() { return this.chatUseCase.activeSessionId; }
    protected get chatSessions() { return this.chatUseCase.chatSessions; }

    protected get currentUser() { return this.userService.currentUser; }
    protected get topics() { return this.knowledgeUseCase.topics; }
    protected get selectedTopic() { return this.knowledgeUseCase.selectedTopic; }
    protected get responseRatings() { return this.chatUseCase.responseRatings; }

    protected readonly document = document;

    constructor(
        private knowledgeUseCase: KnowledgeUseCase,
        private userService: UserService,
        private authService: AuthService,
        private dialog: MatDialog,
        private translate: TranslateService,
        private route: ActivatedRoute
    ) {
        this.watchRouteParams();
        this.loadTopics();
    }

    /**
     * 监听路由参数变化。
     * 当 sessionId 改变时加载历史记录，若无 sessionId 则重置为落地页状态。
     */
    private watchRouteParams() {
        this.route.params.subscribe(async params => {
            const sessionId = params['sessionId'];
            if (sessionId) {
                // 只有当路径中的 ID 与内存中不同时，才加载历史记录
                // 这可以防止 sendMessage 触发的跳转导致本地消息被历史记录覆盖
                if (sessionId !== this.chatUseCase.activeSessionId()) {
                    this.chatUseCase.loadHistory(sessionId);
                }
                if (this.chatSessions().length === 0) {
                    this.chatUseCase.refreshSessionsListSilently();
                }
            } else {
                // 如果没有 sessionId，则进入落地页状态，清空历史
                this.chatUseCase.activeSessionId.set('');
                this.chatUseCase.messages.set([]);
                if (this.chatSessions().length === 0) {
                    this.chatUseCase.refreshSessionsListSilently();
                }
            }
        });
    }

    /**
     * 初始化加载知识库主题列表。
     */
    private async loadTopics() {
        await this.knowledgeUseCase.refreshTopics();
    }

    /**
     * 选中一个知识库主题。
     * @param topic - 选中的主题对象或 null（取消选中）。
     */
    protected selectTopic(topic: Topic | null) {
        this.knowledgeUseCase.selectedTopicId.set(topic?.id || null);
    }

    /**
     * 调用 UseCase 开启新会话（导航回落地页）。
     */
    protected createNewSession() {
        this.chatUseCase.createNewSession();
    }

    /**
     * 调用 UseCase 切换到指定会话。
     * @param sessionId - 目标会话 ID。
     */
    protected switchSession(sessionId: string) {
        this.chatUseCase.switchSession(sessionId);
    }

    /**
     * 切换历史记录侧边栏的展开/收起状态。
     */
    protected toggleSidebar() {
        this.isSidebarOpen.update(v => !v);
    }

    /**
     * 选择推荐建议，并将其文本填充到输入框。
     * @param suggestionKey - 建议的国际化 Key。
     */
    protected selectSuggestion(suggestionKey: string) {
        const text = this.translate.instant(suggestionKey);
        this.userInput.set(text);
    }

    /**
     * 执行登出操作。
     */
    protected logout() {
        this.authService.logout();
    }

    /**
     * 打开设置对话框。
     */
    protected openSettings() {
        this.dialog.open(SettingsDialogComponent, {
            width: '400px',
            panelClass: ['custom-dialog-container', 'animate-fade-in-up']
        });
    }

    /**
     * 跳转至外部账号中心。
     */
    protected openAccountManagement() {
        window.open('https://tao-lan.122577.xyz:8381/account', '_blank');
    }

    /**
     * 处理文件选择事件。
     * @param event - HTML Input Change 事件。
     */
    protected onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.chatUseCase.addFiles(Array.from(input.files));
            input.value = '';
        }
    }

    /**
     * 从待发送列表中移除文件。
     * @param index - 文件索引。
     */
    protected removeFile(index: number) {
        this.chatUseCase.removeFile(index);
    }

    /**
     * 切换语音录制状态。
     */
    protected toggleRecording() {
        this.chatUseCase.toggleRecording();
    }

    /**
     * 调用 UseCase 打开摄像头。
     */
    protected openCamera() {
        this.chatUseCase.openCamera(this.videoElement.nativeElement);
    }

    /**
     * 关闭当前打开的摄像头。
     */
    protected closeCamera() {
        this.chatUseCase.closeCamera();
    }

    /**
     * 捕捉摄像头画面并保存为文件。
     */
    protected capturePhoto() {
        this.chatUseCase.capturePhoto(this.videoElement.nativeElement, this.canvasElement.nativeElement);
    }

    /**
     * 判断指定索引的消息是否为该会话中最后一条用户消息。
     * 用于 UI 上显示编辑/重新生成按钮。
     * @param index - 消息索引。
     * @returns 布尔值。
     */
    protected isLastUserMessage(index: number): boolean {
        const msgs = this.messages();
        for (let i = index + 1; i < msgs.length; i++) {
            if (msgs[i].role === 'user') return false;
        }
        return true;
    }

    /**
     * 判断指定索引的消息是否导致了后续的 AI 回复失败。
     * @param index - 用户消息索引。
     * @returns 布尔值。
     */
    protected isResponseFailed(index: number): boolean {
        const msgs = this.messages();
        if (index + 1 < msgs.length) {
            const nextMsg = msgs[index + 1];
            return nextMsg.role === 'model' && nextMsg.content.startsWith('Error:');
        }
        return false;
    }

    /**
     * 复制文本到剪贴板。
     * @param text - 待复制文本。
     */
    protected copyText(text: string) {
        navigator.clipboard.writeText(text);
    }

    /**
     * 编辑指定消息。
     * @param index - 消息索引。
     */
    protected editMessage(index: number) {
        this.chatUseCase.editMessage(index, (content) => this.userInput.set(content));
    }

    /**
     * 重试发送指定消息。
     * @param index - 消息索引。
     */
    protected retryMessage(index: number) {
        this.chatUseCase.retryMessage(index, (content) => this.userInput.set(content), () => this.sendMessage());
    }

    /**
     * 对 AI 回复进行点赞/点踩评分。
     * @param index - 消息索引。
     * @param rating - 'good' 或 'bad'。
     */
    protected rateResponse(index: number, rating: 'good' | 'bad') {
        const ratings = new Map(this.responseRatings());
        const existing = ratings.get(index);
        if (existing === rating) {
            ratings.delete(index);
        } else {
            ratings.set(index, rating);
        }
        this.responseRatings.set(ratings);
    }

    /**
     * 重新生成上一条 AI 回复。
     * @param index - 用户消息索引。
     */
    protected regenerateResponse(index: number) {
        this.chatUseCase.regenerateResponse(index, (content) => this.userInput.set(content), () => this.sendMessage());
    }

    /**
     * 将 AI 回复内容导出为 Markdown 文件。
     * @param index - 消息索引。
     */
    protected exportResponse(index: number) {
        try {
            const content = this.messages()[index].content;
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `response_${index + 1}.md`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export failed', e);
        }
    }

    /**
     * 发送当前输入的消息内容。
     */
    protected sendMessage() {
        this.chatUseCase.sendMessage(this.userInput().trim(), this.selectedTopic()?.id || null, (key) => this.translate.instant(key));
        this.userInput.set('');
    }
}
