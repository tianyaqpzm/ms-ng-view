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
import { ThemeService } from '../../core/services/theme.service';
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

    protected isSidebarOpen = signal(false);
    protected get isDarkMode() { return this.themeService.isDarkMode; }
    protected userInput = signal('');

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
        public themeService: ThemeService,
        private authService: AuthService,
        private dialog: MatDialog,
        private translate: TranslateService,
        private route: ActivatedRoute
    ) {
        this.watchRouteParams();
        this.loadTopics();
    }

    private watchRouteParams() {
        this.route.params.subscribe(async params => {
            const sessionId = params['sessionId'];
            if (sessionId) {
                this.chatUseCase.loadHistory(sessionId);
                if (this.chatSessions().length === 0) {
                    this.chatUseCase.refreshSessionsListSilently();
                }
            } else {
                const sessions = await this.chatUseCase.refreshSessionsListSilently();
                if (sessions && sessions.length > 0) {
                    this.chatUseCase.switchSession(sessions[0].sessionId);
                } else {
                    this.chatUseCase.createNewSession();
                }
            }
        });
    }

    private async loadTopics() {
        await this.knowledgeUseCase.refreshTopics();
    }

    protected selectTopic(topic: Topic | null) {
        this.knowledgeUseCase.selectedTopicId.set(topic?.id || null);
    }

    protected createNewSession() {
        this.chatUseCase.createNewSession();
    }

    protected switchSession(sessionId: string) {
        this.chatUseCase.switchSession(sessionId);
    }

    protected toggleSidebar() {
        this.isSidebarOpen.update(v => !v);
    }

    protected toggleTheme() {
        this.themeService.toggleTheme();
    }

    protected logout() {
        this.authService.logout();
    }

    protected openSettings() {
        this.dialog.open(SettingsDialogComponent, {
            width: '400px',
            panelClass: ['custom-dialog-container', 'animate-fade-in-up']
        });
    }

    protected openAccountManagement() {
        window.open('https://tao-lan.122577.xyz:8381/account', '_blank');
    }

    protected onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.chatUseCase.addFiles(Array.from(input.files));
            input.value = '';
        }
    }

    protected removeFile(index: number) {
        this.chatUseCase.removeFile(index);
    }

    protected toggleRecording() {
        this.chatUseCase.toggleRecording();
    }

    protected openCamera() {
        this.chatUseCase.openCamera(this.videoElement.nativeElement);
    }

    protected closeCamera() {
        this.chatUseCase.closeCamera();
    }

    protected capturePhoto() {
        this.chatUseCase.capturePhoto(this.videoElement.nativeElement, this.canvasElement.nativeElement);
    }

    protected isLastUserMessage(index: number): boolean {
        const msgs = this.messages();
        for (let i = index + 1; i < msgs.length; i++) {
            if (msgs[i].role === 'user') return false;
        }
        return true;
    }

    protected isResponseFailed(index: number): boolean {
        const msgs = this.messages();
        if (index + 1 < msgs.length) {
            const nextMsg = msgs[index + 1];
            return nextMsg.role === 'model' && nextMsg.content.startsWith('Error:');
        }
        return false;
    }

    protected copyText(text: string) {
        navigator.clipboard.writeText(text);
    }

    protected editMessage(index: number) {
        this.chatUseCase.editMessage(index, (content) => this.userInput.set(content));
    }

    protected retryMessage(index: number) {
        this.chatUseCase.retryMessage(index, (content) => this.userInput.set(content), () => this.sendMessage());
    }

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

    protected regenerateResponse(index: number) {
        this.chatUseCase.regenerateResponse(index, (content) => this.userInput.set(content), () => this.sendMessage());
    }

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

    protected sendMessage() {
        this.chatUseCase.sendMessage(this.userInput().trim(), this.selectedTopic()?.id || null, (key) => this.translate.instant(key));
        this.userInput.set('');
    }
}
