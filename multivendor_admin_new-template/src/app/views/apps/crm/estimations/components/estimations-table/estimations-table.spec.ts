import { ComponentFixture, TestBed } from '@angular/core/testing'

import { EstimationsTable } from './estimations-table'

describe('EstimationsTable', () => {
  let component: EstimationsTable
  let fixture: ComponentFixture<EstimationsTable>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstimationsTable],
    }).compileComponents()

    fixture = TestBed.createComponent(EstimationsTable)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
