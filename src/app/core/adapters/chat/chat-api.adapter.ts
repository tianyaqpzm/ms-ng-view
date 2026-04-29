import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { ChatRepository } from '../../domain/chat/chat-repository.interface';
import { ChatMessage, ChatSessionDto } from '../../domain/chat/chat.model';
import { URLConfig } from '../../constants/url.config';

@Injectable({
    providedIn: 'root'
})
export class ChatApiAdapter implements ChatRepository {
    private http = inject(HttpClient);

    getHistory(sessionId: string): Observable<ChatMessage[]> {
        return this.http.get<any[]>(URLConfig.CHAT.HISTORY, {
            params: { sessionId }
        }).pipe(
            map(history => history.map(h => ({
                role: h.role === 'ai' ? 'model' : 'user',
                content: h.content
            })))
        );
    }

    getSessions(): Observable<ChatSessionDto[]> {
        return this.http.get<ChatSessionDto[]>(URLConfig.CHAT.SESSIONS).pipe(
            catchError(() => of([]))
        );
    }

    sendMessageStream(sessionId: string, message: string, topicId: string | null): Observable<string> {
        return new Observable<string>(observer => {
            const subscription = this.http.post(
                URLConfig.CHAT.AGENT_CHAT,
                {
                    session_id: sessionId,
                    message: message,
                    topic_id: topicId || null
                },
                {
                    observe: 'events',
                    responseType: 'text',
                    reportProgress: true
                }
            ).subscribe({
                next: (event) => {
                    if (event.type === HttpEventType.DownloadProgress) {
                        const partialText = (event as any).partialText as string;
                        if (partialText) {
                            this.parseSSEData(partialText, observer);
                        }
                    } else if (event.type === HttpEventType.Response) {
                        const body = event.body as string;
                        if (body) {
                            this.parseSSEData(body, observer);
                        }
                        // Do not immediately complete on response, wait for [DONE] message in stream
                    }
                },
                error: (err) => {
                    observer.error(err);
                }
            });

            return () => subscription.unsubscribe();
        });
    }

    private parseSSEData(text: string, observer: any) {
        const lines = text.split('\\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                    observer.complete();
                    break;
                }
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                        observer.next(parsed.content);
                    }
                } catch (e) {
                    // Ignore JSON parse error for partial lines
                }
            }
        }
    }
}
