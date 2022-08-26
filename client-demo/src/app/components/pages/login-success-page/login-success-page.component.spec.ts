import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginSuccessPageComponent } from './login-success-page.component';

describe('LoginSuccessPageComponent', () => {
  let component: LoginSuccessPageComponent;
  let fixture: ComponentFixture<LoginSuccessPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginSuccessPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginSuccessPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
