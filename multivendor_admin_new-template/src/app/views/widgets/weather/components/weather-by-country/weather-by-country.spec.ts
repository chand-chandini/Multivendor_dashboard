import { ComponentFixture, TestBed } from '@angular/core/testing'
import { WeatherByCountry } from './weather-by-country'

describe('WeatherByCountry', () => {
  let component: WeatherByCountry
  let fixture: ComponentFixture<WeatherByCountry>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherByCountry],
    }).compileComponents()

    fixture = TestBed.createComponent(WeatherByCountry)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
