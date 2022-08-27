import { Injectable, InjectionToken, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  HttpClientModule,
  HttpClientXsrfModule,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpXsrfTokenExtractor,
  HTTP_INTERCEPTORS,

} from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WelcomePageComponent } from './components/pages/welcome-page/welcome-page.component';
import { LoginPageComponent } from './components/pages/login-page/login-page.component';
import { LoginSuccessPageComponent } from './components/pages/login-success-page/login-success-page.component';
import { Observable } from 'rxjs';

@Injectable()
export class CustomInterceptor implements HttpInterceptor {
  constructor(private tokenExtractor: HttpXsrfTokenExtractor) {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const cookieheaderName = 'X-XSRF-TOKEN';
    let csrfToken = this.tokenExtractor.getToken() as string;
    if (csrfToken !== null && !req.headers.has(cookieheaderName)) {
      req = req.clone({
        headers: req.headers.set(cookieheaderName, csrfToken),
      });
    }
    return next.handle(req);
  }
}

export const XSRF_COOKIE_NAME: InjectionToken<string> = new InjectionToken<string>(`X-CSRF-HEADER`);
export const XSRF_HEADER_NAME: InjectionToken<string> = new InjectionToken<string>(`X-CSRF-TOKEN`);



@NgModule({
  declarations: [
    AppComponent,
    WelcomePageComponent,
    LoginPageComponent,
    LoginSuccessPageComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: `XSRF-TOKEN`,
      headerName: `X-XSRF-TOKEN`,
    }),
  ],
  providers: [
    // { provide: XSRF_COOKIE_NAME, useValue: 'XSRF-TOKEN' },
    // { provide: XSRF_HEADER_NAME, useValue: 'X-XSRF-TOKEN' },
    { provide: HTTP_INTERCEPTORS, useClass: CustomInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
