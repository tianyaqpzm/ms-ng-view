import { Observable } from 'rxjs';
import { ChatMessage, ChatSessionDto } from './chat.model';

export interface ChatRepository {
    getHistory(sessionId: string): Observable<ChatMessage[]>;
    getSessions(): Observable<ChatSessionDto[]>;
    sendMessageStream(sessionId: string, message: string, topicId: string | null): Observable<string>;
}
