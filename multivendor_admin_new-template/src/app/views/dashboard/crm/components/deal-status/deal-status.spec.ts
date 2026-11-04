import { ComponentFixture, TestBed } from '@angular/core/testing'
import { DealStatus } from './deal-status'

describe('DealStatus', () => {
  let component: DealStatus
  let fixture: ComponentFixture<DealStatus>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealStatus],
    }).compileComponents()

    fixture = TestBed.createComponent(DealStatus)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
