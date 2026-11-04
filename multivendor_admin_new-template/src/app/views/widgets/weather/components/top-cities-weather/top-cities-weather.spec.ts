import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TopCitiesWeather } from './top-cities-weather'

describe('TopCitiesWeather', () => {
  let component: TopCitiesWeather
  let fixture: ComponentFixture<TopCitiesWeather>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopCitiesWeather],
    }).compileComponents()

    fixture = TestBed.createComponent(TopCitiesWeather)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
