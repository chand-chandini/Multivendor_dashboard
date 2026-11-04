import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TotalOrder } from './total-order'

describe('TotalOrder', () => {
  let component: TotalOrder
  let fixture: ComponentFixture<TotalOrder>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalOrder],
    }).compileComponents()

    fixture = TestBed.createComponent(TotalOrder)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
