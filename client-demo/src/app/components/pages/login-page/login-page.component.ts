import { Component, OnInit } from '@angular/core';


const HOST = `http://localhost:8080`;

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  login_with_demoApp() {
    const oauth_location = `${HOST}/oauth?client_id=12345`;
    window.location.href = oauth_location;
  }
}
