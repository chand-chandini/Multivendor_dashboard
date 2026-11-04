import { ComponentFixture, TestBed } from '@angular/core/testing'
import { WeeklyPerformance } from './weekly-performance'

describe('WeeklyPerformance', () => {
  let component: WeeklyPerformance
  let fixture: ComponentFixture<WeeklyPerformance>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyPerformance],
    }).compileComponents()

    fixture = TestBed.createComponent(WeeklyPerformance)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
