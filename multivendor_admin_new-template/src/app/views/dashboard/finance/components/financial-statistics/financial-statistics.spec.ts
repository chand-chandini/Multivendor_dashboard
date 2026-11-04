import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FinancialStatistics } from './financial-statistics'

describe('FinancialStatistics', () => {
  let component: FinancialStatistics
  let fixture: ComponentFixture<FinancialStatistics>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialStatistics],
    }).compileComponents()

    fixture = TestBed.createComponent(FinancialStatistics)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
