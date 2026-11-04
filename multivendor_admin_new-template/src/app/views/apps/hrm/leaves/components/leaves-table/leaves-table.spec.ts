import { ComponentFixture, TestBed } from '@angular/core/testing'
import { LeavesTable } from './leaves-table'

describe('LeavesTable', () => {
  let component: LeavesTable
  let fixture: ComponentFixture<LeavesTable>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeavesTable],
    }).compileComponents()

    fixture = TestBed.createComponent(LeavesTable)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
