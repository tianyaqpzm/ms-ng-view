import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ChatMessage, ChatSessionDto } from '../../domain/chat/chat.model';
import { ChatApiAdapter } from '../../adapters/chat/chat-api.adapter';
import { MediaDeviceAdapter } from '../../adapters/device/media-device.adapter';

@Injectable({
    providedIn: 'root'
})
export class ChatUseCase {
    private chatApi = inject(ChatApiAdapter);
    private mediaAdapter = inject(MediaDeviceAdapter);
    private router = inject(Router);

    // State Signals
    public messages = signal<ChatMessage[]>([]);
    public activeSessionId = signal<string>('');
    public chatSessions = signal<ChatSessionDto[]>([]);
    public isThinking = signal(false);
    public isRecording = signal(false);
    public isCameraOpen = signal(false);
    public selectedFiles = signal<File[]>([]);
    public responseRatings = signal<Map<number, 'good' | 'bad'>>(new Map());

    private mediaStream: MediaStream | null = null;
    private cameraStream: MediaStream | null = null;

    /**
     * 加载指定会话的历史记录。
     * @param sessionId - 目标会话的 16 位 16 进制 ID。
     */
    async loadHistory(sessionId: string) {
        this.activeSessionId.set(sessionId);
        try {
            this.chatApi.getHistory(sessionId).subscribe({
                next: (history) => {
                    this.messages.set(history);
                },
                error: (err) => {
                    console.error('Failed to load history', err);
                }
            });
        } catch (err) {
            console.error('Failed to load history', err);
        }
    }

    /**
     * 静默刷新会话列表，不触发 UI 阻塞。
     * @returns 包含最新会话列表的 Promise。
     */
    async refreshSessionsListSilently(): Promise<ChatSessionDto[]> {
        return new Promise((resolve) => {
            this.chatApi.getSessions().subscribe({
                next: (sessions) => {
                    this.chatSessions.set(sessions);
                    resolve(sessions);
                },
                error: () => resolve([])
            });
        });
    }

