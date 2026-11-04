import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TopPerforming } from './top-performing'

describe('TopPerforming', () => {
  let component: TopPerforming
  let fixture: ComponentFixture<TopPerforming>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopPerforming],
    }).compileComponents()

    fixture = TestBed.createComponent(TopPerforming)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
