import { ComponentFixture, TestBed } from '@angular/core/testing'

import { DealsTable } from './deals-table'

describe('DealsTable', () => {
  let component: DealsTable
  let fixture: ComponentFixture<DealsTable>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealsTable],
    }).compileComponents()

    fixture = TestBed.createComponent(DealsTable)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
