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

export const routes: Routes = [
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  { path: 'landing', component: LandingComponent },
  { path: 'landing/dashboard', component: DashboardComponent },
  { path: 'landing/create-event', component: CreateEventComponent },
  { path: 'landing/events', component: EventListComponent },
  { path: 'landing/events/detail', component: EventDetailComponent },
  { path: 'landing/customize', component: CustomizeComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'knowledge', component: KnowledgeComponent },
  { path: 'knowledge/embedding', component: KnowledgeEmbeddingComponent },
  { path: 'knowledge/embedding/:id', component: KnowledgeEmbeddingComponent },
];