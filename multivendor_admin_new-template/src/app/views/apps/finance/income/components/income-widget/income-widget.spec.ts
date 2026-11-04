import { ComponentFixture, TestBed } from '@angular/core/testing'
import { IncomeWidget } from './income-widget'

describe('IncomeWidget', () => {
  let component: IncomeWidget
  let fixture: ComponentFixture<IncomeWidget>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomeWidget],
    }).compileComponents()

    fixture = TestBed.createComponent(IncomeWidget)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
