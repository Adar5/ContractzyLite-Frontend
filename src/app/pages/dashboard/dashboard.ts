import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
  contracts: any[] = [];
  notifications: any[] = []; // New Notifications Array
  contractForm: FormGroup;
  userRole: string = 'standard';

  // Count Metrics
  totalContracts = 0;
  pendingContracts = 0;
  expiredContracts = 0;

  // Financial Metrics for the Chart
  totalValue = 0;
  signedValue = 0;
  pendingValue = 0;
  expiredValue = 0;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.contractForm = this.fb.group({
      title: ['', Validators.required],
      client_name: ['', Validators.required],
      value: ['', [Validators.required, Validators.min(0)]],
      expiration_date: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.userRole = this.apiService.getUserRole();
    this.loadContracts();
  }

  isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  canCreateContracts(): boolean {
    return ['admin', 'legal'].includes(this.userRole);
  }

  loadContracts() {
    this.apiService.getContracts().subscribe({
      next: (data) => {
        this.contracts = data;
        this.calculateMetrics();
        this.generateActivityAlerts();
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.logout();
        }
      }
    });
  }

  calculateMetrics() {
    // Basic Counts
    this.totalContracts = this.contracts.length;
    this.pendingContracts = this.contracts.filter(c => c.status === 'Draft' || c.status === 'Sent').length;
    this.expiredContracts = this.contracts.filter(c => c.status === 'Expired').length;

    // Financial Chart Calculations
    this.totalValue = this.contracts.reduce((sum, current) => sum + (Number(current.value) || 0), 0);
    this.signedValue = this.contracts.filter(c => c.status === 'Signed').reduce((sum, current) => sum + (Number(current.value) || 0), 0);
    this.pendingValue = this.contracts.filter(c => c.status === 'Draft' || c.status === 'Sent').reduce((sum, current) => sum + (Number(current.value) || 0), 0);
    this.expiredValue = this.contracts.filter(c => c.status === 'Expired').reduce((sum, current) => sum + (Number(current.value) || 0), 0);
  }

  // Gets the percentage for the Tailwind CSS chart widths
  getPercentage(value: number): number {
    if (this.totalValue === 0) return 0;
    return (value / this.totalValue) * 100;
  }

  generateActivityAlerts() {
  this.notifications = []; // Clear old alerts
  const today = new Date();

  this.contracts.forEach(contract => {

    // 1. Check for Expirations (Warning)
    if (contract.expiration_date) {
      const expDate = new Date(contract.expiration_date);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (contract.status === 'Expired' || diffDays < 0) {
         this.notifications.push({
           type: 'warning',
           title: 'Contract Expired',
           message: `The ${contract.title} for ${contract.client_name} has expired. Immediate action required.`,
           time: 'Urgent'
         });
      } else if (diffDays <= 30 && contract.status !== 'Signed') {
         this.notifications.push({
           type: 'warning',
           title: 'Expiring Soon',
           message: `The ${contract.title} for ${contract.client_name} expires in ${diffDays} days.`,
           time: 'Action Required'
         });
      }
    }

    // 2. Check for Pending Actions (Info)
    if (contract.status === 'Draft') {
      this.notifications.push({
        type: 'info',
        title: 'Draft Pending',
        message: `${contract.client_name}'s ${contract.title} is awaiting finalization in the workspace.`,
        time: 'Pending Review'
      });
    } else if (contract.status === 'Sent') {
      this.notifications.push({
        type: 'info',
        title: 'Awaiting Client',
        message: `${contract.client_name} needs to sign the ${contract.title}.`,
        time: 'Pending Signature'
      });
    }

    // 3. Check for Executed Contracts (Success)
    if (contract.status === 'Signed') {
       this.notifications.push({
         type: 'success',
         title: 'Contract Executed',
         message: `${contract.client_name} successfully signed and vaulted the ${contract.title}.`,
         time: 'Archived'
       });
    }
  });

  // 4. Sort the alerts: Put Warnings at the top, then Info, then Success
  this.notifications.sort((a, b) => {
     if (a.type === 'warning' && b.type !== 'warning') return -1;
     if (b.type === 'warning' && a.type !== 'warning') return 1;
     return 0;
  });

  // 5. Cap the list at 8 alerts so the UI doesn't overflow
  this.notifications = this.notifications.slice(0, 8);
}

  dismissNotification(index: number) {
    this.notifications.splice(index, 1);
  }

  createContract() {
    if (this.contractForm.valid) {
      this.apiService.createContract(this.contractForm.value).subscribe({
        next: () => {
          this.contractForm.reset();
          this.loadContracts();
        },
        error: (err) => {
          console.error(err);
          alert('Error: ' + (err.error?.error || err.message));
        }
      });
    }
  }

  updateStatus(id: number, event: any) {
    this.apiService.updateContractStatus(id, event.target.value).subscribe({
      next: () => this.loadContracts(),
      error: (err) => alert('Failed to update status')
    });
  }

  deleteContract(id: number) {
    this.apiService.deleteContract(id).subscribe({
      next: () => this.loadContracts(),
      error: (err) => alert('Failed to delete contract')
    });
  }

  openWorkspace(id: number) {
    this.router.navigate(['/editor', id]);
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
