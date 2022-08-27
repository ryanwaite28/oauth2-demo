import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';



const AUTH_HOST = `http://localhost:8080`;
const APP_HOST = `http://localhost:8082`;
const USERS_HOST = `http://localhost:8084`;

@Component({
  selector: 'app-login-success-page',
  templateUrl: './login-success-page.component.html',
  styleUrls: ['./login-success-page.component.scss']
})
export class LoginSuccessPageComponent implements OnInit {

  headers = {
    'Content-Type': `application/json`,
    'Accept': `application/json`,
  }

  userData: any = null;
  errorMessage: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe({
      next: (params) => {
        console.log(params);

        if (params['code']) {
          this.http.get(`${AUTH_HOST}/oauth/grant?client_id=12345&code=${params['code']}`, { withCredentials: true, headers: this.headers }).subscribe({
            next: (response) => {
              console.log(response);
              if ((response as any).access_token) {
                window.localStorage.setItem(`demo-app-access-token`, (response as any).access_token);
                this.check_token();
              }
            },
            error: (error: HttpErrorResponse) => {
              console.log(error);
              this.errorMessage = error.error.message || error.error.error;
              this.router.navigate(['/', 'login']);
            }
          });
        }
      }
    });
  }

  check_token() {
    const headers = { ...this.headers, Authorization: `Bearer ${window.localStorage.getItem(`demo-app-access-token`)}` };
    const options = { headers, withCredentials: true };

    this.http.get(`${USERS_HOST}/get-user-info`, options).subscribe({
      next: (response: any) => {
        console.log(response);
        this.userData = response.data.user;
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
    this.userData = null;
    this.router.navigate(['/', 'login']);
  }
}