    /**
     * 生成一个 16 位的 16 进制随机字符串作为会话 ID。
     * @returns 16 位 16 进制字符串。
     */
    private generateShortId(): string {
        return Array.from(crypto.getRandomValues(new Uint8Array(8)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * 开启新会话，重定向至 /chat 落地页。
     */
    createNewSession() {
        this.router.navigate(['/chat']);
    }

    /**
     * 切换到现有会话。
     * @param sessionId - 会话 ID。
     */
    switchSession(sessionId: string) {
        this.router.navigate(['/chat', sessionId]);
    }

    /**
     * 切换录音状态（开始/停止）。
     */
    async toggleRecording() {
        if (this.isRecording()) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    /**
     * 开始录音并获取音频流。
     */
    private async startRecording() {
        try {
            this.mediaStream = await this.mediaAdapter.getAudioStream();
            this.isRecording.set(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please allow permissions.');
        }
    }

    /**
     * 停止录音并释放流。
     */
    private stopRecording() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        this.isRecording.set(false);
    }

    /**
     * 打开摄像头并将流绑定到视频元素。
     * @param videoElement - 用于展示预览的 HTMLVideoElement。
     */
    async openCamera(videoElement: HTMLVideoElement) {
        try {
            this.cameraStream = await this.mediaAdapter.getVideoStream();
            this.isCameraOpen.set(true);
            setTimeout(() => {
                if (videoElement) {
                    videoElement.srcObject = this.cameraStream;
                }
            }, 100);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please allow permissions.');
        }
    }

    /**
     * 关闭摄像头并释放流。
     */
    closeCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        this.isCameraOpen.set(false);
    }

    /**
     * 从视频流中捕捉照片并转换为 File。
     * @param videoElement - 视频源。
     * @param canvasElement - 中间处理用的画布。
     */
    capturePhoto(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
        if (!videoElement || !canvasElement) return;

        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;

        const context = canvasElement.getContext('2d');
        if (context) {
            context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            canvasElement.toBlob(blob => {
                if (blob) {
                    const file = new File([blob], `photo_${Date.now()}.png`, { type: 'image/png' });
                    this.selectedFiles.update(files => [...files, file]);
                    this.closeCamera();
                }
            }, 'image/png');
        }
    }

    /**
     * 添加待上传的文件。
     * @param newFiles - 文件数组。
     */
    addFiles(newFiles: File[]) {
        this.selectedFiles.update(files => [...files, ...newFiles]);
    }

    /**
     * 移除特定索引的待上传文件。
     * @param index - 索引。
     */
    removeFile(index: number) {
        this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    }

    /**
     * 发送聊天消息。如果是首条消息且没有会话 ID，则自动生成 ID。
     * @param content - 消息文本。
     * @param topicId - 选中的知识库 ID（可选）。
     * @param translateInstant - 国际化翻译回调。
     */
    sendMessage(content: string, topicId: string | null, translateInstant: (key: string) => string) {
        const files = this.selectedFiles();
        if (!content && files.length === 0) return;

        // 延迟生成 Session ID：只有在发送消息时如果没有 ID 才生成并同步 URL
        if (!this.activeSessionId()) {
            const newId = this.generateShortId();
            this.activeSessionId.set(newId);
            this.router.navigate(['/chat', newId], { replaceUrl: true });
        }

        const fileNames = files.map(f => `[File: ${f.name}]`).join(' ');
        const fullContent = [content, fileNames].filter(Boolean).join('\n');

        // Optimistically add user message
        this.messages.update(msgs => [...msgs, { role: 'user', content: fullContent }]);
        this.selectedFiles.set([]);

        // Placeholder for AI response
        const aiMsgIndex = this.messages().length;
        this.messages.update(msgs => [...msgs, { role: 'model', content: '' }]);

        this.isThinking.set(true);

        this.chatApi.sendMessageStream(this.activeSessionId(), fullContent, topicId).subscribe({
            next: (partialContent) => {
                this.isThinking.set(false);
                this.messages.update(msgs => {
                    const newMsgs = [...msgs];
                    if (newMsgs[aiMsgIndex]) {
                        newMsgs[aiMsgIndex] = { ...newMsgs[aiMsgIndex], content: partialContent };
                    }
                    return newMsgs;
                });
            },
            error: (error) => {
                this.isThinking.set(false);
                console.error('Chat error:', error);
                this.messages.update(msgs => {
                    const newMsgs = [...msgs];
                    if (newMsgs[aiMsgIndex]) {
                        newMsgs[aiMsgIndex] = { ...newMsgs[aiMsgIndex], content: 'Error: ' + translateInstant('CHAT.RETRY') };
                    }
                    return newMsgs;
                });
            },
            complete: () => {
                if (aiMsgIndex === 1) {
                    this.refreshSessionsListSilently();
                }
            }
        });
    }

    /**
     * 进入消息编辑模式。
     * @param index - 消息索引。
     * @param setInputCallback - 用于将内容设置回输入框的回调。
     */
    editMessage(index: number, setInputCallback: (content: string) => void) {
        const msgs = this.messages();
        const content = msgs[index].content;
        const cleanedContent = content.replace(/ \\[(?:File|Image|Photo):[^\\]]*\\]/g, '').trim();
        
        this.messages.set(msgs.slice(0, index));
        setInputCallback(cleanedContent);
    }

    /**
     * 重试发送特定消息。
     * @param index - 消息索引。
     * @param setInputCallback - 编辑回调。
     * @param sendMessageCallback - 发送回调。
     */
    retryMessage(index: number, setInputCallback: (content: string) => void, sendMessageCallback: () => void) {
        this.editMessage(index, setInputCallback);
        setTimeout(() => sendMessageCallback(), 0);
    }

    /**
     * 重新生成 AI 回答。
     * @param index - AI 回答的索引。
     * @param setInputCallback - 编辑回调。
     * @param sendMessageCallback - 发送回调。
     */
    regenerateResponse(index: number, setInputCallback: (content: string) => void, sendMessageCallback: () => void) {
        let userMsgIndex = -1;
        const msgs = this.messages();
        for (let i = index - 1; i >= 0; i--) {
            if (msgs[i].role === 'user') {
                userMsgIndex = i;
                break;
            }
        }

        if (userMsgIndex !== -1) {
            this.editMessage(userMsgIndex, setInputCallback);
            setTimeout(() => sendMessageCallback(), 0);
        }
    }
}
