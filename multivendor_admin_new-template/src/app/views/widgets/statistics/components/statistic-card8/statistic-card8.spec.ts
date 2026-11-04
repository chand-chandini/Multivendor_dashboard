import { ComponentFixture, TestBed } from '@angular/core/testing'
import { StatisticCard8 } from './statistic-card8'

describe('StatisticCard8', () => {
  let component: StatisticCard8
  let fixture: ComponentFixture<StatisticCard8>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticCard8],
    }).compileComponents()

    fixture = TestBed.createComponent(StatisticCard8)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
