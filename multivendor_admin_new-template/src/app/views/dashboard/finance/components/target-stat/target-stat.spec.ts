import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TargetStat } from './target-stat'

describe('TargetStat', () => {
  let component: TargetStat
  let fixture: ComponentFixture<TargetStat>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TargetStat],
    }).compileComponents()

    fixture = TestBed.createComponent(TargetStat)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
