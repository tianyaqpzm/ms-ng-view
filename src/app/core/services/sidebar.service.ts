import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  isOpen = signal<boolean>(window.innerWidth >= 768);

  toggle() {
    this.isOpen.update(v => !v);
  }

  setOpen(open: boolean) {
    this.isOpen.set(open);
  }
}
