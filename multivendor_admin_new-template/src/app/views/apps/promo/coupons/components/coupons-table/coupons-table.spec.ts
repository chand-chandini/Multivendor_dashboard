import { ComponentFixture, TestBed } from '@angular/core/testing'

import { CouponsTable } from './coupons-table'

describe('CouponsTable', () => {
  let component: CouponsTable
  let fixture: ComponentFixture<CouponsTable>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CouponsTable],
    }).compileComponents()

    fixture = TestBed.createComponent(CouponsTable)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
