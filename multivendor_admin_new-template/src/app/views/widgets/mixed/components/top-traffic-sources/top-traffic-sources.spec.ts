import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TopTrafficSources } from './top-traffic-sources'

describe('TopTrafficSources', () => {
  let component: TopTrafficSources
  let fixture: ComponentFixture<TopTrafficSources>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopTrafficSources],
    }).compileComponents()

    fixture = TestBed.createComponent(TopTrafficSources)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
