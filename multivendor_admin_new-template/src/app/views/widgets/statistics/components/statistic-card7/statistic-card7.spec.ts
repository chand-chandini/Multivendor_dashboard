import { ComponentFixture, TestBed } from '@angular/core/testing'
import { StatisticCard7 } from './statistic-card7'

describe('StatisticCard7', () => {
  let component: StatisticCard7
  let fixture: ComponentFixture<StatisticCard7>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticCard7],
    }).compileComponents()

    fixture = TestBed.createComponent(StatisticCard7)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
