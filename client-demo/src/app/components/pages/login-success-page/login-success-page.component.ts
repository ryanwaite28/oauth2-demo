import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';



const AUTH_HOST = `http://localhost:8080`;
const APP_HOST = `http://localhost:8082`;

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

  constructor(
    private activatedRoute: ActivatedRoute,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe({
      next: (params) => {
        console.log(params);

        if (params['code']) {
          this.http.get(`${AUTH_HOST}/oauth/grant?client_id=12345&code=${params['code']}`).subscribe({
            next: (response) => {
              console.log(response);
              if ((response as any).access_token) {
                window.localStorage.setItem(`demo-app-access-token`, (response as any).access_token);
                this.check_token();
              }
            }
          });
        }
      }
    });
  }

  check_token() {
    const headers = { ...this.headers, Authorization: `Bearer ${window.localStorage.getItem(`demo-app-access-token`)}` };

    this.http.get(`${APP_HOST}/get-user-info`, { headers }).subscribe({
      next: (response: any) => {
        console.log(response);
        this.userData = response.data.user;
      }
    });

    this.http.get(`${AUTH_HOST}/verify-access-token`, { headers }).subscribe({
      next: (response) => {
        console.log(response);
      }
    });
  }
}
