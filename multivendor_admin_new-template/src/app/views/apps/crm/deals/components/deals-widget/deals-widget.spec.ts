import { ComponentFixture, TestBed } from '@angular/core/testing'
import { DealsWidget } from './deals-widget'

describe('DealsWidget', () => {
  let component: DealsWidget
  let fixture: ComponentFixture<DealsWidget>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealsWidget],
    }).compileComponents()

    fixture = TestBed.createComponent(DealsWidget)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
