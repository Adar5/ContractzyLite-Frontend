import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoginMode: boolean = true; // Tracks whether user is logging in or signing up

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = ''; // Clear any existing errors when switching modes
    this.loginForm.reset();
  }

  onSubmit() {
    if (this.loginForm.valid) {
      if (this.isLoginMode) {
        // Handle Login
        this.apiService.login(this.loginForm.value).subscribe({
          next: (res: any) => {
            localStorage.setItem('token', res.token);
            this.router.navigate(['/dashboard']);
          },
          error: (err: any) => {
            this.errorMessage = err.error?.error || 'Login failed. Please try again.';
          }
        });
      } else {
        // Handle Registration
        this.apiService.register(this.loginForm.value).subscribe({
          next: () => {
            // On successful registration, switch back to login mode
            this.isLoginMode = true;
            this.errorMessage = '';
            alert('Account created successfully! Please sign in.');
          },
          error: (err: any) => {
            this.errorMessage = err.error?.error || 'Registration failed. User may already exist.';
          }
        });
      }
    }
  }
}
