import { ComponentFixture, TestBed } from '@angular/core/testing'

import { LeadsWidget } from './leads-widget'

describe('LeadsWidget', () => {
  let component: LeadsWidget
  let fixture: ComponentFixture<LeadsWidget>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadsWidget],
    }).compileComponents()

    fixture = TestBed.createComponent(LeadsWidget)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
