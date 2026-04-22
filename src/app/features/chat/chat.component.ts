import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { firstValueFrom } from 'rxjs';
import { KnowledgeService, Topic } from '../../core/services/knowledge.service';
import { UserService, UserProfile } from '../../core/services/user.service';
import { ThemeService } from '../../core/services/theme.service';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

interface ChatSessionDto {
    sessionId: string;
    title: string;
    lastActiveTime: string;
}

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
        MatDividerModule
    ],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent {
    @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
    @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

    protected isSidebarOpen = signal(true);
    protected get isDarkMode() { return this.themeService.isDarkMode; }
    protected userInput = signal('');
    protected messages = signal<ChatMessage[]>([]);
    protected selectedFiles = signal<File[]>([]);
    protected isRecording = signal(false);
    protected isCameraOpen = signal(false);
    protected isThinking = signal(false);

    protected activeSessionId = signal<string>('');
    protected chatSessions = signal<ChatSessionDto[]>([]);
    protected currentUser = signal<UserProfile | null>(null);

    private mediaStream: MediaStream | null = null;
    private cameraStream: MediaStream | null = null;
    private sessionId = '';

    protected topics = signal<Topic[]>([]);
    protected selectedTopic = signal<Topic | null>(null);
    protected responseRatings = signal<Map<number, 'good' | 'bad'>>(new Map());

    protected readonly document = document;

    constructor(
        private http: HttpClient,
        private knowledgeService: KnowledgeService,
        private userService: UserService,
        public themeService: ThemeService
    ) {
        this.initSession();
        this.loadTopics();
        this.loadProfile();
    }

    private async loadProfile() {
        try {
            const user = await this.userService.getCurrentUser();
            this.currentUser.set(user);
        } catch(e) {
            console.error('No valid user bound');
        }
    }

    private async loadTopics() {
        try {
            const result = await this.knowledgeService.getTopics();
            this.topics.set(result);
        } catch (e) {
            console.error('Failed to load KB topics for chat', e);
        }
    }

    protected selectTopic(topic: Topic | null) {
        this.selectedTopic.set(topic);
    }

    private async initSession() {
        try {
            const sessionsResponse = await firstValueFrom(
                this.http.get<ChatSessionDto[]>(`/rest/dark/v1/history/sessions`)
            );
            this.chatSessions.set(sessionsResponse);

            if (sessionsResponse.length > 0) {
                // Load the most recently active session
                this.switchSession(sessionsResponse[0].sessionId);
            } else {
                this.createNewSession();
            }
        } catch (err) {
            console.error('Failed to load sessions', err);
            this.createNewSession(); // fallback
        }
    }

    protected createNewSession() {
        const newSessionId = crypto.randomUUID();
        this.activeSessionId.set(newSessionId);
        this.messages.set([]);
    }

    protected switchSession(sessionId: string) {
        this.activeSessionId.set(sessionId);
        this.loadHistory(sessionId);
    }

    private async loadHistory(sessionId: string) {
        try {
            const history = await firstValueFrom(
                this.http.get<any[]>(`/rest/dark/v1/history`, {
                    params: { sessionId }
                })
            );

            const uiMessages: ChatMessage[] = history.map(h => ({
                role: h.role === 'ai' ? 'model' : 'user',
                content: h.content
            }));

            this.messages.set(uiMessages);

            if (this.messages().length === 0) {
                this.messages.set([{ role: 'model', content: 'Hello! How can I help you today?' }]);
            }
        } catch (err) {
            console.error('Failed to load history', err);
            // Fallback
            if (this.messages().length === 0) {
                this.messages.set([{ role: 'model', content: 'Hello! How can I help you today? (Offline Mode)' }]);
            }
        }
    }

    protected toggleSidebar() {
        this.isSidebarOpen.update(v => !v);
    }

    protected toggleTheme() {
        this.themeService.toggleTheme();
    }

    protected onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const newFiles = Array.from(input.files);
            this.selectedFiles.update(files => [...files, ...newFiles]);
            input.value = ''; // Reset input so same file can be selected again
        }
    }

    protected removeFile(index: number) {
        this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    }

    protected async toggleRecording() {
        if (this.isRecording()) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    private async startRecording() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.isRecording.set(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please allow permissions.');
        }
    }

    private stopRecording() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        this.isRecording.set(false);
    }

    protected async openCamera() {
        try {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.isCameraOpen.set(true);
            setTimeout(() => {
                if (this.videoElement && this.videoElement.nativeElement) {
                    this.videoElement.nativeElement.srcObject = this.cameraStream;
                }
            }, 100); // Allow render cycle
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please allow permissions.');
        }
    }

    protected closeCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        this.isCameraOpen.set(false);
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
        const msgs = this.messages();
        const content = msgs[index].content;
        // Optionally clean up any prepended "[File: xxx]" 
        const cleanedContent = content.replace(/ \[(?:File|Image|Photo):[^\]]*\]/g, '').trim();
        
        this.messages.set(msgs.slice(0, index));
        this.userInput.set(cleanedContent);
    }

    protected retryMessage(index: number) {
        const msgs = this.messages();
        const content = msgs[index].content;
        const cleanedContent = content.replace(/ \[(?:File|Image|Photo):[^\]]*\]/g, '').trim();
        
        this.messages.set(msgs.slice(0, index));
        this.userInput.set(cleanedContent);
        // Small delay to allow Angular binding to populate textarea before send
        setTimeout(() => this.sendMessage(), 0);
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
        let userMsgIndex = -1;
        const msgs = this.messages();
        for (let i = index - 1; i >= 0; i--) {
            if (msgs[i].role === 'user') {
                userMsgIndex = i;
                break;
            }
        }

        if (userMsgIndex !== -1) {
            const userMsg = msgs[userMsgIndex];
            const cleanedContent = userMsg.content.replace(/ \[(?:File|Image|Photo):[^\]]*\]/g, '').trim();
            this.messages.set(msgs.slice(0, userMsgIndex));
            this.userInput.set(cleanedContent);
            setTimeout(() => this.sendMessage(), 0);
        }
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

    protected capturePhoto() {
        if (!this.videoElement || !this.canvasElement) return;

        const video = this.videoElement.nativeElement;
        const canvas = this.canvasElement.nativeElement;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                if (blob) {
                    const file = new File([blob], `photo_${Date.now()}.png`, { type: 'image/png' });
                    this.selectedFiles.update(files => [...files, file]);
                    this.closeCamera();
                }
            }, 'image/png');
        }
    }

    protected async sendMessage() {
        const content = this.userInput().trim();
        const files = this.selectedFiles();

        if (!content && files.length === 0) return;

        // Prepare User Message
        const fileNames = files.map(f => `[File: ${f.name}]`).join(' ');
        const fullContent = [content, fileNames].filter(Boolean).join('\n');

        // Optimistically add user message
        this.messages.update(msgs => [...msgs, { role: 'user', content: fullContent }]);
        this.userInput.set('');
        this.selectedFiles.set([]);

        // Placeholder for AI response
        const aiMsgIndex = this.messages().length;
        this.messages.update(msgs => [...msgs, { role: 'model', content: '' }]);

        let aiContent = '';

        this.isThinking.set(true);
        this.http.post(
            `/rest/dark/v1/agent/chat`,
            {
                session_id: this.activeSessionId(),
                message: fullContent,
                topic_id: this.selectedTopic()?.id || null
            },
            {
                observe: 'events',
                responseType: 'text',
                reportProgress: true
            }
        ).subscribe({
            next: (event) => {
                if (event.type === HttpEventType.DownloadProgress) {
                    // Angular HttpClient streams the full response up to the current point
                    // in partialText, so we need to process it.
                    const partialText = (event as any).partialText as string;
                    if (partialText) {
                        const lines = partialText.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') break;
                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed.content) {
                                        this.isThinking.set(false);
                                        aiContent = parsed.content;
                                        // Update the specific message in the signal array
                                        this.messages.update(msgs => {
                                            const newMsgs = [...msgs];
                                            if (newMsgs[aiMsgIndex]) {
                                                newMsgs[aiMsgIndex] = { ...newMsgs[aiMsgIndex], content: aiContent };
                                            }
                                            return newMsgs;
                                        });
                                    }
                                } catch (e) {
                                    // ignore json parse error for partial lines
                                }
                            }
                        }
                    }
                } else if (event.type === HttpEventType.Response) {
                    // Final response received
                    const body = event.body;
                    if (body) {
                        this.isThinking.set(false);
                        const lines = body.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') break;
                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed.content) {
                                        aiContent = parsed.content;
                                        // Update the specific message in the signal array
                                        this.messages.update(msgs => {
                                            const newMsgs = [...msgs];
                                            if (newMsgs[aiMsgIndex]) {
                                                newMsgs[aiMsgIndex] = { ...newMsgs[aiMsgIndex], content: aiContent };
                                            }
                                            return newMsgs;
                                        });
                                    }
                                } catch (e) {
                                    // ignore json parse error for partial lines
                                }
                            }
                        }
                    }
                }
                
                // When request finishes gracefully, refresh session list to capture new chat
                if (aiMsgIndex === 1) { // 意味着这是本session的第一句话
                    this.refreshSessionsListSilently();
                }
            },
            error: (error) => {
                this.isThinking.set(false);
                console.error('Chat error:', error);
                this.messages.update(msgs => {
                    const newMsgs = [...msgs];
                    // Remove the empty AI message on error or show error text
                    if (newMsgs[aiMsgIndex]) {
                        newMsgs[aiMsgIndex] = { ...newMsgs[aiMsgIndex], content: 'Error: Could not reach the agent. Please check connection.' };
                    }
                    return newMsgs;
                });
            }
        });
    }

    private async refreshSessionsListSilently() {
        try {
            const sessionsResponse = await firstValueFrom(this.http.get<ChatSessionDto[]>(`/rest/dark/v1/history/sessions`));
            this.chatSessions.set(sessionsResponse);
        } catch (e) {
            // ignore
        }
    }
}
