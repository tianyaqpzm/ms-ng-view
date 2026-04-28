import { Routes } from '@angular/router';
import { ChatComponent } from './app/features/chat/chat.component';
import { CreateEventComponent } from './app/features/create-event/create-event.component';
import { CustomizeComponent } from './app/features/customize/customize.component';
import { DashboardComponent } from './app/features/dashboard/dashboard.component';
import { EventDetailComponent } from './app/features/event-detail/event-detail.component';
import { EventListComponent } from './app/features/event-list/event-list.component';
import { KnowledgeEmbeddingComponent } from './app/features/knowledge-embedding/knowledge-embedding.component';
import { KnowledgeComponent } from './app/features/knowledge/knowledge.component';
import { LandingComponent } from './app/features/landing/landing.component';
import { authGuard } from './app/core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  { path: 'landing', component: LandingComponent },
  { path: 'landing/dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'landing/create-event', component: CreateEventComponent, canActivate: [authGuard] },
  { path: 'landing/events', component: EventListComponent, canActivate: [authGuard] },
  { path: 'landing/events/detail', component: EventDetailComponent, canActivate: [authGuard] },
  { path: 'landing/customize', component: CustomizeComponent, canActivate: [authGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  { path: 'chat/:sessionId', component: ChatComponent, canActivate: [authGuard] },
  { path: 'knowledge', component: KnowledgeComponent, canActivate: [authGuard] },
  { path: 'knowledge/embedding', component: KnowledgeEmbeddingComponent, canActivate: [authGuard] },
  { path: 'knowledge/embedding/:id', component: KnowledgeEmbeddingComponent, canActivate: [authGuard] },
];