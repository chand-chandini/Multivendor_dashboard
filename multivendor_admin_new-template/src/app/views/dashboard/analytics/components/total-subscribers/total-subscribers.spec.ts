import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TotalSubscribers } from './total-subscribers'

describe('TotalSubscribers', () => {
  let component: TotalSubscribers
  let fixture: ComponentFixture<TotalSubscribers>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalSubscribers],
    }).compileComponents()

    fixture = TestBed.createComponent(TotalSubscribers)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
