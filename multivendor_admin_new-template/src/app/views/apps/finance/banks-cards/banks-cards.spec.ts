import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BanksCards } from './banks-cards'

describe('BanksCards', () => {
  let component: BanksCards
  let fixture: ComponentFixture<BanksCards>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BanksCards],
    }).compileComponents()

    fixture = TestBed.createComponent(BanksCards)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
