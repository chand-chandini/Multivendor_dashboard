import { ComponentFixture, TestBed } from '@angular/core/testing'
import { AttendanceWidget } from './attendance-widget'

describe('AttendanceWidget', () => {
  let component: AttendanceWidget
  let fixture: ComponentFixture<AttendanceWidget>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceWidget],
    }).compileComponents()

    fixture = TestBed.createComponent(AttendanceWidget)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
