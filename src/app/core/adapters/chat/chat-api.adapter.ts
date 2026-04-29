import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { ChatRepository } from '../../domain/chat/chat-repository.interface';
import { ChatMessage, ChatSessionDto } from '../../domain/chat/chat.model';
import { URLConfig } from '../../constants/url.config';

/**
 * 聊天会话 API 适配器实现。
 * 通过 HTTP 与后端交互，实现 ChatRepository 定义的操作。
 */
@Injectable({
    providedIn: 'root'
})
export class ChatApiAdapter implements ChatRepository {
    private http = inject(HttpClient);

    /**
     * 获取指定会话的历史消息。
     * @param sessionId - 会话 ID。
     * @returns 消息列表 Observable。
     */
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

    /**
     * 获取所有聊天会话列表。
     * @returns 会话列表 Observable。
     */
    getSessions(): Observable<ChatSessionDto[]> {
        return this.http.get<ChatSessionDto[]>(URLConfig.CHAT.SESSIONS).pipe(
            catchError(() => of([]))
        );
    }

    /**
     * 删除指定会话。
     * @param sessionId - 要删除的会话 ID。
     * @returns 操作结果 Observable。
     */
    deleteSession(sessionId: string): Observable<void> {
        return this.http.delete<void>(`${URLConfig.CHAT.SESSIONS}/${sessionId}`);
    }

    /**
     * 发送流式消息。
     * @param sessionId - 会话 ID。
     * @param message - 用户消息内容。
     * @param topicId - 知识库主题 ID（可选）。
     * @returns 流式响应内容 Observable。
     */
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
                    }
                },
                error: (err) => {
                    observer.error(err);
                }
            });

            return () => subscription.unsubscribe();
        });
    }

    /**
     * 解析 SSE 流数据。
     * @param text - 接收到的流数据片段。
     * @param observer - RxJS 观察者。
     */
    private parseSSEData(text: string, observer: any) {
        const lines = text.split('\n');
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
                    // 忽略部分解析错误
                }
            }
        }
    }
}
