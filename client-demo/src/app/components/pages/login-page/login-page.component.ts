import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';


const AUTH_HOST = `http://localhost:8080`;
const APP_HOST = `http://localhost:8082`;
const USERS_HOST = `http://localhost:8084`;

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {

  access_token = window.localStorage.getItem(`demo-app-access-token`);
  logged_in = !!this.access_token;
  userData: any = null;

  oauth_location = `${AUTH_HOST}/oauth?client_id=12345`;
  headers = {
    'Content-Type': `application/json`,
    'Accept': `application/json`,
  }
  errorMessage: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    if (this.logged_in) {
      this.check_token();
    }
  }

  login_with_demoApp() {
    const oauth_location = `${AUTH_HOST}/oauth?client_id=12345`;
    window.location.href = oauth_location;
  }

  check_token() {
    const headers = { ...this.headers, Authorization: `Bearer ${window.localStorage.getItem(`demo-app-access-token`)}` };
    const options = { headers, withCredentials: true };

    this.http.get(`${USERS_HOST}/get-user-info`, options).subscribe({
      next: (response: any) => {
        console.log(response);
        this.userData = response.data.user;
      },
      error: (error: HttpErrorResponse) => {
        console.log(error);
        this.errorMessage = error.error.message || error.error.error;
      }
    });

    this.http.get(`${APP_HOST}/get-user-posts`, options).subscribe({
      next: (response: any) => {
        console.log(response);
      },
      error: (error: HttpErrorResponse) => {
        console.log(error);
        this.errorMessage = error.error.message || error.error.error;
      }
    });

    this.http.get(`${AUTH_HOST}/verify-access-token`, options).subscribe({
      next: (response) => {
        console.log(response);
      }
    });

    this.http.post(`${USERS_HOST}/find-by-email`, { email: `email2` }, options).subscribe({
      next: (response) => {
        console.log(response);
      }
    });
  }

  logout() {
    window.localStorage.removeItem(`demo-app-access-token`);
    this.access_token = null;
    this.logged_in = false;
    this.userData = null;
  }
}
