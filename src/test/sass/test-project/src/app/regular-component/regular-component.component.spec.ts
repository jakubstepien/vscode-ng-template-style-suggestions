import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegularComponentComponent } from './regular-component.component';

describe('RegularComponentComponent', () => {
  let component: RegularComponentComponent;
  let fixture: ComponentFixture<RegularComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegularComponentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegularComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
