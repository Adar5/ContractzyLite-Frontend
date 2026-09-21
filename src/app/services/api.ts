import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Authentication
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, credentials);
  }

  register(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, credentials);
  }

  getUserRole(): string {
  const token = localStorage.getItem('token');
  if (!token) return 'standard'; // Default fail-safe

  try {
    // Decode the middle section of the JWT
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || 'standard';
  } catch (e) {
    return 'standard';
  }
}

  // Header Utility
  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  // Contracts
  getContracts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/contracts`, this.getHeaders());
  }

  createContract(contract: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/contracts`, contract, this.getHeaders());
  }

  updateContractStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/contracts/${id}`, { status }, this.getHeaders());
  }

  deleteContract(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/contracts/${id}`, this.getHeaders());
  }

  signContract(id: string, payload: any) {
  return this.http.post(`${this.baseUrl}/contracts/${id}/sign`, payload, this.getHeaders());
}
getContractVersions(id: string) {
  return this.http.get(`${this.baseUrl}/contracts/${id}/versions`, this.getHeaders());
}

downloadFile(fileName: string) {
  return this.http.get(`${this.baseUrl}/contracts/file/${fileName}`, {
    ...this.getHeaders(),
    responseType: 'blob' // CRITICAL: Tells Angular to process this as a file, not JSON
  });
}

analyzeDocument(documentContent: string, isSelection: boolean = false) {
  return this.http.post(
    `${this.baseUrl}/contracts/analyze`,
    { documentContent, isSelection },
    this.getHeaders()
  );
}

}
