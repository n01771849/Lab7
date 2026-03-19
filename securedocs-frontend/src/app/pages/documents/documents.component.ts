import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DocumentService } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './documents.component.html'
})
export class DocumentsComponent implements OnInit {
  documents: any[] = [];
  error = '';
  lastVisitedDocumentTitle = '';
  lastReviewTime = '';

  constructor(
    private documentService: DocumentService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadDocuments();
    await this.loadLastVisitedDocument();
  }

  async loadDocuments(): Promise<void> {
    try {
      this.documents = await this.documentService.getAll();
    } catch (err: any) {
      this.error = err?.error?.message || 'Failed to load documents';
    }
  }

  async loadLastVisitedDocument(): Promise<void> {
    try {
      let currentUser = this.authService.user();

      if (!currentUser) {
        await this.authService.loadSession();
        currentUser = this.authService.user();
      }

      if (!currentUser?.userId) {
        return;
      }

      const cookieName = `lastVisitedDocument_${currentUser.userId}`;
      const cookieValue = this.getCookie(cookieName);

      if (!cookieValue) {
        return;
      }

      const lastVisited = JSON.parse(decodeURIComponent(cookieValue));
      this.lastVisitedDocumentTitle = lastVisited.title || '';
      this.lastReviewTime = lastVisited.reviewedAt
        ? new Date(lastVisited.reviewedAt).toLocaleString()
        : '';
    } catch {
      this.lastVisitedDocumentTitle = '';
      this.lastReviewTime = '';
    }
  }

  getCookie(name: string): string | null {
    const cookieParts = document.cookie.split('; ');
    const target = cookieParts.find((item) => item.startsWith(`${name}=`));
    return target ? target.split('=').slice(1).join('=') : null;
  }

  editDocument(id: string): void {
    this.router.navigate(['/documents/edit', id]);
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      await this.documentService.delete(id);
      await this.loadDocuments();
    } catch (err: any) {
      this.error = err?.error?.message || 'Failed to delete document';
    }
  }
}
