import { ComponentFixture, TestBed } from '@angular/core/testing'
import { HolidayTable } from './holiday-table'

describe('HolidayTable', () => {
  let component: HolidayTable
  let fixture: ComponentFixture<HolidayTable>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HolidayTable],
    }).compileComponents()

    fixture = TestBed.createComponent(HolidayTable)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
