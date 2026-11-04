import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TotalVisitors } from './total-visitors'

describe('TotalVisitors', () => {
  let component: TotalVisitors
  let fixture: ComponentFixture<TotalVisitors>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalVisitors],
    }).compileComponents()

    fixture = TestBed.createComponent(TotalVisitors)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
