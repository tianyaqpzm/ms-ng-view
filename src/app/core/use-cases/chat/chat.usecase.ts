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

    async loadHistory(sessionId: string) {
        this.activeSessionId.set(sessionId);
        try {
            this.chatApi.getHistory(sessionId).subscribe({
                next: (history) => {
                    this.messages.set(history);
                    if (history.length === 0) {
                        this.messages.set([{ role: 'model', content: 'Hello! How can I help you today?' }]);
                    }
                },
                error: (err) => {
                    console.error('Failed to load history', err);
                    if (this.messages().length === 0) {
                        this.messages.set([{ role: 'model', content: 'Hello! How can I help you today? (Offline Mode)' }]);
                    }
                }
            });
        } catch (err) {
            console.error('Failed to load history', err);
        }
    }

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

    createNewSession() {
        const newSessionId = crypto.randomUUID();
        this.router.navigate(['/chat', newSessionId], { 
            replaceUrl: this.router.url === '/chat' 
        });
    }

    switchSession(sessionId: string) {
        this.router.navigate(['/chat', sessionId]);
    }

    async toggleRecording() {
        if (this.isRecording()) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    private async startRecording() {
        try {
            this.mediaStream = await this.mediaAdapter.getAudioStream();
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

    closeCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        this.isCameraOpen.set(false);
    }

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

    addFiles(newFiles: File[]) {
        this.selectedFiles.update(files => [...files, ...newFiles]);
    }

    removeFile(index: number) {
        this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    }

    sendMessage(content: string, topicId: string | null, translateInstant: (key: string) => string) {
        const files = this.selectedFiles();
        if (!content && files.length === 0) return;

        const fileNames = files.map(f => `[File: ${f.name}]`).join(' ');
        const fullContent = [content, fileNames].filter(Boolean).join('\\n');

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

    editMessage(index: number, setInputCallback: (content: string) => void) {
        const msgs = this.messages();
        const content = msgs[index].content;
        const cleanedContent = content.replace(/ \\[(?:File|Image|Photo):[^\\]]*\\]/g, '').trim();
        
        this.messages.set(msgs.slice(0, index));
        setInputCallback(cleanedContent);
    }

    retryMessage(index: number, setInputCallback: (content: string) => void, sendMessageCallback: () => void) {
        this.editMessage(index, setInputCallback);
        setTimeout(() => sendMessageCallback(), 0);
    }

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
