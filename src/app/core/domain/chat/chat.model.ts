export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export interface ChatSessionDto {
    sessionId: string;
    title: string;
    lastActiveTime: string;
}

export interface ChatState {
    messages: ChatMessage[];
    activeSessionId: string;
    chatSessions: ChatSessionDto[];
    isThinking: boolean;
    isRecording: boolean;
    isCameraOpen: boolean;
    selectedFiles: File[];
}
