import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ExpensesTable } from './expenses-table'

describe('ExpensesTable', () => {
  let component: ExpensesTable
  let fixture: ComponentFixture<ExpensesTable>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensesTable],
    }).compileComponents()

    fixture = TestBed.createComponent(ExpensesTable)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
