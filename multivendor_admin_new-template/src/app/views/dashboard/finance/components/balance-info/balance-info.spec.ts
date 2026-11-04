import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BalanceInfo } from './balance-info'

describe('BalanceInfo', () => {
  let component: BalanceInfo
  let fixture: ComponentFixture<BalanceInfo>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceInfo],
    }).compileComponents()

    fixture = TestBed.createComponent(BalanceInfo)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
