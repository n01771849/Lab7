import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './document-form.component.html'
})
export class DocumentFormComponent implements OnInit {
  form = {
    title: '',
    description: ''
  };

  documentId: string | null = null;
  isEditMode = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    this.documentId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.documentId;

    if (this.isEditMode && this.documentId) {
      try {
        const loadedDocument: any = await this.documentService.getById(this.documentId);
        this.form.title = loadedDocument.title;
        this.form.description = loadedDocument.description;
        await this.updateLastVisitedDocumentCookie(loadedDocument.title);
      } catch (err: any) {
        this.error = err?.error?.message || 'Failed to load document';
      }
    }
  }

  async updateLastVisitedDocumentCookie(title: string): Promise<void> {
    let currentUser = this.authService.user();

    if (!currentUser) {
      await this.authService.loadSession();
      currentUser = this.authService.user();
    }

    if (!currentUser?.userId) {
      return;
    }

    const cookieName = `lastVisitedDocument_${currentUser.userId}`;
    const cookieValue = encodeURIComponent(
      JSON.stringify({
        title,
        reviewedAt: new Date().toISOString()
      })
    );

    document.cookie = `${cookieName}=${cookieValue}; path=/; max-age=2592000`;
  }

  async submit(): Promise<void> {
    this.error = '';

    try {
      if (this.isEditMode && this.documentId) {
        await this.documentService.update(this.documentId, this.form);
      } else {
        await this.documentService.create(this.form);
      }

      this.router.navigate(['/documents']);
    } catch (err: any) {
      this.error = err?.error?.message || 'Save failed';
    }
  }
}
