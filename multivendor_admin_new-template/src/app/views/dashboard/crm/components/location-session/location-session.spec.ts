import { ComponentFixture, TestBed } from '@angular/core/testing'
import { LocationSession } from './location-session'

describe('LocationSession', () => {
  let component: LocationSession
  let fixture: ComponentFixture<LocationSession>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationSession],
    }).compileComponents()

    fixture = TestBed.createComponent(LocationSession)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
