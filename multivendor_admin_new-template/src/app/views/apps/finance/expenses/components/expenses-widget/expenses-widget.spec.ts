import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ExpensesWidget } from './expenses-widget'

describe('ExpensesWidget', () => {
  let component: ExpensesWidget
  let fixture: ComponentFixture<ExpensesWidget>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensesWidget],
    }).compileComponents()

    fixture = TestBed.createComponent(ExpensesWidget)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
