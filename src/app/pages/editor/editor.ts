import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.html'
})
export class Editor implements OnInit {
  @ViewChild('docEditor') docEditor!: ElementRef<HTMLTextAreaElement>;

  contractId: string | null = '';
  contract: any = null;
  versions: any[] = [];

  documentContent = '';
  customFileName = '';
  isAutoFilled = false;
  isSigned = false;
  currentVersion = 'v1.0 (Draft)';

  // AI State
  aiIsScanning = false;
  showAiReview = false;
  aiRiskFound = false;
  aiRiskExplanation = '';
  aiRiskyClause = '';
  aiFixedClause = '';
  analyzedSelectionOnly = false;

  // Signature State
  showSignModal = false;
  signatureText = '';
  currentTimestamp = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.contractId = this.route.snapshot.paramMap.get('id');

    this.contract = {
      id: this.contractId,
      title: 'Non-Disclosure Agreement',
      client_name: 'Acme Corp',
      value: 5000,
      status: 'Draft'
    };

    this.customFileName = `NDA_${this.contract.client_name.replace(/\s+/g, '_')}_Draft`;

    if (this.contractId) {
      this.apiService.getContractVersions(this.contractId).subscribe({
        next: (data: any) => {
          this.versions = Array.isArray(data) ? data : [];
        },
        error: (err: any) => console.error('Failed to load OCI vault history', err)
      });
    }
  }

onVersionSelect(event: Event) {
  const target = event.target as HTMLSelectElement;
  const fileName = target.value;

  if (fileName === 'current') return;

  // Reset the dropdown visually
  target.value = 'current';

  this.apiService.downloadFile(fileName).subscribe({
    next: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);

      // 1. Create an invisible anchor tag
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName; // 2. Force the browser to download it as a file

      // 3. Append, click, and remove
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // 4. Free up browser memory
      window.URL.revokeObjectURL(url);
    },
    error: (err: any) => {
      console.error('Download Error:', err);
      alert('Failed to retrieve artifact from OCI Vault.');
    }
  });
}

  autoFillTemplate() {
    this.documentContent = `This ${this.contract.title} ("Agreement") is entered into by and between ContractzyLite and ${this.contract.client_name}.\n\nThe total value of this agreement is fixed at $${this.contract.value}.\n\nBoth parties agree to maintain strict confidentiality regarding all proprietary information.\n\n[LIABILITY CLAUSE 4.1]: ContractzyLite assumes all financial liability for any third-party data breaches, regardless of fault.\n\nFailure to comply will result in immediate termination of this agreement.`;
    this.isAutoFilled = true;
    this.currentVersion = 'v1.1 (Initialized)';
  }

  runAiReview() {
    let targetText = this.documentContent;
    let isSelection = false;

    // Check if user has highlighted text in the textarea
    if (this.docEditor && this.docEditor.nativeElement) {
      const textarea = this.docEditor.nativeElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end).trim();

      if (selected.length > 0) {
        targetText = selected;
        isSelection = true;
      }
    }

    if (!targetText.trim()) {
      alert('Please enter or select text to analyze.');
      return;
    }

    this.aiIsScanning = true;
    this.showAiReview = false;
    this.aiRiskFound = false;
    this.analyzedSelectionOnly = isSelection;

    // Send targeted text to backend
    this.apiService.analyzeDocument(targetText, isSelection).subscribe({
      next: (aiResponse: any) => {
        this.aiIsScanning = false;
        this.showAiReview = true;

        if (aiResponse && aiResponse.risky_clause) {
          this.aiRiskFound = true;
          this.aiRiskExplanation = aiResponse.risk_explanation;
          this.aiRiskyClause = aiResponse.risky_clause;
          this.aiFixedClause = aiResponse.fixed_clause;
        } else {
          this.aiRiskFound = false;
        }
      },
      error: (err: any) => {
        this.aiIsScanning = false;
        console.error('AI Error:', err);
        alert('AI Analysis failed to process.');
      }
    });
  }

  fixAiRisk() {
    if (this.aiRiskyClause && this.aiFixedClause) {
      // Replace the risky phrase in the document
      this.documentContent = this.documentContent.replace(this.aiRiskyClause, this.aiFixedClause);
      this.aiRiskFound = false;
      this.currentVersion = 'v1.2 (Remediated)';
    }
  }

  openSignModal() {
    this.showSignModal = true;
  }

  closeSignModal() {
    this.showSignModal = false;
    this.signatureText = '';
  }

  confirmSignature() {
    if (this.signatureText.trim() && this.contractId) {
      this.currentTimestamp = new Date().toISOString();
      const finalFileName = `${this.customFileName.replace(/[^a-zA-Z0-9_-]/g, '')}_v2.pdf`;

      const payload = {
        version: '2.0',
        documentContent: this.documentContent,
        customFileName: finalFileName,
        signatureText: this.signatureText
      };

      this.apiService.signContract(this.contractId, payload).subscribe({
        next: () => {
          this.isSigned = true;
          this.contract.status = 'Executed';
          this.currentVersion = 'v2.0 (Vaulted)';
          this.closeSignModal();
        },
        error: (err: any) => {
          console.error('OCI Vault Error:', err);
          alert('Failed to authorize and vault document.');
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
