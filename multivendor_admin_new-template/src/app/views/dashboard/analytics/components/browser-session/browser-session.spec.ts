import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserSession } from './browser-session'

describe('BrowserSession', () => {
  let component: BrowserSession
  let fixture: ComponentFixture<BrowserSession>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserSession],
    }).compileComponents()

    fixture = TestBed.createComponent(BrowserSession)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
