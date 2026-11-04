import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostWeather } from './post-weather'

describe('PostWeather', () => {
  let component: PostWeather
  let fixture: ComponentFixture<PostWeather>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostWeather],
    }).compileComponents()

    fixture = TestBed.createComponent(PostWeather)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
