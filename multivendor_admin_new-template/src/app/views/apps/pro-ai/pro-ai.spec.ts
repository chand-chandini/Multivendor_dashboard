import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ProAi } from './pro-ai'

describe('ProAi', () => {
  let component: ProAi
  let fixture: ComponentFixture<ProAi>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProAi],
    }).compileComponents()

    fixture = TestBed.createComponent(ProAi)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
