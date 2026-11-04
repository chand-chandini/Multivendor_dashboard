import { ComponentFixture, TestBed } from '@angular/core/testing'

import { CouponsWidget } from './coupons-widget'

describe('CouponsWidget', () => {
  let component: CouponsWidget
  let fixture: ComponentFixture<CouponsWidget>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CouponsWidget],
    }).compileComponents()

    fixture = TestBed.createComponent(CouponsWidget)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
