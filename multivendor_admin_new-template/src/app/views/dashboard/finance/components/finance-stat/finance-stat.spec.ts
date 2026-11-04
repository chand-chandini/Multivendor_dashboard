import { ComponentFixture, TestBed } from '@angular/core/testing'

import { FinanceStat } from './finance-stat'

describe('FinanceStat', () => {
  let component: FinanceStat
  let fixture: ComponentFixture<FinanceStat>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanceStat],
    }).compileComponents()

    fixture = TestBed.createComponent(FinanceStat)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
