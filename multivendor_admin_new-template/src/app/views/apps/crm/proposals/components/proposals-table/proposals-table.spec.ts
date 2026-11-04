import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ProposalsTable } from './proposals-table'

describe('ProposalsTable', () => {
  let component: ProposalsTable
  let fixture: ComponentFixture<ProposalsTable>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProposalsTable],
    }).compileComponents()

    fixture = TestBed.createComponent(ProposalsTable)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
