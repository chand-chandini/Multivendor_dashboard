import { ComponentFixture, TestBed } from '@angular/core/testing'
import { HolidayWidget } from './holiday-widget'

describe('HolidayWidget', () => {
  let component: HolidayWidget
  let fixture: ComponentFixture<HolidayWidget>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HolidayWidget],
    }).compileComponents()

    fixture = TestBed.createComponent(HolidayWidget)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
